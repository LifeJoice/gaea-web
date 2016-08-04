package org.gaea.db;

import org.apache.commons.lang3.StringUtils;
import org.apache.commons.lang3.time.FastDateFormat;
import org.gaea.db.dialect.MySQL56InnoDBDialect;
import org.gaea.db.ibatis.jdbc.SQL;
import org.gaea.exception.InvalidDataException;
import org.gaea.exception.ValidationFailedException;
import org.gaea.framework.web.schema.GaeaSchemaCache;
import org.gaea.framework.web.schema.domain.PageResult;
import org.gaea.framework.web.schema.domain.SchemaGridPage;
import org.gaea.framework.web.schema.domain.view.SchemaColumn;
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
    final Logger log = LoggerFactory.getLogger(this.getClass());
    private NamedParameterJdbcTemplate namedParameterJdbcTemplate;
    @Autowired
    private GaeaSchemaCache gaeaSchemaCache;

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
                if (log.isDebugEnabled()) {
                    log.debug("Page SQL:" + limitedSQL);
                }
                params.addValue("START_ROWNUM", startPos);
                params.addValue("PAGE_SIZE", pageSize);
                // 查询数据
                content = namedParameterJdbcTemplate.queryForList(limitedSQL, params);
            }
        }

        if (log.isDebugEnabled()) {
            log.debug("Count SQL:" + countSQL);
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
     * @param conditions
     * @return
     */
    public List<Map<String, Object>> query(String sql, List<QueryCondition> conditions) throws ValidationFailedException {
        MapSqlParameterSource params = null;
        /* 拼凑【WHERE】条件语句 */
        String whereCause = genWhereString(conditions);
        params = conditions == null ? new MapSqlParameterSource() : genWhereParams(conditions);
        if (StringUtils.isNotEmpty(whereCause)) {
            sql = sql + " WHERE " + whereCause;
        }
        log.debug(MessageFormat.format("\nquery SQL:\n{0}\nparams:\n{1}", sql, params.getValues()));

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
             * username = :USER_NAME
             * {0} 字段名 {1} sql比较符 {2} Spring namedParameterJdbcTemplate的sql占位符
             */
            whereSql.append(MessageFormat.format("{0} {1} :{2}", columnName.toUpperCase(), parseFieldOp(cond.getOp()), columnName.toUpperCase()));
        }
        return whereSql.toString();
    }

    /**
     * 把页面传过来的(一般情况是)条件操作符(eq,ne,...)转换成sql的条件操作符(=,!=,...).
     *
     * @param op 页面传来的操作符
     * @return
     * @throws ValidationFailedException
     */
    public String parseFieldOp(String op) throws ValidationFailedException {
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
        } else {
            throw new ValidationFailedException(MessageFormat.format("配置的sql操作符无法解析！op={0}", op));
        }
        return sqlOp;
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

//    List<Map<String, Object>> content = jdbcTemplate.queryForList(sql, getExtractParams());
//    return new PageImpl<Map<String, Object>>(caseInsensitiveMap(content), new PageRequest(0, Integer.MAX_VALUE),
//    content.size());
//    }
}
