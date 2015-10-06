package org.gaea.framework.web.service;

import org.gaea.framework.common.exception.SysLogicalException;
import org.gaea.framework.common.exception.ValidationFailedException;

/**
 * Created by Iverson on 2015/8/11.
 */
public interface CommonCRUDService {
    void deleteById(String urSchemaId, String gridId, Long recordId, String wfProcInstId, String deleteReason) throws ValidationFailedException, SysLogicalException;
}
