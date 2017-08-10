package org.gaea.security.service.impl;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.databind.ser.FilterProvider;
import com.fasterxml.jackson.databind.ser.impl.SimpleBeanPropertyFilter;
import com.fasterxml.jackson.databind.ser.impl.SimpleFilterProvider;
import org.apache.commons.lang3.StringUtils;
import org.gaea.exception.ProcessFailedException;
import org.gaea.exception.ValidationFailedException;
import org.gaea.security.domain.Resource;
import org.gaea.security.repository.SystemResourcesRepository;
import org.gaea.security.service.SystemResourcesService;
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
public class SystemResourcesServiceImpl implements SystemResourcesService {
    //    @Autowired
//    private SessionFactory sessionFactory;
    @Autowired
    private NamedParameterJdbcTemplate namedParameterJdbcTemplate;
    @Autowired
    private SystemResourcesRepository resourcesRepository;
    private ObjectMapper mapper = new ObjectMapper();

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
    public void save(Resource inResource) throws ValidationFailedException {
        inResource.setId(""); // 避免页面端有缓存，新增都应该是空的id
        resourcesRepository.save(inResource);

    }

    @Override
    public void update(Resource inResource) throws ValidationFailedException {
        if (inResource == null || StringUtils.isEmpty(inResource.getId())) {
            throw new ValidationFailedException("页面传来的资源对象为空，无法保存！");
        }
        Resource resource = resourcesRepository.findOne(inResource.getId());
        // 不覆盖资源权限的配置关系
        BeanUtils.copyProperties(inResource, resource, "authorities");
        resourcesRepository.save(resource);
    }

    @Override
    public String loadEditData(String id) throws ProcessFailedException, IOException {
        Resource resource = resourcesRepository.findOne(id);
        if (resource == null) {
            throw new ProcessFailedException("找不到对应的资源，无法编辑！");
        }
        return GaeaJacksonUtils.parse(resource, "authorities");
    }
}
