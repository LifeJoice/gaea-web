package org.gaea.security.controller;

import org.apache.commons.lang3.StringUtils;
import org.gaea.exception.ProcessFailedException;
import org.gaea.exception.ValidationFailedException;
import org.gaea.framework.web.bind.annotation.RequestBean;
import org.gaea.framework.web.common.GaeaHttpStatus;
import org.gaea.framework.web.common.ResponseJsonMessage;
import org.gaea.framework.web.common.WebCommonDefinition;
import org.gaea.security.domain.Menu;
import org.gaea.security.dto.MenuDTO;
import org.gaea.security.service.SystemMenusService;
import org.gaea.util.GaeaJacksonUtils;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.core.GrantedAuthority;
import org.springframework.security.core.context.SecurityContextImpl;
import org.springframework.stereotype.Controller;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.ResponseBody;

import javax.servlet.http.HttpServletRequest;
import javax.servlet.http.HttpServletResponse;
import java.io.IOException;
import java.util.*;

/**
 * 系统的菜单管理控制器。负责寻找用户所能操作的菜单等。
 * Created by iverson on 2016/1/31.
 */
@Controller
@RequestMapping("/gaea/security/menu")
public class SystemMenusController {
    private final Logger logger = LoggerFactory.getLogger(SystemLoginController.class);
    @Autowired
    private SystemMenusService systemMenusService;

    @RequestMapping("/management")
    public String list() {
        return "system/security/menu_management.xml";
    }

    // 新增页面
    @RequestMapping(value = "/showCreateForm", produces = "plain/text; charset=UTF-8")
    public String showCreateForm() {
        return "/gaea-system/security/menu/crud-form.html";
    }

    // 更新页面
    @RequestMapping(value = "/showUpdateForm", produces = "plain/text; charset=UTF-8")
    public String showUpdateForm() {
        return "/gaea-system/security/menu/update-form.html";
    }

    /**
     * 权限资源关系编辑页
     *
     * @return
     */
//    @RequestMapping(value = "/showRoleUsers", produces = "plain/text; charset=UTF-8")
//    public String showRoleUsers() {
//        return "/gaea/security/role/role-users-form.html";
//    }
    @RequestMapping(value = "/add", produces = "plain/text; charset=UTF-8")
    @ResponseBody
    public String save(@RequestBean Menu menu) {
        menu.setStatus(1);
        systemMenusService.save(menu);
        return "";
    }

    @RequestMapping(value = "/update", produces = "plain/text; charset=UTF-8")
    @ResponseBody
    public String update(@RequestBean Menu menu) throws ValidationFailedException {
        menu.setStatus(1);
        systemMenusService.update(menu);
        return "";
    }

    @RequestMapping(value = "/delete")
    @ResponseBody
    public void delete(@RequestBean("selectedRows") List<Menu> menuList) throws ValidationFailedException {
        systemMenusService.delete(menuList);
    }

    // 加载编辑数据
    @RequestMapping(value = "/load-edit-data", produces = "plain/text; charset=UTF-8")
    @ResponseBody
    public String loadDsAuthEditData(@RequestBean(WebCommonDefinition.PARAM_NAME_SELECTED_ROW) Menu menu) throws ProcessFailedException, IOException {
        Map result = systemMenusService.loadEditData(menu.getId());
        if (result != null) {
            return GaeaJacksonUtils.parse(result);
        }
        return "";
    }

//    @RequestMapping(value = "/saveAuthResource", produces = "plain/text; charset=UTF-8")
//    @ResponseBody
//    public String saveAuthResource(Authority authority, @RequestBean List<String> resourceIds) {
////        systemRolesService.save(authority);
//        return "";
//    }

    /**
     * 查找用户所能操作的所有菜单功能。
     *
     * @param request
     * @param response
     * @return
     */
    @RequestMapping("/find-all")
    @ResponseBody
    public List<MenuDTO> findAll(HttpServletRequest request, HttpServletResponse response) {
        Set<String> authSet = new HashSet<String>();
        SecurityContextImpl securityContextImpl = (SecurityContextImpl) request.getSession().getAttribute("SPRING_SECURITY_CONTEXT");
        if (securityContextImpl == null || securityContextImpl.getAuthentication() == null) {
            return null;
        }
        //登录名
        String loginName = securityContextImpl.getAuthentication().getName();
        //获得当前用户所拥有的权限
        List<GrantedAuthority> authorities = (List<GrantedAuthority>) securityContextImpl.getAuthentication().getAuthorities();
        for (GrantedAuthority grantedAuthority : authorities) {
            authSet.add(grantedAuthority.getAuthority());
        }
        System.out.println("Username:" + loginName);
        List<MenuDTO> menus = null;
        if (StringUtils.isNotEmpty(loginName)) {
            menus = systemMenusService.findAll(authSet);
        } else {
            logger.debug("获取不到用户的登录名。可能是Spring Security的配置问题。");
        }
        return menus;
    }
}
