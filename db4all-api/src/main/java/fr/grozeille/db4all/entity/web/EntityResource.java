package fr.grozeille.db4all.entity.web;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.google.common.base.Strings;
import fr.grozeille.db4all.entity.model.Entity;
import fr.grozeille.db4all.entity.model.EntitySearchItem;
import fr.grozeille.db4all.entity.repositories.DataSetRepository;
import fr.grozeille.db4all.entity.repositories.EntityRepository;
import fr.grozeille.scuba.dataset.model.DataSetConf;
import fr.grozeille.scuba.dataset.model.DataSetSearchItem;
import fr.grozeille.scuba.dataset.model.HiveTable;
import fr.grozeille.scuba.dataset.repositories.DataSetRepository;
import fr.grozeille.scuba.dataset.services.DataSetService;
import fr.grozeille.scuba.dataset.web.dto.DataSetData;
import fr.grozeille.scuba.dataset.web.dto.DataSetRequest;
import io.swagger.annotations.ApiImplicitParam;
import io.swagger.annotations.ApiImplicitParams;
import lombok.extern.slf4j.Slf4j;
import org.apache.thrift.TException;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.scheduling.concurrent.ThreadPoolTaskExecutor;
import org.springframework.web.bind.annotation.*;

import java.io.IOException;
import java.security.Principal;
import java.util.Collection;

@RestController
@Slf4j
@RequestMapping("/api/entity")
public class EntityResource {

    private static final String DEFAULT_MAX = "50000";

    @Autowired
    private EntityRepository entityRepository;

    @ApiImplicitParams({
            @ApiImplicitParam(name = "page", dataType = "integer", paramType = "query",
                    value = "Results page you want to retrieve (0..N)"),
            @ApiImplicitParam(name = "size", dataType = "integer", paramType = "query",
                    value = "Number of records per page."),
            @ApiImplicitParam(name = "sort", allowMultiple = true, dataType = "string", paramType = "query",
                    value = "Sorting criteria in the format: property(,asc|desc). " +
                            "Default sort order is ascending. " +
                            "Multiple sort criteria are supported.")
    })
    @RequestMapping(value = "", method = RequestMethod.GET)
    public Iterable<Entity> filter(
            Pageable pageable,
            @RequestParam(value = "filter", required = false, defaultValue = "") String filter) {

        return internalFilter(pageable, filter, "");
    }

    @ApiImplicitParams({
            @ApiImplicitParam(name = "page", dataType = "integer", paramType = "query",
                    value = "Results page you want to retrieve (0..N)"),
            @ApiImplicitParam(name = "size", dataType = "integer", paramType = "query",
                    value = "Number of records per page."),
            @ApiImplicitParam(name = "sort", allowMultiple = true, dataType = "string", paramType = "query",
                    value = "Sorting criteria in the format: property(,asc|desc). " +
                            "Default sort order is ascending. " +
                            "Multiple sort criteria are supported.")
    })
    @RequestMapping(value = "/{project}", method = RequestMethod.GET)
    public Iterable<Entity> filter(
            Pageable pageable,
            @PathVariable("project") String project,
            @RequestParam(value = "filter", required = false, defaultValue = "") String filter) {

        return internalFilter(pageable, filter, project);
    }

    @RequestMapping(value = "/{project}/{entity}", method = RequestMethod.GET)
    public ResponseEntity<Entity> get(@PathVariable("project") String project,
                                         @PathVariable("entity") String entity) throws IOException {
        return null;
    }

    @RequestMapping(value = "/{project}/{entity}", method = RequestMethod.DELETE)
    public void delete(
            @PathVariable("project") String project,
            @PathVariable("entity") String entity) throws Exception {

    }

    private Iterable<Entity> internalFilter(Pageable pageable, String filter, String project) {
        if(pageable.getSort() == null) {
            pageable = new PageRequest(
                    pageable.getPageNumber(),
                    pageable.getPageSize(),
                    new Sort(Sort.Direction.ASC, "project", "name"));
        }

        final ObjectMapper objectMapper = new ObjectMapper();
        Page<EntitySearchItem> result;
        result = entityRepository.findAllAndProject(pageable, filter, "");

        return result.map(dataSetSearchItem -> {
            try {
                return objectMapper.readValue(dataSetSearchItem.getJsonData(), Entity.class);
            } catch (IOException e) {
                log.error("Unable to read json data: "+ dataSetSearchItem.getJsonData());
                return null;
            }
        });
    }
}
