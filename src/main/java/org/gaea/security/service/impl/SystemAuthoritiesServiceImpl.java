package org.gaea.security.service.impl;

import org.apache.commons.collections.CollectionUtils;
import org.apache.commons.lang3.StringUtils;
import org.gaea.security.domain.Authority;
import org.gaea.security.domain.Resource;
import org.gaea.security.repository.SystemAuthoritiesRepository;
import org.gaea.security.service.SystemAuthoritiesService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.jdbc.core.namedparam.MapSqlParameterSource;
import org.springframework.jdbc.core.namedparam.NamedParameterJdbcTemplate;
import org.springframework.stereotype.Service;

import java.util.ArrayList;
import java.util.List;

/**
 * Created by Iverson on 2015/11/22.
 */
@Service
public class SystemAuthoritiesServiceImpl implements SystemAuthoritiesService {
    @Autowired
    private NamedParameterJdbcTemplate namedParameterJdbcTemplate;
    @Autowired
    private SystemAuthoritiesRepository authoritiesRepository;

    /**
     * 查找权限表的所有的code。不带条件。
     *
     * @return
     */
    @Override
    public List<String> findCodeList() {
        String sql = "SELECT CODE FROM GAEA_SYS_AUTHORITIES";
        List<String> codeList = namedParameterJdbcTemplate.queryForList(sql, new MapSqlParameterSource(), String.class);
        return codeList;
    }

    @Override
    public void save(Authority authority) {
        authoritiesRepository.save(authority);
    }

    @Override
    public void saveAuthResource(Authority authority, List<String> resourceIds) {
        if (authority == null || StringUtils.isEmpty(authority.getId())) {
            throw new IllegalArgumentException("用户权限authority对象的id为空！无法执行更新操作！");
        }
        authority = authoritiesRepository.findOne(authority.getId());
        if (CollectionUtils.isNotEmpty(resourceIds)) {
            List<Resource> resources = new ArrayList<Resource>();
            for (String id : resourceIds) {
                Resource resource = new Resource(id);
                resources.add(resource);
            }
            authority.setResources(resources);
            save(authority);
        }
//        authoritiesRepository.save(authority);
    }
}
