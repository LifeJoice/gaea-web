package org.gaea.framework.web.service;

import org.gaea.data.dataset.domain.ConditionSet;
import org.gaea.data.dataset.domain.GaeaDataSet;
import org.gaea.data.domain.DataSetCommonQueryConditionDTO;
import org.gaea.exception.InvalidDataException;
import org.gaea.exception.SysInitException;
import org.gaea.exception.SystemConfigException;
import org.gaea.exception.ValidationFailedException;
import org.gaea.framework.web.schema.domain.PageResult;
import org.gaea.framework.web.schema.domain.SchemaGridPage;

import java.util.LinkedHashMap;

/**
 * Created by iverson on 2017年12月3日 星期日
 */
public interface ApiDataSourceQueryService {
    PageResult query(GaeaDataSet gaeaDataSet, LinkedHashMap<ConditionSet, DataSetCommonQueryConditionDTO> conditionSetMap, SchemaGridPage page, String loginName) throws ValidationFailedException, InvalidDataException, SystemConfigException, SysInitException;
}
