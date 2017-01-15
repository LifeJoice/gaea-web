package org.gaea.framework.web.data.authority.entity;

import org.apache.commons.collections.CollectionUtils;
import org.apache.commons.lang3.StringUtils;
import org.gaea.data.dataset.domain.Condition;
import org.gaea.data.dataset.domain.ConditionSet;
import org.gaea.framework.web.common.CommonDefinition;
import org.gaea.framework.web.data.domain.DataSetEntity;
import org.gaea.framework.web.data.domain.DsConditionEntity;
import org.hibernate.annotations.GenericGenerator;

import javax.persistence.*;
import java.io.Serializable;
import java.util.ArrayList;
import java.util.List;

/**
 * 这个和DsConditionSetEntity基本一样。主要是设计上，因为普通的ConditionSet，是关联DataSet的，如果权限校验的ConditionSet，也同一张表，则DataSet id会为空。
 * ORM框架在识别的过程会出错（没有DataSet id的记录会当成transient对象）。另外设计上也有违常理。
 * Created by iverson on 2017-1-4 09:32:10.
 */
@Entity
@Table(name = "GAEA_SYS_DS_AUTHORITIES_CONDITION_SET")
public class DsAuthConditionSetEntity implements Serializable {
    private static final long serialVersionUID = 1L;
    @Id
    @GenericGenerator(name = "gaeaDateTimeIDGenerator", strategy = "org.gaea.extend.hibernate.id.GaeaDateTimeIDGenerator")
    @GeneratedValue(generator = "gaeaDateTimeIDGenerator")
    @Column(name = "ID")
    private String id;
    @Column(name = "NAME")
    private String name; // XML里定义的id
    @Column(name = "APPEND_SQL")
    private String appendSql;
    @OneToMany(mappedBy = "dsAuthConditionSetEntity", fetch = FetchType.LAZY, cascade = CascadeType.ALL, orphanRemoval = true)
    private List<DsAuthConditionEntity> dsAuthConditionEntities;
    @OneToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "DS_AUTHORITY_ID")
    private DsAuthorityEntity dsAuthorityEntity;

    public DsAuthConditionSetEntity() {
    }

    public DsAuthConditionSetEntity(DataSetEntity dataSetEntity, ConditionSet conditionSet) {
        if (conditionSet == null || dataSetEntity == null || StringUtils.isEmpty(dataSetEntity.getName())) {
            throw new IllegalArgumentException("conditionSet为空，或dataset name（即）为空，是无法构建conditionSet entity的。");
        }
        this.name = dataSetEntity.getName() + CommonDefinition.COMMON_DATASET_NAME_SEPARATOR + conditionSet.getId();
        this.appendSql = conditionSet.getAppendSql();
        List<Condition> conditionList = CollectionUtils.isEmpty(conditionSet.getConditions()) ? null : conditionSet.getConditions();
//        dsConditionEntities = new ArrayList<DsConditionEntity>();
//        for (Condition c : conditionList) {
//            DsConditionEntity dsConditionEntity = new DsConditionEntity(this, c);
//            dsConditionEntities.add(dsConditionEntity);
//        }
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

    public DsAuthorityEntity getDsAuthorityEntity() {
        return dsAuthorityEntity;
    }

    public void setDsAuthorityEntity(DsAuthorityEntity dsAuthorityEntity) {
        this.dsAuthorityEntity = dsAuthorityEntity;
    }

    public List<DsAuthConditionEntity> getDsAuthConditionEntities() {
        return dsAuthConditionEntities;
    }

    public void setDsAuthConditionEntities(List<DsAuthConditionEntity> dsAuthConditionEntities) {
        this.dsAuthConditionEntities = dsAuthConditionEntities;
    }
}
