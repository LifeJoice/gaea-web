package org.gaea.framework.web.method.annotation;

import org.gaea.framework.web.bind.annotation.RequestToBean;
import java.lang.reflect.Field;
import java.util.Iterator;
import org.springframework.beans.BeanUtils;
import org.springframework.core.MethodParameter;
import org.springframework.stereotype.Component;
import org.springframework.web.bind.support.WebDataBinderFactory;
import org.springframework.web.context.request.NativeWebRequest;
import org.springframework.web.method.support.HandlerMethodArgumentResolver;
import org.springframework.web.method.support.ModelAndViewContainer;

/**
 * 自定义的Controller的参数转换类。负责实现自定义的页面请求到Entity的转换。
 *
 * @author Iverson 2014-5-20 星期二
 */
@Component
public class GaeaRequestParamMethodArgumentResolver implements HandlerMethodArgumentResolver {

    @Override
    public boolean supportsParameter(MethodParameter parameter) {
        return parameter.getParameterAnnotation(RequestToBean.class) != null;
    }

    @Override
    public Object resolveArgument(MethodParameter parameter, ModelAndViewContainer mavContainer, NativeWebRequest webRequest, WebDataBinderFactory binderFactory) throws Exception {
        String objName = parameter.getParameterName() + ".";
        Object o = BeanUtils.instantiate(parameter.getParameterType());
        StringBuffer tmp;
        String[] val;
        Field[] frr = parameter.getParameterType().getDeclaredFields();
        for (Iterator<String> itr = webRequest.getParameterNames(); itr
                .hasNext();) {
            tmp = new StringBuffer(itr.next());
            if (tmp.indexOf(objName) < 0) {
                continue;
            }
            for (int i = 0; i < frr.length; i++) {
                frr[i].setAccessible(true);
                if (tmp.toString().equals(objName + frr[i].getName())) {
                    val = webRequest.getParameterValues(tmp.toString());
                    frr[i].set(o, val[0]);
                }
            }
        }
        return o;
    }

}
