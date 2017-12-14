package org.gaea.demo.controller;

import org.gaea.exception.InvalidDataException;
import org.gaea.exception.SysInitException;
import org.gaea.exception.SystemConfigException;
import org.gaea.exception.ValidationFailedException;
import org.gaea.framework.web.service.ApiDataSourceQueryService;
import org.gaea.framework.web.service.GaeaHttpService;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Controller;
import org.springframework.web.bind.annotation.RequestMapping;

import java.io.IOException;

/**
 * 演示通过Restful接口获取数据构造列表。
 * Created by iverson on 2017年12月3日 星期日
 */
@Controller
@RequestMapping("/gaea/demo/api-ds")
public class DemoApiDataSetController {

    private final Logger logger = LoggerFactory.getLogger(DemoApiDataSetController.class);
    @Autowired
    private GaeaHttpService gaeaHttpService;
    @Autowired
    private ApiDataSourceQueryService apiDataSourceQueryService;

    @RequestMapping("/management")
    public String list() throws IOException, SystemConfigException, ValidationFailedException, SysInitException, InvalidDataException {

        // ----------------------------------------------------------------- test 1 -----------------------------------------------------------------
//        MultiValueMap<String, String> params = new LinkedMultiValueMap<String, String>();
//        params.add("start","1");
//        params.add("limit","10");
//        gaeaHttpUtils.httpGet("http://pms.ma-test.com/api/coupon/schemas", null, params);
//
//        Map<String, String> params2 = new HashMap<String, String>();
//        params2.put("page","1");
//        params2.put("limit","15");
//        gaeaHttpUtils.httpPost("http://pms.ma-test.com/api/rebate/page",null, params2,null);
//
//        GaeaDataSet gaeaDataSet = SystemDataSetFactory.getDataSet("DEMO_API_DATA_MANAGEMENT");
//        PageResult pageResultSet = apiDataSourceQueryService.query(gaeaDataSet, null, new SchemaGridPage(1, 20), null);


        return "demo/demo_api_data_management.xml";
    }
}
