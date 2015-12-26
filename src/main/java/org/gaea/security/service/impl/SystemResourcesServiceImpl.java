package org.gaea.security.service.impl;

import org.gaea.security.service.SystemResourcesService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.jdbc.core.namedparam.MapSqlParameterSource;
import org.springframework.jdbc.core.namedparam.NamedParameterJdbcTemplate;
import org.springframework.stereotype.Service;

import java.util.List;

/**
 * Created by Iverson on 2015/11/22.
 */
@Service
public class SystemResourcesServiceImpl implements SystemResourcesService {
//    @Autowired
//    private SessionFactory sessionFactory;
    @Autowired
    private NamedParameterJdbcTemplate namedParameterJdbcTemplate;
    @Override
    public List<String> findByAuthorityCode(String authority) {
//        String sql = "SELECT CODE FROM GAEA_SYS_AUTHORITIES";
        String sql = "SELECT \n" +
                "  res.`RESOURCE` \n" +
                "FROM\n" +
                "  gaea_sys_resources res \n" +
                "  LEFT JOIN gaea_sys_authorities_resources aures \n" +
                "    ON res.`ID` = aures.`RESOURCE_ID` \n" +
                "  LEFT JOIN gaea_sys_authorities auth \n" +
                "    ON aures.`AUTHORITY_ID` = auth.`ID` \n" +
                "WHERE auth.`CODE` = :AUTH_CODE ";
//        Session session = sessionFactory.openSession();
        MapSqlParameterSource params = new MapSqlParameterSource();
        params.addValue("AUTH_CODE",authority);
        List<String> codeList = namedParameterJdbcTemplate.queryForList(sql,params,String.class);
        return codeList;
    }
}
