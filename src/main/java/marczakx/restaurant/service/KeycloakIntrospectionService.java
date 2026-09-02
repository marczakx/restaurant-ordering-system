package marczakx.restaurant.service;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import com.fasterxml.jackson.annotation.JsonProperty;
import marczakx.restaurant.configuration.KeycloakIntrospectionProperties;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestClient;

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
 * The backend does NOT trust the JWT that the browser sends directly. Instead
 * it forwards the bearer token to Keycloak, which returns whether the token
 * is still active together with the user and role claims. This service is
 * the only place that talks to Keycloak's introspection endpoint; controllers
 * should depend on {@link #introspect(String)} and not call Keycloak
 * themselves.
 * <p>
 * The HTTP client is created lazily and configured with the connect/read
 * timeouts from {@link KeycloakIntrospectionProperties} so a slow Keycloak
 * cannot block request threads.
 */
@Service
public class KeycloakIntrospectionService {

    private static final Logger log = LoggerFactory.getLogger(KeycloakIntrospectionService.class);

    private final KeycloakIntrospectionProperties properties;
    private final RestClient restClient;
    private final String authorizationHeader;

    public KeycloakIntrospectionService(KeycloakIntrospectionProperties properties) {
        this.properties = properties;
        this.restClient = RestClient.builder()
                .requestFactory(buildRequestFactory(properties))
                .build();
        this.authorizationHeader = "Basic " + Base64.getEncoder().encodeToString(
                (properties.getClientId() + ":" + properties.getClientSecret()).getBytes(StandardCharsets.UTF_8));
    }

    private static org.springframework.http.client.ClientHttpRequestFactory buildRequestFactory(
            KeycloakIntrospectionProperties properties) {
        var factory = new org.springframework.http.client.SimpleClientHttpRequestFactory();
        factory.setConnectTimeout(properties.getConnectTimeoutMs());
        factory.setReadTimeout(properties.getReadTimeoutMs());
        return factory;
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
            IntrospectionResponse response = restClient.post()
                    .uri(properties.getUrl())
                    .header(HttpHeaders.AUTHORIZATION, authorizationHeader)
                    .header(HttpHeaders.CONTENT_TYPE, MediaType.APPLICATION_FORM_URLENCODED_VALUE)
                    .body(body)
                    .retrieve()
                    .body(IntrospectionResponse.class);
            if (response == null) {
                log.warn("Keycloak introspection returned an empty body for the supplied token");
                return IntrospectionResult.inactive();
            }
            return response.toResult();
        } catch (org.springframework.web.client.HttpStatusCodeException ex) {
            log.warn("Keycloak introspection failed with HTTP {}: {}",
                    ex.getStatusCode().value(), ex.getStatusText());
            return IntrospectionResult.inactive();
        } catch (RuntimeException ex) {
            // RestClient wraps IO errors – log once and treat as not-active so
            // the caller returns 401 instead of hanging on a broken Keycloak.
            log.warn("Keycloak introspection request failed: {}", ex.getMessage());
            return IntrospectionResult.inactive();
        }
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
