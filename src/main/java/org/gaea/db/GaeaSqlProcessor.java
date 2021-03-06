package org.gaea.db;

import org.apache.commons.collections.CollectionUtils;
import org.apache.commons.lang3.StringUtils;
import org.apache.commons.lang3.time.FastDateFormat;
import org.gaea.data.dataset.domain.*;
import org.gaea.data.domain.DataSetCommonQueryConditionDTO;
import org.gaea.data.domain.QueryValue;
import org.gaea.db.ibatis.jdbc.SQL;
import org.gaea.exception.InvalidDataException;
import org.gaea.exception.ValidationFailedException;
import org.gaea.framework.common.GaeaSpelKeywordDefinition;
import org.gaea.framework.web.data.GaeaDefaultDsContext;
import org.gaea.framework.web.data.GaeaSqlExpressionParser;
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

import java.sql.Types;
import java.text.MessageFormat;
import java.text.ParseException;
import java.util.*;

/**
 * Created by Iverson on 2015/9/23.
 */
@Component
public class GaeaSqlProcessor {
    private final Logger logger = LoggerFactory.getLogger(GaeaSqlProcessor.class);
    public static final String PLACEHOLDER_PREFIX = ":"; // appendSQL用的占位符的特殊标记开始。例如“:AUTH_ID_NOT_EQ”
    @Autowired
    private NamedParameterJdbcTemplate namedParameterJdbcTemplate;
    @Autowired
    private GaeaSqlExpressionParser gaeaSqlExpressionParser;
    @Autowired
    private GaeaDataBase gaeaDataBase;

    /**
     * 根据参数查询分页过的数据。
     *
     * @param sql              基础的查询sql
     * @param primaryTable     分页id相关的主表。主要是MySQL分页用。
     * @param conditions       查询条件
     * @param page             分页对象
     * @param defaultDsContext SQL的表达式需要用到的上下文对象。可以为空。空，则不进行SQL的表达式转换。
     * @return
     * @throws ValidationFailedException
     * @throws InvalidDataException
     */
    public PageResult query(String sql, String primaryTable, List<QueryCondition> conditions, SchemaGridPage page, GaeaDefaultDsContext defaultDsContext) throws ValidationFailedException, InvalidDataException {
        PageResult pageResult = new PageResult();
//        MySQL56InnoDBDialect dialect = new MySQL56InnoDBDialect();
        MapSqlParameterSource params = null;
        /* 拼凑【WHERE】条件语句 */
        String whereCause = genWhereString(conditions, "", sql);
        params = conditions == null ? new MapSqlParameterSource() : genWhereParams(conditions, defaultDsContext);
        if (StringUtils.isNotEmpty(whereCause)) {
            sql = sql + " WHERE " + whereCause;
        }
        /* 转换SQL里面的表达式 */
        // 转换自定义占位符
//        sql = parsePlaceHolder(sql, conditions);
        /**
         * 如果defaultDsContext不为空，则对sql进行表达式转换。例如：
         * SQL里面可能有一些需要替换为当前登录名的、角色的等，用的是SPEL表达式，需要动态替换。
         */
        if (defaultDsContext != null) {
            sql = gaeaSqlExpressionParser.parse(sql, defaultDsContext);
        }
        pageResult = query(sql, params, primaryTable, page);
        return pageResult;
    }

    /**
     * 根据SQL，把conditions主动组装条件加到SQL上，然后查询出结果。
     * <p>这个是没分页的<p/>
     *
     * @param gaeaDataSet
     * @param conditionSet      可以为空。
     * @param queryConditionDTO 可以为空。查询条件对象，包含若干where ... and ... and ...
     * @return
     */
    public List<Map<String, Object>> query(GaeaDataSet gaeaDataSet, ConditionSet conditionSet, GaeaDefaultDsContext defaultDsContext, DataSetCommonQueryConditionDTO queryConditionDTO) throws ValidationFailedException, InvalidDataException {
        MapSqlParameterSource params = null;
        String sql = gaeaDataSet.getSql();
        StringBuilder whereCause = new StringBuilder();
        /* 拼凑【WHERE】条件语句 */
//        String whereCause = parseConditionSet(conditionSet, queryConditionDTO);
        whereCause.append(parseConditionSet(sql, conditionSet, queryConditionDTO));
        /**
         * 如果没有条件对象，则创建一个空的MapSqlParameterSource.
         * else 按条件对象，拼凑条件参数值
         * 用Spring Template查询必须。
         */
        if (conditionSet == null || CollectionUtils.isEmpty(conditionSet.getConditions())) {
            params = new MapSqlParameterSource();
        } else {
            params = genWhereParams(getConditions(conditionSet, queryConditionDTO), defaultDsContext);
        }
//        params = CollectionUtils.isEmpty(conditionSet.getConditions()) ? new MapSqlParameterSource() : genWhereParams(getConditions(conditionSet, queryConditionDTO));
//        params = conditions == null ? new MapSqlParameterSource() : genWhereParams(conditions);

        sql = toSql(sql, whereCause.toString(), gaeaDataSet.getOrderBy(), gaeaDataSet.getGroupBy());
//        if (StringUtils.isNotEmpty(whereCause)) {
//            sql = new SQL().SELECT("*").FROM(sql, "subQuery").WHERE(whereCause).toString();
//        }
        /* 转换SQL里面的表达式 */
        /**
         * 如果defaultDsContext不为空，则对sql进行表达式转换。例如：
         * SQL里面可能有一些需要替换为当前登录名的、角色的等，用的是SPEL表达式，需要动态替换。
         */

        // 先把where里面的占位符转换
        whereCause = new StringBuilder(gaeaSqlExpressionParser.parse(whereCause.toString(), defaultDsContext, getExtraContext(whereCause, conditionSet, queryConditionDTO)));
        // 再把where作为占位符上下文，给整句sql使用（转换sql里面的#where）
        sql = gaeaSqlExpressionParser.parse(sql, defaultDsContext, getExtraContext(whereCause, conditionSet, queryConditionDTO));
        // 转换自定义占位符
//        sql = parsePlaceHolder(sql, conditionSet, queryConditionDTO);
        // 查询
        PageResult pageResult = query(sql, params, gaeaDataSet.getPrimaryTable(), null);

//        if (StringUtils.isNotEmpty(whereCause)) {
//            sql = sql + " WHERE " + whereCause;
//        }
//        logger.debug(MessageFormat.format("\nquery SQL:\n{0}\nparams:\n{1}", sql, params.getValues()));
//
//        List<Map<String, Object>> content = new ArrayList<Map<String, Object>>();
//        // 查询数据
//        content = namedParameterJdbcTemplate.queryForList(sql, params);
        return pageResult.getContent();
    }

    /**
     * 查询。
     * <p>
     * 历史原因，这个当前只能匹配一个条件集查询。即如果有权限的条件集，就用不了其他条件集了。<br/>
     * 推荐多个条件集使用另一个query接口。
     * </p>
     * <p>
     * 权限校验（或者表达式）的值对象，用的不是DataSetCommonQueryConditionDTO，而是GaeaDefaultDsContext对象。
     * AI.TODO 这个，重构一下，整合两个值对象会比较合理
     * </p>
     *
     * @param gaeaDataSet
     * @param primaryTable
     * @param conditionSet      条件。
     * @param page              可以为空。为空表示查询不设数量限制。
     * @param defaultDsContext  主要用权限过滤，和SQL中的表达式（如果有）的解析。
     * @param queryConditionDTO 可以为空。查询的条件的值。这个一般页面发起的查询有。一般的可以放入到ConditionSet。有点重复了。
     * @return
     * @throws ValidationFailedException
     * @throws InvalidDataException
     */
    public PageResult query(GaeaDataSet gaeaDataSet, String primaryTable, ConditionSet conditionSet, SchemaGridPage page, GaeaDefaultDsContext defaultDsContext, DataSetCommonQueryConditionDTO queryConditionDTO) throws ValidationFailedException, InvalidDataException {
        MapSqlParameterSource params = null;
        String sql = gaeaDataSet.getSql();
        StringBuilder whereCause = new StringBuilder();
        /* 拼凑【WHERE】条件语句 */
//        String whereCause = parseConditionSet(conditionSet, queryConditionDTO);
        whereCause.append(parseConditionSet(sql, conditionSet, queryConditionDTO));
        /**
         * 如果没有条件对象，则创建一个空的MapSqlParameterSource.
         * else 按条件对象，拼凑条件参数值
         * 用Spring Template查询必须。
         */
        if (conditionSet == null || CollectionUtils.isEmpty(conditionSet.getConditions())) {
            params = new MapSqlParameterSource();
        } else {
            params = genWhereParams(getConditions(conditionSet, queryConditionDTO), defaultDsContext);
        }
        sql = toSql(sql, whereCause.toString(), gaeaDataSet.getOrderBy(), gaeaDataSet.getGroupBy());
//        if (StringUtils.isNotEmpty(whereCause)) {
//            sql = new SQL().SELECT("*").FROM(sql, "subQuery").WHERE(whereCause).toString();
//        }
        /* 转换SQL里面的表达式 */
        /**
         * 如果defaultDsContext不为空，则对sql进行表达式转换。例如：
         * SQL里面可能有一些需要替换为当前登录名的、角色的等，用的是SPEL表达式，需要动态替换。
         */
        // 先把where里面的占位符转换
        whereCause = new StringBuilder(gaeaSqlExpressionParser.parse(whereCause.toString(), defaultDsContext, getExtraContext(whereCause, conditionSet, queryConditionDTO)));
        // 再把where作为占位符上下文，给整句sql使用（转换sql里面的#where）
        sql = gaeaSqlExpressionParser.parse(sql, defaultDsContext, getExtraContext(whereCause, conditionSet, queryConditionDTO));
        // 查询
        PageResult pageResult = query(sql, params, primaryTable, page);
        return pageResult;
    }

    /**
     * 支持多个ConditionSet作为查询条件的查询功能。
     *
     * @param gaeaDataSet
     * @param gaeaDataSet
     *@param primaryTable
     * @param conditionSetMap  key：条件集 value：条件集的值。这个需要有序的map。查询条件组成sql的顺序，会按照map中的顺序来。
     * @param page
     * @param defaultDsContext     @return
     * @throws ValidationFailedException
     * @throws InvalidDataException
     */
    public PageResult query(GaeaDataSet gaeaDataSet, String primaryTable, LinkedHashMap<ConditionSet, DataSetCommonQueryConditionDTO> conditionSetMap, SchemaGridPage page, GaeaDefaultDsContext defaultDsContext) throws ValidationFailedException, InvalidDataException {
        MapSqlParameterSource params = new MapSqlParameterSource();
        StringBuilder whereCause = new StringBuilder();
        String sql = gaeaDataSet.getSql();
        /**
         * 构造where
         */
        if (conditionSetMap != null) {
            for (ConditionSet conditionSet : conditionSetMap.keySet()) {
                DataSetCommonQueryConditionDTO queryConditionDTO = conditionSetMap.get(conditionSet);
                /* 拼凑【WHERE】条件语句 */
                whereCause.append(parseConditionSet(sql, conditionSet, queryConditionDTO));
                /**
                 * 如果没有条件对象，则创建一个空的MapSqlParameterSource.
                 * else 按条件对象，拼凑条件参数值
                 * 用Spring Template查询必须。
                 */
//                if (params == null && (conditionSet == null || CollectionUtils.isEmpty(conditionSet.getConditions()))) {
//                    params = new MapSqlParameterSource();
//                } else {
                if (conditionSet != null && CollectionUtils.isNotEmpty(conditionSet.getConditions())) {
                    params.addValues(genWhereParams(getConditions(conditionSet, queryConditionDTO), defaultDsContext).getValues());
                }
            }
        }
        /**
         * 最终SQL
         */
        sql = toSql(sql, whereCause.toString(), gaeaDataSet.getOrderBy(), gaeaDataSet.getGroupBy());
//        if (StringUtils.isNotEmpty(whereCause)) {
//            sql = new SQL().SELECT("*").FROM(sql, "subQuery").WHERE(whereCause.toString()).toString();
//        }
        /* 转换SQL里面的表达式 */
        /**
         * 如果defaultDsContext不为空，则对sql进行表达式转换。例如：
         * SQL里面可能有一些需要替换为当前登录名的、角色的等，用的是SPEL表达式，需要动态替换。
         */
        Map extraContextMap = new HashMap();
        // 转换自定义占位符
        for (ConditionSet conditionSet : conditionSetMap.keySet()) {
            DataSetCommonQueryConditionDTO queryConditionDTO = conditionSetMap.get(conditionSet);
            extraContextMap.putAll(getExtraContext(whereCause, conditionSet, queryConditionDTO));
        }
        sql = gaeaSqlExpressionParser.parse(sql, defaultDsContext, extraContextMap);
//        // 转换自定义占位符
//        for (ConditionSet conditionSet : conditionSetMap.keySet()) {
//            DataSetCommonQueryConditionDTO queryConditionDTO = conditionSetMap.get(conditionSet);
//            sql = parsePlaceHolder(sql, conditionSet, queryConditionDTO);
//        }
        // 查询
        PageResult pageResult = query(sql, params, primaryTable, page);
        return pageResult;
    }

    /**
     * 根据查询条件，拼凑SQL的WHERE语句（不包含WHERE关键字）。<br/>
     * 如果占位符定义为空，或者在sql/whereSql里面都找不到占位符，就直接把条件当SQL。否则就放后面处理。
     *
     * @param conditions
     * @param baseWhereSql    如果where本身已经有一句基础了。在此基础上构造。例如, 当前主要是：conditionSet的appendSql.
     * @param sql             主SQL。用于检测里面有没有占位符。
     * @return
     */
    private String genWhereString(List<QueryCondition> conditions, String baseWhereSql, String sql) throws ValidationFailedException {
        if (conditions == null || conditions.isEmpty()) {
            return "";
        }
        StringBuilder whereSql = new StringBuilder("");
        // 如果where本身已经有一句基础了。在此基础上构造。
        if (StringUtils.isNotEmpty(baseWhereSql)) {
            whereSql.append(baseWhereSql);
        }

        for (QueryCondition cond : conditions) {
            String placeholderName = cond.getPlaceholder(); // 占位符
//            String fullPlaceholder = PLACEHOLDER_PREFIX + placeholderName; // 完整的占位符
            String columnName = cond.getPropName();
            // 查询条件，变量名或值为空就略过
            if (StringUtils.isEmpty(columnName)) {
                continue;
            }
            StringBuffer conditionSql = new StringBuffer();
            // 快捷查询区的条件，默认都只能用and
            if (StringUtils.isNotEmpty(whereSql.toString())) {
                whereSql.append(" AND ");
            }
            /**
             * 拼凑查询条件.
             * if 关系符是 eq/neq( is null / is not null)这类查询, 直接用操作符。例如：
             *      username is not null
             * else
             *      username = :USER_NAME
             */
            conditionSql.append(parseCondition(cond));
//            if (StringUtils.isNotEmpty(cond.getPropValue())) {
//                whereSql.append(MessageFormat.format("{0} {1} :{2}", columnName.toUpperCase(), parseFieldOp(cond), columnName.toUpperCase()));
//            } else {
//                whereSql.append(MessageFormat.format("{0} {1}", columnName.toUpperCase(), parseFieldOp(cond)));
//            }

            // 如果占位符定义为空，或者在sql/whereSql里面都找不到占位符，就直接把条件当SQL。否则就放后面处理。
            // 主SQL有占位符也不能粘贴条件语句，因为这样会重复
            if (StringUtils.isEmpty(placeholderName) ||
                    (!gaeaSqlExpressionParser.hasExpression(baseWhereSql, placeholderName) && !gaeaSqlExpressionParser.hasExpression(sql, placeholderName))) {
                whereSql.append(conditionSql);
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
        } else if (QueryCondition.FIELD_OP_IN.equalsIgnoreCase(op)) {
            sqlOp = " IN ";
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
     * <p>
     *     如果是有append-sql的情况
     * </p>
     * <p>
     * param name支持'.'所以<br/><b>
     * R.CREATE_BY = :R.CREATE_BY
     * </b><br/>
     * 这样的命名是没有问题的.
     * </p>
     *
     *
     * @param sql               协助判断其中没有SPEL表达式，才会把条件转换成where
     * @param conditionSet
     * @param queryConditionDTO 可以为空
     * @return
     * @throws ValidationFailedException
     */
    public String parseConditionSet(String sql, ConditionSet conditionSet, DataSetCommonQueryConditionDTO queryConditionDTO) throws ValidationFailedException {
        if (conditionSet == null) {
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
            String whereCause = genWhereString(newConditions, appendSql, sql);
            whereSql.append(whereCause);
        } else {
            if (CollectionUtils.isNotEmpty(newConditions)) {
                for (QueryCondition cond : newConditions) {
                    String placeholderName = cond.getPlaceholder(); // 占位符
//                    String fullPlaceholder = PLACEHOLDER_PREFIX + placeholderName; // 完整的占位符
                    String columnName = cond.getPropName();
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
                     * if 关系符是 eq/neq( is null / is not null)这类查询, 直接用操作符。例如：
                     *      username is not null
                     * else
                     *      username = :USER_NAME
                     */
                    conditionSql.append(parseCondition(cond));
//                    if (StringUtils.isNotEmpty(cond.getPropValue())) {
//                        conditionSql.append(MessageFormat.format("{0} {1} :{2}", columnName.toUpperCase(), parseFieldOp(cond), columnName.toUpperCase()));
//                    } else {
//                        conditionSql.append(MessageFormat.format("{0} {1}", columnName.toUpperCase(), parseFieldOp(cond)));
//                    }
                    /**
                     * if 没有placeholder,或者placeholder找不到
                     *      直接加上条件SQL即可
                     * else
                     *      把条件SQL配置项
                     *      （例如：<or field="auth.id" op="ne" placeholder="AUTH_ID_NOT_EQ">）
                     *      转换后的SQL替换掉placeholder的位置。
                     */
                    if (StringUtils.isEmpty(placeholderName) ||
                            (!gaeaSqlExpressionParser.hasExpression(appendSql, placeholderName) && !gaeaSqlExpressionParser.hasExpression(sql, placeholderName))) {
                        appendSql += conditionSql;
//                    } else {
//                        appendSql = StringUtils.replace(appendSql, fullPlaceholder, conditionSql.toString());
                    }
                }
                whereSql.append(appendSql);
            }
        }
        return whereSql.toString();
    }

    /**
     * 拼凑查询条件.
     * if 关系符是 eq/neq( is null / is not null)这类查询
     * 直接用操作符。例如：
     * username is not null
     * else
     * username = :USER_NAME
     *
     * @param cond
     * @return
     * @throws ValidationFailedException
     */
    private String parseCondition(QueryCondition cond) throws ValidationFailedException {
        StringBuilder result = new StringBuilder();
        if (SchemaColumn.DATA_TYPE_DATE.equalsIgnoreCase(cond.getDataType()) ||
                SchemaColumn.DATA_TYPE_DATETIME.equalsIgnoreCase(cond.getDataType())) {
            // 日期类的条件转换
            result.append(gaeaDataBase.parseDateTimeCondition(cond));
        } else {
            /**
             * if 关系符是 is null / is not null这类查询
             *      则不需要">=<"之类的
             *      直接用操作符。例如：
             *      username is not null
             * else if propValues不为空
             *      采用 in ('A','B')
             * else
             *      username = :USER_NAME
             */
            if (QueryCondition.FIELD_OP_NULL.equalsIgnoreCase(cond.getOp()) || QueryCondition.FIELD_OP_NOT_NULL.equalsIgnoreCase(cond.getOp())) {
                result.append(MessageFormat.format("{0} {1}", cond.getPropName().toUpperCase(), parseFieldOp(cond)));
            } else if (QueryCondition.FIELD_OP_IN.equalsIgnoreCase(cond.getOp())) {
                if (CollectionUtils.isEmpty(cond.getPropValues())) {
                    throw new ValidationFailedException("未获取到条件的值，无法执行IN查询。 condition: " + cond.toString());
                }
                result.append(MessageFormat.format("{0} {1} (:{2})", cond.getPropName().toUpperCase(), parseFieldOp(cond), cond.getPropName().toUpperCase()));
            } else {
                result.append(MessageFormat.format("{0} {1} :{2}", cond.getPropName().toUpperCase(), parseFieldOp(cond), cond.getPropName().toUpperCase()));
            }
        }
        return result.toString();
    }

    /**
     * 把conditionSet和对应的值对象queryConditionDTO作匹配，转换成后台通用的查询对象QueryCondition。才能和后台的功能对接。
     * <p>
     * 如果Condition配置了值，同时页面也传了值。则页面的值会覆盖配置的值。
     * </p>
     *
     * @param conditionSet
     * @param queryConditionDTO 页面用的通用查询传值对象
     * @return
     * @throws ValidationFailedException
     */
    public List<QueryCondition> getConditions(ConditionSet conditionSet, DataSetCommonQueryConditionDTO queryConditionDTO) throws ValidationFailedException {
        if (conditionSet == null) {
            return new ArrayList<QueryCondition>();
        }
        List<QueryCondition> newConditions = new ArrayList<QueryCondition>();// 按通用查询组装标准查询对象
        if (queryConditionDTO != null && conditionSet.getConditions().size() != queryConditionDTO.getValues().size()) {
            throw new ValidationFailedException("查询失败！conditionSet的值和queryCondition的值的个数不匹配。可能XML配置和页面值配置不匹配导致。请检查。");
        }
        for (int i = 0; i < conditionSet.getConditions().size(); i++) {
            QueryCondition cond = new QueryCondition();
            // 【重要】这里一个假设：页面value的顺序和XML SCHEMA condition的顺序是一致的。因为暂时不想把查询字段暴露到页面去。
            Condition schemaCondition = conditionSet.getConditions().get(i);
            BeanUtils.copyProperties(schemaCondition, cond);
            // 以Condition的value为基础
            String value = schemaCondition.getPropValue();
            if (queryConditionDTO != null) {
                // 【重要】假设顺序一致
                QueryValue valueDTO = queryConditionDTO.getValues().get(i);
                value = valueDTO.getValue();
                if (StringUtils.isEmpty(schemaCondition.getPropValue())) {
                    cond.setPropValue(valueDTO.getValue());// value为页面传过来的值
                } else {
                    cond.setPropValue(schemaCondition.getPropValue());
                    cond.getValueElContextMap().put("gaea_value", valueDTO.getValue());
                }
            }
//            QueryCondition cond = new QueryCondition();
//            BeanUtils.copyProperties(schemaCondition, cond);
            if (StringUtils.isEmpty(cond.getDataType())) {
                cond.setDataType(SchemaColumn.DATA_TYPE_STRING);// 暂时默认
            }
//            cond.setPropValue(value);// value为页面传过来的值 or 写死在condition中的值
            newConditions.add(cond);
        }
        return newConditions;
    }

    /**
     * 组装where条件语句的值。使用占位符的方式。
     * <p>
     * param name支持'.'所以<br/>
     * R.CREATE_BY = :R.CREATE_BY<br/>
     * 这样的命名是没有问题的.
     * </p>
     *
     * @param conditions
     * @return
     */
    private MapSqlParameterSource genWhereParams(List<QueryCondition> conditions, GaeaDefaultDsContext defaultDsContext) {
        MapSqlParameterSource params = new MapSqlParameterSource();
        try {
            for (QueryCondition cond : conditions) {
                String columnName = cond.getPropName();
//                String value = cond.getPropValue();
                Object value = parseParamValue(cond, defaultDsContext);
                // 查询条件，变量名或值为空就略过
//                if (StringUtils.isEmpty(columnName) || value == null) {
//                    continue;
//                }
                // 拼凑查询条件 username=:USER_NAME
                if (SchemaColumn.DATA_TYPE_DATE.equalsIgnoreCase(cond.getDataType())) {// 如果XML SCHEMA定义的是日期类型，进行特别处理
//                    FastDateFormat df = FastDateFormat.getInstance("yyyy-MM-dd");
                    params.addValue(columnName.toUpperCase(), value, Types.DATE);
                } else if (SchemaColumn.DATA_TYPE_DATETIME.equalsIgnoreCase(cond.getDataType())) {// 如果XML SCHEMA定义的是日期类型，进行特别处理
//                    FastDateFormat df = FastDateFormat.getInstance("yyyy-MM-dd HH:mm:ss");
                    params.addValue(columnName.toUpperCase(), value, Types.DATE);
                } else {
                    // 普通的值，通过parseParamValue处理一下，比如有like的情况，需要把值加上%。
                    params.addValue(columnName.toUpperCase(), value);
                }
            }
        } catch (ParseException e) {
            throw new IllegalArgumentException("生成SQL的查询条件失败！值转换为日期类失败 : " + e.getMessage(), e);
        }
        return params;
    }

    /**
     * 转换值。主要是增加like操作符。是以'某内容'开始，还是以'某内容'结束。就是“%”加在前面还是后面。
     * <p>
     * 针对带表达式的处理（例如：权限校验里面的）<br/>
     * 1. 默认可用的值对象，就是GaeaDefaultDsContext。（无关DataSetCommonQueryConditionDTO）
     * </p>
     *
     * @param cond
     * @param defaultDsContext
     * @return
     */
    private Object parseParamValue(QueryCondition cond, GaeaDefaultDsContext defaultDsContext) throws ParseException {
        String value = cond.getPropValue();
        if (StringUtils.isEmpty(value)) {
            // 如果是多值，即IN查询，直接返回值
            if (CollectionUtils.isNotEmpty(cond.getPropValues())) {
                return cond.getPropValues();
            }
            // 返回null是为了方便调用方法判断
            return null;
        }
        /**
         * 检查值是否有SPEL表达式。如果有，则先转换为正常静态值
         */
//        Map contextMap = new HashMap();
//        contextMap.put("gaea_value", cond.getPropValue());
//        value = "#{#gaea_value-1}";
        if (gaeaSqlExpressionParser.hasExpression(value)) {
//            value = gaeaSqlExpressionParser.parse(value, defaultDsContext);
            try {
                value = gaeaSqlExpressionParser.parse(value, defaultDsContext, cond.getValueElContextMap());
            } catch (Exception e) {
                e.printStackTrace();
            }
        }
        /**
         * 对特殊关系操作符的处理。
         * 例如：like，需要加上前后模糊查询符等。
         */
        if (QueryCondition.FIELD_OP_LK.equalsIgnoreCase(cond.getOp())) {
            value = "%" + value + "%";
        } else if (QueryCondition.FIELD_OP_LLK.equalsIgnoreCase(cond.getOp())) {
            value = value + "%";
        } else if (QueryCondition.FIELD_OP_RLK.equalsIgnoreCase(cond.getOp())) {
            value = "%" + value;
        }
        /**
         * 根据QueryCondition的数据类型，转换数据的值
         * 例如：日期类的转换为Date类型。
         */
        if (SchemaColumn.DATA_TYPE_DATE.equalsIgnoreCase(cond.getDataType())) {// 如果XML SCHEMA定义的是日期类型，进行特别处理
            FastDateFormat df = FastDateFormat.getInstance("yyyy-MM-dd");
            return df.parse(value);
        } else if (SchemaColumn.DATA_TYPE_DATETIME.equalsIgnoreCase(cond.getDataType())) {// 如果XML SCHEMA定义的是日期类型，进行特别处理
            FastDateFormat df = FastDateFormat.getInstance("yyyy-MM-dd HH:mm:ss");
            return df.parse(value);
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

    /**
     * 最终执行查询的方法。没有什么其他的数据组装逻辑。
     *
     * @param sql
     * @param params
     * @param primaryTable
     * @param page            可以为空。为空表示查询不设数量限制。
     * @return
     * @throws InvalidDataException
     */
    private PageResult query(String sql, MapSqlParameterSource params, String primaryTable, SchemaGridPage page) throws InvalidDataException {
//        MySQL56InnoDBDialect dialect = new MySQL56InnoDBDialect();
        PageResult pageResult = new PageResult();
        /* 拼凑【COUNT】语句 */
        String countSQL = new SQL().
                SELECT("count(*)")
                .FROM("(" + sql + ") results")
                .toString();
        // debug
        if (logger.isDebugEnabled()) {
            logger.debug("Count SQL:" + countSQL);
            logger.debug(MessageFormat.format("\nquery SQL:\n{0}\nparams:\n{1}", sql, params.getValues()));
        }
        // 查询记录数
        int total = namedParameterJdbcTemplate.queryForObject(countSQL, params, Integer.class);

        List<Map<String, Object>> content = new ArrayList<Map<String, Object>>();
        // 如果给定的页码值是Integer.Max_VALUE，则认为是不需要查内容
        if (page != null && page.getPage() < Integer.MAX_VALUE) {
            int startPos = (page.getPage() - 1) * page.getSize();
            int pageSize = page.getSize();
            if (total > 0) {
                // 获取分页sql
                String limitedSQL = gaeaDataBase.getPageSql(sql, primaryTable, startPos, pageSize);
                if (logger.isDebugEnabled()) {
                    logger.debug("Page SQL:" + limitedSQL);
                }
                params.addValue("START_ROWNUM", startPos);
                params.addValue("PAGE_SIZE", pageSize);
                // 查询数据
                content = namedParameterJdbcTemplate.queryForList(limitedSQL, params);
            }
            // 回写分页相关信息
            pageResult.setPage(page.getPage());
            pageResult.setSize(page.getSize());
        } else {
            content = namedParameterJdbcTemplate.queryForList(sql, params);
        }

        pageResult.setContent(content);
        pageResult.setTotalElements(total);
        return pageResult;
    }

    /**
     * 获取最终的SQL。看是否需要拼order by，group by等。
     * 还有看有没有#where表达式，有就
     *
     * @param sql
     * @param whereCause
     * @param orderBy
     * @param groupBy
     * @return
     */
    private String toSql(String sql, String whereCause, OrderBy orderBy, GroupBy groupBy) {
//        StringBuilder sqlBuilder = new StringBuilder(sql);
        SQL sqlCriteria = new SQL();
        sqlCriteria.SELECT("*").FROM(sql, "subQuery");
        // 如果有where 且 必须没有#{#where} SPEL表达式，则把sql再包一层子查询
        // 如果有SPEL where表达式，会导致有两个where条件
        if (StringUtils.isNotEmpty(whereCause) && !gaeaSqlExpressionParser.hasExpression(sql, GaeaSpelKeywordDefinition.SQL_WHERE)) {
            sqlCriteria.WHERE(whereCause);
//            sqlBuilder.append(" WHERE ").append(whereCause);
        }
        if (groupBy != null && StringUtils.isNotEmpty(groupBy.getValue())) {
            sqlCriteria.GROUP_BY(groupBy.getValue());
//            sqlBuilder.append(" GROUP BY ").append(groupBy.getValue());
        }
        if (orderBy != null && StringUtils.isNotEmpty(orderBy.getValue())) {
            sqlCriteria.ORDER_BY(orderBy.getValue());
//            sqlBuilder.append(" ORDER BY ").append(orderBy.getValue());
        }
        return sqlCriteria.toString();
//        return sqlBuilder.toString();
    }

//    private String parsePlaceHolder(String sql, ConditionSet conditionSet, DataSetCommonQueryConditionDTO queryConditionDTO) throws ValidationFailedException {
//        List<QueryCondition> newConditions = getConditions(conditionSet, queryConditionDTO);// 按通用查询组装标准查询对象
//        return parsePlaceHolder(sql, newConditions);
//    }

    /**
     * 转换SQL里面的相关占位符。主要是把newConditions转换为属性值，去替换SQL里面的占位符。占位符使用spel表达式。
     * @param sql
     * @param newConditions
     * @return
     * @throws ValidationFailedException
     */
//    private String parsePlaceHolder(String sql, List<QueryCondition> newConditions) throws ValidationFailedException {
//        if (CollectionUtils.isNotEmpty(newConditions)) {
//            for (QueryCondition cond : newConditions) {
//                    String placeholderName = cond.getPlaceholder();
//                    String fullPlaceholder = PLACEHOLDER_PREFIX + placeholderName;
////                String columnName = cond.getPropName();
//                // 查询条件，变量名或值为空就略过
////                if (StringUtils.isEmpty(columnName)) {
////                    continue;
////                }
//                StringBuffer conditionSql = new StringBuffer();
////                // 如果condOp为空，默认就当AND处理。正常应该是不会的。因为condOp是XML元素名。
//                String op = parseCondOp(cond);
//                conditionSql.append(op);
//                /**
//                 * 拼凑查询条件.
//                 * if 关系符是 eq/neq( is null / is not null)这类查询, 直接用操作符。例如：
//                 *      username is not null
//                 * else
//                 *      username = :USER_NAME
//                 */
//                conditionSql.append(parseCondition(cond));
//                /**
//                 * if 没有placeholder,或者placeholder找不到
//                 *      直接加上条件SQL即可
//                 * else
//                 *      把条件SQL配置项
//                 *      （例如：<or field="auth.id" op="ne" placeholder="AUTH_ID_NOT_EQ">）
//                 *      转换后的SQL替换掉placeholder的位置。
//                 */
//                    if (StringUtils.isNotEmpty(placeholderName) && StringUtils.contains(sql, fullPlaceholder)) {
////                appendSql += conditionSql;
////                    } else {
//                        sql = StringUtils.replace(sql, fullPlaceholder, conditionSql.toString());
//                    }
//            }
////            whereSql.append(appendSql);
//        }
//        return sql;
//    }

    /**
     * 把条件集转换为可以为SPEL调用的变量，放到contextMap中。这样SQL表达式就可以直接用了。
     *
     * @param newConditions
     * @param contextMap
     * @throws ValidationFailedException
     */
    private void setPlaceholderContext(List<QueryCondition> newConditions, Map contextMap) throws ValidationFailedException {

        if (CollectionUtils.isNotEmpty(newConditions)) {
            for (QueryCondition cond : newConditions) {
                String placeholderName = cond.getPlaceholder();
                if (StringUtils.isEmpty(placeholderName)) {
                    continue;
                }
                if (StringUtils.containsAny(placeholderName, "#")) {
                    throw new ValidationFailedException("查询语句中，place-holder不允许包含特殊字符'#'. ");
                }
                StringBuffer conditionSql = new StringBuffer();
                // 如果condOp为空，默认就当AND处理。正常应该是不会的。因为condOp是XML元素名。
                String op = parseCondOp(cond);
                conditionSql.append(op);
                /**
                 * 拼凑查询条件.
                 * if 关系符是 eq/neq( is null / is not null)这类查询, 直接用操作符。例如：
                 *      username is not null
                 * else
                 *      username = :USER_NAME
                 */
                conditionSql.append(parseCondition(cond));
                // 以placeholderName作为名，放到SPEL的上下文对象中去使用
                contextMap.put(placeholderName, conditionSql.toString());
            }
        }
    }

    /**
     * 获取额外的上下文数据。因为SQL中会有很多SPEL表达式引用，这些引用的动态变量，例如查询条件等，在这里被处理并放入上下文中供调用。
     *
     * @param whereCause
     * @param conditionSet
     * @param queryConditionDTO
     * @return
     * @throws ValidationFailedException
     */
    private Map getExtraContext(StringBuilder whereCause, ConditionSet conditionSet, DataSetCommonQueryConditionDTO queryConditionDTO) throws ValidationFailedException {
        List<QueryCondition> newConditions = getConditions(conditionSet, queryConditionDTO);// 按通用查询组装标准查询对象
        return getExtraContext(whereCause, newConditions);
    }

    /**
     * 获取查询需要的一些额外的属性，作为SPEL表达式所需的参数。
     *
     * @param whereCause
     * @return
     */
    private Map getExtraContext(StringBuilder whereCause, List<QueryCondition> newConditions) throws ValidationFailedException {
        Map contextMap = new HashMap();
        if (StringUtils.isNotEmpty(whereCause)) {
            whereCause.insert(0, " WHERE ");
        }
        contextMap.put(GaeaSpelKeywordDefinition.SQL_WHERE, whereCause);
        // 把某些条件转换为上下文参数，可以供嵌入SQL不同位置（基于place-holder配置）
        setPlaceholderContext(newConditions, contextMap);
        return contextMap;
    }
}
