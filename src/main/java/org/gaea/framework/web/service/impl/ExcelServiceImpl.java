package org.gaea.framework.web.service.impl;

import org.gaea.data.domain.DataSetCommonQueryConditionDTO;
import org.gaea.exception.SysInitException;
import org.gaea.exception.SysLogicalException;
import org.gaea.exception.ValidationFailedException;
import org.gaea.framework.web.data.GaeaDefaultDsContext;
import org.gaea.framework.web.schema.service.SchemaDataService;
import org.gaea.framework.web.service.CommonViewQueryService;
import org.gaea.framework.web.service.ExcelService;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

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

    @Override
    public List<Map<String, Object>> queryByConditions(String schemaId, String datasetId, String excelTemplateId, GaeaDefaultDsContext defaultDsContext) throws ValidationFailedException, SysLogicalException, SysInitException {
        return queryByConditions(schemaId, datasetId, excelTemplateId, defaultDsContext, null);
    }

    @Override
    public List<Map<String, Object>> queryByConditions(String schemaId, String datasetId, String excelTemplateId, GaeaDefaultDsContext defaultDsContext, DataSetCommonQueryConditionDTO queryConditionDTO) throws ValidationFailedException, SysLogicalException, SysInitException {
        List<Map<String, Object>> newDataList = commonViewQueryService.queryByConditions(schemaId, datasetId, null, queryConditionDTO);
        // 对查询数据作处理，例如，把数据库字段名改一改等，再返回
        return schemaDataService.transformViewData(newDataList, excelTemplateId);
    }
}
