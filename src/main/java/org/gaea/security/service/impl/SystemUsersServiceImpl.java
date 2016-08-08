package org.gaea.security.service.impl;

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

import java.util.ArrayList;
import java.util.Collection;
import java.util.List;

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
    public User findByLoginName(String username) {
        String sql = "SELECT ID,NAME,LOGIN_NAME loginName,PASSWORD FROM GAEA_SYS_USERS WHERE LOGIN_NAME=:LOGIN_NAME";
        MapSqlParameterSource params = new MapSqlParameterSource();
        try {
            params.addValue("LOGIN_NAME", username);
            User user = namedParameterJdbcTemplate.queryForObject(sql, params, new BeanPropertyRowMapper<User>(User.class));
            return user;
        } catch (EmptyResultDataAccessException e) {
            return null;
        }
    }
}
