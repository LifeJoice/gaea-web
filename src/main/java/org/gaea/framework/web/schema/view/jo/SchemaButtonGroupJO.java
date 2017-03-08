package org.gaea.framework.web.schema.view.jo;

import org.gaea.framework.web.schema.domain.SchemaViewsComponent;

import java.util.ArrayList;
import java.util.List;

/**
 * 按钮组对象。copy from SchemaButtonGroup
 * Created by iverson on 2017年3月1日14:57:00
 */
public class SchemaButtonGroupJO implements SchemaViewsComponent {
    private String id;
    private String name;
    private String componentName;
    private String text;
    private List<SchemaButtonJO> buttons = new ArrayList<SchemaButtonJO>();

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

    public List<SchemaButtonJO> getButtons() {
        return buttons;
    }

    public void setButtons(List<SchemaButtonJO> buttons) {
        this.buttons = buttons;
    }
}
