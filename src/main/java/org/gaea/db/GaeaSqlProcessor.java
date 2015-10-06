package org.gaea.db;

import org.gaea.db.dialect.MySQL56InnoDBDialect;
import org.gaea.db.ibatis.jdbc.SQL;
import org.gaea.framework.web.schema.GaeaSchemaCache;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageImpl;
import org.springframework.data.domain.Pageable;
import org.springframework.jdbc.core.namedparam.MapSqlParameterSource;
import org.springframework.jdbc.core.namedparam.NamedParameterJdbcTemplate;
import org.springframework.stereotype.Component;

import javax.sql.DataSource;
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

    public Page<?> query(final String sql,List<QueryCondition> conditions,Pageable pageable){
        MySQL56InnoDBDialect dialect = new MySQL56InnoDBDialect();
        String countSQL = new SQL(){{
            SELECT("count(*)");
            FROM("("+sql+") results");
        }}.toString();
        // 查询记录数
        int total = namedParameterJdbcTemplate.queryForObject(countSQL, new MapSqlParameterSource(), Integer.class);

        List<Map<String, Object>> content = new ArrayList<Map<String, Object>>();
        // 如果给定的页码值是Integer.Max_VALUE，则认为是不需要查内容
        if (pageable.getPageNumber() < Integer.MAX_VALUE) {
            int startPos = (pageable.getPageNumber()-1) * pageable.getPageSize();
            int pageSize = pageable.getPageSize();
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
        return new PageImpl<Map<String, Object>>(content, pageable, total);
    }

//    List<Map<String, Object>> content = jdbcTemplate.queryForList(sql, getExtractParams());
//    return new PageImpl<Map<String, Object>>(caseInsensitiveMap(content), new PageRequest(0, Integer.MAX_VALUE),
//    content.size());
//    }
}
