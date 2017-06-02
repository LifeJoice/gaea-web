package org.gaea.framework.web.service.impl;

import org.gaea.data.domain.DataSetCommonQueryConditionDTO;
import org.gaea.exception.*;
import org.gaea.framework.web.common.CommonDefinition;
import org.gaea.framework.web.config.SystemProperties;
import org.gaea.framework.web.data.GaeaDefaultDsContext;
import org.gaea.framework.web.schema.service.SchemaDataService;
import org.gaea.framework.web.service.CommonViewQueryService;
import org.gaea.framework.web.service.ExcelService;
import org.gaea.framework.web.utils.GaeaWebUtils;
import org.gaea.poi.domain.Field;
import org.gaea.poi.export.ExcelExport;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.util.LinkedCaseInsensitiveMap;

import javax.servlet.http.HttpServletResponse;
import java.io.*;
import java.util.List;
import java.util.Map;

/**
 * Excel导出导入之类的通用操作。
 * 核心的出来还是封装在Gaea POI。这里是也业务系统更密切的一些东西。
 * Created by iverson on 2016/11/25.
 */
@Service
public class ExcelServiceImpl implements ExcelService {
    private final Logger logger = LoggerFactory.getLogger(ExcelServiceImpl.class);
    @Autowired
    private CommonViewQueryService commonViewQueryService;
    @Autowired
    private SchemaDataService schemaDataService;
    @Autowired
    private ExcelExport excelExport;

    @Override
    public List<Map<String, Object>> queryByConditions(String schemaId, String datasetId, String excelTemplateId, GaeaDefaultDsContext defaultDsContext) throws ValidationFailedException, SysLogicalException, SysInitException {
        return queryByConditions(schemaId, datasetId, excelTemplateId, defaultDsContext, null);
    }

    @Override
    public List<Map<String, Object>> queryByConditions(String schemaId, String datasetId, String excelTemplateId, GaeaDefaultDsContext defaultDsContext, DataSetCommonQueryConditionDTO queryConditionDTO) throws ValidationFailedException, SysLogicalException, SysInitException {
        // 默认需要对结果的每个字段做数据集转换
        List<Map<String, Object>> newDataList = commonViewQueryService.queryByConditions(schemaId, datasetId, null, queryConditionDTO, true);
        // 对查询数据作处理，例如，把数据库字段名改一改等，再返回
        return schemaDataService.transformViewData(newDataList, excelTemplateId);
    }

    @Override
    public void export(List<LinkedCaseInsensitiveMap> data, Map<String, Field> fieldDefMap, String fileName, HttpServletResponse response) throws ValidationFailedException, InvalidDataException, ProcessFailedException {
        if (data == null) {
            logger.trace("传入data为空，无法执行导出！");
            return;
        }
        File file = excelExport.export(data, "", fieldDefMap, "", SystemProperties.get(CommonDefinition.PROP_KEY_EXCEL_BASE_DIR));
        GaeaWebUtils.writeFileToResponse(file, response);
    }
}
