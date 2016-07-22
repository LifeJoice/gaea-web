package org.gaea.framework.web.schema.data.domain;

import java.util.Map;

/**
 * Created by iverson on 2016-7-10 14:18:55.
 */
public class SchemaWhere {
    private Map<String,SchemaConditionSet> conditionSets; // key=id , value=ConditionSet

    public Map<String, SchemaConditionSet> getConditionSets() {
        return conditionSets;
    }

    public void setConditionSets(Map<String, SchemaConditionSet> conditionSets) {
        this.conditionSets = conditionSets;
    }
}
