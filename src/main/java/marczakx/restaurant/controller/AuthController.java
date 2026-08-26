package marczakx.restaurant.controller;

import jakarta.servlet.http.HttpServletResponse;
import marczakx.restaurant.model.dto.AuthStatusDto;
import org.springframework.security.authentication.AnonymousAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
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
        return new AuthStatusDto(authenticated, authenticated ? authentication.getName() : null);
    }
}