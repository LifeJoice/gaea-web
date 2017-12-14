package org.gaea.framework.web.service.impl;

import org.apache.commons.lang3.StringUtils;
import org.apache.commons.lang3.math.NumberUtils;
import org.gaea.data.dataset.domain.*;
import org.gaea.data.domain.DataSetCommonQueryConditionDTO;
import org.gaea.exception.InvalidDataException;
import org.gaea.exception.SysInitException;
import org.gaea.exception.SystemConfigException;
import org.gaea.exception.ValidationFailedException;
import org.gaea.framework.web.schema.domain.PageResult;
import org.gaea.framework.web.schema.domain.SchemaGridPage;
import org.gaea.framework.web.service.ApiDataSourceQueryService;
import org.gaea.framework.web.service.GaeaHttpService;
import org.gaea.util.GaeaCollectionUtils;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.io.IOException;
import java.util.*;

/**
 * Created by iverson on 2017年12月3日 星期日
 */
@Service
public class ApiDataSourceQueryServiceImpl implements ApiDataSourceQueryService {
    private final Logger logger = LoggerFactory.getLogger(ApiDataSourceQueryService.class);
    @Autowired
    private GaeaHttpService gaeaHttpService;

    /**
     * 根据XmlApiDataSource定义调用Restful接口获取数据。
     *
     * @param gaeaDataSet
     * @param conditionSetMap
     * @param page
     * @param loginName
     * @return
     * @throws ValidationFailedException
     * @throws InvalidDataException
     * @throws SystemConfigException
     * @throws SysInitException
     */
    @Override
    public PageResult query(GaeaDataSet gaeaDataSet, LinkedHashMap<ConditionSet, DataSetCommonQueryConditionDTO> conditionSetMap, SchemaGridPage page, String loginName) throws ValidationFailedException, InvalidDataException, SystemConfigException, SysInitException {
        if (gaeaDataSet == null || gaeaDataSet.getApiDataSource() == null) {
            return null;
        }
        XmlApiDataSource apiDataSource = gaeaDataSet.getApiDataSource();
        return getData(apiDataSource, page);
    }

    /**
     * 根据apiDataSource定义和page定义，通过Restful接口获取带分页的数据。
     *
     * @param apiDataSource
     * @param page
     * @return
     * @throws SystemConfigException
     */
    public PageResult getData(XmlApiDataSource apiDataSource, SchemaGridPage page) throws SystemConfigException {
        if (apiDataSource == null || apiDataSource.getRequest() == null) {
            return null;
        }
        PageResult pageResult = new PageResult();
        XmlApiRequest apiDsRequest = apiDataSource.getRequest(); // 请求的配置项
        XmlApiResponse apiDsResponse = apiDataSource.getResponse(); // 返回的配置项
        XmlApiResponseData apiResponseData = (apiDsResponse.getDataExtract() == null || apiDsResponse.getDataExtract().getApiResponseData() == null) ?
                null : apiDsResponse.getDataExtract().getApiResponseData(); // 返回的数据提取配置项

        if (StringUtils.isEmpty(apiDsRequest.getUrl())) {
            logger.debug("<api-data-source>未配置请求URL地址，请求失败！");
            return null;
        }
        // 调Restful接口获取数据
        Map response = getData(apiDsRequest.getUrl(), apiDsRequest.getApiPage(), page, apiDataSource.getRequestType());
        // 解析返回的数据
        Object responseData = null;
        List responseDataList = null;
        long totalElements = 0;
        if (response != null) {
            responseData = response.get(apiResponseData.getParamName());
            XmlApiPage responsePage = apiDsResponse.getDataExtract().getApiPage();
            // 获取总记录数
            if (responsePage != null && response.get(responsePage.getTotalElementsParamName()) != null && NumberUtils.isNumber(String.valueOf(response.get(responsePage.getTotalElementsParamName())))) {
                totalElements = Long.parseLong(String.valueOf(response.get(responsePage.getTotalElementsParamName())));
            }
        }
        // 把response中数据部分（response可能有其他一些信息）放入结果
        if (responseData instanceof List) {
            responseDataList = (List) responseData;
        } else if (responseData != null) {
            // 如果不是列表，当成一个对象放入一个列表中
            responseDataList = new ArrayList();
            responseDataList.add(responseData);
        }
        pageResult.setSize(page.getSize());
        pageResult.setPage(page.getPage());
        pageResult.setContent(responseDataList);
        pageResult.setTotalElements(totalElements);

        return pageResult;
    }

    /**
     * 通过Restful接口获取数据。主要判断是用GET还是POST获取数据。构造请求需要的一些条件（例如分页）。
     *
     * @param url
     * @param apiDsPage
     * @param page
     * @param requestType
     * @return
     * @throws SystemConfigException
     */
    private Map getData(String url, XmlApiPage apiDsPage, SchemaGridPage page, String requestType) throws SystemConfigException {
        Map<String, String> requestParams = new HashMap<String, String>();
        // 合并分页的条件
        if (page != null && apiDsPage != null) {
            requestParams.putAll(getPagingConditions(apiDsPage, page));
        }
        Map response = null;
        try {
            // 判断用GET请求还是POST请求
            if (XmlApiDataSource.REQUEST_TYPE_POST.equals(requestType)) {
                response = gaeaHttpService.httpPost(url, null, requestParams, null);
            } else if (XmlApiDataSource.REQUEST_TYPE_GET.equals(requestType)) {
                response = gaeaHttpService.httpGet(url, null, GaeaCollectionUtils.convert(requestParams));
            } else {
                throw new SystemConfigException("<api-data-source>缺少request-type属性配置。无法执行操作！");
            }
        } catch (IOException e) {
            logger.error("通过api-data-source的接口方式获取数据失败！参数：" + requestParams.toString(), e);
        }
        logger.debug("请求RESTFUL接口的返回数据：" + response.toString());
        return response;
    }

    /**
     * <p>
     * 分页接口有两种可能：按页数分(page)，或是按起始位置分(start)。<br/>
     * page（default）:
     * 这种就直接以paramName，加上SchemaGridPage的page为准。<br/>
     * 等于每页多少条定义在gaea框架，不需要通过<api-data-source>定义。<br/>
     * start:
     * 按起始位置，就需要根据页数去计算分页。
     * </p>
     *
     * @param apiDsPage
     * @param page
     * @return
     */
    private Map getPagingConditions(XmlApiPage apiDsPage, SchemaGridPage page) {
        Map<String, String> requestParams = new HashMap<String, String>();
        String pagingBy = apiDsPage.getPagingBy();
        /**
         * 分页接口有两种可能：按页数分(page)，或是按起始位置分(start)。
         * page（default）:
         * 这种就直接以paramName和pageNum为准。
         * start:
         * 按起始位置，就需要根据页数去计算分页。
         */
        if (XmlApiPage.PAGING_BY_START.equals(pagingBy)) {
            int startNum = page.getSize() * (page.getPage() - 1) + apiDsPage.getStartNum();
            requestParams.put(apiDsPage.getParamName(), String.valueOf(startNum));
        } else {
            // paging by page
            // 每页多少条（从SchemaGridPage读取）
            int pageNum = page.getPage();
            if (apiDsPage.getStartNum() > 0) {
                pageNum += apiDsPage.getStartNum(); // 页的起始，从0还是1（或其他）开始
            }
            requestParams.put(apiDsPage.getParamName(), String.valueOf(pageNum));
        }

        // 每页多少条
        requestParams.put(apiDsPage.getSizeParamName(), String.valueOf(page.getSize()));
        return requestParams;
    }

//    public void getData(String paramPath, XmlApiPage apiDsPage, XmlApiDataList apiDsDataList, SchemaGridPage page, String requestType) {
//        Map<String, String> params2 = new HashMap<String, String>();
//        params2.put("page", "1");
//        params2.put("limit", "15");
//        try {
//            Map result = gaeaHttpUtils.httpPost("http://pms.ma-test.com/api/rebate/page", null, params2, null);
//        } catch (IOException e) {
//            e.printStackTrace();
//        }
//    }
}
