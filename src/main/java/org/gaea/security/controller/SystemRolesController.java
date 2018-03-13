package org.gaea.security.controller;

import org.gaea.exception.DataIntegrityViolationException;
import org.gaea.exception.SystemConfigException;
import org.gaea.exception.ValidationFailedException;
import org.gaea.framework.web.bind.annotation.RequestBean;
import org.gaea.security.domain.Authority;
import org.gaea.security.domain.Role;
import org.gaea.security.service.SystemRolesService;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Controller;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.ResponseBody;

import java.util.List;

/**
 * 系统权限控制器。
 * Created by iverson on 2016-8-3 10:45:55.
 */
@Controller
@RequestMapping("/gaea/security/role")
public class SystemRolesController {

    private final Logger logger = LoggerFactory.getLogger(SystemRolesController.class);
    @Autowired
    private SystemRolesService systemRolesService;

    @RequestMapping("/management")
    public String list() {
        return "system/security/role_management.xml";
    }

    @RequestMapping(value = "/showCreateUpdateForm", produces = "plain/text; charset=UTF-8")
    public String showCreateUpdateForm() {
        return "/gaea-system/security/role/crud-form.html";
    }

    /**
     * 权限资源关系编辑页
     *
     * @return
     */
    @RequestMapping(value = "/showRoleUsers", produces = "plain/text; charset=UTF-8")
    public String showRoleUsers() {
        return "/gaea-system/security/role/role-users-form.html";
    }

    @RequestMapping(value = "/showRoleAuths", produces = "plain/text; charset=UTF-8")
    public String showRoleAuths() {
        return "/gaea-system/security/role/role-authorities-form.html";
    }

    @RequestMapping(value = "/add", produces = "plain/text; charset=UTF-8")
    @ResponseBody
    public void save(Role role) throws ValidationFailedException {
        systemRolesService.save(role);
    }

    @RequestMapping(value = "/update", produces = "plain/text; charset=UTF-8")
    @ResponseBody
    public void update(Role role) throws ValidationFailedException {
        systemRolesService.update(role);
    }

    @RequestMapping(value = "/saveRoleUsers", produces = "plain/text; charset=UTF-8")
    @ResponseBody
    public String saveRoleUsers(Role role, @RequestBean List<String> userIds) throws DataIntegrityViolationException, SystemConfigException {
        systemRolesService.saveRoleUsers(role, userIds);
        return "";
    }

    @RequestMapping(value = "/saveRoleAuths", produces = "plain/text; charset=UTF-8")
    @ResponseBody
    public String saveRoleAuthorities(Role role, @RequestBean List<String> authIds) {
        systemRolesService.saveRoleAuthorities(role, authIds);
        return "";
    }

    @RequestMapping(value = "/delete", produces = "plain/text; charset=UTF-8")
    @ResponseBody
    public void delete(@RequestBean("selectedRows") List<Role> roleList) throws ValidationFailedException {
        systemRolesService.delete(roleList);
    }
}
