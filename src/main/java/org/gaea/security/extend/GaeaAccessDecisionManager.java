package org.gaea.security.extend;

import org.springframework.security.access.AccessDecisionManager;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.security.access.ConfigAttribute;
import org.springframework.security.access.SecurityConfig;
import org.springframework.security.authentication.InsufficientAuthenticationException;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.GrantedAuthority;

import java.util.Collection;
import java.util.Iterator;

/**
 * 负责对用户对某个url操作时的权限判断
 * Created by Iverson on 2015/11/6.
 */
public class GaeaAccessDecisionManager implements AccessDecisionManager{

    /**
     * @param authentication   认证过的票据Authentication，确定了谁正在访问资源。
     * @param object           被访问的资源。对应Gaea框架的Resource。（例如：URL: /gaea/security/user/management）
     * @param configAttributes 访问资源要求的权限配置。（应该是Resource对应的Authority。例如：AUTH_USERS）
     * @throws AccessDeniedException
     * @throws InsufficientAuthenticationException
     */
    @Override
    public void decide(Authentication authentication, Object object, Collection<ConfigAttribute> configAttributes) throws AccessDeniedException, InsufficientAuthenticationException {
        if( configAttributes == null ) {
            return ;
        }
        Iterator<ConfigAttribute> attributes = configAttributes.iterator();
        Collection<? extends GrantedAuthority> userAuthorities = authentication.getAuthorities(); // 用户所拥有的权限
        while (attributes.hasNext()) {
            ConfigAttribute ca = attributes.next();
            String needRole = ((SecurityConfig) ca).getAttribute();
            //ga 为用户所被赋予的权限。 needRole 为访问相应的资源应该具有的权限。
            for (GrantedAuthority ga : userAuthorities) {
                if (needRole.trim().equals(ga.getAuthority().trim())) {
                    return;
                }
            }
        }
        throw new AccessDeniedException("用户权限认证不通过。没有操作权限。");
    }

    @Override
    public boolean supports(ConfigAttribute attribute) {
        return true;
    }

    @Override
    public boolean supports(Class<?> clazz) {
        return true;
    }
}
