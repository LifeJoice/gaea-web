package org.gaea.framework.web.service;

import org.gaea.db.QueryCondition;
import org.gaea.framework.common.exception.SysLogicalException;
import org.gaea.framework.common.exception.ValidationFailedException;
import org.springframework.data.domain.Pageable;

import java.util.List;
import java.util.Map;

/**
 * Created by Iverson on 2015/8/17.
 */
public interface CommonViewQueryService {
    List<Map<String, Object>> query(String urSchemaId, List<QueryCondition> filters,
                                    Pageable pageable, boolean translate) throws ValidationFailedException, SysLogicalException;
}
