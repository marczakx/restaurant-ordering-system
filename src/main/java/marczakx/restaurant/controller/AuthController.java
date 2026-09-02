package marczakx.restaurant.controller;

import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import marczakx.restaurant.model.dto.AuthStatusDto;
import marczakx.restaurant.service.KeycloakIntrospectionService;
import marczakx.restaurant.service.KeycloakIntrospectionService.IntrospectionResult;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.authentication.AnonymousAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.GrantedAuthority;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.oauth2.client.authentication.OAuth2AuthenticationToken;
import org.springframework.security.oauth2.core.user.OAuth2User;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.io.IOException;
import java.util.List;
import java.util.Locale;

@RestController
@RequestMapping("/api/auth")
public class AuthController {

    /**
     * Header set on the response of the nginx {@code auth_request} subrequest
     * so the upstream (backend or notification-service) can identify the user
     * without re-validating the token. nginx uses {@code auth_request_set} to
     * copy these values into the main request before proxying.
     */
    static final String HEADER_USER = "X-User";
    static final String HEADER_USER_ID = "X-User-Id";
    static final String HEADER_ROLES = "X-Roles";

    /**
     * Role that grants access to the Keycloak admin UI (/keycloak/). Both
     * {@code admin} and {@code superadmin} are accepted – superadmin is
     * treated as having every admin-level role.
     */
    private static final String ROLE_ADMIN = "admin";
    private static final String ROLE_SUPERADMIN = "superadmin";

    private final KeycloakIntrospectionService introspectionService;

    public AuthController(KeycloakIntrospectionService introspectionService) {
        this.introspectionService = introspectionService;
    }

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
        if (!authenticated) {
            return new AuthStatusDto(false, null, List.of());
        }
        return new AuthStatusDto(true, resolveDisplayName(authentication), resolveRoles(authentication));
    }

    /**
     * Verifies a bearer token presented by the nginx {@code auth_request}
     * subrequest. nginx calls this endpoint and inspects the returned HTTP
     * status: 200 means the token is valid (and the optional role check
     * passed), 401 means the token is missing/invalid, 403 means the user is
     * authenticated but does not have the required role.
     * <p>
     * On success the resolved user identity and roles are written to response
     * headers so the upstream application receives them via nginx's
     * {@code auth_request_set} directive.
     *
     * @param required optional role required to access the upstream
     *                 location. When present, the user must hold this role
     *                 (or the {@code superadmin} role, which is treated as a
     *                 superset of every required role). When absent, any
     *                 active user is accepted.
     */
    @GetMapping("/internal/verify")
    public ResponseEntity<Void> verify(HttpServletRequest request,
                                       @RequestParam(value = "required", required = false) String required) {
        String token = extractBearerToken(request);
        if (token == null) {
            return ResponseEntity.status(401).build();
        }
        IntrospectionResult result = introspectionService.introspect(token);
        if (!result.isActive()) {
            return ResponseEntity.status(401).build();
        }
        if (required != null && !required.isBlank() && !hasRequiredRole(result, required)) {
            return ResponseEntity.status(403).build();
        }
        return ResponseEntity.ok()
                .header(HEADER_USER, nullSafe(result.getUsername()))
                .header(HEADER_USER_ID, nullSafe(result.getSubject()))
                .header(HEADER_ROLES, String.join(",", result.getRoles()))
                .header(HttpHeaders.CONTENT_TYPE, MediaType.APPLICATION_JSON_VALUE)
                .build();
    }

    private static String extractBearerToken(HttpServletRequest request) {
        String header = request.getHeader(HttpHeaders.AUTHORIZATION);
        if (header == null || !header.regionMatches(true, 0, "Bearer ", 0, 7)) {
            return null;
        }
        String token = header.substring(7).trim();
        return token.isEmpty() ? null : token;
    }

    /**
     * Returns whether the introspection result grants the user the required
     * role. The {@code superadmin} role is treated as having every required
     * role, so the superadmin user can access any admin-only endpoint.
     */
    private static boolean hasRequiredRole(IntrospectionResult result, String required) {
        List<String> roles = result.getRoles();
        if (roles.contains(ROLE_SUPERADMIN)) {
            return true;
        }
        return roles.contains(required.toLowerCase(Locale.ROOT));
    }

    private static String nullSafe(String value) {
        return value == null ? "" : value;
    }

    /**
     * Resolves the roles granted to the authenticated user. Spring Security
     * prefixes role authorities with {@code ROLE_}, so those are stripped to
     * report plain role names (e.g. {@code menu-editor}, {@code menu-creator})
     * that the SPA can match against the Keycloak realm roles. Non-role
     * authorities (scopes, {@code OIDC_USER}, ...) are ignored.
     */
    private List<String> resolveRoles(Authentication authentication) {
        return authentication.getAuthorities().stream()
                .map(GrantedAuthority::getAuthority)
                .filter(authority -> authority.startsWith("ROLE_"))
                .map(authority -> authority.substring("ROLE_".length()))
                .sorted()
                .toList();
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
