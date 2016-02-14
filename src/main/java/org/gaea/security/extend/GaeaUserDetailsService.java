package org.gaea.security.extend;

import org.gaea.security.service.SystemUsersService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.core.GrantedAuthority;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.userdetails.User;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.core.userdetails.UserDetailsService;
import org.springframework.security.core.userdetails.UsernameNotFoundException;

import java.util.ArrayList;
import java.util.Collection;

/**
 * Created by Iverson on 2015/11/6.
 */
public class GaeaUserDetailsService implements UserDetailsService {
    @Autowired
    private SystemUsersService systemUsersService;

    /**
     * 供Spring Security调用。获取用户的角色权限信息。然后Spring Security会把相关的信息传递给AccessDecisionManager去判断。
     * @param username
     * @return
     * @throws UsernameNotFoundException
     */
    @Override
    public UserDetails loadUserByUsername(String username) throws UsernameNotFoundException {
        Collection<GrantedAuthority> auths = new ArrayList<GrantedAuthority>();
        //得到用户的权限
        auths = systemUsersService.findUserAuthorities(username);
        String password = null;
        //取得用户的密码
        password = systemUsersService.findPasswordByLoginName(username);
        return new User(username, password, true, true, true, true, auths);
    }
}
