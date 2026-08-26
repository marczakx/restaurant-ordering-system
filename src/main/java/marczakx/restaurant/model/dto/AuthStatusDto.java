package marczakx.restaurant.model.dto;

/**
 * Response of {@code GET /api/auth/status}: tells the SPA whether the
 * current browser session was authenticated by the backend OAuth2 login
 * (e.g. Google) and which user owns it.
 */
public record AuthStatusDto(boolean authenticated, String username) {
}