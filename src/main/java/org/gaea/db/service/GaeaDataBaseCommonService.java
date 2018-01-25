package org.gaea.db.service;

import org.gaea.db.QueryCondition;
import org.gaea.exception.InvalidDataException;

/**
 * Created by iverson on 2017/2/14.
 */
public interface GaeaDataBaseCommonService {
    String getPageSql(String sql, String primaryTable, int startPos, int pageSize) throws InvalidDataException;

    String parseDateTimeCondition(QueryCondition condition);
}
