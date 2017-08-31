package org.gaea.security.controller;

import org.gaea.exception.ProcessFailedException;
import org.gaea.exception.ValidationFailedException;
import org.gaea.framework.web.bind.annotation.RequestBean;
import org.gaea.security.domain.User;
import org.gaea.security.service.SystemUsersService;
import org.gaea.util.GaeaJacksonUtils;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Controller;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.ResponseBody;

import java.io.IOException;
import java.util.List;
import java.util.Map;

/**
 * Created by iverson on 2016/1/3.
 * 真正添加内容 2016-8-3 14:16:40
 */
@Controller
@RequestMapping("/gaea/security/user")
public class SystemUserController {
    private final Logger logger = LoggerFactory.getLogger(SystemUserController.class);
    @Autowired
    private SystemUsersService systemUsersService;

    @RequestMapping("/management")
    public String list() {
        return "system/security/user_management.xml";
    }

    @RequestMapping(value = "/showCreateUpdateForm", produces = "plain/text; charset=UTF-8")
    public String showCreateUpdateForm() {
        return "/gaea-system/security/user/crud-form.html";
    }

    /**
     * 权限资源关系编辑页
     *
     * @return
     */
    @RequestMapping(value = "/showUserRoles", produces = "plain/text; charset=UTF-8")
    public String showRoleUsers() {
        return "/gaea-system/security/user/user-roles-form.html";
    }

    @RequestMapping(value = "/add", produces = "plain/text; charset=UTF-8")
    @ResponseBody
    public void save(User user) throws ValidationFailedException {
        systemUsersService.save(user);
    }

    /**
     * 编辑功能，获取数据
     *
     * @param userEntity
     * @return
     * @throws ProcessFailedException
     * @throws IOException
     */
    @RequestMapping(value = "/load-edit-data", produces = "plain/text; charset=UTF-8")
    @ResponseBody
    public String loadEditData(@RequestBean("selectedRow") User userEntity) throws ProcessFailedException, IOException, ValidationFailedException {
        User result = systemUsersService.loadEditData(userEntity);
        if (result != null) {
            return GaeaJacksonUtils.parse(result);
        }
        return "";
    }

    @RequestMapping(value = "/update", produces = "plain/text; charset=UTF-8")
    @ResponseBody
    public void update(User user) throws ValidationFailedException {
        systemUsersService.update(user);
    }

    @RequestMapping(value = "/delete", produces = "plain/text; charset=UTF-8")
    @ResponseBody
    public void delete(@RequestBean("selectedRows") List<User> userList) throws ValidationFailedException {
        systemUsersService.delete(userList);
    }

    @RequestMapping(value = "/saveUserRoles", produces = "plain/text; charset=UTF-8")
    @ResponseBody
    public String saveUserRoles(User user, @RequestBean List<String> roleIds) {
//        systemRolesService.save(authority);
        return "";
    }
}
