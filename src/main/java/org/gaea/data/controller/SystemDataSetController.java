package org.gaea.data.controller;

import com.fasterxml.jackson.databind.ObjectMapper;
import org.apache.commons.lang3.StringUtils;
import org.gaea.data.dataset.domain.GaeaDsResultConfig;
import org.gaea.data.dataset.service.GaeaDataSetService;
import org.gaea.data.domain.DataSetCommonQueryConditionDTO;
import org.gaea.exception.SysInitException;
import org.gaea.exception.SysLogicalException;
import org.gaea.exception.SystemConfigException;
import org.gaea.exception.ValidationFailedException;
import org.gaea.framework.web.bind.annotation.RequestBean;
import org.gaea.framework.web.bind.annotation.RequestBeanDataType;
import org.gaea.framework.web.controller.CommonViewQueryController;
import org.gaea.framework.web.data.service.SystemDataSetService;
import org.gaea.framework.web.service.CommonViewQueryService;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Controller;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.ResponseBody;

import javax.servlet.http.HttpServletRequest;
import javax.servlet.http.HttpServletResponse;
import java.util.List;

/**
 * Created by iverson on 2016/5/20.
 */
@Controller
@RequestMapping("/gaea/data/ds")
public class SystemDataSetController {
    private final Logger logger = LoggerFactory.getLogger(SystemDataSetController.class);
    @Autowired
    private GaeaDataSetService gaeaDataSetService;
    @Autowired
    private CommonViewQueryController commonViewQueryController;
    @Autowired
    private ObjectMapper objectMapper;
    @Autowired
    private CommonViewQueryService commonViewQueryService;
    @Autowired
    private SystemDataSetService systemDataSetService;

    /**
     * 暂时来说，整合了CommonViewQueryController的查询。通过数据集定义SQL是否为空，来确定走哪一个查询。
     *
     * @param resultConfig
     * @param schemaId
     * @param queryConditionDTO
     * @param request
     * @param response
     * @return
     * @throws ValidationFailedException
     * @throws SysLogicalException
     * @throws SysInitException
     */
    @RequestMapping("/get")
    @ResponseBody
    public List getDsData(GaeaDsResultConfig resultConfig, String schemaId, @RequestBean(value = "conditions", dataType = RequestBeanDataType.JSON) DataSetCommonQueryConditionDTO queryConditionDTO,
                          HttpServletRequest request, HttpServletResponse response) throws ValidationFailedException, SysLogicalException, SysInitException, SystemConfigException {
        if (resultConfig == null || StringUtils.isEmpty(resultConfig.getDsId())) {
            logger.debug("无法获取到请求的<结果集配置/dsId>，返回空。");
            return null;
        }
        return systemDataSetService.getData(resultConfig, schemaId, queryConditionDTO);
    }
}
