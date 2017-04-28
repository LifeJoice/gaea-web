package org.gaea.framework.web.schema.utils;

import org.apache.commons.collections.MapUtils;
import org.apache.commons.lang3.StringUtils;
import org.gaea.exception.SysInitException;
import org.gaea.framework.web.schema.SystemCacheFactory;
import org.gaea.framework.web.schema.domain.GaeaXmlSchema;
import org.gaea.framework.web.schema.domain.view.SchemaColumn;
import org.gaea.framework.web.schema.domain.view.SchemaGrid;
import org.gaea.poi.domain.Field;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

import java.util.HashMap;
import java.util.List;
import java.util.Map;

/**
 * Excel协处理类。主要负责一些中间的转换工作。
 * 核心excel代码在gaea-common-poi模块。
 * Created by iverson on 2016-11-1 11:25:09.
 */
public class GaeaExcelUtils {
    private static final Logger logger = LoggerFactory.getLogger(GaeaExcelUtils.class);

    /**
     * 根据schemaId，获取里面的view.grid.columns，转换成key=column.name，value=Field对象的map返回。
     * 例如：
     * 导出excel可以用Schema定义的Column来拼凑excel的title等。
     *
     * @param schemaId
     * @return Map < column.name，Field对象 >
     */
    public static Map<String, Field> getFields(String schemaId) throws SysInitException {
        if (StringUtils.isEmpty(schemaId)) {
            return null;
        }
        GaeaXmlSchema gaeaXmlSchema = SystemCacheFactory.getGaeaSchema(schemaId);
        Map<String, Field> fieldsMap = null;
        if (gaeaXmlSchema != null && gaeaXmlSchema.getSchemaViews() != null) {
            fieldsMap = new HashMap<String, Field>();
            SchemaGrid grid = gaeaXmlSchema.getSchemaViews().getGrid();
            if (grid != null && grid.getColumns() != null) {
                for (SchemaColumn col : grid.getColumns()) {
                    Field field = new Field();
                    field.setName(col.getName());
                    field.setTitle(col.getLabel());
                    field.setDataType(col.getDataType());
                    field.setDatetimeFormat(col.getDatetimeFormat());
                    fieldsMap.put(col.getName(), field);
                }
            }
        }
        return fieldsMap;
    }

    /**
     * 根据fieldMap，也就是Excel字段定义，抽取转换成SchemaColumn的列定义。因为原来的数据查询等，都是以SchemaColumn，也就是XML SCHEMA的gird.column定义进行数据处理的。
     * 等于SchemaColumn是标准的数据列定义。
     *
     * @param fieldMap
     * @return
     */
    public static Map<String, SchemaColumn> getDbNameColumnMap(Map<String, Field> fieldMap) {
        if (MapUtils.isEmpty(fieldMap)) {
            return null;
        }
        Map<String, SchemaColumn> columnMap = new HashMap<String, SchemaColumn>();
        for (String key : fieldMap.keySet()) {
            Field excelField = fieldMap.get(key);
            if (StringUtils.isEmpty(excelField.getDbColumnName())) {
                logger.debug("XML配置的excel field确实db-column-name，无法转换成DbNameColumnMap.Field name:{}", excelField.getName());
                continue;
            }
            SchemaColumn column = new SchemaColumn(excelField.getName(), excelField.getName(), excelField.getTitle(),
                    excelField.getDbColumnName(), true, excelField.getWidth(), excelField.getDataType(),
                    excelField.getDataSetId(), excelField.getDatetimeFormat());
            columnMap.put(excelField.getDbColumnName(), column);
        }
        return columnMap;
    }
}