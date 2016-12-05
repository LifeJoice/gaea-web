package org.gaea.framework.web.schema.data.domain;

/**
 * 逻辑与的查询条件对象。
 * Created by iverson on 2016-7-10 14:18:55.
 */
public class SchemaCondition {
    private String field;
    private String value;
    private String fieldOp;// 单字段条件的比较操作符：eq ne lt gt le ge.这个在处理时会被转义.
    private String condOp;// 不同条件间的操作符，例如：and,or,in等
    private String placeholder; // SQL里面的占位符。如果有的话，当前condition产生的查询条件会替换占位符的内容。

    public String getField() {
        return field;
    }

    public void setField(String field) {
        this.field = field;
    }

    public String getValue() {
        return value;
    }

    public void setValue(String value) {
        this.value = value;
    }

    public String getFieldOp() {
        return fieldOp;
    }

    public void setFieldOp(String fieldOp) {
        this.fieldOp = fieldOp;
    }

    public String getCondOp() {
        return condOp;
    }

    public void setCondOp(String condOp) {
        this.condOp = condOp;
    }

    public String getPlaceholder() {
        return placeholder;
    }

    public void setPlaceholder(String placeholder) {
        this.placeholder = placeholder;
    }
}
