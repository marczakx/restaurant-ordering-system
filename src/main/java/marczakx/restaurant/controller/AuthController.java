package marczakx.restaurant.controller;

import jakarta.servlet.http.HttpServletResponse;
import marczakx.restaurant.model.dto.AuthStatusDto;
import org.springframework.security.authentication.AnonymousAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.oauth2.client.authentication.OAuth2AuthenticationToken;
import org.springframework.security.oauth2.core.user.OAuth2User;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.io.IOException;

@RestController
@RequestMapping("/api/auth")
public class AuthController {

    /**
     * Kicks off the Google OAuth2 authorization-code flow handled by
     * Spring Security. The browser is redirected to the standard
     * {@code /oauth2/authorization/google} endpoint, which forwards to
     * Google's consent screen.
     */
    @GetMapping("/google")
    public void googleLogin(HttpServletResponse response) throws IOException {
        response.sendRedirect("/oauth2/authorization/google");
    }

    /**
     * Reports whether the current browser session is authenticated by the
     * backend OAuth2 login (e.g. Google). The SPA calls this from its
     * {@code /login/callback} route after being redirected back from the
     * OAuth2 flow, so it can mark the session as logged in on the client
     * side and continue to the protected routes.
     */
    @GetMapping("/status")
    public AuthStatusDto status() {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        boolean authenticated = authentication != null
                && authentication.isAuthenticated()
                && !(authentication instanceof AnonymousAuthenticationToken);
        return new AuthStatusDto(authenticated, authenticated ? resolveDisplayName(authentication) : null);
    }

    /**
     * Resolves a human-readable name for the authenticated user. For the
     * Google OAuth2 login the principal is an {@link OAuth2User} whose
     * {@code getName()} returns the numeric Google subject, so we prefer the
     * {@code email} or {@code name} attribute instead. For other login
     * methods (e.g. Keycloak password flow) the regular principal name is
     * used.
     */
    private String resolveDisplayName(Authentication authentication) {
        if (authentication instanceof OAuth2AuthenticationToken oauthToken) {
            OAuth2User oauth2User = oauthToken.getPrincipal();
            Object email = oauth2User.getAttribute("email");
            if (email instanceof String s && !s.isBlank()) {
                return s;
            }
            Object name = oauth2User.getAttribute("name");
            if (name instanceof String s && !s.isBlank()) {
                return s;
            }
        }
        return authentication.getName();
    }
}