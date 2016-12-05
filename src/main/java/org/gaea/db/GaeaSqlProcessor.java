package org.gaea.db;

import org.apache.commons.collections.CollectionUtils;
import org.apache.commons.lang3.StringUtils;
import org.apache.commons.lang3.time.FastDateFormat;
import org.gaea.data.domain.DataSetCommonQueryConditionDTO;
import org.gaea.data.domain.DataSetCommonQueryConditionValueDTO;
import org.gaea.db.dialect.MySQL56InnoDBDialect;
import org.gaea.db.ibatis.jdbc.SQL;
import org.gaea.exception.InvalidDataException;
import org.gaea.exception.ValidationFailedException;
import org.gaea.framework.web.schema.GaeaSchemaCache;
import org.gaea.framework.web.schema.data.domain.SchemaCondition;
import org.gaea.framework.web.schema.data.domain.SchemaConditionSet;
import org.gaea.framework.web.schema.domain.PageResult;
import org.gaea.framework.web.schema.domain.SchemaGridPage;
import org.gaea.framework.web.schema.domain.view.SchemaColumn;
import org.gaea.util.BeanUtils;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.jdbc.core.namedparam.MapSqlParameterSource;
import org.springframework.jdbc.core.namedparam.NamedParameterJdbcTemplate;
import org.springframework.stereotype.Component;

import javax.sql.DataSource;
import java.sql.Types;
import java.text.MessageFormat;
import java.text.ParseException;
import java.util.ArrayList;
import java.util.List;
import java.util.Map;

/**
 * Created by Iverson on 2015/9/23.
 */
@Component
public class GaeaSqlProcessor {
    private final Logger logger = LoggerFactory.getLogger(GaeaSqlProcessor.class);
    private NamedParameterJdbcTemplate namedParameterJdbcTemplate;
    @Autowired
    private GaeaSchemaCache gaeaSchemaCache;
    public static final String PLACEHOLDER_PREFIX = ":"; // appendSQL用的占位符的特殊标记开始。例如“:AUTH_ID_NOT_EQ”

    @Autowired
    public void setDataSource(DataSource dataSource) {
        this.namedParameterJdbcTemplate = new NamedParameterJdbcTemplate(dataSource);
    }

//    public Page<?> query(String urSchemaId,List<QueryCondition> conditions,Pageable pageable){
//        GaeaXmlSchema urSchema = urSchemaCache.get(urSchemaId);
//        DataSet dataSet = urSchema.getSchemaData().getDataSetList().get(0);
//        final String sql = dataSet.getSql();
//        return query(sql,conditions,pageable);
//    }

    /**
     * 根据参数查询分页过的数据。
     *
     * @param sql          基础的查询sql
     * @param primaryTable 分页id相关的主表。主要是MySQL分页用。
     * @param conditions   查询条件
     * @param page         分页对象
     * @return
     * @throws ValidationFailedException
     * @throws InvalidDataException
     */
    public PageResult query(String sql, String primaryTable, List<QueryCondition> conditions, SchemaGridPage page) throws ValidationFailedException, InvalidDataException {
        PageResult pageResult = new PageResult();
        MySQL56InnoDBDialect dialect = new MySQL56InnoDBDialect();
        MapSqlParameterSource params = null;
        /* 拼凑【WHERE】条件语句 */
        String whereCause = genWhereString(conditions);
        params = conditions == null ? new MapSqlParameterSource() : genWhereParams(conditions);
        if (StringUtils.isNotEmpty(whereCause)) {
            sql = sql + " WHERE " + whereCause;
        }
        /* 拼凑【COUNT】语句 */
        String countSQL = new SQL().
                SELECT("count(*)")
                .FROM("(" + sql + ") results")
                .toString();
        // 查询记录数
        int total = namedParameterJdbcTemplate.queryForObject(countSQL, params, Integer.class);

        List<Map<String, Object>> content = new ArrayList<Map<String, Object>>();
        // 如果给定的页码值是Integer.Max_VALUE，则认为是不需要查内容
        if (page.getPage() < Integer.MAX_VALUE) {
            int startPos = (page.getPage() - 1) * page.getSize();
            int pageSize = page.getSize();
            if (total > 0) {
                // 获取分页sql
                String limitedSQL = dialect.getPageSql(sql, primaryTable, startPos, pageSize);
                if (logger.isDebugEnabled()) {
                    logger.debug("Page SQL:" + limitedSQL);
                }
                params.addValue("START_ROWNUM", startPos);
                params.addValue("PAGE_SIZE", pageSize);
                // 查询数据
                content = namedParameterJdbcTemplate.queryForList(limitedSQL, params);
            }
        }

        if (logger.isDebugEnabled()) {
            logger.debug("Count SQL:" + countSQL);
        }
        pageResult.setContent(content);
        pageResult.setTotalElements(total);
        return pageResult;
//        return new PageImpl<Map<String, Object>>(content, new PageRequest(page.getPage(),page.getSize()), total);
    }

    /**
     * 根据SQL，把conditions主动组装条件加到SQL上，然后查询出结果。
     *
     * @param sql
     * @param conditionSet      可以为空。
     * @param queryConditionDTO 可以为空。查询条件对象，包含若干where ... and ... and ...
     * @return
     */
    public List<Map<String, Object>> query(String sql, SchemaConditionSet conditionSet, DataSetCommonQueryConditionDTO queryConditionDTO) throws ValidationFailedException {
        MapSqlParameterSource params = null;
        /* 拼凑【WHERE】条件语句 */
        String whereCause = parseConditionSet(conditionSet, queryConditionDTO);
//        String whereCause = genWhereString(conditions);
        /**
         * 如果没有条件对象，则创建一个空的MapSqlParameterSource.
         * else 按条件对象，拼凑条件参数值
         * 用Spring Template查询必须。
         */
        if (conditionSet == null || CollectionUtils.isEmpty(conditionSet.getConditions())) {
            params = new MapSqlParameterSource();
        } else {
            params = genWhereParams(getConditions(conditionSet, queryConditionDTO));
        }
//        params = CollectionUtils.isEmpty(conditionSet.getConditions()) ? new MapSqlParameterSource() : genWhereParams(getConditions(conditionSet, queryConditionDTO));
//        params = conditions == null ? new MapSqlParameterSource() : genWhereParams(conditions);
        if (StringUtils.isNotEmpty(whereCause)) {
            sql = sql + " WHERE " + whereCause;
        }
        logger.debug(MessageFormat.format("\nquery SQL:\n{0}\nparams:\n{1}", sql, params.getValues()));

        List<Map<String, Object>> content = new ArrayList<Map<String, Object>>();
        // 查询数据
        content = namedParameterJdbcTemplate.queryForList(sql, params);
        return content;
    }

    /**
     * 根据查询条件，拼凑SQL的WHERE语句（不包含WHERE关键字）。
     *
     * @param conditions
     * @return
     */
    private String genWhereString(List<QueryCondition> conditions) throws ValidationFailedException {
        if (conditions == null || conditions.isEmpty()) {
            return "";
        }
        StringBuilder whereSql = new StringBuilder("");
        for (QueryCondition cond : conditions) {
            String columnName = cond.getPropertyName();
            // 查询条件，变量名或值为空就略过
            if (StringUtils.isEmpty(columnName)) {
                continue;
            }
            if (StringUtils.isNotEmpty(whereSql.toString())) {
                whereSql.append(" AND ");
            }
            /**
             * 拼凑查询条件.
             * if value不为空
             *      username = :USER_NAME
             * else value为空
             *      直接用操作符。例如：
             *      username is not null
             * {0} 字段名 {1} sql比较符 {2} Spring namedParameterJdbcTemplate的sql占位符
             */
            if (StringUtils.isNotEmpty(cond.getValue())) {
                whereSql.append(MessageFormat.format("{0} {1} :{2}", columnName.toUpperCase(), parseFieldOp(cond), columnName.toUpperCase()));
            } else {
                whereSql.append(MessageFormat.format("{0} {1}", columnName.toUpperCase(), parseFieldOp(cond)));
            }
        }
        return whereSql.toString();
    }

    /**
     * 把页面传过来的(一般情况是)条件操作符(eq,ne,...)转换成sql的条件操作符(=,!=,...).
     *
     * @param queryCondition 页面传来的查询条件对象（单个）
     * @return
     * @throws ValidationFailedException
     */
    public String parseFieldOp(QueryCondition queryCondition) throws ValidationFailedException {
        String op = queryCondition.getOp();
        String sqlOp = "";// SQL关系操作符
        if (QueryCondition.FIELD_OP_EQ.equalsIgnoreCase(op)) {
            sqlOp = "=";
        } else if (QueryCondition.FIELD_OP_NE.equalsIgnoreCase(op)) {
            sqlOp = "!=";
        } else if (QueryCondition.FIELD_OP_GE.equalsIgnoreCase(op)) {
            sqlOp = ">=";
        } else if (QueryCondition.FIELD_OP_GT.equalsIgnoreCase(op)) {
            sqlOp = ">";
        } else if (QueryCondition.FIELD_OP_LE.equalsIgnoreCase(op)) {
            sqlOp = "<=";
        } else if (QueryCondition.FIELD_OP_LT.equalsIgnoreCase(op)) {
            sqlOp = "<";
        } else if (QueryCondition.FIELD_OP_LK.equalsIgnoreCase(op)
                || QueryCondition.FIELD_OP_LLK.equalsIgnoreCase(op)
                || QueryCondition.FIELD_OP_RLK.equalsIgnoreCase(op)) {
            sqlOp = "LIKE";
        } else if (QueryCondition.FIELD_OP_NULL.equalsIgnoreCase(op)) {
            sqlOp = " IS NULL ";
        } else if (QueryCondition.FIELD_OP_NOT_NULL.equalsIgnoreCase(op)) {
            sqlOp = " IS NOT NULL ";
        } else {
            throw new ValidationFailedException(MessageFormat.format("配置的sql操作符无法解析！op={0}", op));
        }
        return sqlOp;
    }

    /**
     * 把conditionSet和它的值对象queryConditionDTO合并，转换为where条件语句并返回。
     * <p>
     * 包括Spring查询占位符的生成、各种关系符的转换（OR,AND)、LIKE的不同查询情况的处理、appendSQL的替换等。
     * </p>
     *
     * @param conditionSet
     * @param queryConditionDTO
     * @return
     * @throws ValidationFailedException
     */
    public String parseConditionSet(SchemaConditionSet conditionSet, DataSetCommonQueryConditionDTO queryConditionDTO) throws ValidationFailedException {
        if (conditionSet == null || queryConditionDTO == null) {
            return "";
        }
        StringBuffer whereSql = new StringBuffer();
        List<QueryCondition> newConditions = getConditions(conditionSet, queryConditionDTO);// 按通用查询组装标准查询对象
        String appendSql = conditionSet.getAppendSql();
        /**
         * if 没有appendSQL，只有普通查询条件
         *      简单的按queryCondition拼凑查询条件
         * else
         *      appendSQL需要的转换placeholder，然后替换placeholder的位置。
         */
        if (StringUtils.isEmpty(appendSql) && CollectionUtils.isNotEmpty(newConditions)) {
            String whereCause = genWhereString(newConditions);
            whereSql.append(whereCause);
        } else {
            if (CollectionUtils.isNotEmpty(newConditions)) {
                for (QueryCondition cond : newConditions) {
                    String placeholderName = cond.getPlaceholder();
                    String fullPlaceholder = PLACEHOLDER_PREFIX + placeholderName;
                    String columnName = cond.getPropertyName();
                    // 查询条件，变量名或值为空就略过
                    if (StringUtils.isEmpty(columnName)) {
                        continue;
                    }
                    StringBuffer conditionSql = new StringBuffer();
//                    if (StringUtils.isNotEmpty(whereSql.toString())) {
                    // 如果condOp为空，默认就当AND处理。正常应该是不会的。因为condOp是XML元素名。
                    String op = parseCondOp(cond);
//                        String op = StringUtils.isEmpty(cond.getCondOp()) ? " AND " : " " + cond.getCondOp() + " ";
                    conditionSql.append(op);
//                    }
                    /**
                     * 拼凑查询条件.
                     * if value不为空
                     *      username = :USER_NAME
                     * else value为空
                     *      直接用操作符。例如：
                     *      username is not null
                     * {0} 字段名 {1} sql比较符 {2} Spring namedParameterJdbcTemplate的sql占位符
                     */
                    if (StringUtils.isNotEmpty(cond.getValue())) {
                        conditionSql.append(MessageFormat.format("{0} {1} :{2}", columnName.toUpperCase(), parseFieldOp(cond), columnName.toUpperCase()));
                    } else {
                        conditionSql.append(MessageFormat.format("{0} {1}", columnName.toUpperCase(), parseFieldOp(cond)));
                    }
                    /**
                     * if 没有placeholder,或者placeholder找不到
                     *      直接加上条件SQL即可
                     * else
                     *      把条件SQL配置项
                     *      （例如：<or field="auth.id" field-op="ne" placeholder="AUTH_ID_NOT_EQ">）
                     *      转换后的SQL替换掉placeholder的位置。
                     */
                    if (StringUtils.isEmpty(placeholderName) || !StringUtils.contains(appendSql, fullPlaceholder)) {
                        appendSql += conditionSql;
                    } else {
                        appendSql = StringUtils.replace(appendSql, fullPlaceholder, conditionSql.toString());
                    }
                }
                whereSql.append(appendSql);
            }
        }
        return whereSql.toString();
    }

    /**
     * 把conditionSet和对应的值对象queryConditionDTO作匹配，转换成后台通用的查询对象QueryCondition。才能和后台的功能对接。
     *
     * @param conditionSet
     * @param queryConditionDTO 页面用的通用查询传值对象
     * @return
     * @throws ValidationFailedException
     */
    public List<QueryCondition> getConditions(SchemaConditionSet conditionSet, DataSetCommonQueryConditionDTO queryConditionDTO) throws ValidationFailedException {
        List<QueryCondition> newConditions = new ArrayList<QueryCondition>();// 按通用查询组装标准查询对象
        if (conditionSet.getConditions().size() != queryConditionDTO.getValues().size()) {
            throw new ValidationFailedException("查询失败！conditionSet的值和queryCondition的值的个数不匹配。可能XML配置和页面值配置不匹配导致。请检查。");
        }
        for (int i = 0; i < conditionSet.getConditions().size(); i++) {
            // 【重要】这里一个假设：页面value的顺序和XML SCHEMA condition的顺序是一致的。因为暂时不想把查询字段暴露到页面去。
            SchemaCondition schemaCondition = conditionSet.getConditions().get(i);
            DataSetCommonQueryConditionValueDTO valueDTO = queryConditionDTO.getValues().get(i);// 假设顺序一致
            QueryCondition cond = new QueryCondition();
            BeanUtils.copyProperties(schemaCondition, cond);
            cond.setPropertyName(schemaCondition.getField());// 查询字段为XML SCHEMA中的定义
            cond.setDataType(SchemaColumn.DATA_TYPE_STRING);// 暂时默认
            cond.setValue(valueDTO.getValue());// value为页面传过来的值
            cond.setOp(schemaCondition.getFieldOp());
//            cond.setPlaceholder(schemaCondition.getPlaceholder());
//            cond.setCondOp(schemaCondition.getCondOp());
            newConditions.add(cond);
        }
        return newConditions;
    }

    /**
     * 组装where条件语句的值。使用占位符的方式。
     *
     * @param conditions
     * @return
     */
    private MapSqlParameterSource genWhereParams(List<QueryCondition> conditions) {
        MapSqlParameterSource params = new MapSqlParameterSource();
        try {
            for (QueryCondition cond : conditions) {
                String columnName = cond.getPropertyName();
                String value = cond.getValue();
                // 查询条件，变量名或值为空就略过
                if (StringUtils.isEmpty(columnName) || StringUtils.isEmpty(value)) {
                    continue;
                }
                // 拼凑查询条件 username=:USER_NAME
                if (SchemaColumn.DATA_TYPE_DATE.equalsIgnoreCase(cond.getDataType())) {// 如果XML SCHEMA定义的是日期类型，进行特别处理
                    FastDateFormat df = FastDateFormat.getInstance("yyyy-MM-dd");
                    params.addValue(columnName.toUpperCase(), df.parse(value), Types.DATE);
                } else if (SchemaColumn.DATA_TYPE_DATETIME.equalsIgnoreCase(cond.getDataType())) {// 如果XML SCHEMA定义的是日期类型，进行特别处理
                    FastDateFormat df = FastDateFormat.getInstance("yyyy-MM-dd HH:mm:ss");
                    params.addValue(columnName.toUpperCase(), df.parse(value), Types.DATE);
                } else {
                    // 普通的值，通过parseParamValue处理一下，比如有like的情况，需要把值加上%。
                    params.addValue(columnName.toUpperCase(), parseParamValue(cond));
                }
            }
        } catch (ParseException e) {
            throw new IllegalArgumentException("生成SQL的查询条件失败！值转换为日期类失败 : " + e.getMessage(), e);
        }
        return params;
    }

    /**
     * 转换值。主要是增加like操作符。是以**开始，还是以**结束。就是“%”加在前面还是后面。
     *
     * @param cond
     * @return
     */
    private String parseParamValue(QueryCondition cond) {
        String value = cond.getValue();
        if (QueryCondition.FIELD_OP_LK.equalsIgnoreCase(cond.getOp())) {
            value = "%" + value + "%";
        } else if (QueryCondition.FIELD_OP_LLK.equalsIgnoreCase(cond.getOp())) {
            value = value + "%";
        } else if (QueryCondition.FIELD_OP_RLK.equalsIgnoreCase(cond.getOp())) {
            value = "%" + value;
        }
        return value;
    }

    /**
     * 转换查询条件里面的关系操作符。是and，还是or。还有一种是不需要，填充空。因为可能是整段sql替换，条件可以放到appendSql里面。
     *
     * @param cond
     * @return
     */
    private String parseCondOp(QueryCondition cond) {
        String op = cond.getCondOp();
        if (QueryCondition.COND_OP_AND.equalsIgnoreCase(cond.getCondOp())) {
            op = " AND ";
        } else if (QueryCondition.COND_OP_OR.equalsIgnoreCase(cond.getCondOp())) {
            op = " OR ";
        } else if (QueryCondition.COND_OP_NONE.equalsIgnoreCase(cond.getCondOp())) {
            op = " ";
        } else if (StringUtils.isEmpty(cond.getCondOp())) {
            logger.debug("配置的条件之间比较符为空。默认使用'AND'. QueryCondition: " + cond.toString());
            op = " AND ";
        }
        return op;
    }
}
