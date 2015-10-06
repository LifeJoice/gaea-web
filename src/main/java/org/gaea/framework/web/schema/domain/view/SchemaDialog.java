package org.gaea.framework.web.schema.domain.view;

import org.gaea.framework.web.schema.domain.SchemaViewsComponent;

import java.util.ArrayList;
import java.util.List;

/**
 * Created by Iverson on 2015/7/6.
 */
public class SchemaDialog implements SchemaViewsComponent {
    private String id;
    private String name;
    private String htmlName;
    private String htmlId;
    private String title;
    private String htmlWidth;
    private String htmlHeight;
    private String type;        // 内置模板，例如工作流审批等。value=normal|workflow-approval|macula-dialog
    private String contentUrl;      // 准备加载内容到dialog的URL地址
    private String submitUrl;       // dialog中内容要提交到的URL。会在dialog内容外包裹一个form。
    private String viewName;
    private List<SchemaButton> buttons = new ArrayList<SchemaButton>();

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

    public String getTitle() {
        return title;
    }

    public void setTitle(String title) {
        this.title = title;
    }

    public String getHtmlWidth() {
        return htmlWidth;
    }

    public void setHtmlWidth(String htmlWidth) {
        this.htmlWidth = htmlWidth;
    }

    public String getHtmlHeight() {
        return htmlHeight;
    }

    public void setHtmlHeight(String htmlHeight) {
        this.htmlHeight = htmlHeight;
    }

    public String getContentUrl() {
        return contentUrl;
    }

    public void setContentUrl(String contentUrl) {
        this.contentUrl = contentUrl;
    }

    public String getSubmitUrl() {
        return submitUrl;
    }

    public void setSubmitUrl(String submitUrl) {
        this.submitUrl = submitUrl;
    }

    @Override
    public String getViewName() {
        return viewName;
    }

    public void setViewName(String viewName) {
        this.viewName = viewName;
    }

    public String getType() {
        return type;
    }

    public void setType(String type) {
        this.type = type;
    }

    public List<SchemaButton> getButtons() {
        return buttons;
    }

    public void setButtons(List<SchemaButton> buttons) {
        this.buttons = buttons;
    }
}
