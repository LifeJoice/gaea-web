package org.gaea.security.controller;

import org.gaea.exception.ProcessFailedException;
import org.gaea.exception.ValidationFailedException;
import org.gaea.framework.web.bind.annotation.RequestBean;
import org.gaea.framework.web.common.WebCommonDefinition;
import org.gaea.security.domain.Authority;
import org.gaea.security.service.SystemAuthoritiesService;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Controller;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.ResponseBody;

import java.io.IOException;
import java.util.List;

/**
 * 系统权限控制器。
 * Created by iverson on 2016-8-1 11:33:25.
 */
@Controller
@RequestMapping("/gaea/security/authority")
public class SystemAuthoritiesController {

    private final Logger logger = LoggerFactory.getLogger(SystemAuthoritiesController.class);
    @Autowired
    private SystemAuthoritiesService systemAuthoritiesService;

    @RequestMapping("/management")
    public String list() {
        return "system/security/authority_management.xml";
    }

    @RequestMapping(value = "/showCreateUpdateForm", produces = "plain/text; charset=UTF-8")
    public String showCreateUpdateForm() {
        return "/gaea-system/security/authority/crud-form.html";
    }

    /**
     * 权限资源关系编辑页
     *
     * @return
     */
    @RequestMapping(value = "/showAuthResource", produces = "plain/text; charset=UTF-8")
    public String showAuthResource() {
        return "/gaea-system/security/authority/authority-resource-form.html";
    }

    @RequestMapping(value = "/add", produces = "plain/text; charset=UTF-8")
    @ResponseBody
    public String save(Authority authority) {
        systemAuthoritiesService.save(authority);
        return "";
    }

    @RequestMapping(value = "/update", produces = "plain/text; charset=UTF-8")
    @ResponseBody
    public String update(Authority authority) throws ValidationFailedException {
        systemAuthoritiesService.update(authority);
        return "";
    }

    // 加载编辑数据
    @RequestMapping(value = "/load-edit-data", produces = "plain/text; charset=UTF-8")
    @ResponseBody
    public String loadDsAuthEditData(@RequestBean(WebCommonDefinition.PARAM_NAME_SELECTED_ROW) Authority authority) throws ProcessFailedException, IOException {
        String result = systemAuthoritiesService.loadEditData(authority.getId());
        return result;
    }

    @RequestMapping(value = "/saveAuthResource", produces = "plain/text; charset=UTF-8")
    @ResponseBody
    public void saveAuthResource(Authority authority, @RequestBean List<String> resourceIds) throws ValidationFailedException {
        systemAuthoritiesService.saveAuthResource(authority, resourceIds);
    }
}
