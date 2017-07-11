package org.gaea.framework.web.schema.service;

import org.gaea.data.domain.DataSetCommonQueryConditionDTO;
import org.gaea.db.QueryCondition;
import org.gaea.exception.*;
import org.springframework.context.ApplicationContext;

import java.io.IOException;
import java.util.List;

/**
 * Gaea XML的视图、页面的服务类。主要是把逻辑封装在自己的代码里。不要放在Spring MVC的view中。
 * Created by iverson on 2016/12/30.
 */
public interface GaeaXmlViewService {
//    String getViewContent(ApplicationContext springApplicationContext, String viewSchemaLocation, String schemaName, String loginName)
//            throws ValidationFailedException, IOException, InvalidDataException, SystemConfigException, SysInitException;

    String getViewContent(ApplicationContext springApplicationContext, String viewSchemaPath, String loginName, List<DataSetCommonQueryConditionDTO> queryConditionDTOList)
            throws ValidationFailedException, IOException, InvalidDataException, SystemConfigException, SysInitException, ProcessFailedException;
}
