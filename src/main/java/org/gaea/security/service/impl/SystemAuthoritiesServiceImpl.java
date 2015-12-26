package org.gaea.security.service.impl;

import org.gaea.security.service.SystemAuthoritiesService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.jdbc.core.namedparam.MapSqlParameterSource;
import org.springframework.jdbc.core.namedparam.NamedParameterJdbcTemplate;
import org.springframework.stereotype.Service;

import java.util.List;

/**
 * Created by Iverson on 2015/11/22.
 */
@Service
public class SystemAuthoritiesServiceImpl implements SystemAuthoritiesService {
//    @Autowired
//    private SessionFactory sessionFactory;
    @Autowired
    private NamedParameterJdbcTemplate namedParameterJdbcTemplate;
    @Override
    public List<String> findCodeList() {
        String sql = "SELECT CODE FROM GAEA_SYS_AUTHORITIES";
//        Session session = sessionFactory.openSession();
//        List<String> codeList = session
//                .createSQLQuery(sql).list();
        List<String> codeList = namedParameterJdbcTemplate.queryForList(sql, new MapSqlParameterSource(),String.class);
        return codeList;
    }
}
