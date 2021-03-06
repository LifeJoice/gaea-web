package org.gaea.springframework.web.servlet.view;

import org.gaea.exception.ValidationFailedException;
import org.gaea.framework.web.schema.GaeaXmlSchemaProcessor;
import org.springframework.core.Ordered;
import org.springframework.core.io.Resource;
import org.springframework.web.servlet.View;
import org.springframework.web.servlet.view.AbstractCachingViewResolver;

import java.util.Locale;

/**
 * Spring MVC的ViewResolver，负责挑选合适的View。<br/>
 * 通过url判断, 是否有对应的XML. 如果是XML路径, 拦截下来, 由GaeaHTMLView处理.<br/>
 * 否则, 返回null. 则下一个Spring MVC viewResolver接力处理.
 * Created by Iverson on 2015/6/17.
 */
public class GaeaHtmlViewResolver extends AbstractCachingViewResolver implements Ordered {
    private int order = Integer.MIN_VALUE;

    // requested file location under web app
    private String location;
    // 存放视图模板的根位置
    private String viewSchemaLocation;
    //    @Autowired
    private GaeaXmlSchemaProcessor gaeaXmlSchemaProcessor;

    // View
    private String viewName;


    public void setViewName(String viewName) {
        this.viewName = viewName;
    }

    public void setOrder(int order) {
        this.order = order;
    }

    public void setLocation(String location) {
        this.location = location;
    }

    public void setViewSchemaLocation(String viewSchemaLocation) {
        this.viewSchemaLocation = viewSchemaLocation;
    }

    public int getOrder() {
        return this.order;
    }

    // 由Spring注入bean。本来可以Autowired的。后来不知为何不行，就改为用配置文件注入了。
    public void setGaeaXmlSchemaProcessor(GaeaXmlSchemaProcessor gaeaXmlSchemaProcessor) {
        this.gaeaXmlSchemaProcessor = gaeaXmlSchemaProcessor;
    }

    @Override
    protected View loadView(String viewName, Locale locale) throws Exception {
        if (location == null) {
            throw new Exception(
                    "No location specified for GenericFileViewResolver.");
        }
//        String requestedFilePath = location + viewName; // 这个是一般的方式直接返回到具体的html页面
        String viewSchemaPath = viewSchemaLocation + viewName;
        Resource resource = null;
        logger.info(viewSchemaPath);
        resource = getApplicationContext().getResource(viewSchemaPath);
        // 返回 null, 以便被下一个 resolver 处理
        if (!resource.exists()) {
            logger.debug("Requested file not found: " + viewSchemaPath + ",viewName:" + viewName);
            return null;
        }

        logger.info("Requested file found: " + viewSchemaPath + ",viewName:" + viewName);
//        logger.info("Requested file found: " + requestedFilePath + ",viewName:" + viewName);

        // 处理XML Schema
//            gaeaXmlSchemaProcessor = this.getApplicationContext().getBean(GaeaXmlSchemaProcessor.class);
//        htmlView = gaeaXmlSchemaProcessor.process(getApplicationContext(),viewSchemaLocation,viewName);
//    } catch (ValidationFailedException e) {
//        // 返回 null, 以便被下一个 resolver 处理
////            logger.info("No file found for file: " + requestedFilePath);
//            // AI.TODO 区分一下no file found exception
//        logger.info("No file found for file: " + viewSchemaPath);
//        return null;
//    }


        // 根据视图名，获取相应的 view 对象
        GaeaHtmlView view = this.getApplicationContext().getBean(this.viewName,
                GaeaHtmlView.class);
        view.setResourceFilePath(viewSchemaPath);
        return view;
    }
}
