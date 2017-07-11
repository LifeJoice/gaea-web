package org.gaea.framework.web.schema.view.jo;

import org.gaea.framework.web.schema.domain.SchemaImport;
import org.gaea.framework.web.schema.domain.view.SchemaActions;
import org.gaea.framework.web.schema.domain.view.SchemaDialog;
import org.gaea.framework.web.schema.domain.view.SchemaGrid;

import java.io.Serializable;
import java.util.ArrayList;
import java.util.List;

/**
 * 这个是JO对象，负责把Schema View的相关内容暴露给外部的。
 * <p/>
 * Created by Iverson on 2017年6月20日16:17:30
 */
public class SchemaViewJO implements Serializable {
    private String id;
    //    private String name;
//    private String htmlName;
//    private String htmlId;
    private String title;
    private String contentUrl;      // 准备加载内容到dialog的URL地址
    private String componentName; // 就是XML的元素名
    private SchemaGridJO grid;
    private List<SchemaDialogJO> dialogs;
    private SchemaActionsJO actions;
    private List<SchemaViewJO> views;

    public List<SchemaDialogJO> getDialogs() {
        if (dialogs == null) {
            dialogs = new ArrayList<SchemaDialogJO>();
        }
        return dialogs;
    }

    public void setDialogs(List<SchemaDialogJO> dialogs) {
        this.dialogs = dialogs;
    }

    public SchemaGridJO getGrid() {
        return grid;
    }

    public void setGrid(SchemaGridJO grid) {
        this.grid = grid;
    }

    public SchemaActionsJO getActions() {
        return actions;
    }

    public void setActions(SchemaActionsJO actions) {
        this.actions = actions;
    }

    public String getTitle() {
        return title;
    }

    public void setTitle(String title) {
        this.title = title;
    }

    public String getId() {
        return id;
    }

    public void setId(String id) {
        this.id = id;
    }

    public String getContentUrl() {
        return contentUrl;
    }

    public void setContentUrl(String contentUrl) {
        this.contentUrl = contentUrl;
    }

    public String getComponentName() {
        return componentName;
    }

    public void setComponentName(String componentName) {
        this.componentName = componentName;
    }

    public List<SchemaViewJO> getViews() {
        if (views == null) {
            views = new ArrayList<SchemaViewJO>();
        }
        return views;
    }

    public void setViews(List<SchemaViewJO> views) {
        this.views = views;
    }
}
