package org.gaea.security.controller;

import org.gaea.exception.ValidationFailedException;
import org.gaea.framework.web.security.GaeaWebSecuritySystem;
import org.gaea.security.domain.Menu;
import org.gaea.security.repository.SystemMenusRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.authentication.AnonymousAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.GrantedAuthority;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.core.context.SecurityContextImpl;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.web.authentication.WebAuthenticationDetails;
import org.springframework.security.web.authentication.logout.SecurityContextLogoutHandler;
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
        } else if (SecurityContextHolder.getContext().getAuthentication() instanceof AnonymousAuthenticationToken) {
            // 未登录无权限
            return "/system/login.html";
        } else {
            username = principal.toString();
        }
        return "redirect:/main";
    }

    @RequestMapping("/logout")
    public String logout(HttpServletRequest request, HttpServletResponse response) throws ValidationFailedException {
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        if (auth != null) {
            GaeaWebSecuritySystem.logout(request, response, auth);
        }
        return "redirect:/main";
    }

    @RequestMapping("/main")
    public String gotoMain(String username, String password, HttpServletRequest request, HttpServletResponse response) {
        return "/system/main.html";
    }
}
