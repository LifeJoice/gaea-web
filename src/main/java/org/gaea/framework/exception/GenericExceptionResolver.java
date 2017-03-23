package org.gaea.framework.exception;

import com.fasterxml.jackson.databind.ObjectMapper;

import java.io.IOException;
import java.util.HashMap;
import java.util.Map;
import javax.servlet.http.HttpServletRequest;
import javax.servlet.http.HttpServletResponse;

import org.gaea.exception.*;
import org.gaea.util.ValidationUtils;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Component;
import org.springframework.web.servlet.HandlerExceptionResolver;
import org.springframework.web.servlet.ModelAndView;

/**
 * 统一的Controller的异常处理。
 * <p>统一拦截后，做个区分</p>
 *
 * @author Iverson 2014-5-5 星期一
 */
@Component
public class GenericExceptionResolver implements HandlerExceptionResolver {

    final Logger logger = LoggerFactory.getLogger(GenericExceptionResolver.class);

    /**
     * 可能并不是最佳实践。
     *
     * @param request
     * @param response
     * @param handler
     * @param ex
     * @return
     */
    @Override
    public ModelAndView resolveException(HttpServletRequest request, HttpServletResponse response, Object handler, Exception ex) {
        ModelAndView mav = new ModelAndView();
        /* 先对异常进行日志处理,避免丢失. */
        logException(ex);
        try {
            /* 相应的状态码设置 */
            response.setStatus(HttpServletResponse.SC_INTERNAL_SERVER_ERROR);// 默认错误 500
            if (isSimpleFailed(ex)) {
                response.setStatus(GaeaException.DEFAULT_FAIL);// 自定义一般校验错误 600
            }
            /* 解决返回json乱码的问题 */
            response.setContentType("text/xml;charset=utf-8");
            /* 使用Jackson2框架的工具类。转换JSON输出。 */
            ObjectMapper mapper = new ObjectMapper();
            /* 获取请求的头，用以判断是否JSON请求 */
            Boolean isJson = false, acceptJson = false, xReqJson = false;
            String requestHeadType = request.getHeader("accept");
            String xRequestedWith = request.getHeader("X-Requested-With");
            /* 判断是否JSON请求 */
            if (!ValidationUtils.isBlank(requestHeadType)) {
                acceptJson = requestHeadType.indexOf("application/json") >= 0;
            }
            if (!ValidationUtils.isBlank(xRequestedWith)) {
                xReqJson = xRequestedWith.indexOf("XMLHttpRequest") >= 0;
            }
            isJson = acceptJson || xReqJson;
//        mav.setViewName("MappingJacksonJsonView");
            Map<String, String> errorMsg = new HashMap<String, String>();
            errorMsg.put("RESULT_MSG", ex.getMessage());
            mav.addAllObjects(errorMsg);
            /**
             * 对请求类型进行区分: 1. 如果是json请求，将结果转换成json返回。 2. 如果不是json请求，则需要跳转页面。
             */
            if (isJson) {
                mapper.writeValue(response.getWriter(), errorMsg);
            } else {
                return new ModelAndView("error", errorMsg);
            }
        } catch (IOException iox) {
            logger.error("自定义的Spring MVC的异常拦截器发生异常！", iox);
        }
        return mav;
    }

    private void logException(Exception ex) {
        if ((ex instanceof InvalidDataException) ||
                (ex instanceof ValidationFailedException) ||
                (ex instanceof ProcessFailedException) ||
                (ex instanceof DataIntegrityViolationException)
                ) {
            logger.warn("校验异常。错误信息：  {}", ex.getMessage());
            logger.trace("异常信息:\n", ex);
        } else {
            logger.error("捕捉到系统异常！", ex);
        }
    }

    /**
     * 是否是普通是异常，可以显示给用户看。
     *
     * @param ex
     * @return
     */
    private boolean isSimpleFailed(Exception ex) {
        if ((ex instanceof InvalidDataException) ||
                (ex instanceof ValidationFailedException) ||
                (ex instanceof ProcessFailedException) ||
                (ex instanceof DataIntegrityViolationException)
                ) {
            return true;
        }
        return false;
    }
}
