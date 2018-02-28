package org.gaea.db;

import java.util.HashMap;
import java.util.List;
import java.util.Map;

/**
 * <p><b>复制于Hibernate的SimpleExpression。没错，借鉴，借鉴。。。</b></p>
 * 查询条件的封装实体类。场景：
 * 页面高级查询往后台传递的查询条件。
 * Created by Iverson on 2015/9/23.
 */
public class QueryCondition {
    private String propName;
    private String propValue;
    private List propValues; // 如果是in的查询，就是多值。
    private boolean ignoreCase;
    private String op;                // 操作符。例如：> , = , like 等
    /*  单字段条件的比较操作符：eq ne lt gt le ge.这个在处理时会被转义.  */
    public static final String FIELD_OP_EQ = "eq";
    public static final String FIELD_OP_NE = "ne";
    public static final String FIELD_OP_LT = "lt";
    public static final String FIELD_OP_GT = "gt";
    public static final String FIELD_OP_LE = "le";
    public static final String FIELD_OP_GE = "ge";
    public static final String FIELD_OP_LK = "lk";
    public static final String FIELD_OP_LLK = "llk";
    public static final String FIELD_OP_RLK = "rlk";
    public static final String FIELD_OP_NULL = "na";
    public static final String FIELD_OP_NOT_NULL = "nna";
    public static final String FIELD_OP_IN = "in";
    /**
     * 数据类型。这个和XML SCHEMA的data-type一样。
     * 辅助字段。当查询都是字符串的时候可以无视。但如果是日期之类的，需要有dataType协助转换。
     */
    private String dataType;
    private String placeholder; // SQL里面的占位符。如果有的话，当前condition产生的查询条件会替换占位符的内容。
    private String condOp;// 不同条件间的操作符，例如：and,or,in等
    public static final String COND_OP_NONE = "none";
    public static final String COND_OP_AND = "and";
    public static final String COND_OP_OR = "or";
    /* 如果propValue是一个El表格式，这里可以放它需要用到的上下文属性值。 */
    private Map valueElContextMap = null;

    public QueryCondition() {
    }

    protected QueryCondition(String propName, String propValue, String op) {
        this.propName = propName;
        this.propValue = propValue;
        this.op = op;
    }

    protected QueryCondition(String propName, String propValue, String op, boolean ignoreCase) {
        this.propName = propName;
        this.propValue = propValue;
        this.ignoreCase = ignoreCase;
        this.op = op;
    }

    public String getOp() {
        return op;
    }

    public String getPropName() {
        return propName;
    }

    public String getPropValue() {
        return propValue;
    }

    public void setPropName(String propName) {
        this.propName = propName;
    }

    public void setPropValue(String propValue) {
        this.propValue = propValue;
    }

    public void setOp(String op) {
        this.op = op;
    }

    public String getDataType() {
        return dataType;
    }

    public void setDataType(String dataType) {
        this.dataType = dataType;
    }

    public String getPlaceholder() {
        return placeholder;
    }

    public void setPlaceholder(String placeholder) {
        this.placeholder = placeholder;
    }

    public String getCondOp() {
        return condOp;
    }

    public void setCondOp(String condOp) {
        this.condOp = condOp;
    }

    /**
     * Make case insensitive.  No effect for non-String values
     *
     * @return {@code this}, for method chaining
     */
    public QueryCondition ignoreCase() {
        ignoreCase = true;
        return this;
    }

    public Map getValueElContextMap() {
        if (valueElContextMap == null) {
            valueElContextMap = new HashMap();
        }
        return valueElContextMap;
    }

    public void setValueElContextMap(Map valueElContextMap) {
        this.valueElContextMap = valueElContextMap;
    }
/* 这个是Hibernate的SimpleExpression带过来的方法。可以分析一下要不要用起来。 */
//    public String toSqlString(Criteria criteria, CriteriaQuery criteriaQuery) throws HibernateException {
//        final String[] columns = criteriaQuery.findColumns( propertyName, criteria );
//        final Type type = criteriaQuery.getTypeUsingProjection( criteria, propertyName );
//        final StringBuilder fragment = new StringBuilder();
//
//        if ( columns.length > 1 ) {
//            fragment.append( '(' );
//        }
//        final SessionFactoryImplementor factory = criteriaQuery.getFactory();
//        final int[] sqlTypes = type.sqlTypes( factory );
//        for ( int i = 0; i < columns.length; i++ ) {
//            final boolean lower = ignoreCase && (sqlTypes[i] == Types.VARCHAR || sqlTypes[i] == Types.CHAR);
//            if ( lower ) {
//                fragment.append( factory.getDialect().getLowercaseFunction() ).append( '(' );
//            }
//            fragment.append( columns[i] );
//            if ( lower ) {
//                fragment.append( ')' );
//            }
//
//            fragment.append( getOp() ).append( "?" );
//            if ( i < columns.length - 1 ) {
//                fragment.append( " and " );
//            }
//        }
//        if ( columns.length > 1 ) {
//            fragment.append( ')' );
//        }
//        return fragment.toString();
//    }

//    public TypedValue[] getTypedValues(Criteria criteria, CriteriaQuery criteriaQuery) throws HibernateException {
//        final Object casedValue = ignoreCase ? value.toString().toLowerCase(Locale.ROOT) : value;
//        return new TypedValue[] { criteriaQuery.getTypedValue( criteria, propertyName, casedValue ) };
//    }

    @Override
    public String toString() {
        return "'" + condOp + "'" + propName + getOp() + "propValue : " + propValue + " propValues : " + propValues;
    }

    public List getPropValues() {
        return propValues;
    }

    public void setPropValues(List propValues) {
        this.propValues = propValues;
    }
}
