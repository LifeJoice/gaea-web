package org.gaea.framework.web.schema.utils;

import org.gaea.framework.web.schema.domain.view.SchemaColumn;
import org.gaea.framework.web.schema.domain.view.SchemaGrid;
import org.apache.commons.lang3.StringUtils;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

/**
 * Created by Iverson on 2015/8/18.
 */
public class GaeaSchemaUtils {
    private final Logger logger = LoggerFactory.getLogger(GaeaSchemaUtils.class);

    public static String getDbColumnName(SchemaGrid grid, String modelFieldId){
        if(StringUtils.isBlank(modelFieldId)){
            return null;
        }
        if(grid==null){
            return null;
        }
        for (SchemaColumn column:grid.getColumns()){
            if(modelFieldId.equalsIgnoreCase(column.getHtmlId())){
                return column.getDbColumnName();
            }
        }
        return null;
    }

    /**
     * 获取XML SCHEMA中的<grid>定义的modelFieldId对应的<column>
     * @param grid
     * @param modelFieldId 一般来说，就是htmlId
     * @return
     */
    public static SchemaColumn getViewColumn(SchemaGrid grid, String modelFieldId){
        if(StringUtils.isBlank(modelFieldId)){
            return null;
        }
        if(grid==null){
            return null;
        }
        for (SchemaColumn column:grid.getColumns()){
            if(modelFieldId.equalsIgnoreCase(column.getHtmlId())){
                return column;
            }
        }
        return null;
    }
}
