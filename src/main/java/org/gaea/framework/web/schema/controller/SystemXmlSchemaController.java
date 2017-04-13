package org.gaea.framework.web.schema.controller;

import org.apache.commons.lang3.StringUtils;
import org.gaea.data.dataset.domain.GaeaDataSet;
import org.gaea.exception.InvalidDataException;
import org.gaea.exception.SysInitException;
import org.gaea.exception.SystemConfigException;
import org.gaea.exception.ValidationFailedException;
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
    public String getDsData(String schemaId, String conditions,
                            HttpServletRequest request, HttpServletResponse response) throws SystemConfigException, ValidationFailedException, SysInitException, InvalidDataException {
        if (StringUtils.isEmpty(schemaId)) {
            throw new InvalidDataException("缺少Schema id，无法获取schema定义和数据！");
        }
        String loginName = GaeaWebSecuritySystem.getUserName(request);
        String jsonSchema = gaeaXmlSchemaService.getJsonSchema(schemaId, loginName);
//        // 获取数据集定义。可能从数据库读，也可能从缓存获取。
//        GaeaDataSet dataSetDef = SystemDataSetFactory.getDataSet(resultConfig.getDsId());
//        List<Map<String, Object>> results = null;
//        // 【重构】
//        // 整合CommonViewQueryController和当前方法两种数据集查询方式。一个是通过SQL，一个更多是静态。
//        // todo 后续应该整合到service中
//        if (StringUtils.isEmpty(dataSetDef.getSql())) {
//            results = gaeaDataSetService.getCommonResults(resultConfig);
//        } else {
//            results = commonViewQueryController.queryByConditions(schemaId, conditions, resultConfig.getDsId(), request, response);
//        }
        return jsonSchema;
    }
}
