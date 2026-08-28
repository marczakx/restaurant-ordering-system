package marczakx.restaurant.model.dto;

import java.util.List;

/**
 * Response of {@code GET /api/auth/status}: tells the SPA whether the
 * current browser session was authenticated by the backend OAuth2 login
 * (e.g. Google), which user owns it and which roles the user has
 * (e.g. {@code menu-editor}, {@code menu-creator}).
 */
public record AuthStatusDto(boolean authenticated, String username, List<String> roles) {

}
