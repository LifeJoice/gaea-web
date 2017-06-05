package org.gaea.framework.web.data.service;

import org.gaea.data.dataset.domain.DataItem;
import org.gaea.exception.ProcessFailedException;
import org.gaea.framework.web.data.domain.DataSetEntity;

import java.util.List;
import java.util.Map;

/**
 * Created by iverson on 2017/6/1.
 */
public interface SystemDataSetMgrService {
    void saveOrUpdate(DataSetEntity dataSetEntity, List<DataItem> dsDataList) throws ProcessFailedException;

    Map loadEditData(DataSetEntity dataSet) throws ProcessFailedException;
}
