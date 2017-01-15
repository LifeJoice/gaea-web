package org.gaea.framework.web.data.authority.entity;

import org.gaea.data.dataset.domain.Condition;
import org.gaea.framework.web.data.domain.DsConditionSetEntity;
import org.gaea.util.BeanUtils;
import org.hibernate.annotations.GenericGenerator;

import javax.persistence.*;
import java.io.Serializable;

/**
 * 这个和DsConditionEntity基本一样。
 * 这个主要是ConditionSet的设计。
 * 因为普通的ConditionSet，是关联DataSet的，如果权限校验的ConditionSet，也同一张表，则DataSet id会为空。
 * ORM框架在识别的过程会出错（没有DataSet id的记录会当成transient对象）。另外设计上也有违常理。
 * Created by iverson on 2017-1-4 09:32:10.
 */
@Entity
@Table(name = "GAEA_SYS_DS_AUTH_CONDITIONS")
public class DsAuthConditionEntity implements Serializable {
    private static final long serialVersionUID = 1L;
    @Id
    @GenericGenerator(name = "gaeaDateTimeIDGenerator", strategy = "org.gaea.extend.hibernate.id.GaeaDateTimeIDGenerator")
    @GeneratedValue(generator = "gaeaDateTimeIDGenerator")
    @Column(name = "ID")
    private String id;
    @Column(name = "COND_OP")
    private String condOp;
    @Column(name = "OP")
    private String op;
    @Column(name = "PROP_NAME")
    private String propName;
    @Column(name = "PROP_VALUE")
    private String propValue;
    @Column(name = "PLACEHOLDER")
    private String placeholder;
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "DS_AUTH_CONDITION_SET_ID")
    private DsAuthConditionSetEntity dsAuthConditionSetEntity;

    public DsAuthConditionEntity() {
    }

    public DsAuthConditionEntity(DsConditionSetEntity conditionSet, Condition condition) {
        if (conditionSet == null || condition == null) {
            throw new IllegalArgumentException("condition或conditionSet为空，是无法构建condition entity的。");
        }
        BeanUtils.copyProperties(condition, this);
//        this.dsConditionSetEntity = conditionSet;
    }

    public String getId() {
        return id;
    }

    public void setId(String id) {
        this.id = id;
    }

    public String getCondOp() {
        return condOp;
    }

    public void setCondOp(String condOp) {
        this.condOp = condOp;
    }

    public String getOp() {
        return op;
    }

    public void setOp(String op) {
        this.op = op;
    }

    public String getPropName() {
        return propName;
    }

    public void setPropName(String propName) {
        this.propName = propName;
    }

    public String getPropValue() {
        return propValue;
    }

    public void setPropValue(String propValue) {
        this.propValue = propValue;
    }

    public String getPlaceholder() {
        return placeholder;
    }

    public void setPlaceholder(String placeholder) {
        this.placeholder = placeholder;
    }

    public DsAuthConditionSetEntity getDsAuthConditionSetEntity() {
        return dsAuthConditionSetEntity;
    }

    public void setDsAuthConditionSetEntity(DsAuthConditionSetEntity dsAuthConditionSetEntity) {
        this.dsAuthConditionSetEntity = dsAuthConditionSetEntity;
    }
}
