package org.gaea.security.dao;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.jdbc.core.namedparam.NamedParameterJdbcTemplate;
import org.springframework.stereotype.Repository;

import javax.sql.DataSource;

/**
 * Created by iverson on 2016/1/3.
 */
@Repository
public class SystemResourcesDAO {

    private final Logger logger = LoggerFactory.getLogger(SystemResourcesDAO.class);

    @Autowired(required = false)
    private DataSource dataSource;
    private NamedParameterJdbcTemplate namedParameterJdbcTemplate;

    public SystemResourcesDAO() {
        if(dataSource!=null){
            namedParameterJdbcTemplate = new NamedParameterJdbcTemplate(dataSource);
        }else{
            logger.error("\nGaea SystemResourcesDAO init failed!\n"+"获取不到数据源（Datasource），导致DAO不能初始化namedParameterJdbcTemplate!");
        }
    }
}
