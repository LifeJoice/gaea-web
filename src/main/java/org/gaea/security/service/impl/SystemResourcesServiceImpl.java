package org.gaea.security.service.impl;

import org.apache.commons.lang3.StringUtils;
import org.gaea.security.domain.Resource;
import org.gaea.security.repository.SystemResourcesRepository;
import org.gaea.security.service.SystemResourcesService;
import org.gaea.util.BeanUtils;
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
    @Autowired
    private SystemResourcesRepository resourcesRepository;

    /**
     * 根据权限编码（authority code）找对应的资源
     *
     * @param authority
     * @return
     */
    @Override
    public List<String> findByAuthorityCode(String authority) {
//        String sql = "SELECT CODE FROM GAEA_SYS_AUTHORITIES";
        String sql = "SELECT \n" +
                "  res.RESOURCE_URL \n" +
                "FROM\n" +
                "  gaea_sys_resources res \n" +
                "  LEFT JOIN gaea_sys_authorities_resources aures \n" +
                "    ON res.ID = aures.RESOURCE_ID \n" +
                "  LEFT JOIN gaea_sys_authorities auth \n" +
                "    ON aures.AUTHORITY_ID = auth.ID \n" +
                "WHERE auth.CODE = :AUTH_CODE ";
//        Session session = sessionFactory.openSession();
        MapSqlParameterSource params = new MapSqlParameterSource();
        params.addValue("AUTH_CODE", authority);
        List<String> resUrlList = namedParameterJdbcTemplate.queryForList(sql, params, String.class);
        return resUrlList;
    }

    @Override
    public void save(Resource newResource) {
        if(StringUtils.isNotEmpty(newResource.getId())) {
            // update
            Resource resource = resourcesRepository.findOne(newResource.getId());
            // 不覆盖资源权限的配置关系
            BeanUtils.copyProperties(newResource, resource, "authorities");
            resourcesRepository.save(resource);
        }else{
            // add
            resourcesRepository.save(newResource);
        }

    }
}
