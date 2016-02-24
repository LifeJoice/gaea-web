package org.gaea.framework.web.schema.service;

import org.gaea.exception.SysLogicalException;
import org.gaea.framework.web.schema.domain.DataSet;
import org.gaea.framework.web.schema.domain.view.SchemaGrid;

/**
 * 基于XML SCHEMA的DATA内容，提供的对外接口和服务。
 * Created by Iverson on 2015/10/16.
 */
public interface SchemaDataService {
    /**
     * 把根据SCHEMA DATA配置的DATA-SET，根据SCHEMA其他配置，转换为页面显示的数据结果。
     *
     * @param dataSet
     * @param grid
     * @return
     * @throws SysLogicalException
     */
    public DataSet transformViewData(DataSet dataSet, SchemaGrid grid) throws SysLogicalException;
}
