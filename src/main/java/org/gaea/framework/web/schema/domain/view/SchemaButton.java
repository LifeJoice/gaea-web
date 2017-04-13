package org.gaea.framework.web.schema.domain.view;

import org.gaea.framework.web.schema.Action;
import org.gaea.framework.web.schema.domain.SchemaViewsComponent;
import org.gaea.framework.web.schema.view.action.ExcelExportButtonAction;

import java.io.Serializable;
import java.util.List;

/**
 * Created by Iverson on 2015/7/6.
 */
public class SchemaButton implements SchemaViewsComponent, Serializable {
    private String id;
    private String name;
    private String htmlName;
    private String htmlId;
    private String htmlValue;
    private String type;
    private String href;        // AI.TODO 这个得研究要不要。因为关联到href就需要涉及请求和响应怎么处理。如果是在弹框显示响应，则应该在<views:dialog>配置href会合理点？
    private String linkViewId;
    private String linkComponent;       // 这个根据linkViewId，转换为关联的对象的类型说明。例如：wf-dialog
    private String componentName;
    private String submitUrl; // 按钮点击时，提交的url
    private String submitType = "ajax"; // 按钮点击时，提交的方式：ajax or form submit。
    public static final String SUBMIT_TYPE_AJAX = "ajax"; // 按钮以ajax方式提交
    public static final String SUBMIT_TYPE_FORM_SUBMIT = "formSubmit"; // 按钮以submit方式提交。这种一般适合文件下载类等，不适合用ajax的场景。
    private String msg; // action对应的信息。在按钮成功或失败后，可以利用它拼凑个提示信息。
    /**
     * 接口action，只定义，后台框架无实现。定义的内容由具体模板页(例如公用列表页等）去实现，而不由XML SCHEMA解析框架处理。
     * changed from interfaceAction by Iverson 2016-6-27 16:06:16
     */
    private String action;
    /**
     * 相比上面的action，更复杂的action。对应XML"button-action"元素。
     * 设计想法：
     * 有序。可以按顺序执行多个action。
     */
    private List actions;

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
    public String getComponentName() {
        return componentName;
    }

    public void setComponentName(String componentName) {
        this.componentName = componentName;
    }

    public String getAction() {
        return action;
    }

    public void setAction(String action) {
        this.action = action;
    }

    public String getSubmitUrl() {
        return submitUrl;
    }

    public void setSubmitUrl(String submitUrl) {
        this.submitUrl = submitUrl;
    }

    public String getSubmitType() {
        return submitType;
    }

    public void setSubmitType(String submitType) {
        this.submitType = submitType;
    }

    public String getMsg() {
        return msg;
    }

    public void setMsg(String msg) {
        this.msg = msg;
    }

    public List getActions() {
        return actions;
    }

    public void setActions(List actions) {
        this.actions = actions;
    }
}
