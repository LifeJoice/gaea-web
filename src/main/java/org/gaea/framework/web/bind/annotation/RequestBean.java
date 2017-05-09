package org.gaea.framework.web.bind.annotation;

import java.lang.annotation.Documented;
import java.lang.annotation.ElementType;
import java.lang.annotation.Retention;
import java.lang.annotation.RetentionPolicy;
import java.lang.annotation.Target;

/**
 * 这个是使用在Controller层的注解。可以把请求中的属性值注入到特定的对象。
 * 如果@RequestBean，则默认使用变量名去匹配request中的属性名并获取值。
 * 如果@RequestBean(value=usr),则获取request中usr开始的属性名去注入对象。忽略对象名。
 * @author Iverson
 * 2014-5-20 星期二
 */
@Target(ElementType.PARAMETER)
@Retention(RetentionPolicy.RUNTIME)
@Documented
public @interface RequestBean {
    String value() default "";

    RequestBeanDataType dataType() default RequestBeanDataType.DEFAULT;
}
