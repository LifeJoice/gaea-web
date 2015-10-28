package org.gaea.security.controller;

import org.springframework.stereotype.Controller;
import org.springframework.web.bind.annotation.RequestMapping;

/**
 * Created by Iverson on 2015/10/28.
 */
@Controller
public class SystemLoginController {

    @RequestMapping("/login")
    public String login(String username,String password){
        if("Iverson".equalsIgnoreCase(username)){
            return "/system/main.html";
        }
        return "/system/login.html";
    }
}
