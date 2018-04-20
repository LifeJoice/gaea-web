package org.gaea.framework.web.schema.domain;

import org.gaea.framework.web.schema.domain.view.SchemaActions;
import org.gaea.framework.web.schema.domain.view.SchemaDialog;
import org.gaea.framework.web.schema.domain.view.SchemaGrid;
import org.gaea.framework.web.schema.view.jo.SchemaGridJO;

import java.io.Serializable;
import java.util.ArrayList;
import java.util.List;

/**
 * Created by Iverson on 2015/6/30.
 */
public class SchemaViews implements Serializable {
    private String id;
    //    private String name;
//    private String htmlName;
//    private String htmlId;
    private String title;
    private String contentUrl;      // 准备加载内容到dialog的URL地址
    private String schemaId;        // xml schema id。这个主要是接口用，如果有人需要不依赖gaea前端开发自己的UI的话。
    private String componentName; // 就是XML的元素名
    private SchemaGrid grid;
    private SchemaGridJO gridJO;
    private List<SchemaDialog> dialogs;
    private SchemaActions actions;
    // view需要引入的css和js的清单
    private SchemaImport imports;
    private List<SchemaViews> views;

    public SchemaGrid getGrid() {
        return grid;
    }

    public void setGrid(SchemaGrid grid) {
        this.grid = grid;
    }

    public SchemaGridJO getGridJO() {
        return gridJO;
    }

    public void setGridJO(SchemaGridJO gridJO) {
        this.gridJO = gridJO;
    }

    public List<SchemaDialog> getDialogs() {
        if(dialogs==null){
            dialogs = new ArrayList<SchemaDialog>();
        }
        return dialogs;
    }

    public void setDialogs(List<SchemaDialog> dialogs) {
        this.dialogs = dialogs;
    }

    public SchemaActions getActions() {
        return actions;
    }

    public void setActions(SchemaActions actions) {
        this.actions = actions;
    }

    public SchemaImport getImports() {
        if(this.imports==null){
            this.imports = new SchemaImport();
        }
        return imports;
    }

    public void setImports(SchemaImport imports) {
        this.imports = imports;
    }

    public String getTitle() {
        return title;
    }

    public void setTitle(String title) {
        this.title = title;
    }

    public List<SchemaViews> getViews() {
        if (views == null) {
            views = new ArrayList<SchemaViews>();
        }
        return views;
    }

    public void setViews(List<SchemaViews> views) {
        this.views = views;
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

    public String getSchemaId() {
        return schemaId;
    }

    public void setSchemaId(String schemaId) {
        this.schemaId = schemaId;
    }
}
