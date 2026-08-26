package marczakx.restaurant.controller;

import jakarta.servlet.http.HttpServletResponse;
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

    @GetMapping("/status")
    public String status() {
        return "Authenticated";
    }
}