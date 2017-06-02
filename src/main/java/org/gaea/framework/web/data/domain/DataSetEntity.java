package org.gaea.framework.web.data.domain;

import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.apache.commons.collections.CollectionUtils;
import org.apache.commons.collections.MapUtils;
import org.gaea.data.dataset.domain.ConditionSet;
import org.gaea.data.dataset.domain.GaeaDataSet;
import org.gaea.framework.web.data.authority.entity.DsAuthorityEntity;
import org.gaea.util.BeanUtils;
import org.hibernate.annotations.GenericGenerator;

import javax.persistence.*;
import java.io.IOException;
import java.io.Serializable;
import java.util.ArrayList;
import java.util.List;
import java.util.Map;

/**
 * 数据集对象。
 * Created by iverson on 2016/5/19.
 */
@Entity
@Table(name = "GAEA_SYS_DATASET")
public class DataSetEntity implements Serializable {
    private static final long serialVersionUID = 1L;
    @Id
    @GenericGenerator(name = "gaeaDateTimeIDGenerator", strategy = "org.gaea.extend.hibernate.id.GaeaDateTimeIDGenerator")
    @GeneratedValue(generator = "gaeaDateTimeIDGenerator")
    @Column(name = "ID")
    private String id;
    //        @Column(name = "DS_ID")
//    private String dsId;
    @Column(name = "NAME",unique = true)
    private String name; // XML里定义的id
    @Column(name = "PRIMARY_TABLE")
    private String primaryTable;
    @Column(name = "DATA_SQL", length = 4000)
    private String sql;
    @Column(name = "DS_DATA", length = 2000)
    private String dsData;
    @Column(name = "CACHE_TYPE", length = 20, nullable = false)
    private String cacheType = GaeaDataSet.CACHE_TYPE_NONE; // 默认不缓存
    /**
     * 校验方式。 0：不校验 1：校验,无对应的当没权限. 2：校验,无对应的当有权限.
     */
    @Column(name = "AUTHORITY_TYPE", nullable = false)
    private Integer authorityType = 0; // 默认不校验
    public static final Integer DATASET_AUTHORITY_TYPE_NONE = 0;
    public static final Integer DATASET_AUTHORITY_TYPE_NO_ROLE_NO_PERMIT = 1;
    public static final Integer DATASET_AUTHORITY_TYPE_NO_ROLE_ALL_PERMIT = 2;
    @OneToMany(mappedBy = "dataSetEntity", fetch = FetchType.LAZY, cascade = CascadeType.ALL, orphanRemoval = true)
    private List<DsConditionSetEntity> dsConditionSetEntities;
    @OneToMany(mappedBy = "dataSetEntity", fetch = FetchType.LAZY)
    private List<DsAuthorityEntity> dsAuthorities;

    public DataSetEntity() {
    }

    public DataSetEntity(GaeaDataSet gaeaDataSet) throws JsonProcessingException {
        if (gaeaDataSet == null) {
            throw new IllegalArgumentException("gaeaDataSet为空，是无法构建DataSet entity的。");
        }
        BeanUtils.copyProperties(gaeaDataSet, this, "id", "dsConditionSets");
        this.name = gaeaDataSet.getId();
//        this.sql = gaeaDataSet.getSql();
        if (CollectionUtils.isNotEmpty(gaeaDataSet.getStaticResults())) {
            ObjectMapper objectMapper = new ObjectMapper();
//            try {
                this.dsData = objectMapper.writeValueAsString(gaeaDataSet.getStaticResults());
//            } catch (IOException e) {
//                e.printStackTrace();
//            }
        }

        Map<String, ConditionSet> gaeaDsConditions = gaeaDataSet.getWhere() == null ? null : gaeaDataSet.getWhere().getConditionSets();
        if (MapUtils.isNotEmpty(gaeaDsConditions)) {
            dsConditionSetEntities = new ArrayList<DsConditionSetEntity>();
            for (String condId : gaeaDsConditions.keySet()) {
                ConditionSet conditionSet = gaeaDsConditions.get(condId);
                DsConditionSetEntity dsConditionSetEntity = new DsConditionSetEntity(this, conditionSet);
                dsConditionSetEntities.add(dsConditionSetEntity);
            }
        }
    }

    public String getId() {
        return id;
    }

    public void setId(String id) {
        this.id = id;
    }

//    public String getDsId() {
//        return dsId;
//    }
//
//    public void setDsId(String dsId) {
//        this.dsId = dsId;
//    }

    public String getName() {
        return name;
    }

    public void setName(String name) {
        this.name = name;
    }

    public String getPrimaryTable() {
        return primaryTable;
    }

    public void setPrimaryTable(String primaryTable) {
        this.primaryTable = primaryTable;
    }

    public String getSql() {
        return sql;
    }

    public void setSql(String sql) {
        this.sql = sql;
    }

    public String getDsData() {
        return dsData;
    }

    public void setDsData(String dsData) {
        this.dsData = dsData;
    }

    public Integer getAuthorityType() {
        return authorityType;
    }

    public void setAuthorityType(Integer authorityType) {
        this.authorityType = authorityType;
    }

    public List<DsConditionSetEntity> getDsConditionSetEntities() {
        return dsConditionSetEntities;
    }

    public void setDsConditionSetEntities(List<DsConditionSetEntity> dsConditionSetEntities) {
        this.dsConditionSetEntities = dsConditionSetEntities;
    }

    public List<DsAuthorityEntity> getDsAuthorities() {
        return dsAuthorities;
    }

    public void setDsAuthorities(List<DsAuthorityEntity> dsAuthorities) {
        this.dsAuthorities = dsAuthorities;
    }

    public String getCacheType() {
        return cacheType;
    }

    public void setCacheType(String cacheType) {
        this.cacheType = cacheType;
    }
}
