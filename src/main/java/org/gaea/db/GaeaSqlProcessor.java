package org.gaea.db;

import org.apache.commons.lang3.StringUtils;
import org.gaea.db.dialect.MySQL56InnoDBDialect;
import org.gaea.db.ibatis.jdbc.SQL;
import org.gaea.framework.web.schema.GaeaSchemaCache;
import org.gaea.framework.web.schema.domain.PageResult;
import org.gaea.framework.web.schema.domain.SchemaGridPage;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageImpl;
import org.springframework.data.domain.PageRequest;
import org.springframework.jdbc.core.namedparam.MapSqlParameterSource;
import org.springframework.jdbc.core.namedparam.NamedParameterJdbcTemplate;
import org.springframework.stereotype.Component;

import javax.sql.DataSource;
import java.text.MessageFormat;
import java.util.ArrayList;
import java.util.HashMap;
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

    public PageResult query(String sql, List<QueryCondition> conditions, SchemaGridPage page){
        PageResult pageResult = new PageResult();
        MySQL56InnoDBDialect dialect = new MySQL56InnoDBDialect();
        /* 拼凑【WHERE】条件语句 */
        String whereCause = genWhereString(conditions);
        if(StringUtils.isNotEmpty(whereCause)){
            sql = sql + " WHERE " + whereCause;
        }
        /* 拼凑【COUNT】语句 */
        String countSQL = new SQL().
            SELECT("count(*)")
                .FROM("("+sql+") results")
        .toString();
        // 查询记录数
        int total = namedParameterJdbcTemplate.queryForObject(countSQL, new MapSqlParameterSource(), Integer.class);

        List<Map<String, Object>> content = new ArrayList<Map<String, Object>>();
        // 如果给定的页码值是Integer.Max_VALUE，则认为是不需要查内容
        if (page.getPage() < Integer.MAX_VALUE) {
            int startPos = (page.getPage()-1) * page.getSize()+1;
            int pageSize = page.getSize();
//            Boolean autoFixPageNum = (Boolean) getExtractParams().get(AUTO_FIX_PAGE_NUM);
//            if (autoFixPageNum != null && autoFixPageNum && startPos > total) {
//                startPos = 0;
//                setPageable(new PageRequest(0, pageSize));
//            }
            if (total > 0) {
                String limitedSQL = dialect.getPageSql(sql, startPos, pageSize);
                if (log.isDebugEnabled()) {
                    log.debug("Page SQL:" + limitedSQL);
                }
                Map<String,Object> paramMap = new HashMap<String, Object>();
                paramMap.put("START_ROWNUM",startPos);;
                paramMap.put("PAGE_SIZE",pageSize);
                // 查询数据
                content = namedParameterJdbcTemplate.queryForList(limitedSQL, paramMap);
//            } else {
//                content = new ArrayList<Map<String, Object>>();
        }
//        } else {
//            content = new ArrayList<Map<String, Object>>();
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
     * 根据查询条件，拼凑SQL的WHERE语句（不包含WHERE关键字）。
     * @param conditions
     * @return
     */
    private String genWhereString(List<QueryCondition> conditions){
        if(conditions==null || conditions.isEmpty()){
            return "";
        }
        StringBuilder whereSql = new StringBuilder("");
        for(QueryCondition cond:conditions){
            String columnName = cond.getPropertyName();
            String value = cond.getValue();
            // 查询条件，变量名或值为空就略过
            if(StringUtils.isEmpty(columnName)||StringUtils.isEmpty(value)){
                continue;
            }
            if(StringUtils.isNotEmpty(whereSql.toString())){
                whereSql.append(" AND ");
            }
            whereSql.append(MessageFormat.format("{0} = {1}",columnName.toUpperCase(),"'"+value+"'"));
        }
        return whereSql.toString();
    }

//    List<Map<String, Object>> content = jdbcTemplate.queryForList(sql, getExtractParams());
//    return new PageImpl<Map<String, Object>>(caseInsensitiveMap(content), new PageRequest(0, Integer.MAX_VALUE),
//    content.size());
//    }
}
