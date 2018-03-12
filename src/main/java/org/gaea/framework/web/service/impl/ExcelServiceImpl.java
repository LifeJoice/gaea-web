package org.gaea.framework.web.service.impl;

import org.apache.commons.collections.CollectionUtils;
import org.apache.commons.lang3.StringUtils;
import org.gaea.data.dataset.domain.GaeaDataSet;
import org.gaea.data.domain.DataSetCommonQueryConditionDTO;
import org.gaea.data.system.SystemDataSetFactory;
import org.gaea.db.GaeaSqlProcessor;
import org.gaea.db.QueryCondition;
import org.gaea.exception.*;
import org.gaea.framework.web.common.WebCommonDefinition;
import org.gaea.config.SystemProperties;
import org.gaea.framework.web.data.GaeaDefaultDsContext;
import org.gaea.framework.web.schema.SystemCacheFactory;
import org.gaea.framework.web.schema.domain.PageResult;
import org.gaea.framework.web.schema.domain.SchemaGridPage;
import org.gaea.framework.web.schema.domain.view.SchemaColumn;
import org.gaea.framework.web.schema.service.SchemaDataService;
import org.gaea.framework.web.schema.utils.GaeaExcelUtils;
import org.gaea.framework.web.security.GaeaWebSecuritySystem;
import org.gaea.framework.web.service.CommonViewQueryService;
import org.gaea.framework.web.service.ExcelService;
import org.gaea.framework.web.utils.GaeaWebConditionUtils;
import org.gaea.framework.web.utils.GaeaWebUtils;
import org.gaea.poi.domain.Block;
import org.gaea.poi.domain.ExcelTemplate;
import org.gaea.poi.domain.Field;
import org.gaea.poi.domain.Sheet;
import org.gaea.poi.export.ExcelExport;
import org.gaea.poi.util.GaeaPoiUtils;
import org.gaea.security.jo.UserJO;
import org.gaea.util.BeanUtils;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.util.LinkedCaseInsensitiveMap;

import javax.servlet.http.HttpServletResponse;
import java.io.*;
import java.util.ArrayList;
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
    @Autowired
    private GaeaWebConditionUtils gaeaWebConditionUtils;
    @Autowired
    private GaeaSqlProcessor gaeaSqlProcessor;

    @Override
    public List<Map<String, Object>> queryByConditions(String schemaId, String datasetId, String excelTemplateId, GaeaDefaultDsContext defaultDsContext) throws ValidationFailedException, SysLogicalException, SysInitException {
        return queryByConditions(schemaId, datasetId, excelTemplateId, defaultDsContext, null);
    }

    @Override
    public List<Map<String, Object>> queryByConditions(String schemaId, String datasetId, String excelTemplateId, GaeaDefaultDsContext defaultDsContext, DataSetCommonQueryConditionDTO queryConditionDTO) throws ValidationFailedException, SysLogicalException, SysInitException {
        // 默认需要对结果的每个字段做数据集转换
        List<Map<String, Object>> newDataList = commonViewQueryService.queryByConditions(schemaId, datasetId, defaultDsContext, queryConditionDTO, true);
        // 对查询数据作处理，例如，把数据库字段名改一改等，再返回
        return schemaDataService.transformViewData(newDataList, excelTemplateId);
    }

    /**
     * 根据数据集查询数据，并根据excel模板对字段进行处理、转换。然后返回数据。
     *
     * @param schemaId         用于前置条件
     * @param queryConditions  查询条件。必须和excel模板对应的数据集能匹配。
     * @param preConditions
     * @param page             可以为空。即查询全部。
     * @param datasetId        数据集id
     * @param excelTemplateId  excel模板id
     * @param defaultDsContext 用于查询的表达式的上下文对象
     * @return
     * @throws ValidationFailedException
     * @throws SysLogicalException
     * @throws SysInitException
     * @throws InvalidDataException
     * @throws SystemConfigException
     */
    @Override
    public List<Map<String, Object>> queryByConditions(String schemaId, List<QueryCondition> queryConditions, String preConditions,
                                                       SchemaGridPage page, String datasetId, String excelTemplateId, GaeaDefaultDsContext defaultDsContext) throws ValidationFailedException, SysLogicalException, SysInitException, InvalidDataException, SystemConfigException {
        List<QueryCondition> newQueryConditions = new ArrayList<QueryCondition>();
        UserJO loginUser = GaeaWebSecuritySystem.getLoginUser();
        // 如果有前置条件，先转换前置条件
        if (StringUtils.isNotEmpty(preConditions)) {
            newQueryConditions.addAll(gaeaWebConditionUtils.convert(schemaId, preConditions));
        }
        // 再叠加当前的查询条件
        newQueryConditions.addAll(queryConditions);

        GaeaDataSet gaeaDataSet = SystemDataSetFactory.getDataSet(datasetId);
        // 获取共有的字段条件（如果用schema中grid的条件,去给excel模板导出用, 会涉及两边的字段定义(sql)不一致的情况, 这个时候, 需要两边都有的字段, 才可以共用查询.）
        List<QueryCondition> joinedQueryConditions = getJoinExcelQueryCondition(queryConditions, excelTemplateId);
        // 根据XML SCHEMA的定义，把页面传过来的查询条件做一定处理（例如查询字段改为数据库真实字段）
        GaeaWebConditionUtils.rebuildQueryConditionBySchema(joinedQueryConditions, schemaId);
        // 数据查询
        PageResult result = commonViewQueryService.query(gaeaDataSet, joinedQueryConditions, page, loginUser.getLoginName(), String.valueOf(loginUser.getId()));
        // 默认需要对结果的每个字段做数据集转换
        List<Map<String, Object>> newDataList = result.getContent();
        // 对查询数据作处理，例如，把数据库字段名改一改等，再返回
        return schemaDataService.transformViewData(newDataList, excelTemplateId);
//        return newDataList;
    }

    @Override
    public void export(List<LinkedCaseInsensitiveMap> data, Map<String, Field> fieldDefMap, String fileName, HttpServletResponse response) throws ValidationFailedException, InvalidDataException, ProcessFailedException {
        if (data == null) {
            logger.trace("传入data为空，无法执行导出！");
            return;
        }
        File file = excelExport.export(data, "", fieldDefMap, "", SystemProperties.get(WebCommonDefinition.PROP_KEY_EXCEL_BASE_DIR));
        GaeaWebUtils.writeFileToResponse(file, response);
    }


    /**
     * 碰撞excel模板和查询条件（条件的属性名可能来自Schema），然后返回两者都有的（name一致）。
     * <p>
     * 因为, 如果用schema中grid的条件,去给excel模板导出用, 会涉及两边的字段定义(sql)不一致的情况, 这个时候, 需要两边都有的字段, 才可以共用查询.
     * </p>
     *
     * @param queryConditions
     * @param excelTemplateId
     * @return
     * @throws SysInitException
     */
    private List<QueryCondition> getJoinExcelQueryCondition(List<QueryCondition> queryConditions, String excelTemplateId) throws SysInitException {
        List<QueryCondition> joinedQueryConditions = new ArrayList<QueryCondition>(); // excel模板和列表页schema可以共用的查询字段
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
                // 要拿到以模板定义name作为key的map
                fieldMap = GaeaPoiUtils.getNameColumnMap(gaeaBlock.getFieldMap());
//                LinkedCaseInsensitiveMap<SchemaColumn> columnMap = GaeaExcelUtils.getDbNameColumnMap(fieldMap);
                // 遍历查询条件，如果条件中的字段在excel模板中不存在，查询就会报错。去掉
                for (QueryCondition cond : queryConditions) {
                    // 如果从excel模板定义中，也能拿到xml schema定义的列，则表示该查询条件可以共用
                    if (fieldMap.get(cond.getPropName()) != null) {
                        QueryCondition copy = new QueryCondition();
                        BeanUtils.copyProperties(cond, copy);
                        // 重置条件对应的数据库字段，用的是Excel模板中定义的数据库字段
                        copy.setPropName(fieldMap.get(cond.getPropName()).getDbColumnName());
                        joinedQueryConditions.add(copy);
                    }
                }
            }
        }
        return joinedQueryConditions;
    }
}
