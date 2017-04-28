package org.gaea.framework.web.data.controller;

import org.gaea.framework.web.bind.annotation.RequestBean;
import org.gaea.security.domain.User;
import org.gaea.security.service.SystemUsersService;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Controller;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.ResponseBody;

import java.util.List;

/**
 * Created by iverson on 2016/1/3.
 * 真正添加内容 2016-8-3 14:16:40
 */
@Controller
@RequestMapping("/gaea/data/dataset")
public class SystemDataSetMgrController {
    private final Logger logger = LoggerFactory.getLogger(SystemDataSetMgrController.class);
    @Autowired
    private SystemUsersService systemUsersService;

    @RequestMapping("/management")
    public String list() {
        return "system/data/dataset_management.xml";
    }

    @RequestMapping(value = "/showCreateUpdateForm", produces = "plain/text; charset=UTF-8")
    public String showCreateUpdateForm() {
        return "/gaea/security/user/crud-form.html";
    }

    /**
     * 权限资源关系编辑页
     *
     * @return
     */
    @RequestMapping(value = "/showUserRoles", produces = "plain/text; charset=UTF-8")
    public String showRoleUsers() {
        return "/gaea/security/user/user-roles-form.html";
    }

    @RequestMapping(value = "/add", produces = "plain/text; charset=UTF-8")
    @ResponseBody
    public String save(User user) {
        systemUsersService.save(user);
        return "";
    }

    @RequestMapping(value = "/saveUserRoles", produces = "plain/text; charset=UTF-8")
    @ResponseBody
    public String saveUserRoles(User user, @RequestBean List<String> roleIds) {
//        systemRolesService.save(authority);
        return "";
    }
}