package org.gaea.event;

import org.gaea.event.service.GaeaEventService;
import org.gaea.framework.web.data.service.SystemDataSetService;
import org.gaea.security.service.SystemLoginService;
import org.gaea.security.service.SystemUsersService;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.context.ApplicationEvent;
import org.springframework.context.ApplicationListener;
import org.springframework.security.access.event.AuthorizedEvent;
import org.springframework.security.authentication.event.AuthenticationSuccessEvent;
import org.springframework.stereotype.Component;

/**
 * 事件处理器。监听器。消费者。
 * <p>
 * 基于Spring框架的事件机制。单机版。
 * </p>
 * Created by iverson on 2016-12-7 14:07:11.
 */
@Component
public class GaeaSpringEventResolver implements ApplicationListener<ApplicationEvent> {
    private final Logger logger = LoggerFactory.getLogger(GaeaSpringEventResolver.class);
    @Autowired
    private SystemDataSetService systemDataSetService;
    @Autowired
    private SystemUsersService systemUsersService;
    @Autowired
    private SystemLoginService systemLoginService;
    @Autowired
    private GaeaEventService gaeaEventService;

    public void resolve(ApplicationEvent eventObj) {
        if (eventObj instanceof GaeaEvent) {
            gaeaEventService.resolve((GaeaEvent) eventObj);
        } else if (eventObj instanceof AuthorizedEvent) {
            /**
             * 登录完成触发事件
             */
            AuthorizedEvent authorizedEvent = (AuthorizedEvent) eventObj;
            systemLoginService.resolveLoginEvent(authorizedEvent);
        } else if (eventObj instanceof AuthenticationSuccessEvent) {
            /**
             * 登录完成触发事件
             */
            AuthenticationSuccessEvent authenticationSuccessEvent = (AuthenticationSuccessEvent) eventObj;
            systemLoginService.resolveLoginEvent(authenticationSuccessEvent);
        }
    }

    @Override
    public void onApplicationEvent(ApplicationEvent event) {
        resolve(event);
    }
}
