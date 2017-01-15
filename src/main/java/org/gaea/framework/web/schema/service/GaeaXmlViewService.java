package org.gaea.framework.web.schema.service;

import org.gaea.exception.InvalidDataException;
import org.gaea.exception.SystemConfigException;
import org.gaea.exception.ValidationFailedException;
import org.springframework.context.ApplicationContext;

import java.io.IOException;

/**
 * Gaea XML的视图、页面的服务类。主要是把逻辑封装在自己的代码里。不要放在Spring MVC的view中。
 * Created by iverson on 2016/12/30.
 */
public interface GaeaXmlViewService {
    String getViewContent(ApplicationContext springApplicationContext, String viewSchemaLocation, String schemaName, String loginName)
            throws ValidationFailedException, IOException, InvalidDataException, SystemConfigException;

    String getViewContent(ApplicationContext springApplicationContext, String viewSchemaPath, String loginName)
            throws ValidationFailedException, IOException, InvalidDataException, SystemConfigException;
}
