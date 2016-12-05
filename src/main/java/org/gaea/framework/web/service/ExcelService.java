package org.gaea.framework.web.service;

import org.gaea.data.domain.DataSetCommonQueryConditionDTO;
import org.gaea.exception.SysInitException;
import org.gaea.exception.SysLogicalException;
import org.gaea.exception.ValidationFailedException;

import java.util.List;
import java.util.Map;

/**
 * Created by iverson on 2016/11/25.
 */
public interface ExcelService {
    List<Map<String, Object>> queryByConditions(String schemaId, String datasetId, DataSetCommonQueryConditionDTO queryConditionDTO, String excelTemplateId) throws ValidationFailedException, SysLogicalException, SysInitException;
}
