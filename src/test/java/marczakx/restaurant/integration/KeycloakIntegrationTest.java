package marczakx.restaurant.integration;

import org.junit.jupiter.api.AfterAll;
import org.junit.jupiter.api.BeforeAll;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.http.HttpEntity;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpMethod;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.util.LinkedMultiValueMap;
import org.springframework.util.MultiValueMap;
import org.springframework.web.client.HttpStatusCodeException;
import org.springframework.web.client.RestTemplate;
import org.testcontainers.containers.GenericContainer;
import org.testcontainers.containers.wait.strategy.Wait;
import org.testcontainers.utility.MountableFile;

import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.time.Duration;

import static org.junit.jupiter.api.Assertions.*;

/**
 * Integration tests for authentication against Keycloak.
 * <p>
 * Keycloak replaces the former {@code marczakx/auth:2} service. These tests
 * spin up a Keycloak container seeded with the same realm configuration used
 * by Docker Compose and Kubernetes ({@code keycloak/restaurant-realm.json})
 * and verify that the direct access grant (password flow) used by the
 * frontend issues tokens for valid credentials and rejects invalid ones.
 */
public class KeycloakIntegrationTest {

    private static final String KEYCLOAK_IMAGE = "quay.io/keycloak/keycloak:24.0.3";
    private static final String REALM = "restaurant";
    private static final String CLIENT_ID = "restaurant-client";

    private static final GenericContainer<?> keycloak =
            new GenericContainer<>(KEYCLOAK_IMAGE)
                    .withCommand("start-dev", "--import-realm")
                    .withExposedPorts(8080)
                    .waitingFor(Wait.forHttp("/realms/" + REALM)
                            .forPort(8080)
                            .withStartupTimeout(Duration.ofSeconds(180)));

    private static RestTemplate restTemplate;
    private static String tokenUrl;

    @BeforeAll
    static void setUp() {
        keycloak.withCopyFileToContainer(
                MountableFile.forHostPath(findRealmFile()),
                "/opt/keycloak/data/import/restaurant-realm.json");
        keycloak.start();

        restTemplate = new RestTemplate();
        tokenUrl = "http://localhost:" + keycloak.getMappedPort(8080)
                + "/realms/" + REALM + "/protocol/openid-connect/token";
    }

    @AfterAll
    static void tearDown() {
        if (keycloak.isRunning()) {
            keycloak.stop();
        }
    }

    /**
     * Locate the shared realm configuration regardless of the working
     * directory the tests are executed from (repo root or module dir).
     */
    private static Path findRealmFile() {
        Path candidate = Paths.get("keycloak", "restaurant-realm.json");
        if (Files.exists(candidate)) {
            return candidate;
        }
        return Paths.get("..", "keycloak", "restaurant-realm.json");
    }

    private static ResponseEntity<String> requestToken(String username, String password) {
        HttpHeaders headers = new HttpHeaders();
        headers.setContentType(MediaType.APPLICATION_FORM_URLENCODED);
        MultiValueMap<String, String> body = new LinkedMultiValueMap<>();
        body.add("grant_type", "password");
        body.add("client_id", CLIENT_ID);
        body.add("username", username);
        body.add("password", password);
        return restTemplate.exchange(tokenUrl, HttpMethod.POST,
                new HttpEntity<>(body, headers), String.class);
    }

    @Test
    @DisplayName("Token endpoint should issue an access token for valid credentials")
    void tokenIssuedForValidCredentials() {
        ResponseEntity<String> response = requestToken("demo", "demo");
        assertEquals(200, response.getStatusCode().value(),
                "Login with valid credentials should succeed");
        assertTrue(response.getBody().contains("access_token"),
                "Response should contain an access_token");
    }

    @Test
    @DisplayName("Token endpoint should reject invalid credentials")
    void invalidCredentialsAreRejected() {
        HttpStatusCodeException exception = assertThrows(HttpStatusCodeException.class,
                () -> requestToken("demo", "wrong-password"),
                "Login with wrong credentials should be rejected");
        assertEquals(401, exception.getStatusCode().value(),
                "Invalid credentials should result in 401 Unauthorized");
        assertTrue(exception.getResponseBodyAsString().contains("invalid_grant"),
                "Error response should contain invalid_grant");
    }
}