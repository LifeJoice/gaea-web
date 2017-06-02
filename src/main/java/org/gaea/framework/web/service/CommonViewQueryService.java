package org.gaea.framework.web.service;

import org.gaea.data.dataset.domain.GaeaDataSet;
import org.gaea.data.domain.DataSetCommonQueryConditionDTO;
import org.gaea.db.QueryCondition;
import org.gaea.exception.*;
import org.gaea.framework.web.data.GaeaDefaultDsContext;
import org.gaea.framework.web.schema.domain.DataSet;
import org.gaea.framework.web.schema.domain.GaeaXmlSchema;
import org.gaea.framework.web.schema.domain.PageResult;
import org.gaea.framework.web.schema.domain.SchemaGridPage;

import java.util.List;
import java.util.Map;

/**
 * Created by Iverson on 2015/8/17.
 */
public interface CommonViewQueryService {
    PageResult query(GaeaXmlSchema gaeaXml, List<QueryCondition> filters,
                     SchemaGridPage page, String loginName) throws ValidationFailedException, SysLogicalException, InvalidDataException, SysInitException;

    PageResult query(String schemaId, List<QueryCondition> filters,
                     SchemaGridPage page, String loginName) throws ValidationFailedException, SysLogicalException, InvalidDataException, SysInitException;

//    List<Map<String, Object>> queryByConditions(String schemaId, String datasetId, DataSetCommonQueryConditionDTO queryConditionDTO, String excelTemplateId) throws ValidationFailedException, SysLogicalException, SysInitException;

    PageResult query(GaeaDataSet gaeaDataSet, List<QueryCondition> conditions, SchemaGridPage page, String loginName) throws ValidationFailedException, InvalidDataException, SystemConfigException;

    List<Map<String, Object>> queryByConditions(String schemaId, String datasetId, GaeaDefaultDsContext defaultDsContext, DataSetCommonQueryConditionDTO queryConditionDTO, boolean isDsTranslate) throws ValidationFailedException, SysLogicalException, SysInitException;

    List<Map<String, Object>> queryByConditions(DataSet dataSet, DataSetCommonQueryConditionDTO queryConditionDTO, GaeaDefaultDsContext defaultDsContext) throws ValidationFailedException, SysLogicalException;
}
