package org.gaea.framework.web.service.impl;

import org.gaea.framework.web.service.GaeaHttpService;
import org.gaea.util.GaeaJacksonUtils;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpEntity;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.stereotype.Component;
import org.springframework.util.MultiValueMap;
import org.springframework.web.client.RestTemplate;
import org.springframework.web.util.UriComponents;
import org.springframework.web.util.UriComponentsBuilder;

import java.io.IOException;
import java.net.URI;
import java.util.Map;

/**
 * 提供Restful接口相关调用的功能。
 * Created by iverson on 2017年12月4日 星期一
 */
@Component
public class GaeaHttpServiceImpl implements GaeaHttpService {
    private final Logger logger = LoggerFactory.getLogger(GaeaHttpServiceImpl.class);
    //    private final CloseableHttpClient httpClient;
    @Autowired
    private RestTemplate restTemplate;

    /**
     * 在启动时初始化
     */
//    public GaeaHttpServiceImpl(){
//        PoolingHttpClientConnectionManager cm = new PoolingHttpClientConnectionManager();
//        // 将最大连接数增加到200
//        cm.setMaxTotal(200);
//        // 将每个路由基础的连接增加到20
//        cm.setDefaultMaxPerRoute(20);
//        //将目标主机的最大连接数增加到50
////        HttpHost localhost = new HttpHost("www.yeetrack.com", 80);
////        cm.setMaxPerRoute(new HttpRoute(localhost), 50);
//
//        httpClient = HttpClients.custom()
//                .setConnectionManager(cm)
//                .build();
//    }

    /**
     * 以HTTP GET的方式获取数据。
     *
     * @param url          基础URL。不带参数。
     * @param uriVariables
     * @param params
     * @return
     */
    @Override
    public Map httpGet(String url, Map<String, ?> uriVariables, MultiValueMap<String, String> params) {
        // 负责拼凑带请求参数的URL
        UriComponents uriComponents = UriComponentsBuilder.fromHttpUrl(url).queryParams(params).build();
        URI uri = uriComponents.toUri();
        Map responseMap;
        if (uriVariables == null) {
            responseMap = restTemplate.getForObject(uri, Map.class);
        } else {
            responseMap = restTemplate.getForObject(url, Map.class, uriVariables);
        }
        return responseMap;
    }

    /**
     * 以HTTP POST的方式获取数据。
     *
     * @param url          基础URL。不带参数。
     * @param uriVariables
     * @param params
     * @param contentType
     * @return
     * @throws IOException
     */
    @Override
    public Map httpPost(String url, Map<String, ?> uriVariables, Map<String, String> params, MediaType contentType) throws IOException {

        HttpHeaders headers = new HttpHeaders();
        // 默认请求头类型为application/json
        if (contentType == null) {
            contentType = MediaType.APPLICATION_JSON_UTF8;
        }
        headers.setContentType(contentType);
        // 请求数据转json字符. 先实现这一种，以后的再扩展。
        String requestJsonParams = GaeaJacksonUtils.parse(params);
        HttpEntity<String> request = new HttpEntity<String>(requestJsonParams, headers);

        Map responseMap;
        if (uriVariables == null) {
            responseMap = restTemplate.postForObject(url, request, Map.class);
        } else {
            responseMap = restTemplate.postForObject(url, request, Map.class, uriVariables);
        }
        return responseMap;
    }

//    /**
//     * 执行请求
//     *
//     * @param url          请求地址
//     * @param method       请求方式
//     * @param httpHeaders  请求头
//     * @param body         要提交的数据
//     * @param responseType 返回数据类型，例：new ParameterizedTypeReference<List<Bean>>(){}
//     *                     返回bean时指定Class
//     * @param uriVariables url自动匹配替换的参数，如url为api/{a}/{b},参数为["1","2"],则解析的url为api/1/2，使用Map参数时，遵循按key匹配
//     * @return 结果对象
//     * @throws RestClientException RestClient异常，包含状态码和非200的返回内容
//     */
//    public <T> T exchange(String url, HttpMethod method, HttpHeaders httpHeaders, Object body, ParameterizedTypeReference<T> responseType, Object... uriVariables) throws RestClientException, ProcessFailedException {
//        try {
//            org.springframework.http.HttpEntity<?> requestEntity = new org.springframework.http.HttpEntity(body, httpHeaders);
//            requestEntity = convert(requestEntity);
//
//            if (uriVariables.length == 1 && uriVariables[0] instanceof Map) {
//                Map<String, ?> _uriVariables = (Map<String, ?>) uriVariables[0];
//                return restTemplate.exchange(url, method, requestEntity, responseType, _uriVariables).getBody();
//            }
//
//            return restTemplate.exchange(url, method, requestEntity, responseType, uriVariables).getBody();
//        } catch (Exception e) {
//            throw new ProcessFailedException("通过API获取数据失败！", e);
//        }
//    }
//
//    /**
//     * 执行请求
//     *
//     * @param url          请求地址
//     * @param method       请求方式
//     * @param httpHeaders  请求头
//     * @param body         要提交的数据
//     * @param responseType 返回数据类型
//     *                     返回bean时指定Class
//     * @param uriVariables url自动匹配替换的参数，如url为api/{a}/{b},参数为["1","2"],则解析的url为api/1/2，使用Map参数时，遵循按key匹配
//     * @return 结果对象
//     * @throws RestClientException RestClient异常，包含状态码和非200的返回内容
//     */
//    public <T> T exchange(String url, HttpMethod method, HttpHeaders httpHeaders, Object body, Class<T> responseType, Object... uriVariables) throws RestClientException {
//        try {
//            org.springframework.http.HttpEntity<?> requestEntity = new org.springframework.http.HttpEntity(body, httpHeaders);
//            requestEntity = convert(requestEntity);
//
//            if (uriVariables.length == 1 && uriVariables[0] instanceof Map) {
//                Map<String, ?> _uriVariables = (Map<String, ?>) uriVariables[0];
//                return restTemplate.exchange(url, method, requestEntity, responseType, _uriVariables).getBody();
//            }
//
//            return restTemplate.exchange(url, method, requestEntity, responseType, uriVariables).getBody();
//        } catch (Exception e) {
//            throw new RestClientException(e);
//        }
//    }

}
