package org.gaea.security.controller;

import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.stereotype.Controller;
import org.springframework.web.bind.annotation.RequestMapping;

/**
 * Created by Iverson on 2015/10/28.
 */
@Controller
public class SystemLoginController {

    @RequestMapping("/login")
    public String login(String username,String password){
        Object principal = SecurityContextHolder.getContext().getAuthentication().getPrincipal();
        if (principal instanceof UserDetails) {
            username = ((UserDetails)principal).getUsername();
        } else {
            username = principal.toString();
        }
//        if("Iverson".equalsIgnoreCase(username)){
//            return "/system/main.html";
//        }
        return "/system/login.html";
    }

    @RequestMapping("/test-spring-security-ok")
    public String test(String username,String password){
        System.out.println("\n=============================\n系统权限校验通过！Spring Security运行中……\n=============================\n");
        return "/system/main.html";
    }
}
