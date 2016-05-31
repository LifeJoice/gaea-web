package org.gaea.security.controller;

import org.gaea.data.dataset.service.GaeaDataSetService;
import org.gaea.exception.ValidationFailedException;
import org.gaea.security.domain.Resource;
import org.gaea.security.service.SystemResourcesService;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Controller;
import org.springframework.web.bind.annotation.RequestMapping;

import java.util.List;
import java.util.Map;

/**
 * 系统资源（菜单等）控制器。
 * Created by iverson on 2016/1/3.
 */
@Controller
@RequestMapping("/gaea/security/resource")
public class SystemResourcesController {

    private final Logger logger = LoggerFactory.getLogger(SystemResourcesController.class);
    @Autowired
    private SystemResourcesService systemResourcesService;

    @RequestMapping("/management")
    public String list() {
        return "system/security/resource_management.xml";
    }

    @RequestMapping(value = "/showCreateUpdateForm", produces = "plain/text; charset=UTF-8")
    public String showCreateUpdateForm() {
        return "/gaea/security/resource/create-update-form.html";
    }

    @RequestMapping(value = "/add", produces = "plain/text; charset=UTF-8")
    public String save(Resource resource) {
        systemResourcesService.save(resource);
        return "system/security/resource_management.xml";
//        return "/gaea/security/resource/create-update-form.html";
    }
}
