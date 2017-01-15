package org.gaea.framework.web.data.service;

import org.gaea.exception.InvalidDataException;
import org.gaea.exception.SysInitException;
import org.gaea.exception.SystemConfigException;
import org.gaea.exception.ValidationFailedException;
import org.gaea.framework.web.schema.domain.DataSet;
import org.springframework.transaction.annotation.Transactional;

/**
 * Created by iverson on 2016-12-10 15:21:13.
 */
public interface SystemDataSetService {
    void initDataSetSystem();

    void synchronizeCacheToDB() throws SysInitException;

    @Transactional(readOnly = true)
    void synchronizeDBDataSet();

    DataSet queryDataAndTotalElement(DataSet ds, String strPageSize, String loginName) throws InvalidDataException, SystemConfigException, ValidationFailedException;
}
