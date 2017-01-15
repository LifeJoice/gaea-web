package org.gaea.framework.web.controller;

import org.apache.commons.collections.CollectionUtils;
import org.apache.commons.lang3.StringUtils;
import org.gaea.db.QueryCondition;
import org.gaea.exception.InvalidDataException;
import org.gaea.exception.ValidationFailedException;
import org.gaea.framework.web.bind.annotation.RequestBean;
import org.gaea.framework.web.schema.SystemCacheFactory;
import org.gaea.framework.web.schema.domain.GaeaXmlSchema;
import org.gaea.framework.web.schema.domain.view.SchemaButton;
import org.gaea.framework.web.schema.utils.GaeaSchemaUtils;
import org.gaea.framework.web.schema.view.action.ExcelExportButtonAction;
import org.gaea.framework.web.schema.view.action.ExcelExportSimpleButtonAction;
import org.gaea.framework.web.schema.view.service.ActionsService;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Controller;
import org.springframework.web.bind.annotation.RequestMapping;

import javax.servlet.http.HttpServletRequest;
import javax.servlet.http.HttpServletResponse;
import java.util.List;

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

    /**
     * 系统公用的button action处理。
     * SchemaId + buttonId可以定义到唯一的action
     *
     * @param method
     * @param schemaId
     * @param request
     * @param response
     * @throws ValidationFailedException
     */
    @RequestMapping(value = "/doAction")
    public void doAction(String method, String schemaId, String buttonId, String actionName,
                         HttpServletRequest request, HttpServletResponse response) throws ValidationFailedException {
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
            for (ExcelExportButtonAction buttonAction : button.getActions()) {
                actionsService.doAction(buttonAction, response, request);
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
     * @param request
     * @param response
     * @throws ValidationFailedException
     */
    @RequestMapping(value = "/doSimpleAction")
    public void doSimpleAction(String schemaId, String buttonId, String actionName, @RequestBean("filters") List<QueryCondition> queryConditionList,
                               HttpServletRequest request, HttpServletResponse response) throws ValidationFailedException, InvalidDataException {
        if (StringUtils.isEmpty(schemaId)) {
            throw new ValidationFailedException("获取不到Schema id。无法进行导出操作。");
        }
        if (StringUtils.isEmpty(actionName)) {
            throw new ValidationFailedException("缺少操作名（actionName）,无法执行doSimpleAction操作。");
        }
        ExcelExportSimpleButtonAction excelSimpleAction = new ExcelExportSimpleButtonAction(actionName, schemaId, queryConditionList);
        // 执行action定义的方法
        actionsService.doSimpleAction(excelSimpleAction, response, request);

    }
}
