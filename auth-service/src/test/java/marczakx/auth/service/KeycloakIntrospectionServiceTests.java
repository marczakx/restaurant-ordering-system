package marczakx.auth.service;

import com.sun.net.httpserver.HttpServer;
import marczakx.auth.configuration.KeycloakIntrospectionProperties;
import marczakx.auth.service.KeycloakIntrospectionService.IntrospectionResult;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;

import java.io.IOException;
import java.io.OutputStream;
import java.net.InetSocketAddress;
import java.nio.charset.StandardCharsets;
import java.util.List;
import java.util.concurrent.atomic.AtomicReference;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertTrue;

/**
 * Regression tests for {@link KeycloakIntrospectionService}.
 *
 * <p>The introspection call used to be issued with Spring's RestClient, whose
 * JDK HttpURLConnection wrapper refuses to override the {@code Host} header.
 * Keycloak 24+ validates the {@code Host} header against the hostname the
 * realm was provisioned with ({@code localhost}), so the introspection
 * request was rejected with {@code rpt_as_audience invalid} / audience
 * mismatch and the auth-service returned 401. That in turn broke every
 * nginx-protected endpoint – including {@code GET /api/menu/items} – right
 * after login, because the menu calls were answered with {@code 401
 * unauthorized} instead of the menu payload.
 *
 * <p>These tests spin up a tiny local HTTP server and verify that the new
 * {@link HttpURLConnection}-based implementation sends the request body it
 * should and, most importantly, sets the {@code Host} header to
 * {@code localhost} so Keycloak accepts the introspection call.
 */
class KeycloakIntrospectionServiceTests {

    private HttpServer server;
    private int port;
    private KeycloakIntrospectionService service;

    /** Captures the Host header of the last introspection request. */
    private final AtomicReference<String> lastHostHeader = new AtomicReference<>();
    private final AtomicReference<String> lastAuthorizationHeader = new AtomicReference<>();
    private final AtomicReference<String> lastRequestBody = new AtomicReference<>();

    @BeforeEach
    void setUp() throws IOException {
        server = HttpServer.create(new InetSocketAddress("127.0.0.1", 0), 0);
        server.createContext("/realms/restaurant/introspect", exchange -> {
            lastHostHeader.set(exchange.getRequestHeaders().getFirst("Host"));
            lastAuthorizationHeader.set(exchange.getRequestHeaders().getFirst("Authorization"));
            // The request is form-encoded (application/x-www-form-urlencoded).
            byte[] body = exchange.getRequestBody().readAllBytes();
            lastRequestBody.set(new String(body, StandardCharsets.UTF_8));

            String response = "{\"active\":true,\"sub\":\"user-123\","
                    + "\"preferred_username\":\"demo\","
                    + "\"realm_access\":{\"roles\":[\"menu-editor\",\"order-viewer\"]}}";
            byte[] bytes = response.getBytes(StandardCharsets.UTF_8);
            exchange.sendResponseHeaders(200, bytes.length);
            try (OutputStream os = exchange.getResponseBody()) {
                os.write(bytes);
            }
        });
        server.start();
        port = server.getAddress().getPort();

        KeycloakIntrospectionProperties properties = new KeycloakIntrospectionProperties();
        properties.setUrl("http://127.0.0.1:" + port + "/realms/restaurant/introspect");
        properties.setClientId("restaurant-backend");
        properties.setClientSecret("restaurant-backend-secret");
        properties.setConnectTimeoutMs(1000);
        properties.setReadTimeoutMs(1000);
        service = new KeycloakIntrospectionService(properties);
    }

    @AfterEach
    void tearDown() {
        server.stop(0);
    }

    @Test
    void shouldIntrospectWithLocalhostHostHeader() {
        IntrospectionResult result = service.introspect("some-token");

        assertTrue(result.isActive());
        assertEquals("demo", result.getUsername());
        assertEquals("user-123", result.getSubject());
        assertEquals(List.of("menu-editor", "order-viewer"), result.getRoles());
        // The critical regression: Keycloak 24+ verifies the Host header matches
        // the hostname of the originally-issued realm. RestClient could not set
        // this; the new implementation must send exactly "localhost".
        assertEquals("localhost", lastHostHeader.get());
        assertEquals("Basic cmVzdGF1cmFudC1iYWNrZW5kOnJlc3RhdXJhbnQtYmFja2VuZC1zZWNyZXQ=",
                lastAuthorizationHeader.get());
        assertTrue(lastRequestBody.get().contains("token=some-token"));
    }

    @Test
    void shouldReturnInactiveForBlankOrNullToken() {
        assertFalse(service.introspect(null).isActive());
        assertFalse(service.introspect("  ").isActive());
    }

    @Test
    void shouldReturnInactiveWhenServerReturnsError() throws IOException {
        // Reuse the same server; replace the context with one that returns
        // HTTP 500 to simulate a broken Keycloak.
        server.removeContext("/realms/restaurant/introspect");
        server.createContext("/realms/restaurant/introspect", exchange -> {
            byte[] bytes = "boom".getBytes(StandardCharsets.UTF_8);
            exchange.sendResponseHeaders(500, bytes.length);
            try (OutputStream os = exchange.getResponseBody()) {
                os.write(bytes);
            }
        });

        IntrospectionResult result = service.introspect("some-token");
        assertFalse(result.isActive());
    }
}