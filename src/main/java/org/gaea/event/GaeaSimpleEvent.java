package org.gaea.event;

import org.springframework.context.ApplicationEvent;

import java.util.Map;

/**
 * Gaea的通用事件定义。并且兼容Spring的事件（实现了Spring的事件接口）
 * Created by iverson on 2016/12/7.
 */
public class GaeaSimpleEvent extends ApplicationEvent implements GaeaEvent<Map<String, Object>> {

    private String eventCode;
    private Map<String, Object> eventContext;

    /**
     * Create a new ApplicationEvent.
     *
     * @param source the object on which the event initially occurred (never {@code null})
     */
    public GaeaSimpleEvent(String eventCode, Object source) {
        super(source);
        this.eventCode = eventCode;
    }

    public String getEventCode() {
        return eventCode;
    }

    public void setEventCode(String eventCode) {
        this.eventCode = eventCode;
    }

    public Map<String, Object> getEventContext() {
        return eventContext;
    }

    public void setEventContext(Map<String, Object> eventContext) {
        this.eventContext = eventContext;
    }
}
