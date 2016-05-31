package org.gaea.data.controller;

import org.apache.commons.lang3.StringUtils;
import org.gaea.data.dataset.domain.GaeaDsResultConfig;
import org.gaea.data.dataset.service.GaeaDataSetService;
import org.gaea.exception.ValidationFailedException;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Controller;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.ResponseBody;

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

    @RequestMapping("/get")
    @ResponseBody
    public List<Map<String, Object>> getDsData(GaeaDsResultConfig resultConfig) throws ValidationFailedException {
        if(resultConfig==null || StringUtils.isEmpty(resultConfig.getDsId())){
            logger.debug("无法获取到请求的<结果集配置/dsId>，返回空。");
            return null;
        }
        List<Map<String, Object>> results = null;
        results = gaeaDataSetService.getCommonResults(resultConfig);
        return results;
    }
}
