package org.gaea.framework.web.data.authority.jo;

import org.apache.commons.collections.CollectionUtils;
import org.apache.commons.lang3.StringUtils;
import org.gaea.data.dataset.domain.Condition;
import org.gaea.data.dataset.domain.ConditionSet;
import org.gaea.framework.web.common.WebCommonDefinition;
import org.gaea.framework.web.data.authority.entity.DsAuthConditionEntity;
import org.gaea.framework.web.data.domain.DataSetEntity;

import java.io.Serializable;
import java.util.List;

/**
 * JO对象。负责以json的方式传递给前端。
 * 因为直接用entity、domain等传递，可能会有不想要的关系（entity必须严格符合JPA模型）、字段。
 * JO对象是零散的，不严谨的，根据前端需要千变万化的。
 * <p/>
 * Created by iverson on 2017-7-3 15:36:00
 */
public class DsAuthConditionSetJO implements Serializable {
    private static final long serialVersionUID = 1L;
    private String id;
    private String name; // XML里定义的id
    private String appendSql;
    private List<DsAuthConditionEntity> dsAuthConditionEntities;

    public DsAuthConditionSetJO() {
    }

    public DsAuthConditionSetJO(DataSetEntity dataSetEntity, ConditionSet conditionSet) {
        if (conditionSet == null || dataSetEntity == null || StringUtils.isEmpty(dataSetEntity.getName())) {
            throw new IllegalArgumentException("conditionSet为空，或dataset name（即）为空，是无法构建conditionSet entity的。");
        }
        this.name = dataSetEntity.getName() + WebCommonDefinition.COMMON_DATASET_NAME_SEPARATOR + conditionSet.getId();
        this.appendSql = conditionSet.getAppendSql();
        List<Condition> conditionList = CollectionUtils.isEmpty(conditionSet.getConditions()) ? null : conditionSet.getConditions();
    }

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

    public String getAppendSql() {
        return appendSql;
    }

    public void setAppendSql(String appendSql) {
        this.appendSql = appendSql;
    }

    public List<DsAuthConditionEntity> getDsAuthConditionEntities() {
        return dsAuthConditionEntities;
    }

    public void setDsAuthConditionEntities(List<DsAuthConditionEntity> dsAuthConditionEntities) {
        this.dsAuthConditionEntities = dsAuthConditionEntities;
    }
}
