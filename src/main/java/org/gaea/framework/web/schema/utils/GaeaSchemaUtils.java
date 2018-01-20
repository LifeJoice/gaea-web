package org.gaea.framework.web.schema.utils;

import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.apache.commons.collections.CollectionUtils;
import org.apache.commons.collections.MapUtils;
import org.apache.commons.lang3.StringUtils;
import org.gaea.data.dataset.domain.GaeaColumn;
import org.gaea.data.dataset.domain.GaeaDataSet;
import org.gaea.exception.ValidationFailedException;
import org.gaea.framework.web.schema.Action;
import org.gaea.framework.web.schema.SchemaActionDefinition;
import org.gaea.framework.web.schema.XmlSchemaDefinition;
import org.gaea.framework.web.schema.domain.DataSet;
import org.gaea.framework.web.schema.domain.GaeaXmlSchema;
import org.gaea.framework.web.schema.domain.SchemaGridPage;
import org.gaea.framework.web.schema.domain.SchemaViews;
import org.gaea.framework.web.schema.domain.view.*;
import org.gaea.framework.web.schema.view.action.ActionParam;
import org.gaea.framework.web.schema.view.action.ExcelExportButtonAction;
import org.gaea.framework.web.schema.view.jo.*;
import org.gaea.util.BeanUtils;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.util.LinkedCaseInsensitiveMap;

import java.io.IOException;
import java.lang.reflect.InvocationTargetException;
import java.util.ArrayList;
import java.util.List;
import java.util.Map;

/**
 * Created by Iverson on 2015/8/18.
 */
public class GaeaSchemaUtils {
    private static final Logger logger = LoggerFactory.getLogger(GaeaSchemaUtils.class);

    private static ObjectMapper objectMapper = new ObjectMapper();

    public static String getDbColumnName(SchemaGrid grid, String modelFieldId) {
        if (StringUtils.isBlank(modelFieldId)) {
            return null;
        }
        if (grid == null) {
            return null;
        }
        for (SchemaColumn column : grid.getColumns()) {
            if (modelFieldId.equalsIgnoreCase(column.getHtmlId())) {
                return column.getDbColumnName();
            }
        }
        return null;
    }

    /**
     * 获取XML SCHEMA中的<grid>定义的modelFieldId对应的<column>
     *
     * @param grid
     * @param modelFieldId 一般来说，就是htmlId
     * @return
     */
    public static SchemaColumn getViewColumn(SchemaGrid grid, String modelFieldId) {
        if (StringUtils.isBlank(modelFieldId)) {
            return null;
        }
        if (grid == null) {
            return null;
        }
        for (SchemaColumn column : grid.getColumns()) {
            if (modelFieldId.equalsIgnoreCase(column.getHtmlId())) {
                return column;
            }
        }
        return null;
    }

    /**
     * 获取grid的定义列中，是主键的那一列
     *
     * @param grid
     * @return
     */
    public static SchemaColumn getPrimaryKeyColumn(SchemaGrid grid) {
        if (grid == null) {
            return null;
        }
        for (SchemaColumn column : grid.getColumns()) {
            if (column.getPrimaryKey()) {
                return column;
            }
        }
        return null;
    }

    /**
     * 把GaeaDataSet复制到一个DataSet的对象。因为一般的BeanUtils没有深度复制。
     *
     * @param gaeaDataSet
     * @return
     */
    public static DataSet translateDataSet(GaeaDataSet gaeaDataSet) {
        if (gaeaDataSet == null) {
            return null;
        }
        DataSet dataSet = new DataSet();
        BeanUtils.copyProperties(gaeaDataSet, dataSet);
        // copy where
        if (gaeaDataSet.getWhere() != null) {
            dataSet.setWhere(gaeaDataSet.getWhere());
        }
        return dataSet;
    }

    /**
     * 把grid里面的column list转换成map。key为column的db-column-name.
     *
     * @param columnList
     * @return
     */
    public static LinkedCaseInsensitiveMap<SchemaColumn> getDbNameColumnMap(List<SchemaColumn> columnList) {
        if (CollectionUtils.isNotEmpty(columnList)) {
            LinkedCaseInsensitiveMap<SchemaColumn> columnMap = new LinkedCaseInsensitiveMap<SchemaColumn>();
            for (SchemaColumn column : columnList) {
                columnMap.put(column.getDbColumnName(), column);
            }
            return columnMap;
        }
        return null;
    }

    /**
     * 把GaeaDataSet里面的GaeaColumn map转换为SchemaColumn map.
     *
     * @param columnDefineMap
     * @return
     */
    public static LinkedCaseInsensitiveMap<SchemaColumn> convertToSchemaColumnMap(Map<String, GaeaColumn> columnDefineMap) {
        if (MapUtils.isNotEmpty(columnDefineMap)) {
            LinkedCaseInsensitiveMap<SchemaColumn> newColumnDefineMap = new LinkedCaseInsensitiveMap<SchemaColumn>();
            for (String key : columnDefineMap.keySet()) {
                SchemaColumn schemaColumn = new SchemaColumn();
                BeanUtils.copyProperties(columnDefineMap.get(key), schemaColumn);
                newColumnDefineMap.put(schemaColumn.getDbColumnName(), schemaColumn);
            }
            return newColumnDefineMap;
        }
        return null;
    }

    /**
     * 在XMLSchema.SchemaViews.Actions.Buttons里面，找某个方法的button定义对象。
     * <p>
     * 找到第一个就返回！
     * </p>
     * <p>
     *     由于SchemaViews.Actions是List<Object>, 所以在XML转换的时候,虽然某个button可能是ExcelExportButtonAction类型的, 但从json转为Actions的时候就变成Map了.<br/>
     *     这个时候,就需要人工判断method属性,再用对应的类去做强制转换.
     * </p>
     *
     * @param xmlSchema
     * @param method
     * @return 找不到返回null
     */
    public static SchemaButton getButton(GaeaXmlSchema xmlSchema, String buttonId, String method) throws ValidationFailedException {
        if (xmlSchema == null || StringUtils.isEmpty(buttonId) || StringUtils.isEmpty(method)) {
            return null;
        }
        SchemaButton button = null;
        if (xmlSchema.getSchemaViews() == null || xmlSchema.getSchemaViews().getActions() == null) {
            throw new IllegalArgumentException("Xml schema的view或者view下的action为空！");
        }
        List buttons = xmlSchema.getSchemaViews().getActions().getButtons();
        button = getButton(buttons, buttonId, method);
        return button;
    }

    private static SchemaButton getButton(List buttons, String buttonId, String method) throws ValidationFailedException {
        SchemaButton button = null;
        for (Object o : buttons) {
            if (o == null) {
                continue;
            }
            if (!(o instanceof Map)) {
                throw new ValidationFailedException("要提取按钮，要求xmlSchema.getSchemaViews().getActions()的值为Map！");
            }
            Map buttonMap = (Map) o;
            Object subButtonsObj = buttonMap.get(XmlSchemaDefinition.ACTION_BUTTONS_NAME);
            List subButtonList = subButtonsObj == null || !(subButtonsObj instanceof List) ? // 有子按钮并且是List？
                    null : (List) subButtonsObj;
            // 如果有按钮组，递归
            if (subButtonList != null) {
                button = getButton(subButtonList, buttonId, method);
                // 如果找到就立马返回。
                if (button != null) {
                    return button;
                }
            } else {
                // 如果button id相同，且里面的action method相同
                if (buttonId.equalsIgnoreCase(String.valueOf(buttonMap.get("id"))) && SchemaActionDefinition.METHOD_EXCEL_EXPORT_BY_TEMPLATE.equalsIgnoreCase(method)) {
                    try {
                        String schemaButtonJson = objectMapper.writeValueAsString(buttonMap);
                        button = objectMapper.readValue(schemaButtonJson, SchemaButton.class);
                        if (buttonMap.get("actions") != null && CollectionUtils.isNotEmpty((List) buttonMap.get("actions"))) {
                            // 先清空actions（因为前面ObjectMapper转的时候把数据当map放进去了）
                            button.setActions(new ArrayList());
                            // 遍历actions，转换为Action类型并放入
                            List buttonActions = (List) buttonMap.get("actions");
                            for (Object btnActionObj : buttonActions) {
                                String btnActionJson = objectMapper.writeValueAsString(btnActionObj);
                                ExcelExportButtonAction action = objectMapper.readValue(btnActionJson, ExcelExportButtonAction.class);
                                button.getActions().add(action);
                            }
                        }
                    } catch (JsonProcessingException e) {
                        logger.error("objectMapper转换SchemaButton失败！", e);
                    } catch (IOException e) {
                        logger.error("objectMapper转换SchemaButton失败！", e);
                    }
                    break;
                }
            }
        }
        return button;
    }

    /**
     * 把SchemaView对象，转换为SchemaViewJO对象。其中的SchemaDialog对象也转换为SchemaDialogJO对象。
     *
     * @param origView
     * @return
     */
    public static SchemaViewJO convert(SchemaViews origView) {
        if (origView == null) {
            return null;
        }
        SchemaViewJO result = new SchemaViewJO();
        BeanUtils.copyProperties(origView, result, "dialogs", "actions", "views");
        // 子view转换
        if (origView.getViews() != null) {
            for (SchemaViews view : origView.getViews()) {
                SchemaViewJO viewJO = convert(view);
                result.getViews().add(viewJO);
            }
        }
        // Grid转换
        if (origView.getGrid() != null) {
            SchemaGridJO gridJO = convert(origView.getGrid());
            // 初始化分页
            int pageSize = StringUtils.isNumeric(origView.getGrid().getPageSize()) ? Integer.parseInt(origView.getGrid().getPageSize()) : 0;
            gridJO.setPage(new SchemaGridPage(1, pageSize));

            result.setGrid(gridJO);
        }
        // dialog转换
        if (origView.getDialogs() != null) {
            for (SchemaDialog origDialog : origView.getDialogs()) {
                SchemaDialogJO dialogJO = new SchemaDialogJO();
                BeanUtils.copyProperties(origDialog, dialogJO);
                result.getDialogs().add(dialogJO);
            }
        }
        // SchemaAction转换
        result.setActions(convert(origView.getActions()));
        return result;
    }

    /**
     * 把Grid转换为GridDTO。方便前端处理。
     *
     * @param origGrid
     * @return
     * @throws InvocationTargetException
     * @throws IllegalAccessException
     */
    public static SchemaGridJO convert(SchemaGrid origGrid) {
        SchemaGridJO gridDTO = new SchemaGridJO();
        GridModelDTO model = new GridModelDTO();
        // 复制DTO属性
        BeanUtils.copyProperties(origGrid, gridDTO);
        gridDTO.setColumns(new ArrayList<SchemaColumnJO>());
        for (int i = 0; i < origGrid.getColumns().size(); i++) {
//        for (SchemaColumn column:origGrid.getColumns()){
            SchemaColumn column = origGrid.getColumns().get(i);
            SchemaColumnJO columnJO = new SchemaColumnJO();
            // 复制column属性
            org.gaea.util.BeanUtils.copyProperties(column, columnJO, "queryCondition");
            // 转换JO里的别名字段等
            columnJO.setText(column.getLabel());       // label即text
            columnJO.setWidth(column.getHtmlWidth());  // htmlWidth即width
            columnJO.setHidden(!column.getVisible());  // hidden和visible相反
            // 复制column queryCondition
            ColumnQueryConditionJO queryConditionJO = new ColumnQueryConditionJO();
            if (column.getQueryCondition() != null) {
                BeanUtils.copyProperties(column.getQueryCondition(), queryConditionJO);
                columnJO.setQueryCondition(queryConditionJO);
            }
            // 生成jo.model
            if (column.getPrimaryKey()) {
                model.setIdProperty(column.getHtmlId());    // 主键字段即model.idProperty
            }
            model.getFields().add(new GridModelFieldDTO(column.getHtmlId()));
            gridDTO.getColumns().add(columnJO);
        }
        gridDTO.setModel(model);
        return gridDTO;
    }

    /**
     * 把SchemaActions对象转换为JO对象，方便返回给前端。同时也可以把一些信息过滤掉不要返回。
     * 例如：
     * ExcelExportButtonAction的param就不需要展示给前端。后台用即可。
     *
     * @param actions
     * @return
     */
    public static SchemaActionsJO convert(SchemaActions actions) {
        if (actions == null) {
            return null;
        }
        SchemaActionsJO actionsJO = new SchemaActionsJO();
        // 复制action
        BeanUtils.copyProperties(actions, actionsJO, "buttons");

        if (CollectionUtils.isNotEmpty(actions.getButtons())) {
            for (Object objButton : actions.getButtons()) {

                if (objButton instanceof SchemaButton) {
                    SchemaButton button = (SchemaButton) objButton;
                    // 复制button
                    SchemaButtonJO buttonJO = convert(button);
                    // 添加button
                    actionsJO.getButtons().add(buttonJO);
                } else if (objButton instanceof SchemaButtonGroup) {
                    SchemaButtonGroup buttonGroup = (SchemaButtonGroup) objButton;
                    SchemaButtonGroupJO buttonGroupJO = new SchemaButtonGroupJO();
                    // 复制 buttonGroup
                    BeanUtils.copyProperties(buttonGroup, buttonGroupJO, "buttons");
                    for (SchemaButton button :
                            buttonGroup.getButtons()) {
                        SchemaButtonJO buttonJO = convert(button);
                        buttonGroupJO.getButtons().add(buttonJO);
                    }
                    // 添加buttonGroup
                    actionsJO.getButtons().add(buttonGroupJO);
                }
            }
        }

        return actionsJO;
    }

    /**
     * 把SchemaButton转换为JO对象。返回前端用。
     *
     * @param button
     * @return
     */
    public static SchemaButtonJO convert(SchemaButton button) {
        SchemaButtonJO buttonJO = new SchemaButtonJO();
        // 复制button
        BeanUtils.copyProperties(button, buttonJO, "actions");
        if (CollectionUtils.isNotEmpty(button.getActions())) {
            buttonJO.setActions(new ArrayList<ButtonActionJO>());
            for (Object objAction :
                    button.getActions()) {
                if (objAction == null) {
                    continue;
                }
                Action action = (Action) objAction;
                ButtonActionJO actionJO = new ButtonActionJO();
                // 复制button action
                BeanUtils.copyProperties(action, actionJO, "actionParamMap");
                // 如果不是ExcelExportButtonAction
                if (!(action instanceof ExcelExportButtonAction)) {
                    if (MapUtils.isNotEmpty(action.getActionParamMap())) {
                        actionJO.setParams(new ArrayList<ActionParam>(action.getActionParamMap().values()));
                    }
                }
                // 添加button action
                buttonJO.getActions().add(actionJO);
            }
        }
        return buttonJO;
    }

    /**
     * 从button的actions里面，判断是否存在特定method。
     *
     * @param method
     * @param button
     * @return
     */
    private static boolean isTheButton(String method, SchemaButton button) {
        boolean itsMe = false;
        if (button == null || CollectionUtils.isEmpty(button.getActions())) {
            return false;
        }
        for (Object objAction : button.getActions()) {
            Action action = (Action) objAction;
            if (method.equalsIgnoreCase(action.getMethod())) {
                itsMe = true;
            }
        }
        return itsMe;
    }
}
