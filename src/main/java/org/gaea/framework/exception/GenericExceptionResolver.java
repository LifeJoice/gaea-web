package org.gaea.framework.exception;

import com.fasterxml.jackson.databind.ObjectMapper;

import java.io.IOException;
import java.util.HashMap;
import java.util.Map;
import javax.servlet.http.HttpServletRequest;
import javax.servlet.http.HttpServletResponse;

import org.apache.commons.lang3.StringUtils;
import org.gaea.exception.*;
import org.gaea.framework.web.common.WebCommonDefinition;
import org.gaea.config.SystemProperties;
import org.gaea.util.ValidationUtils;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Component;
import org.springframework.web.servlet.ModelAndView;
import org.springframework.web.servlet.handler.AbstractHandlerExceptionResolver;

/**
 * 统一的Controller的异常处理。
 * <p>统一拦截后，做个区分</p>
 * <p>
 * 继承AbstractHandlerExceptionResolver,为了设定exception resolver的顺序, 确保在DefaultHandlerExceptionResolver之前.<br/>
 * 否则一些系统抛出的异常,例如DispatchServlet抛出的异常,会被DefaultHandlerExceptionResolver处理掉, 不好控制.<br/>
 * by Iverson 2017-4-27
 * </p>
 *
 * @author Iverson 2014-5-5 星期一
 */
@Component
public class GenericExceptionResolver extends AbstractHandlerExceptionResolver {

    final Logger logger = LoggerFactory.getLogger(GenericExceptionResolver.class);
    private final int ORDER_BEFORE_SPRING_DEFAULT_HANDLER = SystemProperties.getInteger(WebCommonDefinition.PROP_KEY_EXCEPTION_RESOLVER_ORDER);
    /* 使用Jackson2框架的工具类。转换JSON输出。 */
    ObjectMapper mapper = new ObjectMapper();

    public GenericExceptionResolver() {
        /**
         * 这个确保介乎ResponseStatusExceptionResolver( order=1) 和 DefaultHandlerExceptionResolver( order=2 )之间。
         * 压制DefaultHandlerExceptionResolver。
         */
        setOrder(ORDER_BEFORE_SPRING_DEFAULT_HANDLER);
    }

    /**
     * 可能并不是最佳实践。
     * 这个是实现HandlerExceptionResolver的。不过后来改为继承AbstractHandlerExceptionResolver后，这个就变成内部调用了。
     *
     * @param request
     * @param response
     * @param handler
     * @param ex
     * @return
     */
    public ModelAndView resolveException(HttpServletRequest request, HttpServletResponse response, Object handler, Exception ex) {
        ModelAndView mav = new ModelAndView();
        String debugMessage = "";
        /* 先对异常进行日志处理,避免丢失. */
        logException(ex);
        try {
            /* 相应的状态码设置 */
            response.setStatus(HttpServletResponse.SC_INTERNAL_SERVER_ERROR);// 默认错误 500
            if (isSimpleFailed(ex)) {
                response.setStatus(GaeaException.DEFAULT_FAIL);// 自定义一般校验错误 600
                GaeaException gaeaException = (GaeaException) ex;
                debugMessage = gaeaException.getDebugMessage();
            }
            /* 解决返回json乱码的问题 */
            response.setContentType("text/xml;charset=utf-8");
            /* 获取请求的头，用以判断是否JSON请求 */
            Boolean isJson = false, acceptJson = false, xReqJson = false, isMultiPart = false;
            String requestHeadType = request.getHeader("accept");
            String xRequestedWith = request.getHeader("X-Requested-With");
            String contentType = request.getContentType();
            /* 判断是否JSON请求 */
            if (!ValidationUtils.isBlank(requestHeadType)) {
                acceptJson = requestHeadType.indexOf("application/json") >= 0;
            }
            if (!ValidationUtils.isBlank(xRequestedWith)) {
                xReqJson = xRequestedWith.indexOf("XMLHttpRequest") >= 0;
            }
            if (StringUtils.isNotEmpty(contentType)) {
                isMultiPart = contentType.indexOf("multipart/form-data") >= 0;
            }
            // 如果请求是multiPart的，即上传文件的，则返回统一还是json
            isJson = (acceptJson || xReqJson) || isMultiPart;
//        mav.setViewName("MappingJacksonJsonView");
            Map<String, Object> errorMsg = new HashMap<String, Object>();
            errorMsg.put("status", response.getStatus());
            errorMsg.put("message", ex.getMessage());
            errorMsg.put("debugMessage", debugMessage);
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

    @Override
    protected ModelAndView doResolveException(HttpServletRequest request, HttpServletResponse response, Object handler, Exception ex) {
        return resolveException(request, response, handler, ex);
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
