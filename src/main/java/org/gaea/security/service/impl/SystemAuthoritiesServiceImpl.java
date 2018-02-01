package org.gaea.security.service.impl;

import org.apache.commons.collections.CollectionUtils;
import org.apache.commons.lang3.StringUtils;
import org.gaea.exception.ProcessFailedException;
import org.gaea.exception.ValidationFailedException;
import org.gaea.security.domain.Authority;
import org.gaea.security.domain.Resource;
import org.gaea.security.extend.GaeaFilterInvocationSecurityMetadataSource;
import org.gaea.security.repository.SystemAuthoritiesRepository;
import org.gaea.security.service.SystemAuthoritiesService;
import org.gaea.util.BeanUtils;
import org.gaea.util.GaeaJacksonUtils;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.jdbc.core.namedparam.MapSqlParameterSource;
import org.springframework.jdbc.core.namedparam.NamedParameterJdbcTemplate;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.io.IOException;
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
    @Autowired
    private GaeaFilterInvocationSecurityMetadataSource gaeaFilterInvocationSecurityMetadataSource;

    /**
     * 查找权限表的所有的code。不带条件。
     *
     * @return
     */
//    @Override
//    public List<String> findCodeList() {
//        String sql = "SELECT CODE FROM GAEA_SYS_AUTHORITIES";
//        List<String> codeList = namedParameterJdbcTemplate.queryForList(sql, new MapSqlParameterSource(), String.class);
//        return codeList;
//    }
    @Override
    public List<Authority> findAllWithResource() {
        List<Authority> authorityList = authoritiesRepository.findAllWithResource();
        return authorityList;
    }

    @Override
    public void save(Authority authority) {
        authority.setId(""); // 避免页面端有缓存，新增都应该是空的id
        authoritiesRepository.save(authority);
    }

    @Override
    public void update(Authority inAuthority) throws ValidationFailedException {
        if (inAuthority == null || StringUtils.isEmpty(inAuthority.getId())) {
            throw new ValidationFailedException("页面传来的资源对象为空，无法保存！");
        }
        Authority authority = authoritiesRepository.findOne(inAuthority.getId());
        // 不覆盖资源权限的配置关系
        BeanUtils.copyProperties(inAuthority, authority, "resources");
        authoritiesRepository.save(authority);
    }

    @Override
    @Transactional
    public void saveAuthResource(Authority authority, List<String> resourceIds) throws ValidationFailedException {
        if (authority == null || StringUtils.isEmpty(authority.getId())) {
            throw new IllegalArgumentException("用户权限authority对象的id为空！无法执行更新操作！");
        }
        authority = authoritiesRepository.findOne(authority.getId());
        List<Resource> resources = authority.getResources();
        // 先清空所有关联资源
        resources.clear();
        // 再加入当前设定的资源
        if (CollectionUtils.isNotEmpty(resourceIds)) {
            for (String id : resourceIds) {
                if (StringUtils.isNotEmpty(id)) {
                    Resource resource = new Resource(id);
                    resources.add(resource);
                }
            }
        }
        update(authority);
        // 刷新Spring security缓存的权限资源关系
        if (gaeaFilterInvocationSecurityMetadataSource == null) {
            throw new ValidationFailedException("获取不到系统的权限控制框架对象，无法刷新缓存的资源权限缓存！");
        }
        gaeaFilterInvocationSecurityMetadataSource.reloadResourceDefine();
    }

    @Override
    @Transactional(readOnly = true)
    public String loadEditData(String id) throws ProcessFailedException, IOException {
        Authority authority = authoritiesRepository.findOne(id);
        if (authority == null) {
            throw new ProcessFailedException("找不到对应的资源，无法编辑！");
        }
        return GaeaJacksonUtils.parse(authority, "resources");
    }
}
