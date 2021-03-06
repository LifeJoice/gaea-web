package org.gaea.framework.web.schema.utils;

import org.apache.commons.collections.CollectionUtils;
import org.apache.commons.collections.MapUtils;
import org.apache.commons.lang3.StringUtils;
import org.gaea.exception.SysInitException;
import org.gaea.exception.ValidationFailedException;
import org.gaea.framework.web.schema.SystemCacheFactory;
import org.gaea.framework.web.schema.domain.GaeaXmlSchema;
import org.gaea.framework.web.schema.domain.view.SchemaColumn;
import org.gaea.framework.web.schema.domain.view.SchemaGrid;
import org.gaea.framework.web.schema.view.jo.SchemaColumnJO;
import org.gaea.poi.domain.Block;
import org.gaea.poi.domain.ExcelTemplate;
import org.gaea.poi.domain.Field;
import org.gaea.poi.domain.Sheet;
import org.gaea.poi.util.GaeaPoiUtils;
import org.gaea.util.BeanUtils;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.util.LinkedCaseInsensitiveMap;

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
    public static LinkedCaseInsensitiveMap<Field> getFields(String schemaId) throws SysInitException {
        if (StringUtils.isEmpty(schemaId)) {
            return null;
        }
        GaeaXmlSchema gaeaXmlSchema = SystemCacheFactory.getGaeaSchema(schemaId);
        LinkedCaseInsensitiveMap<Field> fieldsMap = null;
        if (gaeaXmlSchema != null && gaeaXmlSchema.getSchemaViews() != null) {
            fieldsMap = new LinkedCaseInsensitiveMap<Field>();
            SchemaGrid grid = gaeaXmlSchema.getSchemaViews().getGrid();
            if (grid != null && grid.getColumns() != null) {
                for (SchemaColumn col : grid.getColumns()) {
                    Field field = new Field();
                    BeanUtils.copyProperties(col, field);
//                    field.setName(col.getName());
                    field.setTitle(col.getLabel());
//                    field.setDataType(col.getDataType());
//                    field.setDatetimeFormat(col.getDatetimeFormat());
                    fieldsMap.put(col.getName(), field);
                }
            }
        }
        return fieldsMap;
    }

    /**
     * 根据schemaId，获取里面的view.grid.columns，转换成key=column.name，value=Field对象的map返回。
     * 例如：
     * 导出excel可以用Schema定义的Column来拼凑excel的title等。
     *
     * @param gridColumnsDefine
     * @return Map < column.name，Field对象 >
     */
    public static Map<String, Field> getFields(List<SchemaColumnJO> gridColumnsDefine) throws ValidationFailedException {
        if (CollectionUtils.isEmpty(gridColumnsDefine)) {
            return null;
        }
        Map<String, Field> resultMap = null;
        resultMap = new HashMap<String, Field>();
        for (SchemaColumnJO col : gridColumnsDefine) {
            if (StringUtils.isEmpty(col.getName())) {
                throw new ValidationFailedException("要转换为Excel field定义，name不允许为空！");
            }
            Field field = new Field();
            field.setName(col.getName());
            field.setTitle(col.getText());
            field.setDataType(col.getDataType());
            field.setDatetimeFormat(col.getDatetimeFormat());
            resultMap.put(col.getName(), field);
        }
        return resultMap;
    }

    /**
     * 获取两个集合相交的Field。其中一个集合是完整的。另一个List，是只有key的list。
     *
     * @param linkFieldsMap          这是一个有序的map。而返回的map的顺序，也保持和这个一样。
     * @param fieldsKeyList
     * @return
     * @throws ValidationFailedException
     */
    public static LinkedCaseInsensitiveMap<Field> getJoinFields(Map<String, Field> linkFieldsMap, List<String> fieldsKeyList) throws ValidationFailedException {
        return GaeaPoiUtils.getJoinFields(linkFieldsMap, fieldsKeyList);
//        if (CollectionUtils.isEmpty(fieldsKeyList) || MapUtils.isEmpty(linkFieldsMap)) {
//            return null;
//        }
//        LinkedCaseInsensitiveMap<Field> resultMap = null;
//        resultMap = new LinkedCaseInsensitiveMap<Field>();
//        // 遍历有序的map，这样返回才能根据有序map的顺序返回
//        for (String linkKey : linkFieldsMap.keySet()) {
//            for (String key2 : fieldsKeyList) {
//                if (linkKey.equalsIgnoreCase(key2)) {
//                    resultMap.put(key2, linkFieldsMap.get(key2));
//                    break;
//                }
//            }
//        }
//        return resultMap;
    }

    /**
     * 根据fieldMap，也就是Excel字段定义，抽取转换成SchemaColumn的列定义。因为原来的数据查询等，都是以SchemaColumn，也就是XML SCHEMA的gird.column定义进行数据处理的。
     * 等于SchemaColumn是标准的数据列定义。
     *
     * @param fieldMap
     * @return
     */
    public static LinkedCaseInsensitiveMap<SchemaColumn> getDbNameColumnMap(Map<String, Field> fieldMap) {
        if (MapUtils.isEmpty(fieldMap)) {
            return null;
        }
        LinkedCaseInsensitiveMap<SchemaColumn> columnMap = new LinkedCaseInsensitiveMap<SchemaColumn>();
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
