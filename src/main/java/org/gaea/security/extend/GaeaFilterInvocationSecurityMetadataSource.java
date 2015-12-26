package org.gaea.security.extend;

import org.gaea.security.service.SystemAuthoritiesService;
import org.gaea.security.service.SystemResourcesService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.access.ConfigAttribute;
import org.springframework.security.access.SecurityConfig;
import org.springframework.security.web.FilterInvocation;
import org.springframework.security.web.access.intercept.FilterInvocationSecurityMetadataSource;
import org.springframework.security.web.util.matcher.AntPathRequestMatcher;
import org.springframework.security.web.util.matcher.RequestMatcher;
import org.springframework.util.AntPathMatcher;

import java.util.*;

/**
 * Created by Iverson on 2015/11/6.
 */
public class GaeaFilterInvocationSecurityMetadataSource implements FilterInvocationSecurityMetadataSource{
    @Autowired
    private SystemAuthoritiesService systemAuthoritiesService;
    @Autowired
    private SystemResourcesService systemResourcesService;
    private AntPathMatcher urlMatcher = new AntPathMatcher();
    private static Map<String, Collection<ConfigAttribute>> resourceMap = null;

    public GaeaFilterInvocationSecurityMetadataSource() {
//        loadResourceDefine();
    }

    /**
     * 根据URL，找到相关的权限配置。
     * @param object    是一个URL，被用户请求的url
     * @return
     * @throws IllegalArgumentException
     */
    @Override
    public Collection<ConfigAttribute> getAttributes(Object object) throws IllegalArgumentException {
        if(resourceMap==null||resourceMap.isEmpty()){
            loadResourceDefine();
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
            if(requestMatcher.matches(filterInvocation.getHttpRequest())) {
                return resourceMap.get(requestURL);
            }
        }

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

    private void loadResourceDefine() {
//        ApplicationContext context = new ClassPathXmlApplicationContext(
//                "classpath:applicationContext.xml");
//
//        SessionFactory sessionFactory = (SessionFactory) context
//                .getBean("sessionFactory");
//
//        Session session = sessionFactory.openSession();

        String username = "";
        String sql = "";

        // 在Web服务器启动时，提取系统中的所有权限。
        sql = "select authority_name from pub_authorities";

        List<String> authorities = systemAuthoritiesService.findCodeList();

  /*
   * 应当是资源为key， 权限为value。 资源通常为url， 权限就是那些以ROLE_为前缀的角色。 一个资源可以由多个权限来访问。
   * sparta
   */
        resourceMap = new HashMap<String, Collection<ConfigAttribute>>();   // 资源权限对照表。资源url：权限集合（权限1、权限2）……

        for (String auth : authorities) {
            ConfigAttribute ca = new SecurityConfig(auth);

//            List<String> query1 = session
//                    .createSQLQuery(
//                            "select b.resource_string "
//                                    + "from Pub_Authorities_Resources a, Pub_Resources b, "
//                                    + "Pub_authorities c where a.resource_id = b.resource_id "
//                                    + "and a.authority_id=c.authority_id and c.Authority_name='"
//                                    + auth + "'").list();
            List<String> resources = systemResourcesService.findByAuthorityCode(auth);

            for (String res : resources) {
//                String res = res;

    /*
     * 判断资源文件和权限的对应关系，如果已经存在相关的资源url，则要通过该url为key提取出权限集合，将权限增加到权限集合中。
     * sparta
     */
                if (resourceMap.containsKey(res)) {
                    Collection<ConfigAttribute> value = resourceMap.get(res);
                    value.add(ca);
                    resourceMap.put(res, value);
                } else {
                    Collection<ConfigAttribute> atts = new ArrayList<ConfigAttribute>();
                    atts.add(ca);
                    resourceMap.put(res, atts);
                }

            }

        }

    }
}
