package org.gaea.framework.web.data.domain;

import org.gaea.data.dataset.domain.Condition;
import org.gaea.util.BeanUtils;
import org.hibernate.annotations.GenericGenerator;

import javax.persistence.*;
import java.io.Serializable;

/**
 * Created by iverson on 2016/12/5.
 */
@Entity
@Table(name = "GAEA_SYS_DS_CONDITIONS")
public class DsConditionEntity implements Serializable {
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
    @JoinColumn(name = "CONDITION_SET_ID")
    private DsConditionSetEntity dsConditionSetEntity;

    public DsConditionEntity() {
    }

    public DsConditionEntity(DsConditionSetEntity conditionSet, Condition condition) {
        if (conditionSet == null || condition == null) {
            throw new IllegalArgumentException("condition或conditionSet为空，是无法构建condition entity的。");
        }
        BeanUtils.copyProperties(condition, this);
        this.dsConditionSetEntity = conditionSet;
    }

    public String getId() {
        return id;
    }

    public void setId(String id) {
        this.id = id;
    }

    public DsConditionSetEntity getDsConditionSetEntity() {
        return dsConditionSetEntity;
    }

    public void setDsConditionSetEntity(DsConditionSetEntity dsConditionSetEntity) {
        this.dsConditionSetEntity = dsConditionSetEntity;
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
}
