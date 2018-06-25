package fr.grozeille.db4all2.user.web;

import com.erudika.para.client.ParaClient;
import com.erudika.para.utils.Pager;
import io.swagger.annotations.ApiParam;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestMethod;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;
import springfox.documentation.annotations.ApiIgnore;
import com.erudika.para.core.User;

import java.security.Principal;
import java.util.List;

@RestController
@Slf4j
@RequestMapping("/api/user")
public class UserResource {

    @Autowired
    private ParaClient paraClient;

    @PreAuthorize("hasRole('ADMIN')")
    @RequestMapping(value = "", method = RequestMethod.GET)
    public ResponseEntity<List<User>> search(
            @RequestParam(value = "page", required = false, defaultValue = "0") Integer page,
            @RequestParam(value = "size", required = false, defaultValue = "100") Integer size,
            @RequestParam(value = "filter", required = false, defaultValue = "*") String filter
    ) {
        Pager pager = new Pager(page, size);
        List<User> result = paraClient.findQuery(new User().getType(), filter, pager);
        return ResponseEntity.ok().body(result);
    }

    @RequestMapping(value = "/current",  method = RequestMethod.GET)
    public User user(@ApiIgnore @ApiParam(hidden = true) Principal principal) {
        User user = paraClient.me();
        return user;
    }

    @RequestMapping(value = "/current/is-admin",  method = RequestMethod.GET)
    public Boolean isAdmin(@ApiIgnore @ApiParam(hidden = true) Principal principal) {
        // TODO
        return true;
    }
}
