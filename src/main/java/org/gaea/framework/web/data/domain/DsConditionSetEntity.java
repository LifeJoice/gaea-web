package org.gaea.framework.web.data.domain;

import org.apache.commons.collections.CollectionUtils;
import org.apache.commons.lang3.StringUtils;
import org.gaea.data.dataset.domain.Condition;
import org.gaea.data.dataset.domain.ConditionSet;
import org.gaea.framework.web.common.CommonDefinition;
import org.hibernate.annotations.GenericGenerator;

import javax.persistence.*;
import java.io.Serializable;
import java.util.ArrayList;
import java.util.List;

/**
 * Created by iverson on 2016/12/5.
 */
@Entity
@Table(name = "GAEA_SYS_DS_CONDITION_SET")
public class DsConditionSetEntity implements Serializable {
    private static final long serialVersionUID = 1L;
    @Id
    @GenericGenerator(name = "gaeaDateTimeIDGenerator", strategy = "org.gaea.extend.hibernate.id.GaeaDateTimeIDGenerator")
    @GeneratedValue(generator = "gaeaDateTimeIDGenerator")
    @Column(name = "ID")
    private String id;
    @Column(name = "NAME")
    private String name; // XML里定义的id
    @Column(name = "APPEND_SQL",length = 1000)
    private String appendSql;
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "DATASET_ID")
    private DataSetEntity dataSetEntity;
    @OneToMany(mappedBy = "dsConditionSetEntity", fetch = FetchType.LAZY, cascade = CascadeType.ALL, orphanRemoval = true)
    private List<DsConditionEntity> dsConditionEntities;

    public DsConditionSetEntity() {
    }

    public DsConditionSetEntity(DataSetEntity dataSetEntity, ConditionSet conditionSet) {
        if (conditionSet == null || dataSetEntity == null || StringUtils.isEmpty(dataSetEntity.getName())) {
            throw new IllegalArgumentException("conditionSet为空，或dataset name（即）为空，是无法构建conditionSet entity的。");
        }
//        this.name = dataSetEntity.getName() + CommonDefinition.COMMON_DATASET_NAME_SEPARATOR + conditionSet.getId();
        this.name = conditionSet.getId();
        this.appendSql = conditionSet.getAppendSql();
        this.dataSetEntity = dataSetEntity;
        List<Condition> conditionList = CollectionUtils.isEmpty(conditionSet.getConditions()) ? null : conditionSet.getConditions();
        dsConditionEntities = new ArrayList<DsConditionEntity>();
        for (Condition c : conditionList) {
            DsConditionEntity dsConditionEntity = new DsConditionEntity(this, c);
            dsConditionEntities.add(dsConditionEntity);
        }
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

    public DataSetEntity getDataSetEntity() {
        return dataSetEntity;
    }

    public void setDataSetEntity(DataSetEntity dataSetEntity) {
        this.dataSetEntity = dataSetEntity;
    }

    public String getAppendSql() {
        return appendSql;
    }

    public void setAppendSql(String appendSql) {
        this.appendSql = appendSql;
    }

    public List<DsConditionEntity> getDsConditionEntities() {
        return dsConditionEntities;
    }

    public void setDsConditionEntities(List<DsConditionEntity> dsConditionEntities) {
        this.dsConditionEntities = dsConditionEntities;
    }
}
