package org.gaea.security.service.impl;

import org.apache.commons.collections.CollectionUtils;
import org.apache.commons.lang3.ArrayUtils;
import org.apache.commons.lang3.StringUtils;
import org.gaea.cache.GaeaCacheOperator;
import org.gaea.exception.DataIntegrityViolationException;
import org.gaea.exception.SysLogicalException;
import org.gaea.exception.SystemConfigException;
import org.gaea.exception.ValidationFailedException;
import org.gaea.framework.web.common.CommonDefinition;
import org.gaea.framework.web.config.SystemProperties;
import org.gaea.security.domain.Role;
import org.gaea.security.domain.User;
import org.gaea.security.repository.SystemUsersRepository;
import org.gaea.security.service.SystemUsersService;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.dao.EmptyResultDataAccessException;
import org.springframework.jdbc.core.BeanPropertyRowMapper;
import org.springframework.jdbc.core.namedparam.MapSqlParameterSource;
import org.springframework.jdbc.core.namedparam.NamedParameterJdbcTemplate;
import org.springframework.security.core.GrantedAuthority;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.text.MessageFormat;
import java.util.*;

/**
 * 系统权限管理模块的用户Service。
 * Created by Iverson on 2015/11/22.
 */
@Service
public class SystemUsersServiceImpl implements SystemUsersService {
    private final Logger logger = LoggerFactory.getLogger(SystemUsersRepository.class);
    @Autowired
    private NamedParameterJdbcTemplate namedParameterJdbcTemplate;
    @Autowired
    private SystemUsersRepository systemUsersRepository;
    @Autowired
    private GaeaCacheOperator gaeaCacheOperator;

    @Override
    public void save(User user) {
        systemUsersRepository.save(user);
    }

    @Override
    public Collection<GrantedAuthority> findUserAuthorities(String loginName) {
        String sql = "SELECT \n" +
                "  auth.CODE \n" +
                "FROM\n" +
                "  gaea_sys_authorities auth \n" +
                "  LEFT JOIN gaea_sys_roles_authorities roleauth \n" +
                "    ON auth.`ID` = roleauth.`AUTHORITY_ID` \n" +
                "  LEFT JOIN gaea_sys_users_roles userrole \n" +
                "    ON roleauth.`ROLE_ID` = userrole.`ROLE_ID` \n" +
                "  LEFT JOIN gaea_sys_users users \n" +
                "    ON userrole.`USER_ID` = users.`id` \n" +
                "WHERE users.`login_name` = :LOGIN_NAME";
        MapSqlParameterSource params = new MapSqlParameterSource();
        params.addValue("LOGIN_NAME", loginName);
        List<String> codeLists = namedParameterJdbcTemplate.queryForList(sql, params, String.class);

        List<GrantedAuthority> auths = new ArrayList<GrantedAuthority>();

        for (String auth : codeLists) {
            SimpleGrantedAuthority authority = new SimpleGrantedAuthority(
                    auth);
            auths.add(authority);
        }
        return auths;
    }

    @Override
    public String findPasswordByLoginName(String loginName) {
        String sql = "SELECT PASSWORD FROM GAEA_SYS_USERS WHERE LOGIN_NAME=:LOGIN_NAME";
        MapSqlParameterSource params = new MapSqlParameterSource();
        params.addValue("LOGIN_NAME", loginName);
        String password = namedParameterJdbcTemplate.queryForObject(sql, params, String.class);
        return password;
    }

    @Override
    @Transactional(readOnly = true)
    public User findByLoginName(String username) {
        if (StringUtils.isEmpty(username)) {
            return null;
        }
        List<User> userList = systemUsersRepository.findByLoginName(username);
        User user = null;
        List<Role> roleList = null;
        if (CollectionUtils.isNotEmpty(userList)) {
            if (userList.size() > 1) {
                logger.debug("有超过一个用户拥有同一个登录名！login_name= " + username);
            }
            user = userList.get(0);
            // 获取角色列表
            if (CollectionUtils.isNotEmpty(user.getRoles())) {
                roleList = new ArrayList<Role>();
                roleList.addAll(user.getRoles());
            }
        }
        user.setRoles(roleList);
        return user;
    }

    /**
     * 缓存用户角色。主要缓存用户角色的code。
     * 到超时时间自动清除缓存。
     *
     * @param user
     * @throws DataIntegrityViolationException
     */
    @Override
    public void cacheUserRoles(User user) throws DataIntegrityViolationException, SystemConfigException {
        if (user != null) {
            List<Role> roleList = user.getRoles();
            if (CollectionUtils.isNotEmpty(roleList)) {
                String roleRootKey = SystemProperties.get(CommonDefinition.PROP_KEY_REDIS_USER_ROLES);
                if (StringUtils.isNotEmpty(roleRootKey)) {
                    /**
                     * 真正的key：
                     * GAEA:USER:ROLES:<USER_LOGIN_NAME>
                     */
                    String realKey = getUserRoleCacheKey(user.getLoginName());
                    String[] roles = new String[roleList.size()];
                    for (int i = 0; i < roleList.size(); i++) {
                        Role role = roleList.get(i);
                        if (StringUtils.isEmpty(role.getCode())) {
                            throw new DataIntegrityViolationException(MessageFormat.format("角色的code不应该为空！id='{0}'", role.getId()).toString());
                        }
                        roles[i] = role.getCode();
                    }
                    // 获取系统配置的默认超时时间。
                    String strTimeOut = SystemProperties.get(CommonDefinition.PROP_KEY_REDIS_USER_LOGIN_TIMEOUT);
                    gaeaCacheOperator.put(realKey, roles, String[].class, strTimeOut);
                }
            }
        }
    }

    /**
     * 根据用户的登录账户名，获取缓存的、对应的用户角色列表。
     *
     * @param loginName
     * @return 用户角色code的数组
     * @throws ValidationFailedException
     * @throws SystemConfigException
     */
    @Override
    public String[] getCacheUserRoles(String loginName) throws ValidationFailedException, SystemConfigException {
        if (StringUtils.isEmpty(loginName)) {
            throw new ValidationFailedException("登录账户名为空，无法获取用户的角色！");
        }
        String key = getUserRoleCacheKey(loginName);
        String[] roles = gaeaCacheOperator.get(key, String[].class);
        return roles;
    }

    public String getUserRoleCacheKey(String loginName) throws SystemConfigException {
        String roleRootKey = SystemProperties.get(CommonDefinition.PROP_KEY_REDIS_USER_ROLES);
        if (StringUtils.isEmpty(roleRootKey)) {
            throw new SystemConfigException("找不到配置的用户角色的缓存的根key。配置项：" + CommonDefinition.PROP_KEY_REDIS_USER_ROLES);
        }
        String realKey = MessageFormat.format("{0}:{1}", roleRootKey, loginName);
        // 缓存的key应该都是大写的
        return realKey.toUpperCase();
    }

    /**
     * 判断用户是否已经登录。当前只能通过是否有缓存的已登录用户的角色数据判断。
     * 有用户名对应的角色缓存，返回true。
     *
     * @param loginName
     * @return
     * @throws SystemConfigException
     * @throws ValidationFailedException
     */
    @Override
    public boolean isLogin(String loginName) throws SystemConfigException, ValidationFailedException {
        if (StringUtils.isEmpty(loginName)) {
            throw new ValidationFailedException("登录名为空, 无法校验用户是否已经登录!");
        }
        /**
         * 真正的key：
         * GAEA:USER:ROLES:<USER_LOGIN_NAME>
         */
        String realKey = getUserRoleCacheKey(loginName);
        String[] roles = gaeaCacheOperator.get(realKey, String[].class);
        if (ArrayUtils.isNotEmpty(roles)) {
            return true;
        }
        return false;
    }
}
