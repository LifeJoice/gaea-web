package org.gaea.framework.web.schema.domain.view;

import java.util.ArrayList;
import java.util.List;

/**
 * Created by Iverson on 2015/8/15.
 */
public class GridModelDTO {
    private String idProperty;
    private List<GridModelFieldDTO> fields = new ArrayList<GridModelFieldDTO>();

    public String getIdProperty() {
        return idProperty;
    }

    public void setIdProperty(String idProperty) {
        this.idProperty = idProperty;
    }

    public List<GridModelFieldDTO> getFields() {
        return fields;
    }

    public void setFields(List<GridModelFieldDTO> fields) {
        this.fields = fields;
    }
}
