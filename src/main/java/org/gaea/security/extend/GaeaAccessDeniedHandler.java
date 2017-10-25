package org.gaea.security.extend;

import com.fasterxml.jackson.databind.ObjectMapper;
import org.gaea.framework.web.common.ResponseJsonMessage;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.security.web.access.AccessDeniedHandler;

import javax.servlet.ServletException;
import javax.servlet.http.HttpServletRequest;
import javax.servlet.http.HttpServletResponse;
import java.io.IOException;

/**
 * 专门负责由Spring security验证不通过导致的异常
 * Created by iverson on 2017/10/25.
 */
public class GaeaAccessDeniedHandler implements AccessDeniedHandler {
    private final Logger logger = LoggerFactory.getLogger(GaeaAccessDeniedHandler.class);
    @Autowired
    private ObjectMapper objectMapper;

    /**
     * 这个处理GaeaAccessDecisionManager用户权限验证失败的。返回json给前端。因为Gaea前端都基于json处理成功失败。
     *
     * @param request
     * @param response
     * @param accessDeniedException
     * @throws IOException
     * @throws ServletException
     */
    @Override
    public void handle(HttpServletRequest request, HttpServletResponse response, AccessDeniedException accessDeniedException) throws IOException, ServletException {
        response.setHeader("Content-Type", "application/json;charset=utf-8");
        response.setStatus(HttpServletResponse.SC_FORBIDDEN);
        ResponseJsonMessage responseJsonMessage = new ResponseJsonMessage(response.getStatus(), accessDeniedException.getMessage(), "");
//        response.getWriter().print("{\"code\":1,\"message\":\""+exception.getMessage()+"\"}");
        objectMapper.writeValue(response.getWriter(), responseJsonMessage);
        response.getWriter().flush();
    }
}
