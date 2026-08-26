package marczakx.restaurant.configuration;

import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.annotation.web.configuration.EnableWebSecurity;
import org.springframework.security.web.SecurityFilterChain;

@Configuration
@EnableWebSecurity
public class SecurityConfig {

    @Bean
    public SecurityFilterChain filterChain(HttpSecurity http) throws Exception {
        http
            .csrf().disable()
            // NOTE: the REST API stays open for now (same behaviour as before
            // Spring Security was introduced). Tokens obtained from Keycloak
            // by the SPA are not validated server-side yet; enabling strict
            // authentication here would require an oauth2ResourceServer setup
            // plus test updates, which is out of scope for this change.
            .authorizeHttpRequests(authz -> authz
                .anyRequest().permitAll()
            )
            // Enables the standard OAuth2 authorization-code flow:
            // GET /oauth2/authorization/google starts the Google login and
            // GET /login/oauth2/code/google handles the callback.
            .oauth2Login(oauth2 -> oauth2
                .defaultSuccessUrl("/menu", true)
            );

        return http.build();
    }
}