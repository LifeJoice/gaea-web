package org.gaea.framework.web.schema.service.impl;

import org.apache.commons.collections.CollectionUtils;
import org.gaea.exception.SysInitException;
import org.gaea.exception.SysLogicalException;
import org.gaea.exception.ValidationFailedException;
import org.gaea.framework.web.schema.GaeaSchemaCache;
import org.gaea.framework.web.schema.GaeaXmlSchemaProcessor;
import org.gaea.framework.web.schema.SystemCacheFactory;
import org.gaea.framework.web.schema.domain.DataSet;
import org.gaea.framework.web.schema.domain.view.SchemaColumn;
import org.gaea.framework.web.schema.domain.view.SchemaGrid;
import org.gaea.framework.web.schema.service.SchemaDataService;
import org.gaea.framework.web.schema.utils.GaeaExcelUtils;
import org.gaea.poi.domain.Block;
import org.gaea.poi.domain.ExcelTemplate;
import org.gaea.poi.domain.Field;
import org.gaea.poi.domain.Sheet;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.Map;

/**
 * Created by Iverson on 2015/10/16.
 */
@Service
public class SchemaDataServiceImpl implements SchemaDataService {

    private final Logger logger = LoggerFactory.getLogger(SchemaDataServiceImpl.class);

    @Autowired
    private GaeaSchemaCache gaeaSchemaCache;
    @Autowired
    private GaeaXmlSchemaProcessor gaeaXmlSchemaProcessor;

    /**
     * 根据XML Schema的View.Grid.Column对数据进行二次处理。
     * 例如：把数据库列名改为别名等。
     *
     * @param origResults
     * @param grid
     * @return
     * @throws SysLogicalException
     * @throws ValidationFailedException
     */
    @Override
    public List<Map<String, Object>> transformViewData(List<Map<String, Object>> origResults, SchemaGrid grid) throws SysLogicalException, ValidationFailedException {
        List<Map<String, Object>> result = gaeaXmlSchemaProcessor.changeDbColumnNameInData(origResults, grid);
        return result;
    }

    /**
     * 根据XML Excel Template定义，对查询的数据结果进行二次处理。数据清洗。
     * 例如：把数据库列名改为别名等。
     *
     * @param origResults
     * @param excelTemplateId
     * @return
     * @throws SysLogicalException
     * @throws ValidationFailedException
     * @throws SysInitException
     */
    @Override
    public List<Map<String, Object>> transformViewData(List<Map<String, Object>> origResults, String excelTemplateId) throws SysLogicalException, ValidationFailedException, SysInitException {
        ExcelTemplate excelTemplate = SystemCacheFactory.getExcelTemplate(excelTemplateId);
        Map<String, Field> fieldMap = null;
        /**
         * 获取field map
         */
        if (CollectionUtils.isNotEmpty(excelTemplate.getExcelSheetList())) {
            // 当前默认只支持一个sheet
            Sheet gaeaSheet = excelTemplate.getExcelSheetList().get(0);
            if (gaeaSheet != null && CollectionUtils.isNotEmpty(gaeaSheet.getBlockList())) {
                // 当前只支持一个block
                Block gaeaBlock = gaeaSheet.getBlockList().get(0);
                fieldMap = gaeaBlock.getFieldMap();
            }
        }
        Map<String, SchemaColumn> columnMap = GaeaExcelUtils.getDbNameColumnMap(fieldMap);
        List<Map<String, Object>> result = gaeaXmlSchemaProcessor.changeDbColumnNameInData(origResults, columnMap, true);
        return result;
    }
}
