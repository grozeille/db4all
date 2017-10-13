package fr.grozeille.db4all.user.web;

import fr.grozeille.db4all.admin.model.AdminUser;
import fr.grozeille.db4all.admin.repositories.AdminUserRepository;
import fr.grozeille.db4all.project.repositories.ProjectRepository;
import fr.grozeille.db4all.user.model.User;
import fr.grozeille.db4all.user.repositories.UserRepository;
import io.swagger.annotations.ApiParam;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestMethod;
import org.springframework.web.bind.annotation.RestController;
import springfox.documentation.annotations.ApiIgnore;

import java.security.Principal;

@RestController
@Slf4j
@RequestMapping("/api/user")
public class UserResource {

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private ProjectRepository projectRepository;

    @Autowired
    private AdminUserRepository adminUserRepository;

    @PreAuthorize("hasRole('ADMIN')")
    @RequestMapping(value = "", method = RequestMethod.GET)
    public Iterable<User> getAll() {
        return this.userRepository.findAll();
    }

    @RequestMapping(value = "/current",  method = RequestMethod.GET)
    public User user(@ApiIgnore @ApiParam(hidden = true) Principal principal) {
        return this.userRepository.findOne(principal.getName());
    }

    @RequestMapping(value = "/current/is-admin",  method = RequestMethod.GET)
    public Boolean isAdmin(@ApiIgnore @ApiParam(hidden = true) Principal principal) {
        AdminUser adminUser = adminUserRepository.findOne(principal.getName());
        return adminUser != null;
    }
}
