package org.gaea.framework.web.security;

import org.apache.commons.lang3.StringUtils;
import org.gaea.cache.GaeaCacheOperator;
import org.gaea.exception.LoginFailedException;
import org.gaea.exception.SysInitException;
import org.gaea.exception.SystemConfigException;
import org.gaea.exception.ValidationFailedException;
import org.gaea.framework.web.GaeaWebSystem;
import org.gaea.framework.web.common.WebCommonDefinition;
import org.gaea.config.SystemProperties;
import org.gaea.security.jo.UserJO;
import org.gaea.security.service.impl.SystemUsersServiceImpl;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.security.authentication.AnonymousAuthenticationToken;
import org.springframework.security.authentication.AuthenticationServiceException;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.core.context.SecurityContextImpl;
import org.springframework.security.web.authentication.logout.SecurityContextLogoutHandler;

import javax.servlet.http.HttpServletRequest;
import javax.servlet.http.HttpServletResponse;

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

    public static String getUserName() throws SysInitException {
        return getUserName(GaeaWebSystem.getRequest());
    }

    /**
     * 获取登录用户。基于Spring的http servlet request注入去获取。
     *
     * @return
     * @throws SysInitException
     * @throws SystemConfigException
     * @throws ValidationFailedException
     */
    public static UserJO getLoginUser() throws SysInitException, SystemConfigException, ValidationFailedException {
        if (!hasLogin()) {
            throw new LoginFailedException("未登录或登录已过期。");
        }
        String userRootKey = SystemProperties.get(WebCommonDefinition.PROP_KEY_REDIS_USER_LOGIN);
        String loginName = getUserName();
        if (StringUtils.isEmpty(userRootKey)) {
            throw new SysInitException("系统未初始化'缓存用户登录的root key'。配置项：" + WebCommonDefinition.PROP_KEY_REDIS_USER_LOGIN);
        }
        if (StringUtils.isEmpty(loginName)) {
            throw new ValidationFailedException("获取不到当前用户的登录名，无法查询缓存的登录用户信息！");
        }
        GaeaCacheOperator gaeaCacheOperator = GaeaWebSystem.getBean(GaeaCacheOperator.class);
        if (gaeaCacheOperator == null) {
            throw new SysInitException("获取不到GaeaCacheOperator对象，无法操作缓存信息！");
        }
        /**
         * 真正的key：
         * GAEA:LOGIN_USER:<USER_LOGIN_NAME>
         */
        String realKey = SystemUsersServiceImpl.getUserCacheKey(loginName);
        UserJO userJO = gaeaCacheOperator.get(realKey, UserJO.class);
        return userJO;
    }

    /**
     * 判断当前状态是否已经登录
     *
     * @return
     */
    public static boolean hasLogin() {
        if (SecurityContextHolder.getContext().getAuthentication() instanceof AnonymousAuthenticationToken) {
            return false;
        }
        return true;
    }

    public static void logout(HttpServletRequest request, HttpServletResponse response, Authentication auth) {
        if (auth != null) {
            new SecurityContextLogoutHandler().logout(request, response, auth);
        }
    }
}
