package org.gaea.security.controller;

import org.apache.commons.lang3.StringUtils;
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
 * Created by iverson on 2016/1/31.
 */
@Controller
@RequestMapping("/menu")
public class SystemMenusController {
    private final Logger logger = LoggerFactory.getLogger(SystemLoginController.class);
    @Autowired
    private SystemMenusService systemMenusService;

    @RequestMapping("/find-all")
    @ResponseBody
    public List<MenuDTO> findAll(HttpServletRequest request, HttpServletResponse response) {
        Set<String> authSet = new HashSet<String>();
        SecurityContextImpl securityContextImpl = (SecurityContextImpl) request.getSession().getAttribute("SPRING_SECURITY_CONTEXT");
        //登录名
        String loginName = securityContextImpl.getAuthentication().getName();
        //获得当前用户所拥有的权限
        List<GrantedAuthority> authorities = (List<GrantedAuthority>) securityContextImpl.getAuthentication().getAuthorities();
        for (GrantedAuthority grantedAuthority : authorities) {
            authSet.add(grantedAuthority.getAuthority());
        }
        System.out.println("Username:" + loginName);
        List<MenuDTO> menus = null;
        if(StringUtils.isNotEmpty(loginName)) {
            menus = systemMenusService.findAll(authSet);
        }else{
            logger.debug("获取不到用户的登录名。可能是Spring Security的配置问题。");
        }
        return menus;
    }
}
