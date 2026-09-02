package marczakx.auth.controller;

import jakarta.servlet.http.HttpServletRequest;
import marczakx.auth.service.KeycloakIntrospectionService;
import marczakx.auth.service.KeycloakIntrospectionService.IntrospectionResult;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;
import java.util.Locale;

/**
 * Verifies a bearer token presented by the nginx {@code auth_request}
 * subrequest. nginx calls this endpoint and inspects the returned HTTP
 * status:
 * <ul>
 *   <li>200 – the token is valid (and the optional role check passed); the
 *       resolved user identity is forwarded to the upstream application via
 *       the {@code X-User}, {@code X-User-Id} and {@code X-Roles} response
 *       headers (nginx copies them with {@code auth_request_set}).</li>
 *   <li>401 – the token is missing or invalid.</li>
 *   <li>403 – the user is authenticated but does not have the required role.</li>
 * </ul>
 */
@RestController
public class VerifyController {

    /** Header set on the response so nginx can copy the user identity. */
    public static final String HEADER_USER = "X-User";
    public static final String HEADER_USER_ID = "X-User-Id";
    public static final String HEADER_ROLES = "X-Roles";

    /**
     * Role that grants access to the Keycloak admin UI (/keycloak/). Both
     * {@code admin} and {@code superadmin} are accepted – superadmin is
     * treated as having every admin-level role.
     */
    private static final String ROLE_SUPERADMIN = "superadmin";

    private final KeycloakIntrospectionService introspectionService;

    public VerifyController(KeycloakIntrospectionService introspectionService) {
        this.introspectionService = introspectionService;
    }

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
}
