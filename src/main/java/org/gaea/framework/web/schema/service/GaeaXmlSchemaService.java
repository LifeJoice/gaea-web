package org.gaea.framework.web.schema.service;

import org.gaea.exception.InvalidDataException;
import org.gaea.exception.SysInitException;
import org.gaea.exception.SystemConfigException;
import org.gaea.exception.ValidationFailedException;
import org.gaea.framework.web.schema.domain.GaeaXmlSchema;
import org.springframework.context.ApplicationContext;
import org.xml.sax.SAXException;

import javax.xml.parsers.ParserConfigurationException;
import java.io.IOException;
import java.lang.reflect.InvocationTargetException;

/**
 * Created by iverson on 2017/3/30.
 */
public interface GaeaXmlSchemaService {
    String getJsonSchema(ApplicationContext springApplicationContext, String viewSchemaPath, String loginName) throws IllegalAccessException, ParserConfigurationException, IOException, SysInitException, SAXException, InvocationTargetException, ValidationFailedException, InvalidDataException, SystemConfigException;

    String getJsonSchema(GaeaXmlSchema gaeaXML, String loginName) throws ValidationFailedException, InvalidDataException, SystemConfigException;

    String getJsonSchema(String schemaId, String loginName) throws SysInitException, ValidationFailedException, InvalidDataException, SystemConfigException;
}
