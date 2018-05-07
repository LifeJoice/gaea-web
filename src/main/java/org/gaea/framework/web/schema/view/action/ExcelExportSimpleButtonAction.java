package org.gaea.framework.web.schema.view.action;

import com.fasterxml.jackson.annotation.JsonIgnore;
import org.apache.commons.collections.CollectionUtils;
import org.gaea.config.SystemProperties;
import org.gaea.db.QueryCondition;
import org.gaea.exception.*;
import org.gaea.framework.web.GaeaWebSystem;
import org.gaea.framework.web.common.WebCommonDefinition;
import org.gaea.framework.web.schema.Action;
import org.gaea.framework.web.schema.domain.PageResult;
import org.gaea.framework.web.schema.domain.SchemaGridPage;
import org.gaea.framework.web.schema.utils.GaeaExcelUtils;
import org.gaea.framework.web.service.CommonViewQueryService;
import org.gaea.framework.web.service.ExcelService;
import org.gaea.poi.domain.Field;
import org.gaea.poi.export.ExcelExport;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

import java.io.File;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

/**
 * 这个是导出excel的simpleAction操作。即只导出当前页面（grid）的数据。
 * 而不是Template的数据。
 * Created by iverson on 2016-11-27 16:09:02.
 */
public class ExcelExportSimpleButtonAction implements Action<File> {
    private final Logger logger = LoggerFactory.getLogger(ExcelExportSimpleButtonAction.class);

    private String method;
    @JsonIgnore
    private Map<String, ActionParam> actionParamMap; // Map< param.name , param obj >
    @JsonIgnore
    private String name;
    /* 要导出的字段 */
    List<String> exportFieldKeys;

    public ExcelExportSimpleButtonAction(String actionName, String schemaId, List<QueryCondition> queryConditionList, List<String> excelFields) {
        Map<String, ActionParam> actionParamMap = new HashMap<String, ActionParam>();
        setName(actionName);
        // 以下是excelSimpleAction必须的一些param。
        ActionParam<String> schemaIdParam = new ActionParam<String>();
        schemaIdParam.setName("schemaId");
        schemaIdParam.setValue(schemaId);
        actionParamMap.put("schemaId", schemaIdParam);
        ActionParam<List<QueryCondition>> queryConditionsParam = new ActionParam<List<QueryCondition>>();
        queryConditionsParam.setName("queryConditions");
        queryConditionsParam.setValue(queryConditionList);
        actionParamMap.put("queryConditions", queryConditionsParam);
        setActionParamMap(actionParamMap);
        this.exportFieldKeys = excelFields;
    }

    /**
     * @param loginName 用于数据权限校验
     * @return
     * @throws ValidationFailedException
     */
    @Override
    public File doAction(String loginName) throws ValidationFailedException, InvalidDataException {
        // 这个本身不是一个托管给Spring的bean。所以需要通过静态方法获取上下文的bean。
        try {
            ExcelService excelService = GaeaWebSystem.getBean(ExcelService.class);
            ExcelExport excelExport = GaeaWebSystem.getBean(ExcelExport.class);
            CommonViewQueryService commonViewQueryService = GaeaWebSystem.getBean(CommonViewQueryService.class);
            Map<String, ActionParam> actionParamMap = getActionParamMap();
            ActionParam<String> schemaIdParam = actionParamMap.get("schemaId");
            ActionParam<List<QueryCondition>> queryConditionsParam = actionParamMap.get("queryConditions");
            String schemaId = schemaIdParam.getValue();
            List<QueryCondition> queryConditionList = queryConditionsParam.getValue();
            int limitQty = Integer.parseInt(SystemProperties.get(WebCommonDefinition.PROP_KEY_EXCEL_EXPORT_LIMIT));

            // 通过通用查询接口，查询数据。默认查询数量，以配置文件为准。
            PageResult result = commonViewQueryService.query(schemaId, queryConditionList, new SchemaGridPage(1, limitQty), loginName); // 默认导出1000条
            List<Map<String, Object>> data = result.getContent();
            // 通过XML Schema的view.grid定义，获取各个列的相关定义
            Map<String, Field> fieldsDefineMap = GaeaExcelUtils.getFields(schemaId);
            // 如果有指定导出的列，获取和默认的导出列的交集
            if (CollectionUtils.isNotEmpty(this.exportFieldKeys)) {
                fieldsDefineMap = GaeaExcelUtils.getJoinFields(fieldsDefineMap, this.exportFieldKeys);
            }
            /**
             * if <param name="withData" value="true" /> 没有 | value不能转成Boolean | value=true
             * 就查询data
             * 其实就是，除非withData=false，否则都会查询data
             */
//                data = excelService.queryByConditions(null, dataSetParam.getValue().toString(), null, excelTemplateParam.getValue()); // 默认导出1000条
            File file = excelExport.export(data, "", fieldsDefineMap, "", SystemProperties.get(WebCommonDefinition.PROP_KEY_EXCEL_BASE_DIR));
            return file;
        } catch (SysLogicalException e) {
            logger.debug(e.getMessage(), e);
            throw new ValidationFailedException("系统逻辑错误！请联系管理员处理。");
        } catch (SysInitException e) {
            logger.error("系统初始化异常！", e);
        } catch (ProcessFailedException e) {
            logger.error(e.getMessage(), e);
        }
        return null;
    }

    @Override
    public String getMethod() {
        return method;
    }

    public void setMethod(String method) {
        this.method = method;
    }

    @Override
    public Map<String, ActionParam> getActionParamMap() {
        return actionParamMap;
    }

    public void setActionParamMap(Map<String, ActionParam> actionParamMap) {
        this.actionParamMap = actionParamMap;
    }

    @Override
    public String getName() {
        return name;
    }

    public void setName(String name) {
        this.name = name;
    }
}
