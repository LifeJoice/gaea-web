package org.gaea.security.service.impl;

import org.apache.commons.collections.CollectionUtils;
import org.apache.commons.lang3.StringUtils;
import org.gaea.security.domain.Authority;
import org.gaea.security.domain.Role;
import org.gaea.security.repository.SystemRolesRepository;
import org.gaea.security.service.SystemRolesService;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.ArrayList;
import java.util.List;

/**
 * Created by Iverson on 2015/11/22.
 */
@Service
public class SystemRolesServiceImpl implements SystemRolesService {

    private final Logger logger = LoggerFactory.getLogger(SystemRolesService.class);
    @Autowired
    private SystemRolesRepository systemRolesRepository;

    @Override
    public void save(Role role) {
        systemRolesRepository.save(role);
    }

    @Override
    @Transactional
    public void saveRoleAuthorities(Role role, List<String> authIds) {
        if (role == null || StringUtils.isEmpty(role.getId())) {
            throw new IllegalArgumentException("角色id不允许为空。否则无法执行角色权限的更新操作！");
        }
        role = systemRolesRepository.findOne(role.getId());
        if(CollectionUtils.isEmpty(role.getAuthorities())){
            role.setAuthorities(new ArrayList<Authority>());
        }
        role.getAuthorities().clear();
        List<Authority> authorities =  role.getAuthorities();
        if (CollectionUtils.isNotEmpty(authIds)) {
            for (String authId : authIds) {
                if(StringUtils.isNotEmpty(authId)) {
                    authorities.add(new Authority(authId));
                }
            }
//        }else{
//            authorities.clear();
        }
//        role.setAuthorities(authorities);
        systemRolesRepository.save(role);
    }
}
