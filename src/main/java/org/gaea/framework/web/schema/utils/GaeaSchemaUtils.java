package org.gaea.framework.web.schema.utils;

import org.apache.commons.collections.CollectionUtils;
import org.apache.commons.lang3.StringUtils;
import org.gaea.data.dataset.domain.GaeaDataSet;
import org.gaea.framework.web.schema.Action;
import org.gaea.framework.web.schema.domain.DataSet;
import org.gaea.framework.web.schema.domain.GaeaXmlSchema;
import org.gaea.framework.web.schema.domain.view.SchemaButton;
import org.gaea.framework.web.schema.domain.view.SchemaButtonGroup;
import org.gaea.framework.web.schema.domain.view.SchemaColumn;
import org.gaea.framework.web.schema.domain.view.SchemaGrid;
import org.gaea.framework.web.schema.view.action.ExcelExportButtonAction;
import org.gaea.util.BeanUtils;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

import java.util.HashMap;
import java.util.List;
import java.util.Map;

/**
 * Created by Iverson on 2015/8/18.
 */
public class GaeaSchemaUtils {
    private final Logger logger = LoggerFactory.getLogger(GaeaSchemaUtils.class);

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
    public static Map<String, SchemaColumn> getDbNameColumnMap(List<SchemaColumn> columnList) {
        if (CollectionUtils.isNotEmpty(columnList)) {
            Map<String, SchemaColumn> columnMap = new HashMap<String, SchemaColumn>();
            for (SchemaColumn column : columnList) {
                columnMap.put(column.getDbColumnName(), column);
            }
            return columnMap;
        }
        return null;
    }

    /**
     * 在XMLSchema.SchemaViews.Actions.Buttons里面，找某个方法的button定义对象。
     * <p>
     * 找到第一个就返回！
     * </p>
     *
     * @param xmlSchema
     * @param method
     * @return 找不到返回null
     */
    public static SchemaButton getButton(GaeaXmlSchema xmlSchema, String buttonId, String method) {
        if (xmlSchema == null || StringUtils.isEmpty(buttonId) || StringUtils.isEmpty(method)) {
            return null;
        }
        SchemaButton button = null;
        if (xmlSchema.getSchemaViews() == null || xmlSchema.getSchemaViews().getActions() == null) {
            throw new IllegalArgumentException("Xml schema的view或者view下的action为空！");
        }
        List buttons = xmlSchema.getSchemaViews().getActions().getButtons();
        for (Object o : buttons) {
            if (o instanceof SchemaButton) {
                SchemaButton b = (SchemaButton) o;
                // 如果button id相同，且里面的action method相同
                if (b != null && buttonId.equalsIgnoreCase(b.getId()) && isTheButton(method, b)) {
                    button = b;
                }
            } else if (o instanceof SchemaButtonGroup) {
                SchemaButtonGroup buttonGroup = (SchemaButtonGroup) o;
                List<SchemaButton> buttonList = buttonGroup.getButtons();
                for (SchemaButton b : buttonList) {
                    // 如果button id相同，且里面的action method相同
                    if (b != null && buttonId.equalsIgnoreCase(b.getId()) && isTheButton(method, b)) {
                        button = b;
                        break;
                    }
                }
            }
        }
        return button;
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
