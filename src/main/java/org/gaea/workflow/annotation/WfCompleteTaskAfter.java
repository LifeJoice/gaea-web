package org.gaea.workflow.annotation;

import java.lang.annotation.ElementType;
import java.lang.annotation.Retention;
import java.lang.annotation.RetentionPolicy;
import java.lang.annotation.Target;

/**
 * 注解于方法上。<p/>
 * 功能：<br/>
 * 在方法完成后触发工作流的completeTask。并且可以根据用户给予的WfVariables去推进流程。
 * Created by Iverson on 2015/8/30.
 */
@Retention(RetentionPolicy.RUNTIME)
@Target(ElementType.METHOD)
public @interface WfCompleteTaskAfter {
    String value() default "";
}
