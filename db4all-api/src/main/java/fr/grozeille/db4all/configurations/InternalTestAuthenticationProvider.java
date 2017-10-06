package fr.grozeille.db4all.configurations;

import org.springframework.boot.autoconfigure.security.oauth2.resource.AuthoritiesExtractor;
import org.springframework.boot.autoconfigure.security.oauth2.resource.FixedAuthoritiesExtractor;
import org.springframework.security.authentication.BadCredentialsException;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.authentication.dao.AbstractUserDetailsAuthenticationProvider;
import org.springframework.security.core.AuthenticationException;
import org.springframework.security.core.GrantedAuthority;
import org.springframework.security.core.userdetails.User;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.core.userdetails.UsernameNotFoundException;
import org.springframework.util.Assert;

import java.util.HashMap;
import java.util.List;
import java.util.Map;

public class InternalTestAuthenticationProvider extends AbstractUserDetailsAuthenticationProvider {

    private AuthoritiesExtractor authoritiesExtractor = new FixedAuthoritiesExtractor();

    private Map<String, String> loginPasswords = new HashMap<>();

    @Override
    protected void additionalAuthenticationChecks(UserDetails userDetails, UsernamePasswordAuthenticationToken usernamePasswordAuthenticationToken) throws AuthenticationException {

    }

    @Override
    protected UserDetails retrieveUser(String username, UsernamePasswordAuthenticationToken token) throws AuthenticationException {

        if(this.loginPasswords.containsKey(username)) {
            if(this.loginPasswords.get(username).equals(token.getCredentials())) {
                Map<String, Object> map = new HashMap<>();
                map.put("login", token.getPrincipal());
                List<GrantedAuthority> grantedAuthorities = authoritiesExtractor.extractAuthorities(map);

                return new User(token.getPrincipal().toString(), token.getCredentials().toString(), grantedAuthorities);
            }
            else {
                throw new BadCredentialsException("Invalid password");
            }
        }
        else {
            throw new UsernameNotFoundException("Invalid user");
        }
    }

    public void setAuthoritiesExtractor(AuthoritiesExtractor authoritiesExtractor) {
        Assert.notNull(authoritiesExtractor, "AuthoritiesExtractor must not be null");
        this.authoritiesExtractor = authoritiesExtractor;
    }

    public void setLoginPasswords(Map<String, String> loginPasswords) {
        this.loginPasswords = loginPasswords;
    }
}
