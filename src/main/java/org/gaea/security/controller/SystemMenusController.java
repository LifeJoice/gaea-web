package org.gaea.security.controller;

import org.apache.commons.lang3.StringUtils;
import org.gaea.framework.web.bind.annotation.RequestBean;
import org.gaea.security.domain.Authority;
import org.gaea.security.domain.Menu;
import org.gaea.security.domain.Resource;
import org.gaea.security.domain.Role;
import org.gaea.security.dto.MenuDTO;
import org.gaea.security.service.SystemMenusService;
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
import java.util.HashSet;
import java.util.List;
import java.util.Map;
import java.util.Set;

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

    @RequestMapping(value = "/showCreateUpdateForm", produces = "plain/text; charset=UTF-8")
    public String showCreateUpdateForm() {
        return "/gaea/security/menu/crud-form.html";
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
