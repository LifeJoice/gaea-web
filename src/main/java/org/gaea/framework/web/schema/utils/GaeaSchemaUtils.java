package org.gaea.framework.web.schema.utils;

import org.gaea.data.dataset.domain.Condition;
import org.gaea.data.dataset.domain.ConditionSet;
import org.gaea.data.dataset.domain.GaeaDataSet;
import org.gaea.framework.web.schema.data.domain.SchemaCondition;
import org.gaea.framework.web.schema.data.domain.SchemaConditionSet;
import org.gaea.framework.web.schema.data.domain.SchemaWhere;
import org.gaea.framework.web.schema.domain.DataSet;
import org.gaea.framework.web.schema.domain.view.SchemaColumn;
import org.gaea.framework.web.schema.domain.view.SchemaGrid;
import org.apache.commons.lang3.StringUtils;
import org.gaea.util.BeanUtils;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

import java.util.ArrayList;
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
     * @param grid
     * @return
     */
    public static SchemaColumn getPrimaryKeyColumn(SchemaGrid grid) {
        if (grid == null) {
            return null;
        }
        for (SchemaColumn column : grid.getColumns()) {
            if(column.getPrimaryKey()){
                return column;
            }
        }
        return null;
    }

    /**
     * 把GaeaDataSet复制到一个DataSet的对象。因为一般的BeanUtils没有深度复制。
     * @param gaeaDataSet
     * @return
     */
    public static DataSet translateDataSet(GaeaDataSet gaeaDataSet) {
        if (gaeaDataSet == null) {
            return null;
        }
        DataSet dataSet = new DataSet();
        BeanUtils.copyProperties(gaeaDataSet,dataSet);
        // copy where
        if(gaeaDataSet.getWhere()!=null){
            SchemaWhere where = new SchemaWhere();
            BeanUtils.copyProperties(gaeaDataSet.getWhere(),where);
            // copy condition-set
            if(gaeaDataSet.getWhere().getConditionSets()!=null){
                Map<String,SchemaConditionSet> newConditionSetMap = new HashMap<String, SchemaConditionSet>();
                for(String id:gaeaDataSet.getWhere().getConditionSets().keySet()){
                    ConditionSet conditionSet = gaeaDataSet.getWhere().getConditionSets().get(id);
                    SchemaConditionSet schemaConditionSet = new SchemaConditionSet();
                    BeanUtils.copyProperties(conditionSet,schemaConditionSet);
                    // copy condition
                    if(conditionSet.getConditions()!=null){
                        List<SchemaCondition> newSchemaConditionList = new ArrayList<SchemaCondition>();
                        for (int i = 0; i < conditionSet.getConditions().size(); i++) {
                            Condition condition = conditionSet.getConditions().get(i);
                            SchemaCondition schemaCondition = new SchemaCondition();
                            BeanUtils.copyProperties(condition,schemaCondition);
                            newSchemaConditionList.add(schemaCondition);
                        }
                        schemaConditionSet.setConditions(newSchemaConditionList);
                    }
                    newConditionSetMap.put(id,schemaConditionSet);
                }
                where.setConditionSets(newConditionSetMap);
            }
            dataSet.setWhere(where);
        }
        return dataSet;
    }
}
