package org.gaea.security.extend;

import org.apache.commons.lang3.StringUtils;
import org.gaea.exception.ValidationFailedException;
import org.gaea.security.domain.Authority;
import org.gaea.security.domain.Resource;
import org.gaea.security.service.SystemAuthoritiesService;
import org.gaea.security.service.SystemResourcesService;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.access.ConfigAttribute;
import org.springframework.security.access.SecurityConfig;
import org.springframework.security.web.FilterInvocation;
import org.springframework.security.web.access.intercept.FilterInvocationSecurityMetadataSource;
import org.springframework.security.web.util.matcher.AntPathRequestMatcher;
import org.springframework.security.web.util.matcher.RequestMatcher;
import org.springframework.util.AntPathMatcher;

import java.util.*;
import java.util.concurrent.ConcurrentHashMap;

/**
 * Created by Iverson on 2015/11/6.
 */
public class GaeaFilterInvocationSecurityMetadataSource implements FilterInvocationSecurityMetadataSource {
    private final Logger logger = LoggerFactory.getLogger(GaeaFilterInvocationSecurityMetadataSource.class);

    @Autowired
    private SystemAuthoritiesService systemAuthoritiesService;
    @Autowired
    private SystemResourcesService systemResourcesService;
    private AntPathMatcher urlMatcher = new AntPathMatcher();
    /**
     * 资源权限汇总表。key=resource_url value=authority collection
     * 例如：
     * key: /login
     * value:
     */
    private static ConcurrentHashMap<String, Collection<ConfigAttribute>> resourceMap = null; // AI.TODO 这个以后移到系统的缓存系统去

    public GaeaFilterInvocationSecurityMetadataSource() {
//        reloadResourceDefine();
    }

    /**
     * 所有请求，都会进入这个方法（包括url、js等等）。
     * 然后会截取url，根据URL，找到相关的权限配置（Gaea_sys_authority_resource）。
     * <p>
     *     如果返回为空，找不到请求url对应的权限配置，则不会进入权限校验（GaeaAccessDecisionManager）。即可以操作。
     * </p>
     * @param object 是一个URL，被用户请求的url
     * @return
     * @throws IllegalArgumentException
     */
    @Override
    public Collection<ConfigAttribute> getAttributes(Object object) throws IllegalArgumentException {
        try {
            if (resourceMap == null || resourceMap.isEmpty()) {
                reloadResourceDefine();
            }
            FilterInvocation filterInvocation = (FilterInvocation) object;
            // object 是一个URL，被用户请求的url。
            String url = filterInvocation.getRequestUrl();

            int firstQuestionMarkIndex = url.indexOf("?");

            if (firstQuestionMarkIndex != -1) {
                url = url.substring(0, firstQuestionMarkIndex);
            }

            Iterator<String> ite = resourceMap.keySet().iterator();

            while (ite.hasNext()) {
                String requestURL = ite.next();
                RequestMatcher requestMatcher = new AntPathRequestMatcher(requestURL);
                if (requestMatcher.matches(filterInvocation.getHttpRequest())) {
                    return resourceMap.get(requestURL);
                }
            }
        } catch (IllegalArgumentException e) {
            logger.error("根据URL，找到相关的权限配置失败！", e);
            throw e;
        } catch (Exception e) {
            logger.error("根据URL，找到相关的权限配置失败！" + e.getMessage(), e);
        }
        /**
         * 这里返回为空，找不到请求url对应的权限配置，则不会进入权限校验（GaeaAccessDecisionManager）
         */
        return null;
    }

    @Override
    public Collection<ConfigAttribute> getAllConfigAttributes() {
        return null;
    }

    @Override
    public boolean supports(Class<?> clazz) {
        return true;
    }

    /**
     * 初始化资源和对应的权限列表。并缓存在一个内部的map中。
     *
     * @throws ValidationFailedException
     */
    public void reloadResourceDefine() throws ValidationFailedException {
//        ApplicationContext context = new ClassPathXmlApplicationContext(
//                "classpath:applicationContext.xml");
//
//        SessionFactory sessionFactory = (SessionFactory) context
//                .getBean("sessionFactory");
//
//        Session session = sessionFactory.openSession();

//        String username = "";
//        String sql = "";

        // 在Web服务器启动时，提取系统中的所有权限。
//        sql = "select authority_name from pub_authorities";
        // TODO 优化一下。这里找Authority应该可以和下面的查询Resource一句就查出。
//        List<String> authorities = systemAuthoritiesService.findCodeList();
        List<Authority> authorityList = systemAuthoritiesService.findAllWithResource();

        /**
         * 应当是资源为key， 权限为value。 资源通常为url， 权限就是那些以ROLE_为前缀的角色。 一个资源可以由多个权限来访问。
         */
        resourceMap = new ConcurrentHashMap<String, Collection<ConfigAttribute>>();   // 资源权限对照表。资源url：权限集合（权限1、权限2）……

//        for (String auth : authorities) {
        for (Authority auth : authorityList) {
            ConfigAttribute ca = new SecurityConfig(auth.getCode());
            List<Resource> resources = auth.getResources();
            // 通过权限Authority找资源Resource
//            List<String> resources = systemResourcesService.findByAuthorityCode(auth);
            // 遍历资源
            for (Resource res : resources) {
                if (res == null || StringUtils.isEmpty(res.getResourceUrl())) {
                    throw new ValidationFailedException("系统资源表（GAEA_SYS_RESOURCES）的RESOURCE_URL为空！无法初始化系统权限资源关系！");
                }
                String resourceUrl = res.getResourceUrl();
                /**
                 * if 如果已经存在相关的resource_url
                 *      将权限Authority增加到key=resource_url的value中。
                 * else
                 *      new一个，并添加。
                 */
                if (resourceMap.containsKey(resourceUrl)) {
                    Collection<ConfigAttribute> value = resourceMap.get(resourceUrl);
                    value.add(ca);
                    resourceMap.put(resourceUrl, value);
                } else {
                    Collection<ConfigAttribute> atts = new ArrayList<ConfigAttribute>();
                    atts.add(ca);
                    resourceMap.put(resourceUrl, atts);
                }

            }

        }

    }
}
