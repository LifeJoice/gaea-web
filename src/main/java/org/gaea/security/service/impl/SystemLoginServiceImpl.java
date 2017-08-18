package org.gaea.security.service.impl;

import org.gaea.exception.DataIntegrityViolationException;
import org.gaea.exception.SystemConfigException;
import org.gaea.exception.ValidationFailedException;
import org.gaea.security.service.SystemLoginService;
import org.gaea.security.service.SystemUsersService;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.access.event.AuthorizedEvent;
import org.springframework.security.core.userdetails.User;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

/**
 * Created by iverson on 2017/1/9.
 */
@Service
public class SystemLoginServiceImpl implements SystemLoginService {
    private final Logger logger = LoggerFactory.getLogger(SystemLoginServiceImpl.class);
    @Autowired
    private SystemUsersService systemUsersService;

    /**
     * 处理登录的事件，基于Spring Security的登录事件。
     *
     * @param authorizedEvent
     */
    @Override
    @Transactional(readOnly = true)
    public void resolveLoginEvent(AuthorizedEvent authorizedEvent) {
        /**
         * 登录完成触发事件
         */
//        AuthorizedEvent authorizedEvent = (AuthorizedEvent) eventObj;
        User user = (User) authorizedEvent.getAuthentication().getPrincipal();
        String username = user.getUsername();
        org.gaea.security.domain.User userDomain = systemUsersService.findByLoginName(username);

        try {
            if (!systemUsersService.isLogin(userDomain.getLoginName())) {
                systemUsersService.cacheUserAndRoles(userDomain);
            }
        } catch (DataIntegrityViolationException e) {
            logger.error(e.getMessage(), e);
        } catch (SystemConfigException e) {
            logger.error(e.getMessage(), e);
        } catch (ValidationFailedException e) {
            logger.warn(e.getMessage());
        }
    }
}
