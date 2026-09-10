package marczakx.auth.service;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import com.fasterxml.jackson.annotation.JsonProperty;
import com.fasterxml.jackson.databind.ObjectMapper;
import marczakx.auth.configuration.KeycloakIntrospectionProperties;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;

import java.io.ByteArrayOutputStream;
import java.io.InputStream;
import java.io.OutputStream;
import java.net.InetSocketAddress;
import java.net.Socket;
import java.net.URL;
import java.net.URLEncoder;
import java.nio.charset.StandardCharsets;
import java.util.Base64;
import java.util.Collections;
import java.util.List;
import java.util.Map;
import java.util.Objects;

/**
 * Wraps the Keycloak token introspection endpoint (RFC 7662).
 * <p>
 * The auth-service does NOT trust the JWT that the browser sends directly.
 * Instead it forwards the bearer token to Keycloak, which returns whether the
 * token is still active together with the user and role claims. This service
 * is the only place that talks to Keycloak's introspection endpoint; controllers
 * should depend on {@link #introspect(String)} and not call Keycloak themselves.
 * <p>
 * The HTTP call is written manually over a raw {@link Socket} so the
 * {@code Host} header can be set to {@code localhost}. Keycloak 24+ enforces
 * the audience / issuer check on the bearer token and rejects the request if
 * the {@code Host} header does not match the hostname that originally issued
 * the token (the realm was provisioned against {@code http://localhost}).
 * Neither {@link java.net.http.HttpClient} nor {@code HttpURLConnection}
 * allow overriding the {@code Host} header (it is a restricted header), so a
 * raw socket is the only way to send the correct value.
 */
@Service
public class KeycloakIntrospectionService {

    private static final Logger log = LoggerFactory.getLogger(KeycloakIntrospectionService.class);

    private final KeycloakIntrospectionProperties properties;
    private final String authorizationHeader;
    private final ObjectMapper objectMapper;

    public KeycloakIntrospectionService(KeycloakIntrospectionProperties properties) {
        this.properties = properties;
        this.authorizationHeader = "Basic " + Base64.getEncoder().encodeToString(
                (properties.getClientId() + ":" + properties.getClientSecret()).getBytes(StandardCharsets.UTF_8));
        this.objectMapper = new ObjectMapper();
    }

    /**
     * Introspects the given bearer token.
     *
     * @param token raw bearer token (without the "Bearer " prefix)
     * @return introspection result; never {@code null}. An empty result is
     *         returned when Keycloak is unreachable, when the response cannot
     *         be parsed or when the token is not active – callers should
     *         treat it as "not authenticated".
     */
    public IntrospectionResult introspect(String token) {
        if (token == null || token.isBlank()) {
            return IntrospectionResult.inactive();
        }
        String body = "token=" + URLEncoder.encode(token, StandardCharsets.UTF_8)
                + "&token_type_hint=access_token";
        try {
            URL url = new URL(properties.getUrl());
            int port = url.getPort() != -1 ? url.getPort() : url.getDefaultPort();
            String path = url.getPath() + (url.getQuery() != null ? "?" + url.getQuery() : "");

            try (Socket socket = new Socket()) {
                socket.connect(new InetSocketAddress(url.getHost(), port), properties.getConnectTimeoutMs());
                socket.setSoTimeout(properties.getReadTimeoutMs());

                // Build the HTTP/1.1 request manually so the Host header can be
                // set to "localhost" – the hostname the Keycloak realm was
                // provisioned against. Restricted headers cannot be overridden
                // by HttpURLConnection or java.net.http.HttpClient.
                String request = "POST " + path + " HTTP/1.1\r\n"
                        + "Host: localhost\r\n"
                        + "Authorization: " + authorizationHeader + "\r\n"
                        + "Content-Type: application/x-www-form-urlencoded\r\n"
                        + "Content-Length: " + body.getBytes(StandardCharsets.UTF_8).length + "\r\n"
                        + "Connection: close\r\n"
                        + "\r\n"
                        + body;

                OutputStream os = socket.getOutputStream();
                os.write(request.getBytes(StandardCharsets.UTF_8));
                os.flush();

                String responseText = readResponse(socket.getInputStream());
                int status = parseStatus(responseText);
                if (status / 100 != 2) {
                    log.warn("Keycloak introspection failed with HTTP {}: {}",
                            status, responseText);
                    return IntrospectionResult.inactive();
                }

                String responseBody = extractBody(responseText);
                if (responseBody.isEmpty()) {
                    log.warn("Keycloak introspection returned an empty body for the supplied token");
                    return IntrospectionResult.inactive();
                }
                IntrospectionResponse parsed = objectMapper.readValue(responseBody, IntrospectionResponse.class);
                return parsed.toResult();
            }
        } catch (Exception ex) {
            log.warn("Keycloak introspection request failed: {}", ex.getMessage());
            return IntrospectionResult.inactive();
        }
    }

    /** Reads the full HTTP response from the socket. */
    private static String readResponse(InputStream is) throws java.io.IOException {
        ByteArrayOutputStream out = new ByteArrayOutputStream();
        byte[] buf = new byte[1024];
        int n;
        while ((n = is.read(buf)) > 0) {
            out.write(buf, 0, n);
        }
        return out.toString(StandardCharsets.UTF_8);
    }

    /** Parses the HTTP status code from the status line (e.g. "HTTP/1.1 200 OK"). */
    private static int parseStatus(String responseText) {
        int space1 = responseText.indexOf(' ');
        if (space1 < 0) {
            return -1;
        }
        int space2 = responseText.indexOf(' ', space1 + 1);
        if (space2 < 0) {
            return -1;
        }
        try {
            return Integer.parseInt(responseText.substring(space1 + 1, space2));
        } catch (NumberFormatException ex) {
            return -1;
        }
    }

    /** Extracts the body after the header/body separator. */
    private static String extractBody(String responseText) {
        int headerEnd = responseText.indexOf("\r\n\r\n");
        if (headerEnd < 0) {
            return "";
        }
        return responseText.substring(headerEnd + 4);
    }

    /** Result of an introspection call. */
    public static final class IntrospectionResult {
        private final boolean active;
        private final String username;
        private final String subject;
        private final List<String> roles;

        private IntrospectionResult(boolean active, String username, String subject, List<String> roles) {
            this.active = active;
            this.username = username;
            this.subject = subject;
            this.roles = roles;
        }

        public static IntrospectionResult inactive() {
            return new IntrospectionResult(false, null, null, Collections.emptyList());
        }

        public static IntrospectionResult of(boolean active, String username, String subject, List<String> roles) {
            return new IntrospectionResult(active, username, subject, roles == null ? Collections.emptyList() : List.copyOf(roles));
        }

        public boolean isActive() {
            return active;
        }

        public String getUsername() {
            return username;
        }

        public String getSubject() {
            return subject;
        }

        public List<String> getRoles() {
            return roles;
        }
    }

    /**
     * Internal mapping of the RFC 7662 introspection response fields we care
     * about. Unknown fields are ignored so the deserializer stays compatible
     * with future Keycloak versions.
     */
    @JsonIgnoreProperties(ignoreUnknown = true)
    static class IntrospectionResponse {
        private boolean active;
        private String username;
        @JsonProperty("preferred_username")
        private String preferredUsername;
        private String sub;
        @JsonProperty("realm_access")
        private Map<String, Object> realmAccess;

        public boolean isActive() {
            return active;
        }

        public void setActive(boolean active) {
            this.active = active;
        }

        public String getUsername() {
            return username;
        }

        public void setUsername(String username) {
            this.username = username;
        }

        public String getPreferredUsername() {
            return preferredUsername;
        }

        public void setPreferredUsername(String preferredUsername) {
            this.preferredUsername = preferredUsername;
        }

        public String getSub() {
            return sub;
        }

        public void setSub(String sub) {
            this.sub = sub;
        }

        public Map<String, Object> getRealmAccess() {
            return realmAccess;
        }

        public void setRealmAccess(Map<String, Object> realmAccess) {
            this.realmAccess = realmAccess;
        }

        IntrospectionResult toResult() {
            if (!active) {
                return IntrospectionResult.inactive();
            }
            String resolvedUsername = preferredUsername != null ? preferredUsername : username;
            return IntrospectionResult.of(true, resolvedUsername, sub, extractRoles());
        }

        @SuppressWarnings("unchecked")
        private List<String> extractRoles() {
            if (realmAccess == null) {
                return Collections.emptyList();
            }
            Object roles = realmAccess.get("roles");
            if (!(roles instanceof List<?> list)) {
                return Collections.emptyList();
            }
            return list.stream()
                    .filter(Objects::nonNull)
                    .map(Object::toString)
                    .toList();
        }
    }
}