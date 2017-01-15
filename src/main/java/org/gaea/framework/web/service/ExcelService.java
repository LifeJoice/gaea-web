package org.gaea.framework.web.service;

import org.gaea.data.domain.DataSetCommonQueryConditionDTO;
import org.gaea.exception.SysInitException;
import org.gaea.exception.SysLogicalException;
import org.gaea.exception.ValidationFailedException;
import org.gaea.framework.web.data.GaeaDefaultDsContext;

import java.util.List;
import java.util.Map;

/**
 * Created by iverson on 2016/11/25.
 */
public interface ExcelService {
    List<Map<String, Object>> queryByConditions(String schemaId, String datasetId, String excelTemplateId, GaeaDefaultDsContext defaultDsContext) throws ValidationFailedException, SysLogicalException, SysInitException;

    List<Map<String, Object>> queryByConditions(String schemaId, String datasetId, String excelTemplateId, GaeaDefaultDsContext defaultDsContext, DataSetCommonQueryConditionDTO queryConditionDTO) throws ValidationFailedException, SysLogicalException, SysInitException;
}
