package org.gaea.framework.web.data.authority.jo;

import org.gaea.data.dataset.domain.Condition;
import org.gaea.framework.web.data.domain.DsConditionSetEntity;
import org.gaea.util.BeanUtils;

import java.io.Serializable;

/**
 * JO对象。负责以json的方式传递给前端。
 * 因为直接用entity、domain等传递，可能会有不想要的关系（entity必须严格符合JPA模型）、字段。
 * JO对象是零散的，不严谨的，根据前端需要千变万化的。
 * <p/>
 * Created by iverson on 2017-7-3 15:36:00
 */
public class DsAuthConditionJO implements Serializable {
    private static final long serialVersionUID = 1L;
    private String id;
    private String condOp;
    private String op;
    private String propName;
    private String propValue;
    private String placeholder;

    public DsAuthConditionJO() {
    }

    public DsAuthConditionJO(DsConditionSetEntity conditionSet, Condition condition) {
        if (conditionSet == null || condition == null) {
            throw new IllegalArgumentException("condition或conditionSet为空，是无法构建condition entity的。");
        }
        BeanUtils.copyProperties(condition, this);
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
}
