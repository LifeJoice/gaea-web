package org.gaea.springframework.web.servlet.view;

import com.fasterxml.jackson.core.JsonGenerator;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.gaea.exception.GaeaException;
import org.gaea.framework.web.schema.GaeaXmlSchemaProcessor;
import org.gaea.framework.web.schema.service.GaeaXmlViewService;
import org.gaea.framework.web.security.GaeaWebSecuritySystem;
import org.gaea.util.GaeaExceptionUtils;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Component;
import org.springframework.web.servlet.view.AbstractUrlBasedView;

import javax.servlet.http.HttpServletRequest;
import javax.servlet.http.HttpServletResponse;
import java.io.StringWriter;
import java.util.HashMap;
import java.util.Map;

/**
 * Created by Iverson on 2015/6/17.
 */
@Component
public class GaeaHtmlView extends AbstractUrlBasedView {

    // default content type
    private final static String CONTENT_TYPE = "text/html;charset=UTF-8";
    //content of http response
    private String responseContent;
    // XML schema file resource path
    private String resourceFilePath;
    @Autowired
    private GaeaXmlViewService gaeaXmlViewService;

    public GaeaHtmlView() {
        super("");
        setContentType(CONTENT_TYPE);
    }

    @Override
    public void setContentType(String contentType) {
        super.setContentType(contentType);
    }

    @Override
    protected void renderMergedOutputModel(Map<String, Object> model, HttpServletRequest request, HttpServletResponse response) throws Exception {
//        gaeaXmlViewService
        String loginName = GaeaWebSecuritySystem.getUserName(request);
        // 把XML schema转换成HTML
        String viewHtml = "";
        try {
            viewHtml =  gaeaXmlViewService.getViewContent(getApplicationContext(), resourceFilePath, loginName);
        }catch(Exception e){
            logger.error("Gaea框架生成视图内容失败！", e);
            viewHtml = GaeaExceptionUtils.getJsonMessage(GaeaException.DEFAULT_FAIL,e.getMessage(),"系统错误，请联系管理员！");
            response.setStatus(GaeaException.DEFAULT_FAIL);// 自定义一般校验错误 600
        }
        response.setContentType(getContentType());
        response.getWriter().write(viewHtml);
        response.getWriter().close();
    }

    /**
     * Set http request content
     *
     * @param responseContent
     */
    public void setResponseContent(String responseContent) {
        this.responseContent = responseContent;
    }

    public void setResourceFilePath(String resourceFilePath) {
        this.resourceFilePath = resourceFilePath;
    }
}
