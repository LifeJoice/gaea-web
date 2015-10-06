package org.gaea.framework.web.schema.utils;

import org.gaea.framework.web.schema.domain.view.SchemaColumn;
import org.gaea.framework.web.schema.domain.view.SchemaGrid;
import org.apache.commons.lang3.StringUtils;

/**
 * Created by Iverson on 2015/8/18.
 */
public class GaeaSchemaUtils {

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
}
