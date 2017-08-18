package org.gaea.framework.web;

import org.gaea.exception.SysInitException;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.BeansException;
import org.springframework.context.ApplicationContext;
import org.springframework.context.ApplicationContextAware;
import org.springframework.stereotype.Component;
import org.springframework.web.context.request.RequestContextHolder;
import org.springframework.web.context.request.ServletRequestAttributes;

import javax.servlet.http.HttpServletRequest;
import java.util.Map;

/**
 * Web的系统通用类。放一些系统级的通用功能。
 * 这个依赖于Spring容器。如果有多个，可能会有问题。
 * Created by iverson on 2016/11/10.
 */
@Component
public class GaeaWebSystem implements ApplicationContextAware {
    private final Logger logger = LoggerFactory.getLogger(GaeaWebSystem.class);

    private static ApplicationContext applicationContext;

    @Override
    public void setApplicationContext(ApplicationContext ac) throws BeansException {
        logger.debug("注入通用容器（供静态获取的）context name:{} context id:{} has parent:{}", ac.getApplicationName(), ac.getId(), (ac.getParent() == null));
        applicationContext = ac;
    }

    public static <T> T getBean(Class<T> aClass) throws SysInitException {
        if (applicationContext == null) {
            throw new SysInitException("系统初始化ApplicationContext失败。ApplicationContext=null。无法通过静态方法获取bean。");
        }
        return applicationContext.getBean(aClass);
    }

    public static <T> Map<String, T> getBeansOfType(Class<T> aClass) throws SysInitException {
        if (applicationContext == null) {
            throw new SysInitException("系统初始化ApplicationContext失败。ApplicationContext=null。无法通过静态方法获取bean。");
        }
        return applicationContext.getBeansOfType(aClass);
    }

    public static HttpServletRequest getRequest() throws SysInitException {
        HttpServletRequest request = ((ServletRequestAttributes) RequestContextHolder.getRequestAttributes()).getRequest();
        if (request == null) {
            throw new SysInitException("无法通过Spring获取当前的HttpServletRequest对象！");
        }
        return request;
    }
}
