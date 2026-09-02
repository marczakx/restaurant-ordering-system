package marczakx.restaurant.configuration;

import org.springframework.boot.context.properties.ConfigurationProperties;

/**
 * Configuration for calling the Keycloak token introspection endpoint
 * (RFC 7662) from the backend. Bound from the {@code keycloak.introspection.*}
 * properties in application.properties.
 */
@ConfigurationProperties(prefix = "keycloak.introspection")
public class KeycloakIntrospectionProperties {

    /**
     * Absolute URL of the Keycloak token introspection endpoint
     * ({@code /realms/{realm}/protocol/openid-connect/token/introspect}).
     */
    private String url;

    /**
     * Confidential client id used to authenticate to the introspection
     * endpoint (client credentials grant, sent as form parameters).
     */
    private String clientId;

    /**
     * Confidential client secret paired with {@link #clientId}.
     */
    private String clientSecret;

    /**
     * Connection timeout when calling the introspection endpoint.
     */
    private int connectTimeoutMs = 2000;

    /**
     * Read timeout when calling the introspection endpoint.
     */
    private int readTimeoutMs = 2000;

    public String getUrl() {
        return url;
    }

    public void setUrl(String url) {
        this.url = url;
    }

    public String getClientId() {
        return clientId;
    }

    public void setClientId(String clientId) {
        this.clientId = clientId;
    }

    public String getClientSecret() {
        return clientSecret;
    }

    public void setClientSecret(String clientSecret) {
        this.clientSecret = clientSecret;
    }

    public int getConnectTimeoutMs() {
        return connectTimeoutMs;
    }

    public void setConnectTimeoutMs(int connectTimeoutMs) {
        this.connectTimeoutMs = connectTimeoutMs;
    }

    public int getReadTimeoutMs() {
        return readTimeoutMs;
    }

    public void setReadTimeoutMs(int readTimeoutMs) {
        this.readTimeoutMs = readTimeoutMs;
    }
}
