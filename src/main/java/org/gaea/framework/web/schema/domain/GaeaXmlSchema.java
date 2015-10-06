package org.gaea.framework.web.schema.domain;

import java.util.HashMap;
import java.util.Map;

/**
 * Created by Iverson on 2015/7/8.
 */
public class GaeaXmlSchema {
    private String id;
    private SchemaViews schemaViews;
    private SchemaData schemaData;
    // 因为像button的link-view-id可以链接到别的组件，所以我们需要通过组件列表去在后期获取对应的组件，而不用每次都遍历。
    private Map<String,SchemaViewsComponent> viewsComponents;         // key: view-id value: 对应的对象，例如：SchemaDialog,UrSchemaButton等

    public String getId() {
        return id;
    }

    public void setId(String id) {
        this.id = id;
    }

    public SchemaViews getSchemaViews() {
        return schemaViews;
    }

    public void setSchemaViews(SchemaViews schemaViews) {
        this.schemaViews = schemaViews;
    }

    public SchemaData getSchemaData() {
        return schemaData;
    }

    public void setSchemaData(SchemaData schemaData) {
        this.schemaData = schemaData;
    }

    public Map<String, SchemaViewsComponent> getViewsComponents() {
        if(this.viewsComponents == null){
            this.viewsComponents = new HashMap<String, SchemaViewsComponent>();
        }
        return viewsComponents;
    }

    public void setViewsComponents(Map<String, SchemaViewsComponent> viewsComponents) {
        this.viewsComponents = viewsComponents;
    }
}
