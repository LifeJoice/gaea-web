package org.gaea.framework.web.schema.domain.view;

import java.util.ArrayList;
import java.util.List;

/**
 * Created by Iverson on 2015/7/6.
 */
public class SchemaActions {
    private String id;
    private String name;
    private String htmlName;
    private String htmlId;
    private List buttons = new ArrayList(); // 这个即可能是SchemaButton，也可能是SchemaButtonGroup

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

    public List getButtons() {
        return buttons;
    }

    public void setButtons(List buttons) {
        this.buttons = buttons;
    }
}
