package fr.grozeille.db4all.configurations;

import fr.grozeille.db4all.user.model.User;
import fr.grozeille.db4all.user.repositories.UserRepository;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.context.ApplicationListener;
import org.springframework.security.authentication.event.InteractiveAuthenticationSuccessEvent;
import org.springframework.stereotype.Service;

import java.time.Instant;
import java.time.LocalDateTime;
import java.util.TimeZone;

@Service
@Slf4j
public class InternalAuthenticationListener implements ApplicationListener<InteractiveAuthenticationSuccessEvent> {

    @Autowired
    private UserRepository userRepository;

    @Override
    public void onApplicationEvent(final InteractiveAuthenticationSuccessEvent event) {
        log.info("Success login form " + event.getAuthentication().getName());

        User user = this.userRepository.findOne(event.getAuthentication().getName());
        if(user == null) {
            user = new User();
            user.setLogin(event.getAuthentication().getName());
        }

        LocalDateTime triggerTime =
                LocalDateTime.ofInstant(Instant.ofEpochMilli(event.getTimestamp()), TimeZone.getDefault().toZoneId());

        user.setLastLogin(triggerTime);

        // keep a trace of the authentication
        try {
            userRepository.save(user);
        } catch (Exception e) {
            log.error("Unable to save the authenticated user: "+user.getLogin());
        }
    }

}
