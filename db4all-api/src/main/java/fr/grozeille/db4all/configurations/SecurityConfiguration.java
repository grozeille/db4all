package fr.grozeille.db4all.configurations;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.autoconfigure.security.oauth2.client.OAuth2SsoProperties;
import org.springframework.boot.autoconfigure.security.oauth2.resource.ResourceServerProperties;
import org.springframework.boot.autoconfigure.security.oauth2.resource.UserInfoTokenServices;
import org.springframework.boot.context.properties.ConfigurationProperties;
import org.springframework.boot.web.servlet.FilterRegistrationBean;
import org.springframework.context.ApplicationEventPublisher;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.security.authentication.AuthenticationEventPublisher;
import org.springframework.security.authentication.DefaultAuthenticationEventPublisher;
import org.springframework.security.authentication.ProviderManager;
import org.springframework.security.config.annotation.authentication.builders.AuthenticationManagerBuilder;
import org.springframework.security.config.annotation.method.configuration.EnableGlobalMethodSecurity;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.annotation.web.builders.WebSecurity;
import org.springframework.security.config.annotation.web.configuration.EnableWebSecurity;
import org.springframework.security.config.annotation.web.configuration.WebSecurityConfigurerAdapter;
import org.springframework.security.oauth2.client.OAuth2ClientContext;
import org.springframework.security.oauth2.client.OAuth2RestTemplate;
import org.springframework.security.oauth2.client.filter.OAuth2ClientAuthenticationProcessingFilter;
import org.springframework.security.oauth2.client.filter.OAuth2ClientContextFilter;
import org.springframework.security.oauth2.client.token.grant.code.AuthorizationCodeResourceDetails;
import org.springframework.security.oauth2.config.annotation.web.configuration.EnableOAuth2Client;
import org.springframework.security.web.AuthenticationEntryPoint;
import org.springframework.security.web.authentication.LoginUrlAuthenticationEntryPoint;
import org.springframework.security.web.authentication.www.BasicAuthenticationEntryPoint;
import org.springframework.security.web.authentication.www.BasicAuthenticationFilter;

import javax.servlet.Filter;
import java.util.Arrays;
import java.util.HashMap;
import java.util.Map;

@EnableWebSecurity
@EnableOAuth2Client
@EnableGlobalMethodSecurity(prePostEnabled = true)
@Configuration
public class SecurityConfiguration extends WebSecurityConfigurerAdapter {

    @Autowired
    private OAuth2ClientContext oauth2ClientContext;

    @Autowired
    private ApplicationEventPublisher applicationEventPublisher;

    @Autowired
    private InternalAuthoritiesExtractor internalAuthoritiesExtractor;

    @Value("${security.enabled}")
    private boolean securityEnabled;

    @Bean
    @ConfigurationProperties("security.oauth2.client")
    public AuthorizationCodeResourceDetails client() {
        return new AuthorizationCodeResourceDetails();
    }

    @Bean
    @ConfigurationProperties("security.oauth2.resource")
    public ResourceServerProperties resource() {
        return new ResourceServerProperties();
    }

    @Bean
    public OAuth2SsoProperties oAuth2SsoProperties(){
        return new OAuth2SsoProperties();
    }

    @Bean
    public FilterRegistrationBean oauth2ClientFilterRegistration(OAuth2ClientContextFilter filter) {
        FilterRegistrationBean registration = new FilterRegistrationBean();
        registration.setFilter(filter);
        registration.setOrder(-100);
        return registration;
    }

    private Filter ssoFilter() {
        OAuth2ClientAuthenticationProcessingFilter filter = new OAuth2ClientAuthenticationProcessingFilter("/login");

        filter.setApplicationEventPublisher(this.applicationEventPublisher);

        UserInfoTokenServices userInfoTokenServices = new UserInfoTokenServices(resource().getUserInfoUri(), resource().getClientId());
        userInfoTokenServices.setAuthoritiesExtractor(internalAuthoritiesExtractor);
        filter.setTokenServices(userInfoTokenServices);

        OAuth2RestTemplate template = new OAuth2RestTemplate(client(), oauth2ClientContext);
        filter.setRestTemplate(template);

        return filter;
    }

    private Filter basicFilter() throws Exception {
        InternalTestAuthenticationProvider internalProvider = new InternalTestAuthenticationProvider();
        internalProvider.setAuthoritiesExtractor(internalAuthoritiesExtractor);

        Map<String, String> loginPasswords = new HashMap<>();
        loginPasswords.put("admin", "admin");
        loginPasswords.put("user", "user");
        internalProvider.setLoginPasswords(loginPasswords);

        ProviderManager providerManager = new ProviderManager(Arrays.asList(internalProvider));
        AuthenticationEventPublisher authenticationEventPublisher = new DefaultAuthenticationEventPublisher(this.applicationEventPublisher);
        providerManager.setAuthenticationEventPublisher(authenticationEventPublisher);

        BasicAuthenticationFilter filter = new BasicAuthenticationFilter(providerManager);

        return filter;
    }

    private AuthenticationEntryPoint basicEntryPoint() {
        BasicAuthenticationEntryPoint entryPoint = new BasicAuthenticationEntryPoint();
        entryPoint.setRealmName("Realm");

        return entryPoint;
    }

    @Override
    protected void configure(AuthenticationManagerBuilder auth) throws Exception {
        super.configure(auth);
    }

    @Override
    public void configure(WebSecurity web) throws Exception {
        web.ignoring()
                .antMatchers(
                        "/**/*.css", "/**/*.js",
                        "/**/*.ttf", "/**/*.eot", "/**/*.woff", "/**/*.woff2","/**/*.svg",
                        "/**/*.png", "/**/*.jpg", "/**/*.gif");
    }

    @Override
    protected void configure(HttpSecurity http) throws Exception {
        if(securityEnabled) {
            http
                    .authorizeRequests()
                        .antMatchers(
                            "/login**",
                            "/login",
                            "/health**",
                            "/info**",
                            "/metrics**",
                            "/h2-console/**",
                            "/api/profile/user"
                        ).permitAll()
                        .antMatchers("/").authenticated()
                        .antMatchers("/**").hasRole("USER")
                        .anyRequest().authenticated()
                    .and()
                    .exceptionHandling().authenticationEntryPoint(new LoginUrlAuthenticationEntryPoint("/login"))
                    .and()
                    .logout().logoutUrl("/logout").logoutSuccessUrl("/").permitAll()
                    .and()
                    .headers().frameOptions().disable()
                    .and()
                    .csrf().disable()
                    .addFilterBefore(ssoFilter(), BasicAuthenticationFilter.class);
        }
        else {
            //http.antMatcher("/**").authorizeRequests().anyRequest().permitAll().and().csrf().disable();

            http
                    .authorizeRequests()
                        .antMatchers(
                                "/login**",
                                "/login",
                                "/health**",
                                "/info**",
                                "/metrics**",
                                "/h2-console/**",
                                "/api/profile/user"
                        ).permitAll()
                        .antMatchers("/").authenticated()
                        .antMatchers("/**").hasRole("USER")
                        .anyRequest().authenticated()
                    .and()
                    .exceptionHandling().authenticationEntryPoint(basicEntryPoint())
                    .and()
                    .logout().logoutUrl("/logout").logoutSuccessUrl("/").permitAll()
                    .and()
                    .headers().frameOptions().disable()
                    .and()
                    .csrf().disable()
                    .addFilter(basicFilter());
        }
    }
}
