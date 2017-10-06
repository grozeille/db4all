package fr.grozeille.db4all.admin.web;

import fr.grozeille.db4all.ClusterConfiguration;
import fr.grozeille.db4all.admin.model.AdminUser;
import fr.grozeille.db4all.admin.repositories.AdminUserRepository;
import fr.grozeille.db4all.admin.web.dto.AdminWithTokenRequest;
import fr.grozeille.db4all.admin.web.dto.AdminWithTokenResponse;
import fr.grozeille.db4all.user.model.User;
import fr.grozeille.db4all.user.repositories.UserRepository;
import io.swagger.annotations.ApiParam;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;
import springfox.documentation.annotations.ApiIgnore;

import java.security.Principal;

@RestController
@Slf4j
@RequestMapping("/api/admin")
public class AdminResource {

    @Autowired
    private AdminUserRepository adminUserRepository;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private ClusterConfiguration clusterConfiguration;

    @PreAuthorize("hasRole('ADMIN')")
    @RequestMapping(value = "", method = RequestMethod.GET)
    public Iterable<AdminUser> adminUsers() {
        return this.adminUserRepository.findAll();
    }

    @PreAuthorize("hasRole('ADMIN')")
    @RequestMapping(value = "/{login}", method = RequestMethod.PUT)
    public ResponseEntity<Void> add(@PathVariable("login") String login) {

        User user = userRepository.findOne(login);
        if(user == null) {
            return ResponseEntity.notFound().build();
        }

        this.adminUserRepository.save(new AdminUser(login));

        return ResponseEntity.ok().build();
    }

    @RequestMapping(value = "/current-user", method = RequestMethod.POST)
    public ResponseEntity<AdminWithTokenResponse> addWithAdminToken(
            @RequestBody AdminWithTokenRequest request,
            @ApiIgnore @ApiParam(hidden = true)  Principal principal) {

        if(clusterConfiguration.getAdminToken().contentEquals(request.getAdminToken())) {
            this.adminUserRepository.save(new AdminUser(principal.getName()));
            log.info("New admin created using adminToken: "+principal.getName());
            return ResponseEntity.ok(new AdminWithTokenResponse(principal.getName()));
        }
        else {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body(new AdminWithTokenResponse());
        }
    }

    @PreAuthorize("hasRole('ADMIN')")
    @RequestMapping(value = "/{login}", method = RequestMethod.DELETE)
    public ResponseEntity<Void> delete(@PathVariable("login") String login) {

        AdminUser admin = this.adminUserRepository.findOne(login);
        if(admin == null) {
            return ResponseEntity.notFound().build();
        }

        this.adminUserRepository.delete(login);

        return ResponseEntity.ok().build();
    }

}
