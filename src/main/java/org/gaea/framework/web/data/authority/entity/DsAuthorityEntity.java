package org.gaea.framework.web.data.authority.entity;

import org.gaea.framework.web.data.domain.DataSetEntity;
import org.gaea.framework.web.data.domain.DsConditionSetEntity;
import org.gaea.security.domain.Role;
import org.hibernate.annotations.GenericGenerator;

import javax.persistence.*;
import java.io.Serializable;
import java.util.List;

/**
 * 数据集权限定义实体
 * Created by iverson on 2016/12/5.
 */
@Entity
@Table(name = "GAEA_SYS_DS_AUTHORITIES")
public class DsAuthorityEntity implements Serializable, org.gaea.data.dataset.domain.DsAuthority {
    private static final long serialVersionUID = 1L;
    @Id
    @GenericGenerator(name = "gaeaDateTimeIDGenerator", strategy = "org.gaea.extend.hibernate.id.GaeaDateTimeIDGenerator")
    @GeneratedValue(generator = "gaeaDateTimeIDGenerator")
    @Column(name = "ID")
    private String id;

    @ManyToOne(fetch = FetchType.LAZY, cascade = CascadeType.ALL)
    @JoinColumn(name = "DATASET_ID")
    private DataSetEntity dataSetEntity;

    /**
     * 这个是附加的权限过滤的conditionSet。
     */
    @OneToOne(mappedBy = "dsAuthorityEntity", fetch = FetchType.LAZY)
    private DsAuthConditionSetEntity dsAuthConditionSetEntity;

    @ManyToMany(fetch = FetchType.LAZY, cascade = CascadeType.ALL)
    @JoinTable(
            name = "GAEA_SYS_DS_AUTHORITIES_ROLES", joinColumns = {
            @JoinColumn(name = "DS_AUTHORITY_ID")
    }, inverseJoinColumns = {
            @JoinColumn(name = "ROLE_ID")
    })
    private List<Role> roles;

    public String getId() {
        return id;
    }

    public void setId(String id) {
        this.id = id;
    }

//    public DsAuthorityGroup getDsAuthorityGroup() {
//        return dsAuthorityGroup;
//    }
//
//    public void setDsAuthorityGroup(DsAuthorityGroup dsAuthorityGroup) {
//        this.dsAuthorityGroup = dsAuthorityGroup;
//    }

    public DataSetEntity getDataSetEntity() {
        return dataSetEntity;
    }

    public void setDataSetEntity(DataSetEntity dataSetEntity) {
        this.dataSetEntity = dataSetEntity;
    }

    public DsAuthConditionSetEntity getDsAuthConditionSetEntity() {
        return dsAuthConditionSetEntity;
    }

    public void setDsAuthConditionSetEntity(DsAuthConditionSetEntity dsAuthConditionSetEntity) {
        this.dsAuthConditionSetEntity = dsAuthConditionSetEntity;
    }

    public List<Role> getRoles() {
        return roles;
    }

    public void setRoles(List<Role> roles) {
        this.roles = roles;
    }
}