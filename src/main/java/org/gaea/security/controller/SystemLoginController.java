package org.gaea.security.controller;

import org.gaea.security.domain.Menu;
import org.gaea.security.repository.SystemMenusRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.core.GrantedAuthority;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.core.context.SecurityContextImpl;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.web.authentication.WebAuthenticationDetails;
import org.springframework.stereotype.Controller;
import org.springframework.web.bind.annotation.RequestMapping;

import javax.servlet.http.HttpServletRequest;
import javax.servlet.http.HttpServletResponse;
import java.util.List;

/**
 * Created by Iverson on 2015/10/28.
 */
@Controller
public class SystemLoginController {

    private final Logger logger = LoggerFactory.getLogger(SystemLoginController.class);
    @Autowired
    private SystemMenusRepository systemMenusRepository;

    @RequestMapping("/login")
    public String login(String username, String password, HttpServletRequest request, HttpServletResponse response) {
        Object principal = SecurityContextHolder.getContext().getAuthentication().getPrincipal();
        if (principal instanceof UserDetails) {
            username = ((UserDetails) principal).getUsername();
        } else {
            username = principal.toString();
        }
//        if("Iverson".equalsIgnoreCase(username)){
//            return "/system/main.html";
//        }
        System.out.println("\n=============================\n系统权限校验通过！Spring Security运行中……\n=============================\n");
        SecurityContextImpl securityContextImpl = (SecurityContextImpl) request.getSession().getAttribute("SPRING_SECURITY_CONTEXT");
//登录名
        System.out.println("Username:" + securityContextImpl.getAuthentication().getName());
//登录密码，未加密的
        System.out.println("Credentials:" + securityContextImpl.getAuthentication().getCredentials());
        WebAuthenticationDetails details = (WebAuthenticationDetails) securityContextImpl.getAuthentication().getDetails();
//获得访问地址
        System.out.println("RemoteAddress" + details.getRemoteAddress());
//获得sessionid
        System.out.println("SessionId" + details.getSessionId());
//获得当前用户所拥有的权限
        List<GrantedAuthority> authorities = (List<GrantedAuthority>) securityContextImpl.getAuthentication().getAuthorities();
        for (GrantedAuthority grantedAuthority : authorities) {
            System.out.println("Authority : " + grantedAuthority.getAuthority());
        }
        return "/system/main.html";
    }
}
