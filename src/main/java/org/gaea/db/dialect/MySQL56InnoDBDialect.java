package org.gaea.db.dialect;

import org.gaea.db.ibatis.jdbc.SQL;

/**
 * <b>dialect是针对特定数据库的方言的翻译器。</b>
 * <p>
 *     例如：<br/>
 *     像分页，SQL SERVER可能是用top 20。Oracle可能是用rownum。这是特定数据库都不一样的。
 * </p>
 * <p>
 *     所以，这可能会是一个比较混杂的类。因为不准备像Hibernate那样，在跨数据库上做太多。所以在数据库方言这块，目前的设计会比较简单些。
 * </p>
 * Created by Iverson on 2015/9/24.
 */
public class MySQL56InnoDBDialect {
    public String getPageSql(final String sql, int startPos, int pageSize) {
        String newSql = new SQL(){{
            SELECT("*");
            FROM("("+sql+") rs1");
            WHERE("id>:START_ROWNUM");
            ORDER_BY("id asc limit :PAGE_SIZE");
        }}.toString();
        return newSql;
    }
}
