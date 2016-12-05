package org.gaea.framework.web.service;

import org.gaea.data.domain.DataSetCommonQueryConditionDTO;
import org.gaea.db.QueryCondition;
import org.gaea.exception.SysInitException;
import org.gaea.exception.SysLogicalException;
import org.gaea.exception.ValidationFailedException;
import org.gaea.framework.web.schema.domain.DataSet;
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

//    List<Map<String, Object>> queryByConditions(String schemaId, String datasetId, DataSetCommonQueryConditionDTO queryConditionDTO, String excelTemplateId) throws ValidationFailedException, SysLogicalException, SysInitException;

    List<Map<String, Object>> queryByConditions(String schemaId, String datasetId, DataSetCommonQueryConditionDTO queryConditionDTO) throws ValidationFailedException, SysLogicalException;

    List<Map<String, Object>> queryByConditions(DataSet dataSet, DataSetCommonQueryConditionDTO queryConditionDTO) throws ValidationFailedException, SysLogicalException;
}
