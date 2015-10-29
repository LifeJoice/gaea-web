package org.gaea.security;

import org.springframework.security.web.context.AbstractSecurityWebApplicationInitializer;

/**
 * 配合Spring Security运作。这个的作用类似注册一个Filter。像这样：
 * <p>
 *       <filter>
 <filter-name>springSecurityFilterChain</filter-name>
 <filter-class>org.springframework.web.filter.DelegatingFilterProxy</filter-class>
 </filter>

 <filter-mapping>
 <filter-name>springSecurityFilterChain</filter-name>
 <url-pattern>/*</url-pattern>
 </filter-mapping>
 * </p>
 * Created by Iverson on 2015/10/29.
 */
public class SpringSecurityInitializer extends
        AbstractSecurityWebApplicationInitializer {

}