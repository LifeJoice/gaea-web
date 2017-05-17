package org.gaea.framework.web.service;

import org.gaea.data.domain.DataSetCommonQueryConditionDTO;
import org.gaea.exception.*;
import org.gaea.framework.web.data.GaeaDefaultDsContext;
import org.gaea.poi.domain.Field;
import org.springframework.util.LinkedCaseInsensitiveMap;

import javax.servlet.http.HttpServletResponse;
import java.util.List;
import java.util.Map;

/**
 * Created by iverson on 2016/11/25.
 */
public interface ExcelService {
    List<Map<String, Object>> queryByConditions(String schemaId, String datasetId, String excelTemplateId, GaeaDefaultDsContext defaultDsContext) throws ValidationFailedException, SysLogicalException, SysInitException;

    List<Map<String, Object>> queryByConditions(String schemaId, String datasetId, String excelTemplateId, GaeaDefaultDsContext defaultDsContext, DataSetCommonQueryConditionDTO queryConditionDTO) throws ValidationFailedException, SysLogicalException, SysInitException;

    void export(List<LinkedCaseInsensitiveMap> data, Map<String, Field> fieldDefMap, String fileName, HttpServletResponse response) throws ValidationFailedException, InvalidDataException, ProcessFailedException;
}
