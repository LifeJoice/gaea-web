package org.gaea.framework.web.data.service;

import org.gaea.exception.ProcessFailedException;
import org.gaea.exception.ValidationFailedException;
import org.gaea.framework.web.data.authority.entity.DsAuthorityEntity;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Map;

/**
 * Created by iverson on 2017/7/3.
 */
public interface SystemDsAuthorityMgrService {
    Map loadEditData(String dsAuthorityId) throws ProcessFailedException;

    void saveDsAuthority(DsAuthorityEntity dsAuthority) throws ValidationFailedException;

    void updateDsAuthority(DsAuthorityEntity dsAuthority) throws ValidationFailedException;

    void delete(List<DsAuthorityEntity> dsAuthorityList) throws ValidationFailedException;
}
