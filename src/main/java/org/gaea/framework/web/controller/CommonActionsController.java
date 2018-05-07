package org.gaea.framework.web.controller;

import com.fasterxml.jackson.databind.ObjectMapper;
import org.apache.commons.collections.CollectionUtils;
import org.apache.commons.lang3.StringUtils;
import org.gaea.db.QueryCondition;
import org.gaea.exception.InvalidDataException;
import org.gaea.exception.ProcessFailedException;
import org.gaea.exception.SysInitException;
import org.gaea.exception.ValidationFailedException;
import org.gaea.framework.web.bind.annotation.RequestBean;
import org.gaea.framework.web.bind.annotation.RequestBeanDataType;
import org.gaea.framework.web.schema.Action;
import org.gaea.framework.web.schema.SystemCacheFactory;
import org.gaea.framework.web.schema.domain.GaeaXmlSchema;
import org.gaea.framework.web.schema.domain.view.SchemaButton;
import org.gaea.framework.web.schema.utils.GaeaExcelUtils;
import org.gaea.framework.web.schema.utils.GaeaSchemaUtils;
import org.gaea.framework.web.schema.view.action.ExcelExportSimpleButtonAction;
import org.gaea.framework.web.schema.view.jo.SchemaColumnJO;
import org.gaea.framework.web.schema.view.service.ActionsService;
import org.gaea.framework.web.service.ExcelService;
import org.gaea.poi.ExcelReader;
import org.gaea.poi.domain.Field;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Controller;
import org.springframework.util.LinkedCaseInsensitiveMap;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.ResponseBody;
import org.springframework.web.multipart.MultipartFile;

import javax.servlet.http.HttpServletRequest;
import javax.servlet.http.HttpServletResponse;
import java.io.IOException;
import java.util.List;
import java.util.Map;

/**
 * 页面各种内置action的处理。例如：导出当前页excel、按模板导出excel等。
 * Created by iverson on 2016/11/8.
 */
@Controller
@RequestMapping("/gaea/actions")
public class CommonActionsController {
    private final Logger logger = LoggerFactory.getLogger(CommonActionsController.class);
    @Autowired
    private ActionsService actionsService;
    @Autowired
    private ExcelReader excelReader;
    @Autowired
    private ExcelService excelService;
    @Autowired
    private ObjectMapper objectMapper;

    /**
     * 系统公用的button action处理。
     * SchemaId + buttonId可以定义到唯一的action。使用这个接口的功能有：
     * <ul>
     *     <li>根据模板导出Excel</li>
     * </ul>
     * @param method
     * @param schemaId
     * @param request
     * @param response
     * @throws ValidationFailedException
     */
    @RequestMapping(value = "/doAction")
    public void doAction(String method, String schemaId, String buttonId, String actionName, @RequestBean(value = "filters", dataType = RequestBeanDataType.JSON) List<QueryCondition> queryConditionList,
                         HttpServletRequest request, HttpServletResponse response) throws ValidationFailedException, SysInitException, ProcessFailedException {
        if (StringUtils.isEmpty(schemaId)) {
            throw new ValidationFailedException("获取不到Schema id。无法进行导出操作。");
        }
        if (StringUtils.isEmpty(buttonId)) {
            throw new ValidationFailedException("缺少按钮id，无法找到对应的action。");
        }
        if (StringUtils.isEmpty(method)) {
            throw new ValidationFailedException("缺少方法名（method）。无法找到对应的action。");
        }
        GaeaXmlSchema xmlSchema = SystemCacheFactory.getGaeaSchema(schemaId);
        SchemaButton button = GaeaSchemaUtils.getButton(xmlSchema, buttonId, method);
        if (button != null && CollectionUtils.isNotEmpty(button.getActions())) {
            for (Object objAction : button.getActions()) {
                Action action = (Action) objAction;
                actionsService.doAction(action, response, request, queryConditionList, schemaId);
            }
        }
    }

    /**
     * 普通action处理。一般是XML定义中，没有定义< button-action >的。
     *
     * @param schemaId
     * @param buttonId
     * @param actionName
     * @param queryConditionList
     * @param excelFields           要导出的指定字段
     * @param request
     * @param response
     * @throws ValidationFailedException
     * @throws InvalidDataException
     */
    @RequestMapping(value = "/doSimpleAction")
    public void doSimpleAction(String schemaId, String buttonId, String actionName, @RequestBean(value = "filters", dataType = RequestBeanDataType.JSON) List<QueryCondition> queryConditionList,
                               @RequestBean("excelFields") List<String> excelFields, HttpServletRequest request, HttpServletResponse response) throws ValidationFailedException, InvalidDataException {
        if (StringUtils.isEmpty(schemaId)) {
            throw new ValidationFailedException("获取不到Schema id。无法进行导出操作。");
        }
        if (StringUtils.isEmpty(actionName)) {
            throw new ValidationFailedException("缺少操作名（actionName）,无法执行doSimpleAction操作。");
        }
        ExcelExportSimpleButtonAction excelSimpleAction = new ExcelExportSimpleButtonAction(actionName, schemaId, queryConditionList, excelFields);
        // 执行action定义的方法
        actionsService.doSimpleAction(excelSimpleAction, response, request);

    }

    /**
     * 可编辑表格（crud grid）的默认excel导入功能。
     * 通过提供的gridColumnsDefine转换为Excel定义，然后和Excel里面的定义匹配，把Excel数据转换后返回，刷新grid。
     * <p>
     * 注意:Excel中未定义的,或者和grid定义不匹配的数据,是不会返回的.
     * </p>
     *
     * @param gridColumnsDefine
     * @param files
     * @param request
     * @param response
     * @throws ValidationFailedException
     * @throws InvalidDataException
     */
    @RequestMapping(value = "/crud-grid/excel-import")
    @ResponseBody
    public List crudGridExcelImportAction(@RequestBean(value = "columns", dataType = RequestBeanDataType.JSON) List<SchemaColumnJO> gridColumnsDefine,
                                          @RequestParam("file") MultipartFile[] files, HttpServletRequest request, HttpServletResponse response) throws ValidationFailedException, InvalidDataException, ProcessFailedException, SysInitException {
        List data = null;
        if (files == null) {
            throw new ValidationFailedException("获取不到文件！");
        } else if (files.length != 1) {
            throw new ValidationFailedException("可编辑表格的excel导入一次只支持一个文件！");
        } else {
            if (CollectionUtils.isEmpty(gridColumnsDefine)) {
                throw new ValidationFailedException("Grid的定义为空，无法执行通用导入！");
            }
            try {
                Map<String, Field> fieldDefMap = GaeaExcelUtils.getFields(gridColumnsDefine);
                data = excelReader.getData(files[0].getInputStream(), fieldDefMap);
            } catch (IOException e) {
                throw new ProcessFailedException("对文件读写错误！请联系管理员！");
            }
        }
        return data;
    }

    /**
     * 可编辑表格（crud grid）的默认excel导出功能。
     * 通过提供的gridColumnsDefine转换为Excel定义，和data，最后导出。
     *
     * @param gridColumnsDefine 列定义
     * @param data              数据
     * @param request
     * @param response
     * @throws ValidationFailedException
     * @throws InvalidDataException
     * @throws ProcessFailedException
     */
    @RequestMapping(value = "/crud-grid/excel-export")
    public void crudGridExcelExportAction(@RequestBean(value = "columns", dataType = RequestBeanDataType.JSON) List<SchemaColumnJO> gridColumnsDefine,
                                          @RequestBean(value = "data", dataType = RequestBeanDataType.JSON) List<LinkedCaseInsensitiveMap> data,
                                          HttpServletRequest request, HttpServletResponse response) throws ValidationFailedException, InvalidDataException, ProcessFailedException {
        if (CollectionUtils.isEmpty(data)) {
            throw new ValidationFailedException("服务器获取不到数据，无法进行导出操作。");
        }
        // 获取列定义（数据类型、name等）
        Map<String, Field> fieldDefMap = GaeaExcelUtils.getFields(gridColumnsDefine);
        // 执行导出
        excelService.export(data, fieldDefMap, "Excel导出", response);
    }
}
