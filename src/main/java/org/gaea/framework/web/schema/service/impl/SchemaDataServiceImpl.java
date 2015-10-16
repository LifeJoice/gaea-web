package org.gaea.framework.web.schema.service.impl;

import org.gaea.framework.common.exception.SysLogicalException;
import org.gaea.framework.web.schema.GaeaSchemaCache;
import org.gaea.framework.web.schema.GaeaXmlSchemaProcessor;
import org.gaea.framework.web.schema.domain.DataSet;
import org.gaea.framework.web.schema.domain.GaeaXmlSchema;
import org.gaea.framework.web.schema.domain.view.SchemaGrid;
import org.gaea.framework.web.schema.service.SchemaDataService;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

/**
 * Created by Iverson on 2015/10/16.
 */
@Service
public class SchemaDataServiceImpl implements SchemaDataService {

    private final Logger logger = LoggerFactory.getLogger(getClass());

    @Autowired
    private GaeaSchemaCache gaeaSchemaCache;
    @Autowired
    private GaeaXmlSchemaProcessor gaeaXmlSchemaProcessor;

    @Override
    public DataSet transformViewData(DataSet dataSet, SchemaGrid grid) throws SysLogicalException {
        DataSet result = gaeaXmlSchemaProcessor.changeDbColumnNameInData(dataSet,grid);
        return result;
    }
}
