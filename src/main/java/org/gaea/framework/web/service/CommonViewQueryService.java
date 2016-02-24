package org.gaea.framework.web.service;

import org.gaea.db.QueryCondition;
import org.gaea.exception.SysLogicalException;
import org.gaea.exception.ValidationFailedException;
import org.gaea.framework.web.schema.domain.PageResult;
import org.gaea.framework.web.schema.domain.SchemaGridPage;

import java.util.List;
import java.util.Map;

/**
 * Created by Iverson on 2015/8/17.
 */
public interface CommonViewQueryService {
    PageResult query(String schemaId, List<QueryCondition> filters,
                     SchemaGridPage page, boolean translate) throws ValidationFailedException, SysLogicalException;
}
