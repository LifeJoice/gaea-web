package org.gaea.framework.web.service;

import org.springframework.http.MediaType;
import org.springframework.util.MultiValueMap;

import java.io.IOException;
import java.util.Map;

/**
 * Created by iverson on 2017年12月13日 星期三
 */
public interface GaeaHttpService {
    Map httpGet(String url, Map<String, ?> uriVariables, MultiValueMap<String, String> params);

    Map httpPost(String url, Map<String, ?> uriVariables, Map<String, String> params, MediaType contentType) throws IOException;
}
