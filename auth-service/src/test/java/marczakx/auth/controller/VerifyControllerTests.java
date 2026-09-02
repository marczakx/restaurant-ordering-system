package marczakx.auth.controller;

import marczakx.auth.service.KeycloakIntrospectionService;
import marczakx.auth.service.KeycloakIntrospectionService.IntrospectionResult;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.WebMvcTest;
import org.springframework.boot.test.mock.mockito.MockBean;
import org.springframework.test.web.servlet.MockMvc;

import java.util.List;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.header;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

/**
 * Slice test for the auth-service verify endpoint, used by the nginx
 * auth_request subrequest. Mocks KeycloakIntrospectionService so the tests
 * stay hermetic and do not require a running Keycloak.
 */
@WebMvcTest(VerifyController.class)
class VerifyControllerTests {

    @Autowired
    private MockMvc mockMvc;

    @MockBean
    private KeycloakIntrospectionService introspectionService;

    @Test
    void shouldReturn401WhenAuthorizationHeaderIsMissing() throws Exception {
        mockMvc.perform(get("/internal/verify"))
                .andExpect(status().isUnauthorized());
        verify(introspectionService, never()).introspect(any());
    }

    @Test
    void shouldReturn401WhenAuthorizationHeaderIsNotBearer() throws Exception {
        mockMvc.perform(get("/internal/verify")
                        .header("Authorization", "Basic dXNlcjpwYXNz"))
                .andExpect(status().isUnauthorized());
        verify(introspectionService, never()).introspect(any());
    }

    @Test
    void shouldReturn401WhenTokenIsInactive() throws Exception {
        when(introspectionService.introspect("expired-token"))
                .thenReturn(IntrospectionResult.inactive());
        mockMvc.perform(get("/internal/verify")
                        .header("Authorization", "Bearer expired-token"))
                .andExpect(status().isUnauthorized());
    }

    @Test
    void shouldReturn200AndUserHeadersWhenTokenIsActiveAndNoRoleRequired() throws Exception {
        when(introspectionService.introspect("good-token"))
                .thenReturn(IntrospectionResult.of(true, "demo", "user-123", List.of("menu-editor", "order-viewer")));
        mockMvc.perform(get("/internal/verify")
                        .header("Authorization", "Bearer good-token"))
                .andExpect(status().isOk())
                .andExpect(header().string("X-User", "demo"))
                .andExpect(header().string("X-User-Id", "user-123"))
                .andExpect(header().string("X-Roles", "menu-editor,order-viewer"));
    }

    @Test
    void shouldReturn200WhenRequiredRoleMatches() throws Exception {
        when(introspectionService.introspect("admin-token"))
                .thenReturn(IntrospectionResult.of(true, "admin", "user-admin", List.of("admin", "menu-editor")));
        mockMvc.perform(get("/internal/verify")
                        .param("required", "admin")
                        .header("Authorization", "Bearer admin-token"))
                .andExpect(status().isOk())
                .andExpect(header().string("X-User", "admin"));
    }

    @Test
    void shouldReturn403WhenRequiredRoleIsMissing() throws Exception {
        when(introspectionService.introspect("viewer-token"))
                .thenReturn(IntrospectionResult.of(true, "manager", "user-mgr", List.of("order-viewer")));
        mockMvc.perform(get("/internal/verify")
                        .param("required", "admin")
                        .header("Authorization", "Bearer viewer-token"))
                .andExpect(status().isForbidden());
    }

    @Test
    void shouldReturn200ForSuperadminRegardlessOfRequiredRole() throws Exception {
        when(introspectionService.introspect("super-token"))
                .thenReturn(IntrospectionResult.of(true, "root", "user-root", List.of("superadmin")));
        mockMvc.perform(get("/internal/verify")
                        .param("required", "admin")
                        .header("Authorization", "Bearer super-token"))
                .andExpect(status().isOk())
                .andExpect(header().string("X-User", "root"));
    }

    @Test
    void shouldReturn200WithEmptyHeadersWhenIntrospectionResultHasNoUser() throws Exception {
        when(introspectionService.introspect("anon-token"))
                .thenReturn(IntrospectionResult.of(true, null, null, List.of()));
        mockMvc.perform(get("/internal/verify")
                        .header("Authorization", "Bearer anon-token"))
                .andExpect(status().isOk())
                .andExpect(header().string("X-User", ""))
                .andExpect(header().string("X-User-Id", ""))
                .andExpect(header().string("X-Roles", ""));
    }
}
