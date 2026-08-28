package marczakx.restaurant.controller;

import marczakx.restaurant.configuration.SecurityConfig;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.WebMvcTest;
import org.springframework.context.annotation.Import;
import org.springframework.security.core.GrantedAuthority;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.oauth2.client.authentication.OAuth2AuthenticationToken;
import org.springframework.security.oauth2.core.user.DefaultOAuth2User;
import org.springframework.security.test.web.servlet.request.SecurityMockMvcRequestPostProcessors;
import org.springframework.test.web.servlet.MockMvc;

import java.util.Collection;
import java.util.Collections;
import java.util.List;
import java.util.Map;

import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

/**
 * Slice test for the auth status endpoint used by the SPA callback after
 * the Google OAuth2 login. Uses the real SecurityConfig so the reported
 * authentication state matches production behaviour.
 */
@WebMvcTest(AuthController.class)
@Import(SecurityConfig.class)
class AuthControllerTests {

    @Autowired
    private MockMvc mockMvc;

    @Test
    void shouldReportUnauthenticatedWithoutOAuth2Session() throws Exception {
        mockMvc.perform(get("/api/auth/status"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.authenticated").value(false))
                .andExpect(jsonPath("$.roles.length()").value(0));
    }

    @Test
    void shouldReportAuthenticatedUserWhenSessionExists() throws Exception {
        mockMvc.perform(get("/api/auth/status")
                        .with(SecurityMockMvcRequestPostProcessors.user("google-user")))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.authenticated").value(true))
                .andExpect(jsonPath("$.username").value("google-user"));
    }

    @Test
    void shouldReportRolesOfTheAuthenticatedUser() throws Exception {
        mockMvc.perform(get("/api/auth/status")
                        .with(SecurityMockMvcRequestPostProcessors.user("editor-user")
                                .roles("menu-editor", "menu-creator")))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.authenticated").value(true))
                .andExpect(jsonPath("$.username").value("editor-user"))
                .andExpect(jsonPath("$.roles.length()").value(2))
                .andExpect(jsonPath("$.roles[0]").value("menu-creator"))
                .andExpect(jsonPath("$.roles[1]").value("menu-editor"));
    }

    @Test
    void shouldReportEmptyRolesForUserWithoutRoleAuthorities() throws Exception {
        mockMvc.perform(get("/api/auth/status")
                        .with(SecurityMockMvcRequestPostProcessors.authentication(googleToken(
                                Map.of("sub", "1234567890", "email", "john.doe@example.com"),
                                Collections.emptyList()))))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.authenticated").value(true))
                .andExpect(jsonPath("$.roles.length()").value(0));
    }

    @Test
    void shouldIgnoreNonRoleAuthoritiesWhenResolvingRoles() throws Exception {
        // OAuth2 logins carry authorities like SCOPE_* and OIDC_USER that are
        // not roles; only ROLE_-prefixed authorities may be reported.
        Collection<? extends GrantedAuthority> authorities = List.of(
                new SimpleGrantedAuthority("OIDC_USER"),
                new SimpleGrantedAuthority("SCOPE_openid"),
                new SimpleGrantedAuthority("ROLE_menu-editor"));
        mockMvc.perform(get("/api/auth/status")
                        .with(SecurityMockMvcRequestPostProcessors.authentication(googleToken(
                                Map.of("sub", "1234567890", "email", "john.doe@example.com"),
                                authorities))))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.authenticated").value(true))
                .andExpect(jsonPath("$.roles.length()").value(1))
                .andExpect(jsonPath("$.roles[0]").value("menu-editor"));
    }

    @Test
    void shouldReportEmailInsteadOfNumericSubjectForGoogleOAuth2User() throws Exception {
        mockMvc.perform(get("/api/auth/status")
                        .with(SecurityMockMvcRequestPostProcessors.authentication(googleToken(
                                Map.of("sub", "1234567890",
                                       "email", "john.doe@example.com",
                                       "name", "John Doe")))))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.authenticated").value(true))
                .andExpect(jsonPath("$.username").value("john.doe@example.com"));
    }

    @Test
    void shouldReportFullNameWhenEmailAttributeIsMissing() throws Exception {
        mockMvc.perform(get("/api/auth/status")
                        .with(SecurityMockMvcRequestPostProcessors.authentication(googleToken(
                                Map.of("sub", "1234567890",
                                       "name", "John Doe")))))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.authenticated").value(true))
                .andExpect(jsonPath("$.username").value("John Doe"));
    }

    @Test
    void shouldFallBackToNumericSubjectWhenNoEmailOrNameAttribute() throws Exception {
        mockMvc.perform(get("/api/auth/status")
                        .with(SecurityMockMvcRequestPostProcessors.authentication(googleToken(
                                Map.of("sub", "1234567890")))))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.authenticated").value(true))
                .andExpect(jsonPath("$.username").value("1234567890"));
    }

    /**
     * Builds an OAuth2 authentication like the one Spring Security stores in
     * the session after the Google login. The principal name ("sub") is the
     * numeric Google subject, which is what used to be displayed in the UI.
     */
    private static OAuth2AuthenticationToken googleToken(Map<String, Object> attributes) {
        return googleToken(attributes, Collections.emptySet());
    }

    private static OAuth2AuthenticationToken googleToken(Map<String, Object> attributes,
                                                         Collection<? extends GrantedAuthority> authorities) {
        DefaultOAuth2User principal = new DefaultOAuth2User(authorities, attributes, "sub");
        return new OAuth2AuthenticationToken(principal, principal.getAuthorities(), "google");
    }
}