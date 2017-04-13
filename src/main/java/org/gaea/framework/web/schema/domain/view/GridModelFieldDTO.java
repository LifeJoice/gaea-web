package org.gaea.framework.web.schema.domain.view;

import java.io.Serializable;

/**
 * Created by Iverson on 2015/8/15.
 */
public class GridModelFieldDTO implements Serializable {
    private String id;

    public GridModelFieldDTO() {
    }

    public GridModelFieldDTO(String id) {
        this.id = id;
    }

    public String getId() {
        return id;
    }

    public void setId(String id) {
        this.id = id;
    }
}
