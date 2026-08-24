package marczakx.restaurant.integration;

import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.BeforeAll;
import org.junit.jupiter.api.AfterAll;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.extension.ExtendWith;
import org.springframework.http.HttpEntity;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpMethod;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.client.RestTemplate;
import org.testcontainers.containers.GenericContainer;
import org.testcontainers.junit.jupiter.Container;
import org.testcontainers.junit.jupiter.Testcontainers;

import static org.junit.jupiter.api.Assertions.*;

/**
 * Integration tests for the external {@code marczakx/auth:2} service.
 * <p>
 * The tests spin up the Docker image using Testcontainers and perform
 * simple HTTP requests against the exposed endpoints.  The goal is to
 * verify that the service is reachable and that the authentication
 * endpoint behaves as expected for invalid credentials.
 */
@Testcontainers
public class AuthServiceIntegrationTest {

    /**
     * Start the auth service container.  The image is pulled from Docker
     * Hub and exposes port 8080 by default.
     */
    @Container
    private static final GenericContainer<?> authContainer =
            new GenericContainer<>("marczakx/auth:2")
                    .withExposedPorts(8080);

    private static RestTemplate restTemplate;
    private static String baseUrl;

    @BeforeAll
    static void setUp() {
        restTemplate = new RestTemplate();
        int mappedPort = authContainer.getMappedPort(8080);
        baseUrl = "http://localhost:" + mappedPort;
    }

    @AfterAll
    static void tearDown() {
        // Testcontainers automatically stops containers after tests.
    }

    @Test
    @DisplayName("Health endpoint should return 200 OK")
    void healthEndpointReturnsOk() {
        ResponseEntity<String> response = restTemplate.getForEntity(baseUrl + "/health", String.class);
        assertEquals(200, response.getStatusCodeValue(), "Health endpoint should be reachable");
    }

    @Test
    @DisplayName("Login with invalid credentials should return 401 Unauthorized")
    void loginWithInvalidCredentialsReturnsUnauthorized() {
        HttpHeaders headers = new HttpHeaders();
        headers.setContentType(MediaType.APPLICATION_JSON);
        String body = "{\"user\":\"invalid\",\"password\":\"wrong\"}";
        HttpEntity<String> request = new HttpEntity<>(body, headers);
        ResponseEntity<String> response = restTemplate.exchange(baseUrl + "/login", HttpMethod.POST, request, String.class);
        assertEquals(401, response.getStatusCodeValue(), "Login with wrong credentials should be unauthorized");
    }
}
