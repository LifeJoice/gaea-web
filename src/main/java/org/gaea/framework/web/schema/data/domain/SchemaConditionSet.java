package org.gaea.framework.web.schema.data.domain;

import java.util.List;

/**
 * Created by iverson on 2016-7-10 14:18:55.
 */
public class SchemaConditionSet {
    private String id;
    private List<SchemaCondition> conditions;

    public String getId() {
        return id;
    }

    public void setId(String id) {
        this.id = id;
    }

    public List<SchemaCondition> getConditions() {
        return conditions;
    }

    public void setConditions(List<SchemaCondition> conditions) {
        this.conditions = conditions;
    }
}
