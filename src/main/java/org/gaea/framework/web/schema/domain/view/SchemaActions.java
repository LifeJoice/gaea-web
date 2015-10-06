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

    public List<SchemaButton> getButtons() {
        return buttons;
    }

    public void setButtons(List<SchemaButton> buttons) {
        this.buttons = buttons;
    }
}
