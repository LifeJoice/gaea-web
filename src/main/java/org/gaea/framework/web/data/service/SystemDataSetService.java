package org.gaea.framework.web.data.service;

import com.fasterxml.jackson.core.JsonProcessingException;
import org.gaea.exception.InvalidDataException;
import org.gaea.exception.SysInitException;
import org.gaea.exception.SystemConfigException;
import org.gaea.exception.ValidationFailedException;
import org.gaea.framework.web.schema.domain.DataSet;
import org.gaea.framework.web.schema.domain.view.SchemaColumn;
import org.gaea.framework.web.schema.domain.view.SchemaGrid;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.util.LinkedCaseInsensitiveMap;

import java.util.List;
import java.util.Map;

/**
 * Created by iverson on 2016-12-10 15:21:13.
 */
public interface SystemDataSetService {
    void initDataSetSystem();

    void synchronizeCacheToDB() throws SysInitException, JsonProcessingException;

    @Transactional(readOnly = true)
    void synchronizeDBDataSet();

    DataSet queryDataAndTotalElement(DataSet ds, String strPageSize, String loginName) throws InvalidDataException, SystemConfigException, ValidationFailedException;

    /**
     * 对数据库查出来的数据结果进行处理。不能直接把数据库字段名返回到前端，而是使用别名。<p/>
     * 由于结果集是“数据库字段名:值”的键值对。直接把结果集转换json返回前端会暴露数据库的设计。<p/>
     * 所以需要把结果集中的数据库字段名改为别名，即column.name
     * <p>
     * columnMap的key之所以为DB-COLUMN-NAME，是因为这个方法本身就是把data的key，从数据库字段名改为xml column name的。<br/>
     * 在转换之前,无法通过data的key(这时候还是db column name),去找column(如果key是xml column name的话).
     * </p>
     *
     * @param dataList               sql查询的数据列表。一行 = Map < 字段名 ： 字段值 >
     * @param columnMap              Map< db_column_name : schemaColumn >
     * @param displayUndefinedColumn 是否显示XML Schema中未定义的列。如果是，则key以数据库字段名返回。
     * @param isDsTranslate          是否需要对列进行数据集转换。例如是列表页之类的，可能是需要的；但如果是表单编辑的，那就不需要。否则填充值的时候会比较麻烦。
     * @return Map. key: 大写的column name.
     */
    List<Map<String, Object>> changeDbColumnNameInData(List<Map<String, Object>> dataList, LinkedCaseInsensitiveMap<SchemaColumn> columnMap, boolean displayUndefinedColumn, boolean isDsTranslate);

    /**
     * 对数据库查出来的数据结果进行处理。不能直接把数据库字段名返回到前端，而是使用别名。<p/>
     * 由于结果集是“数据库字段名:值”的键值对。直接把结果集转换json返回前端会暴露数据库的设计。<p/>
     * 所以需要把结果集中的数据库字段名改为别名，即column.name
     *
     * @param dataList
     * @param grid
     * @param isDsTranslate 是否需要对列进行数据集转换。例如是列表页之类的，可能是需要的；但如果是表单编辑的，那就不需要。否则填充值的时候会比较麻烦。
     * @return
     * @throws ValidationFailedException
     */
    List<Map<String, Object>> changeDbColumnNameInData(List<Map<String, Object>> dataList, SchemaGrid grid, boolean isDsTranslate) throws ValidationFailedException;
}
