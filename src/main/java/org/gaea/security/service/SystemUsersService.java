package org.gaea.security.service;

import org.gaea.exception.DataIntegrityViolationException;
import org.gaea.exception.SystemConfigException;
import org.gaea.exception.ValidationFailedException;
import org.gaea.security.domain.User;
import org.springframework.security.core.GrantedAuthority;
import org.springframework.transaction.annotation.Transactional;

import java.util.Collection;
import java.util.List;

/**
 * Created by Iverson on 2015/11/22.
 */
public interface SystemUsersService {
    void save(User user) throws ValidationFailedException;

    public Collection<GrantedAuthority> findUserAuthorities(String loginName);

    public String findPasswordByLoginName(String loginName) throws ValidationFailedException;

    public User findByLoginName(String username);

    void cacheUserAndRoles(User user) throws DataIntegrityViolationException, SystemConfigException;

    String[] getCacheUserRoles(String loginName) throws ValidationFailedException, SystemConfigException;

    boolean isLogin(String loginName) throws SystemConfigException, ValidationFailedException;

    void delete(List<User> userList) throws ValidationFailedException;

    void updateWithoutPassword(User user) throws ValidationFailedException;

    @Transactional
    void updatePassword(User inUser) throws ValidationFailedException;

    User loadEditData(User userEntity) throws ValidationFailedException;
}
