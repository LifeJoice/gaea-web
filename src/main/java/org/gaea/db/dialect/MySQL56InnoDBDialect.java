package org.gaea.db.dialect;

import org.apache.commons.lang3.StringUtils;
import org.gaea.db.ibatis.jdbc.SQL;
import org.gaea.db.service.GaeaDataBaseCommonService;
import org.gaea.exception.InvalidDataException;
import org.springframework.stereotype.Service;

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
@Service
public class MySQL56InnoDBDialect implements GaeaDataBaseCommonService{
    /**
     * 获取分页的SQL。
     * @param sql 基础的数据查询sql
     * @param primaryTable 分页相关的id的主表。主要用于获取id来协助分页。
     * @param startPos 开始位置。获取数据从startPos+1那条开始。
     * @param pageSize
     * @return
     * @throws InvalidDataException
     */
    public String getPageSql(final String sql,String primaryTable, int startPos, int pageSize) throws InvalidDataException {
        if(StringUtils.isEmpty(primaryTable)){
            throw new InvalidDataException("主表为空，无法构造分页SQL。可能情况：数据集的配置缺失等。");
        }
        // MySQL的分页子查询，先获取id
        SQL selectIdSql = new SQL();
        selectIdSql.SELECT("id").FROM(primaryTable).ORDER_BY("id limit :START_ROWNUM,1");

        String newSql = new SQL()
            .SELECT("*")
            .FROM("("+sql+") rs1")
            .WHERE("id>=("+selectIdSql.toString()+")")
            .ORDER_BY("id asc limit :PAGE_SIZE")
        .toString();
        return newSql;
    }
}
