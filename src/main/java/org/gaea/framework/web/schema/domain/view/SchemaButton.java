package org.gaea.framework.web.schema.domain.view;

import org.gaea.framework.web.schema.domain.SchemaViewsComponent;

/**
 * Created by Iverson on 2015/7/6.
 */
public class SchemaButton implements SchemaViewsComponent {
    private String id;
    private String name;
    private String htmlName;
    private String htmlId;
    private String htmlValue;
    private String type;
    private String href;        // AI.TODO 这个得研究要不要。因为关联到href就需要涉及请求和响应怎么处理。如果是在弹框显示响应，则应该在<views:dialog>配置href会合理点？
    private String linkViewId;
    private String linkComponent;       // 这个根据linkViewId，转换为关联的对象的类型说明。例如：wf-dialog
    private String viewName;
    /**
     * 接口action，只定义，后台框架无实现。定义的内容由具体模板页(例如公用列表页等）去实现，而不由XML SCHEMA解析框架处理。
     * changed from interfaceAction by Iverson 2016-6-27 16:06:16
     */
    private String action;

    public String getId() {
        return id;
    }

    public void setId(String id) {
        this.id = id;
    }

    public String getName() {
        return name;
    }

    public void setName(String name) {
        this.name = name;
    }

    public String getHtmlName() {
        return htmlName;
    }

    public void setHtmlName(String htmlName) {
        this.htmlName = htmlName;
    }

    public String getHtmlId() {
        return htmlId;
    }

    public void setHtmlId(String htmlId) {
        this.htmlId = htmlId;
    }

    public String getHtmlValue() {
        return htmlValue;
    }

    public void setHtmlValue(String htmlValue) {
        this.htmlValue = htmlValue;
    }

    public String getType() {
        return type;
    }

    public void setType(String type) {
        this.type = type;
    }

    public String getHref() {
        return href;
    }

    public void setHref(String href) {
        this.href = href;
    }

    public String getLinkViewId() {
        return linkViewId;
    }

    public void setLinkViewId(String linkViewId) {
        this.linkViewId = linkViewId;
    }

    public String getLinkComponent() {
        return linkComponent;
    }

    public void setLinkComponent(String linkComponent) {
        this.linkComponent = linkComponent;
    }

    @Override
    public String getViewName() {
        return viewName;
    }

    public void setViewName(String viewName) {
        this.viewName = viewName;
    }

    public String getAction() {
        return action;
    }

    public void setAction(String action) {
        this.action = action;
    }
}
