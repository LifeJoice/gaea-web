package org.gaea.framework.web.data.authority.jo;

import org.gaea.framework.web.data.authority.entity.DsAuthConditionSetEntity;
import org.gaea.framework.web.data.domain.DataSetEntity;
import org.gaea.security.domain.Role;
import org.hibernate.annotations.GenericGenerator;

import javax.persistence.*;
import java.io.Serializable;
import java.util.List;

/**
 * 数据集权限定义实体
 * <p/>
 * JO对象。负责以json的方式传递给前端。
 * 因为直接用entity、domain等传递，可能会有不想要的关系（entity必须严格符合JPA模型）、字段。
 * JO对象是零散的，不严谨的，根据前端需要千变万化的。
 * <p/>
 * Created by iverson on 2017-7-3 15:36:00
 */
public class DsAuthorityJO implements Serializable, org.gaea.data.dataset.domain.DsAuthority {
    private static final long serialVersionUID = 1L;
    private String id;

    private String name;

    private String description;

    private DataSetEntity dataSetEntity;

    /**
     * 这个是附加的权限过滤的conditionSet。
     */
    private DsAuthConditionSetEntity dsAuthConditionSetEntity;

    private List<Role> roles;

    public String getId() {
        return id;
    }

    public void setId(String id) {
        this.id = id;
    }

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

    public String getName() {
        return name;
    }

    public void setName(String name) {
        this.name = name;
    }

    public String getDescription() {
        return description;
    }

    public void setDescription(String description) {
        this.description = description;
    }
}
