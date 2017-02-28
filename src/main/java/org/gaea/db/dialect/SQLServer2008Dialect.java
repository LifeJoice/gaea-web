package org.gaea.db.dialect;

import org.gaea.db.ibatis.jdbc.SQL;
import org.gaea.db.service.GaeaDataBaseCommonService;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;

/**
 * <b>dialect是针对特定数据库的方言的翻译器。</b>
 * <p>例如：<br/>
 * 像分页，SQL SERVER可能是用top 20。Oracle可能是用rownum。这是特定数据库都不一样的。</p>
 * <p>
 *     所以，这可能会是一个比较混杂的类。因为不准备像Hibernate那样，在跨数据库上做太多。所以在数据库方言这块，目前的设计会比较简单些。
 * </p>
 * Created by Iverson on 2015/9/24.
 */
@Service
public class SQLServer2008Dialect implements GaeaDataBaseCommonService{
    private final Logger logger = LoggerFactory.getLogger(SQLServer2008Dialect.class);

    public String getPageSql(final String sql, String primaryTable, int startPos, int pageSize) {
        // 写完未测试。
        String pageSql = new SQL(){{
            SELECT("*");
            FROM("("+
                    new SQL(){{
                        SELECT("row_number () OVER (ORDER BY id) row_num_ ,*");
                        FROM("("+sql+") rs1");
                    }}.toString()+
                    ") rs11");
            WHERE("row_num_ <=:END_ROWNUM");
            WHERE("row_num_ >:START_ROWNUM");
        }}.toString();
        return pageSql;
    }
}
