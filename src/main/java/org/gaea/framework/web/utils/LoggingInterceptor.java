package org.gaea.framework.web.utils;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.http.HttpRequest;
import org.springframework.http.client.ClientHttpRequestExecution;
import org.springframework.http.client.ClientHttpRequestInterceptor;
import org.springframework.http.client.ClientHttpResponse;

import java.io.BufferedReader;
import java.io.IOException;
import java.io.InputStreamReader;

/**
 * 这个是协助RestTemplate进行接口API调试的。
 * 因为通过RestTemplate发起的请求，不清楚最终的报文格式，有时候无法定位具体的问题。
 * Created by iverson on 2017年12月6日 星期三
 */
public class LoggingInterceptor implements ClientHttpRequestInterceptor {

    final Logger logger = LoggerFactory.getLogger(LoggingInterceptor.class);

    @Override
    public ClientHttpResponse intercept(HttpRequest request, byte[] body, ClientHttpRequestExecution execution) throws IOException {
        traceRequest(request, body);
        ClientHttpResponse response = execution.execute(request, body);
//            traceResponse(response);
        return response;
    }

    private void traceRequest(HttpRequest request, byte[] body) throws IOException {
        logger.debug(" =========================== request begin ===========================");
        logger.debug("URI         : {}", request.getURI());
        logger.debug("Method      : {}", request.getMethod());
        logger.debug("Headers     : {}", request.getHeaders());
        logger.debug("Request body: {}", new String(body, "UTF-8"));
        logger.debug(" =========================== request end ===========================");
    }

    /**
     * <p style='color:red'>
     * 这个不可用，仅供参考！<br/>
     * 因为response.getBody()是流，如果这里读出了，返回的对象就没有body了。这样后面的逻辑就处理不了了。
     * </p>
     *
     * @param response
     * @throws IOException
     */
    private void traceResponse(ClientHttpResponse response) throws IOException {
        StringBuilder inputStringBuilder = new StringBuilder();
        BufferedReader bufferedReader = new BufferedReader(new InputStreamReader(response.getBody(), "UTF-8"));
        String line = bufferedReader.readLine();
        while (line != null) {
            inputStringBuilder.append(line);
            inputStringBuilder.append('\n');
            line = bufferedReader.readLine();
        }
        logger.debug("=========================== response begin ===========================");
        logger.debug("Status code  : {}", response.getStatusCode());
        logger.debug("Status text  : {}", response.getStatusText());
        logger.debug("Headers      : {}", response.getHeaders());
        logger.debug("Response body: {}", inputStringBuilder.toString());
        logger.debug("=========================== response end ===========================");
    }

}
