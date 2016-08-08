package org.gaea.security.service;

import org.gaea.security.domain.User;
import org.springframework.security.core.GrantedAuthority;

import java.util.Collection;

/**
 * Created by Iverson on 2015/11/22.
 */
public interface SystemUsersService {
    void save(User user);

    public Collection<GrantedAuthority> findUserAuthorities(String loginName);

    public String findPasswordByLoginName(String loginName);

    public User findByLoginName(String username);
}
