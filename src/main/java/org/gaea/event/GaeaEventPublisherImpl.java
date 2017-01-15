package org.gaea.event;

import org.apache.commons.collections.MapUtils;
import org.apache.commons.lang3.StringUtils;
import org.gaea.exception.SysInitException;
import org.gaea.framework.web.common.CommonDefinition;
import org.gaea.framework.web.config.SystemProperties;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.context.ApplicationContext;
import org.springframework.stereotype.Component;

import java.util.Map;

/**
 * Gaea框架的通用事件发布处理类。
 * Created by iverson on 2016-12-7 14:07:02.
 */
@Component
public class GaeaEventPublisherImpl implements GaeaEventPublisher {
    private final Logger logger = LoggerFactory.getLogger(GaeaEventPublisherImpl.class);
    @Autowired
    private ApplicationContext applicationContext;

    /**
     * 发布一个普通的通用事件。
     *
     * @param eventCode    事件码。根据这个，可能会调用不同的处理类处理事件。例如：调用数据集初始化服务等。
     * @param eventContext 事件上下文内容。相关服务类处理事件需要的一些额外信息。
     * @throws SysInitException
     */
    public void publishSimpleEvent(String eventCode, Map<String, Object> eventContext) throws SysInitException {
        if (StringUtils.isEmpty(eventCode)) {
            throw new IllegalArgumentException("发布事件，eventCode不允许为空。");
        }
        GaeaSimpleEvent event = null;
        if (MapUtils.isEmpty(eventContext)) {
            event = new GaeaSimpleEvent(eventCode, "");
        } else {
            event = new GaeaSimpleEvent(eventCode, eventContext);
        }
        publishSimpleEvent(event);
    }

    /**
     * 暂时只支持基于Spring的单机事件处理框架。
     * <p>
     * 本来考虑用Redis做分布式事件框架.但发现redis的pub/sub机制有点问题. 即发即丢的方式,会导致监听器在未完成初始化前无法收到消息.
     * </p>
     *
     * @param event
     * @throws SysInitException
     */
    public void publishSimpleEvent(GaeaEvent event) throws SysInitException {
        // 获取系统配置，看是用什么事件框架
        String eventFramework = SystemProperties.get(CommonDefinition.PROP_KEY_SYSTEM_EVENT_FRAMEWORK);
        if (CommonEventDefinition.EVENT_FRAMEWORK_SPRING.equalsIgnoreCase(eventFramework)) {
            applicationContext.publishEvent(event);
        } else {
            throw new SysInitException("配置的事件框架不被支持。系统事件处理框架启动失败！");
            /**
             if(redisTemplate==null){
             logger.error("系统基于redis的消息架构启动失败！REDIS系统尚未启动或配置，无法获取redisTemplate。");
             }
             // 如果配置Redis作为事件框架, 发出redis的消息.
             redisTemplate.convertAndSend("GAEA:EVENT:TOPIC_CHANNEL","Hi. My first redis pub/sub example.");
             **/
        }
    }
}
