package org.gaea.framework.web.security;

import org.gaea.framework.web.GaeaWebSystem;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.GrantedAuthority;
import org.springframework.security.core.context.SecurityContextImpl;
import org.springframework.security.web.authentication.logout.SecurityContextLogoutHandler;

import javax.servlet.http.HttpServletRequest;
import javax.servlet.http.HttpServletResponse;
import java.util.List;

/**
 * 负责处理web应用的所有安全相关的最通用的功能。
 * Created by iverson on 2016/12/22.
 */
public class GaeaWebSecuritySystem {
    private final Logger logger = LoggerFactory.getLogger(GaeaWebSecuritySystem.class);

    /**
     * 通过request获取用户名。基于Spring security。
     *
     * @param request
     * @return
     */
    public static String getUserName(HttpServletRequest request) {
        SecurityContextImpl securityContextImpl = (SecurityContextImpl) request.getSession().getAttribute("SPRING_SECURITY_CONTEXT");
        if (securityContextImpl == null || securityContextImpl.getAuthentication() == null) {
            return null;
        }
        //登录名
        String loginName = securityContextImpl.getAuthentication().getName();
        return loginName;
    }

    public static void logout(HttpServletRequest request, HttpServletResponse response, Authentication auth) {
        if (auth != null) {
            new SecurityContextLogoutHandler().logout(request, response, auth);
        }
    }
}
