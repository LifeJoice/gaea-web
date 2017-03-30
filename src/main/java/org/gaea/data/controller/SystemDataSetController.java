package org.gaea.data.controller;

import org.apache.commons.lang3.StringUtils;
import org.gaea.data.dataset.domain.GaeaDataSet;
import org.gaea.data.dataset.domain.GaeaDsResultConfig;
import org.gaea.data.dataset.service.GaeaDataSetService;
import org.gaea.data.system.SystemDataSetFactory;
import org.gaea.exception.SysLogicalException;
import org.gaea.exception.ValidationFailedException;
import org.gaea.framework.web.controller.CommonViewQueryController;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Controller;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.ResponseBody;

import javax.servlet.http.HttpServletRequest;
import javax.servlet.http.HttpServletResponse;
import java.util.List;
import java.util.Map;

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

    /**
     * 暂时来说，整合了CommonViewQueryController的查询。通过数据集定义SQL是否为空，来确定走哪一个查询。
     *
     * @param resultConfig
     * @param schemaId
     * @param conditions
     * @param request
     * @param response
     * @return
     * @throws ValidationFailedException
     * @throws SysLogicalException
     */
    @RequestMapping("/get")
    @ResponseBody
    public List<Map<String, Object>> getDsData(GaeaDsResultConfig resultConfig, String schemaId, String conditions,
                                               HttpServletRequest request, HttpServletResponse response) throws ValidationFailedException, SysLogicalException {
        if (resultConfig == null || StringUtils.isEmpty(resultConfig.getDsId())) {
            logger.debug("无法获取到请求的<结果集配置/dsId>，返回空。");
            return null;
        }
        // 获取数据集定义。可能从数据库读，也可能从缓存获取。
        GaeaDataSet dataSetDef = SystemDataSetFactory.getDataSet(resultConfig.getDsId());
        List<Map<String, Object>> results = null;
        // 【重构】
        // 整合CommonViewQueryController和当前方法两种数据集查询方式。一个是通过SQL，一个更多是静态。
        // todo 后续应该整合到service中
        if (StringUtils.isEmpty(dataSetDef.getSql())) {
            results = gaeaDataSetService.getCommonResults(resultConfig);
        } else {
            results = commonViewQueryController.queryByConditions(schemaId, conditions, resultConfig.getDsId(), request, response);
        }
        return results;
    }
}
