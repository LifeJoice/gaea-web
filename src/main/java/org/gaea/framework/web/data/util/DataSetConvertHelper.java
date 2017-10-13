package org.gaea.framework.web.data.util;

import org.apache.commons.collections.CollectionUtils;
import org.apache.commons.lang3.StringUtils;
import org.gaea.data.dataset.domain.DataItem;
import org.gaea.data.dataset.domain.GaeaDataSet;
import org.gaea.data.system.SystemDataSetFactory;
import org.gaea.exception.ValidationFailedException;
import org.gaea.framework.web.data.domain.DataSetEntity;
import org.gaea.framework.web.data.domain.DsConditionEntity;
import org.gaea.framework.web.data.domain.DsConditionSetEntity;
import org.gaea.framework.web.schema.domain.view.SchemaColumn;
import org.gaea.framework.web.schema.domain.view.SchemaGrid;
import org.gaea.framework.web.schema.utils.GaeaSchemaUtils;
import org.gaea.util.BeanUtils;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.util.LinkedCaseInsensitiveMap;

import java.util.*;

/**
 * 数据集不只是读出来就好，期间还有很多转换来、转换去的操作。
 * Created by iverson on 2017/8/4.
 */
public class DataSetConvertHelper {
    private final Logger logger = LoggerFactory.getLogger(DataSetConvertHelper.class);

    /**
     * 对数据库查出来的数据结果进行处理。不能直接把数据库字段名返回到前端，而是使用别名。<p/>
     * 由于结果集是“数据库字段名:值”的键值对。直接把结果集转换json返回前端会暴露数据库的设计。<p/>
     * 所以需要把结果集中的数据库字段名改为别名，即column.name
     * <p>
     * columnMap的key之所以为DB-COLUMN-NAME，是因为这个方法本身就是把data的key，从数据库字段名改为xml column name的。<br/>
     * 在转换之前,无法通过data的key(这时候还是db column name),去找column(如果key是xml column name的话).
     * </p>
     * <p/>
     * move from GaeaXmlSchemaProcessor by Iverson 2017-5-27
     *
     * @param dataList               sql查询的数据列表。一行 = Map < 字段名 ： 字段值 >
     * @param columnMap              Map< db_column_name : schemaColumn >
     * @param displayUndefinedColumn 是否显示XML Schema中未定义的列。如果是，则key以数据库字段名返回。
     * @param isDsTranslate          是否需要对列进行数据集转换。例如是列表页之类的，可能是需要的；但如果是表单编辑的，那就不需要。否则填充值的时候会比较麻烦。
     * @return Map. key: 大写的column name.
     */
    public static List<Map<String, Object>> changeDbColumnNameInData(List<Map<String, Object>> dataList, LinkedCaseInsensitiveMap<SchemaColumn> columnMap, boolean displayUndefinedColumn, boolean isDsTranslate) {
        if (dataList == null) {
            return null;
        }
        List<Map<String, Object>> newResultMapList = new ArrayList<Map<String, Object>>();
        // 遍历所有记录
        for (Map<String, Object> rowDataMap : dataList) {
            // 必须判断传入的map类型，然后构造同一类型的返回。
            // 注意!
            // Spring namedParameterJdbcTemplate.queryForList返回的是LinkedCaseInsensitiveMap，这样对于key（数据库列）是大小写不敏感的。如果变成HashMap就会大小写敏感了。
            Map<String, Object> oneResultMap = rowDataMap instanceof LinkedCaseInsensitiveMap ? new LinkedCaseInsensitiveMap<Object>() : new HashMap<String, Object>();
            // 遍历一条记录的所有字段
            Set<String> keys = rowDataMap.keySet();
            for (String key : keys) {
                SchemaColumn column = columnMap.get(key);
                // 如果XML SCHEMA没有定义该字段的column元素，而且又设置了display-undefined-column=true，就把该值传到前端。
                if (column == null && displayUndefinedColumn) {
                    oneResultMap.put(key, rowDataMap.get(key));
                }
                if (column == null) {
                    continue;
                }
                // 遍历SCHEMA的“column”元素，对数据库字段名重命名
//                for (SchemaColumn column : columns) {
                // 把结果集中数据库字段名，按XML SCHEMA的“column”的name改名。Map一进一出。
//                    if (key.equalsIgnoreCase(column.getDbColumnName())) {
                /**
                 * 看看对应的列是否关联DataSet。是的话，把DataSet对应的赋值给value
                 * 例如：
                 * value=3，如果这个列有对应的dataset，则找value=3对应的，可能是 {value:3,text:三级菜单,otherValues:{key:value,key2:value2...}}
                 */
                Object newValue = rowDataMap.get(key);
                // 如果需要DataSet转换
                if (isDsTranslate) {
                    newValue = getValueFromDS(newValue, column.getDataSetId());
                }
                // 空值的处理
                // 默认把空改为''. 如果你非要看null，你也可以在null-to定义
                if (newValue == null) {
                    if (column.getNullTo() != null) {
                        newValue = column.getNullTo();
                    } else {
                        newValue = "";
                    }
                }
                oneResultMap.put(column.getName(), newValue);   // 按新名字放入原值
            }
            newResultMapList.add(oneResultMap);
        }
        return newResultMapList;
    }

    /**
     * 对数据库查出来的数据结果进行处理。不能直接把数据库字段名返回到前端，而是使用别名。<p/>
     * 由于结果集是“数据库字段名:值”的键值对。直接把结果集转换json返回前端会暴露数据库的设计。<p/>
     * 所以需要把结果集中的数据库字段名改为别名，即column.name
     * <p/>
     * move from GaeaXmlSchemaProcessor by Iverson 2017-5-27
     *
     * @param dataList
     * @param grid
     * @param isDsTranslate 是否需要对列进行数据集转换。例如是列表页之类的，可能是需要的；但如果是表单编辑的，那就不需要。否则填充值的时候会比较麻烦。
     * @return
     * @throws ValidationFailedException
     */
    public static List<Map<String, Object>> changeDbColumnNameInData(List<Map<String, Object>> dataList, SchemaGrid grid, boolean isDsTranslate) throws ValidationFailedException {
        if (grid == null) {
            throw new ValidationFailedException("XML Schema grid定义为空。无法执行转换操作！");
        }
        // 这里的column map的key，是db-column-name，不是column-name，这个要注意。
        LinkedCaseInsensitiveMap<SchemaColumn> columnMap = GaeaSchemaUtils.getDbNameColumnMap(grid.getColumns());
        return changeDbColumnNameInData(dataList, columnMap, grid.getDisplayUndefinedColumn(), isDsTranslate);
    }

    /**
     * 用newDsConditionSets和parentDataSet.dsConditionSets比较，新的放在一个新的list返回。同时，由于JPA操作的关系，需要设置新的ConditionSet的父级是谁，就是parentDataSet了。
     *
     * @param newDsConditionSetEntities 新的要添加的conditionSets，但可能部分和现有的已经重复了。
     * @param parentDataSetEntity       提供两个功能：dsConditionSets作为基础比较哪些是新的，还有本身作为和新conditionSet的关联对象。
     * @return
     */
    public static List<DsConditionSetEntity> getNewConditionSets(List<DsConditionSetEntity> newDsConditionSetEntities, DataSetEntity parentDataSetEntity) {
        List<DsConditionSetEntity> toAddCondSets = new ArrayList<DsConditionSetEntity>();
        if (CollectionUtils.isNotEmpty(newDsConditionSetEntities)) {
            // 遍历数据库的数据集
            for (DsConditionSetEntity newCs : newDsConditionSetEntities) {
                boolean isNewTarget = true; // 目标有没有要覆盖的对象。如果最后发现没有，就把这个对象从目标移除。
                for (DsConditionSetEntity conditionSet : parentDataSetEntity.getDsConditionSetEntities()) {

                    /**
                     * 遍历源list。毕竟是两个list，不一定一一对应。
                     * 如果对于target A，遍历了origList都没有，则把A从target list移除。
                     * 如果有，则把orig list的A，覆盖target list的A。
                     */
                    if (conditionSet.getName().equalsIgnoreCase(newCs.getName())) {
                        isNewTarget = false;
                        break;
                    }
                }
                // 如果转了一圈，数据库都没有对应的，则新增。
                if (isNewTarget) {
                    newCs.setDataSetEntity(parentDataSetEntity);
                    toAddCondSets.add(newCs);
                }
            }
        }
        return toAddCondSets;
    }

    /**
     * 合并两个ConditionSet列表. 包括:
     * - ConditionSet的name一样的, 当做同一个. 新的值覆盖旧的, 更新操作.
     * - 如果origConditionSets不包含, 则移除.
     * <p style='color: red'>
     * 不处理新增的，这里只是合并！
     * 不包括处理新增的(origConditionSets 有的而 targetConditionSets没有). 另外处理.
     * </p>
     * <p>
     * 针对ConditionSet中的condition list，不做更新操作。每次都全部删除，再重新插入。
     * </p>
     *
     * @param origConditionSets
     * @param targetConditionSets
     * @return
     */
    public static List<DsConditionSetEntity> copyConditionSet(List<DsConditionSetEntity> origConditionSets, List<DsConditionSetEntity> targetConditionSets) {
        List<DsConditionSetEntity> toRemoveCSets = new ArrayList<DsConditionSetEntity>();
        List<DsConditionSetEntity> newCSs = origConditionSets;
        if (CollectionUtils.isNotEmpty(targetConditionSets)) {
            // 遍历数据库的数据集
            for (DsConditionSetEntity conditionSet : targetConditionSets) {
                boolean isInTarget = false; // 目标有没有要覆盖的对象。如果最后发现没有，就把这个对象从目标移除。
                if (CollectionUtils.isNotEmpty(newCSs)) {
                    for (DsConditionSetEntity newCs : newCSs) {
                        /**
                         * 遍历源list。毕竟是两个list，不一定一一对应。
                         * 如果对于target A，遍历了origList都没有，则把A从target list移除。
                         * 如果有，则把orig list的A，覆盖target list的A。
                         */
                        if (conditionSet.getName().equalsIgnoreCase(newCs.getName())) {
                            isInTarget = true;
                            BeanUtils.copyProperties(newCs, conditionSet, "id", "dsConditionEntities", "dataSetEntity");
                            /**
                             * 针对ConditionSet中的condition list，不做更新操作。每次都全部删除，再重新插入。
                             */
                            if (CollectionUtils.isEmpty(conditionSet.getDsConditionEntities())) {
                                conditionSet.setDsConditionEntities(new ArrayList<DsConditionEntity>());
                            }
                            // 清空ConditionSet中全部condition
                            conditionSet.getDsConditionEntities().clear();
                            // 加入新的condition
                            if (CollectionUtils.isNotEmpty(newCs.getDsConditionEntities())) {
                                for (DsConditionEntity newCondition : newCs.getDsConditionEntities()) {
                                    newCondition.setDsConditionSetEntity(conditionSet);
                                    conditionSet.getDsConditionEntities().add(newCondition);
                                }
                            }
                            break;
                        }
                    }
                }
                // 如果转了一圈，XML都没有对应的，则删掉。
                if (!isInTarget) {
                    toRemoveCSets.add(conditionSet);
                }
            }
            // 清除：XML没有，而数据库有的DataSet
            targetConditionSets.removeAll(toRemoveCSets);
        }
        return null;
    }

    /**
     * 输入的value是原始值（string等），通过寻找对应的数据集获取匹配（value相等）的对象。
     * 把value处理一下，根据对应的数据集，看有没有对应value的text。有，则作转换。
     * 例如：
     * 如果数据集里，有value=1，text=一级菜单，则把对象作为值返回。
     *
     * @param origValue     原始值。这个一般为string。
     * @param dataSetId 数据集id。通过获取数据集的数据，返回匹配value的项。
     * @return
     */
    private static Object getValueFromDS(Object origValue, String dataSetId) {
        Object newValue = origValue;
        if (origValue != null) {
            if (StringUtils.isNotEmpty(dataSetId)) {
                GaeaDataSet gaeaDataSet = SystemDataSetFactory.getDataSet(dataSetId);
                if (gaeaDataSet != null) {
                    List<DataItem> dsDatas = gaeaDataSet.getStaticResults();
                    if (dsDatas != null) {
                        // 遍历数据集
                        for (DataItem dataItem : dsDatas) {
                            if (dataItem.getValue() != null && dataItem.getValue().equalsIgnoreCase(String.valueOf(origValue))) {
                                newValue = dataItem;
                            }
                        }
                    }
                }
            }
        }
        return newValue;
    }
}

