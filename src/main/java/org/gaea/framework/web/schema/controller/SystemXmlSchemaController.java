package org.gaea.framework.web.schema.controller;

import org.apache.commons.lang3.StringUtils;
import org.gaea.data.domain.DataSetCommonQueryConditionDTO;
import org.gaea.exception.*;
import org.gaea.framework.web.bind.annotation.RequestBean;
import org.gaea.framework.web.bind.annotation.RequestBeanDataType;
import org.gaea.framework.web.common.WebCommonDefinition;
import org.gaea.framework.web.schema.service.GaeaXmlSchemaService;
import org.gaea.framework.web.security.GaeaWebSecuritySystem;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Controller;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.ResponseBody;

import javax.servlet.http.HttpServletRequest;
import javax.servlet.http.HttpServletResponse;

/**
 * 主要方便前端通过Schema Id获取XML SCHEMA定义的。主要用于grid的生成。
 * Created by iverson on 2017/3/30.
 */
@Controller
@RequestMapping("/gaea/sys/schema")
public class SystemXmlSchemaController {
    private final Logger logger = LoggerFactory.getLogger(SystemXmlSchemaController.class);
    @Autowired
    private GaeaXmlSchemaService gaeaXmlSchemaService;

    @RequestMapping("/get")
    @ResponseBody
    public String getDsData(String schemaId, @RequestBean(value = WebCommonDefinition.PARAM_NAME_CONDITIONS, dataType = RequestBeanDataType.JSON) DataSetCommonQueryConditionDTO queryConditionDTO,
                            HttpServletRequest request, HttpServletResponse response) throws SystemConfigException, ValidationFailedException, SysInitException, InvalidDataException, SysLogicalException, ProcessFailedException {
        if (StringUtils.isEmpty(schemaId)) {
            throw new InvalidDataException("缺少Schema id，无法获取schema定义和数据！");
        }
        String loginName = GaeaWebSecuritySystem.getUserName(request);
        // 有时候页面可能会带些空值过来，这样的条件对象是不可用的
        if (queryConditionDTO != null && StringUtils.isEmpty(queryConditionDTO.getId())) {
            queryConditionDTO = null;
        }
        String jsonSchema = gaeaXmlSchemaService.getJsonSchema(schemaId, queryConditionDTO, loginName);

        return jsonSchema;
    }
}
