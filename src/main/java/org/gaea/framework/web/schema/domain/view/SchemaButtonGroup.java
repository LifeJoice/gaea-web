package org.gaea.framework.web.schema.domain.view;

import org.gaea.framework.web.schema.domain.SchemaViewsComponent;

import java.util.ArrayList;
import java.util.List;

/**
 * 按钮组对象。
 * Created by iverson on 2016/10/13.
 */
public class SchemaButtonGroup implements SchemaViewsComponent {
    private String id;
    private String name;
    private String componentName;
    private String text;
    private List<SchemaButton> buttons = new ArrayList<SchemaButton>();

    @Override
    public String getId() {
        return id;
    }

    public void setId(String id) {
        this.id = id;
    }

    @Override
    public String getName() {
        return name;
    }

    public void setName(String name) {
        this.name = name;
    }

    @Override
    public String getComponentName() {
        return componentName;
    }

    public void setComponentName(String componentName) {
        this.componentName = componentName;
    }

    public String getText() {
        return text;
    }

    public void setText(String text) {
        this.text = text;
    }

    public List<SchemaButton> getButtons() {
        return buttons;
    }

    public void setButtons(List<SchemaButton> buttons) {
        this.buttons = buttons;
    }
}
