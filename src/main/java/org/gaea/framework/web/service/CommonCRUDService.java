package org.gaea.framework.web.service;

import org.gaea.exception.SysLogicalException;
import org.gaea.exception.SystemConfigException;
import org.gaea.exception.ValidationFailedException;
import org.springframework.transaction.annotation.Transactional;

/**
 * Created by Iverson on 2015/8/11.
 */
public interface CommonCRUDService {
    void deleteById(String urSchemaId, String gridId, String recordId, String wfProcInstId, String deleteReason) throws ValidationFailedException, SysLogicalException, SystemConfigException;

    @Transactional
    void pseudoDeleteById(String urSchemaId, String gridId, String recordId, String wfProcInstId,
                          String deleteReason) throws ValidationFailedException, SysLogicalException, SystemConfigException;
}
