package org.gaea.framework.web.data.service;

import org.gaea.data.dataset.domain.DataItem;
import org.gaea.exception.ProcessFailedException;
import org.gaea.exception.ValidationFailedException;
import org.gaea.framework.web.data.authority.entity.DsAuthConditionEntity;
import org.gaea.framework.web.data.authority.entity.DsAuthConditionSetEntity;
import org.gaea.framework.web.data.authority.entity.DsAuthorityEntity;
import org.gaea.framework.web.data.domain.DataSetEntity;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Map;

/**
 * Created by iverson on 2017/6/1.
 */
public interface SystemDataSetMgrService {
    void save(DataSetEntity dataSetEntity, List<DataItem> dsDataList) throws ProcessFailedException;

    void update(DataSetEntity inDataSet, List<DataItem> dsDataList) throws ProcessFailedException;

    Map loadEditData(DataSetEntity dataSet) throws ProcessFailedException;

    void delete(List<DataSetEntity> dataSetList) throws ValidationFailedException;
}
