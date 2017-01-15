package org.gaea.framework.web.data.service;

import org.gaea.data.dataset.domain.GaeaDataSet;
import org.gaea.exception.SystemConfigException;
import org.gaea.exception.ValidationFailedException;
import org.gaea.framework.web.data.authority.DsAuthorityResult;
import org.springframework.stereotype.Service;

/**
 * 负责数据集权限校验的service。
 * Created by iverson on 2016/12/22.
 */
@Service
public interface SystemDataSetAuthorityService {
    DsAuthorityResult authority(GaeaDataSet gaeaDataSet, String loginName) throws ValidationFailedException, SystemConfigException;
}
