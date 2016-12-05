package org.gaea.framework.web.schema.data.domain;

import java.util.List;

/**
 * Created by iverson on 2016-7-10 14:18:55.
 */
public class SchemaConditionSet {
    private String id;
    private List<SchemaCondition> conditions;
    private String appendSql; // 附加的sql。主要针对当前condition-set使用。即把目前的condition和appendSql混合后，一起拼凑给主SQL。

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

    public String getAppendSql() {
        return appendSql;
    }

    public void setAppendSql(String appendSql) {
        this.appendSql = appendSql;
    }
}
