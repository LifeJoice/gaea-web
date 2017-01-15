package org.gaea.framework.web.data.domain;

import java.util.List;

/**
 * Created by iverson on 2017/1/2.
 */
public class DsConditionSet {
    private String name; // XML里定义的id
    private String appendSql;
    private DataSetEntity dataSetEntity;
    private List<DsCondition> dsConditions;

    public String getName() {
        return name;
    }

    public void setName(String name) {
        this.name = name;
    }

    public String getAppendSql() {
        return appendSql;
    }

    public void setAppendSql(String appendSql) {
        this.appendSql = appendSql;
    }

    public DataSetEntity getDataSetEntity() {
        return dataSetEntity;
    }

    public void setDataSetEntity(DataSetEntity dataSetEntity) {
        this.dataSetEntity = dataSetEntity;
    }

    public List<DsCondition> getDsConditions() {
        return dsConditions;
    }

    public void setDsConditions(List<DsCondition> dsConditions) {
        this.dsConditions = dsConditions;
    }
}
