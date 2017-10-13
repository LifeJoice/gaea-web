package org.gaea.framework.web.schema.service;

import org.gaea.data.dataset.domain.ConditionSet;
import org.gaea.data.dataset.domain.GaeaDataSet;
import org.gaea.data.domain.DataSetCommonQueryConditionDTO;
import org.gaea.exception.*;
import org.gaea.framework.web.schema.domain.GaeaXmlSchema;
import org.springframework.context.ApplicationContext;
import org.xml.sax.SAXException;

import javax.xml.parsers.ParserConfigurationException;
import java.io.IOException;
import java.lang.reflect.InvocationTargetException;
import java.util.LinkedHashMap;
import java.util.List;

/**
 * Created by iverson on 2017/3/30.
 */
public interface GaeaXmlSchemaService {
    String getJsonSchema(ApplicationContext springApplicationContext, String viewSchemaPath, String loginName) throws IllegalAccessException, ParserConfigurationException, IOException, SysInitException, SAXException, InvocationTargetException, ValidationFailedException, InvalidDataException, SystemConfigException;

    String getJsonSchema(GaeaXmlSchema gaeaXML, String loginName, LinkedHashMap<ConditionSet, DataSetCommonQueryConditionDTO> conditionSetMap) throws ValidationFailedException, InvalidDataException, SystemConfigException;

    String getJsonSchema(String schemaId, DataSetCommonQueryConditionDTO queryConditionDTO, String loginName) throws SysInitException, ValidationFailedException, InvalidDataException, SystemConfigException, SysLogicalException, ProcessFailedException;

    LinkedHashMap<ConditionSet, DataSetCommonQueryConditionDTO> getConditionSets(GaeaDataSet gaeaDataSet, List<DataSetCommonQueryConditionDTO> queryConditionDTOList, boolean isStrictMatchAll) throws ProcessFailedException, SysInitException;
}
