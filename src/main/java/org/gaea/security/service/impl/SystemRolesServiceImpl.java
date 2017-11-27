package org.gaea.security.service.impl;

import org.apache.commons.collections.CollectionUtils;
import org.apache.commons.lang3.StringUtils;
import org.gaea.exception.ValidationFailedException;
import org.gaea.security.domain.Authority;
import org.gaea.security.domain.Role;
import org.gaea.security.domain.User;
import org.gaea.security.repository.SystemRolesRepository;
import org.gaea.security.service.SystemRolesService;
import org.gaea.util.BeanUtils;
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
    public void save(Role role) throws ValidationFailedException {
        if (StringUtils.isEmpty(role.getName()) || StringUtils.isEmpty(role.getCode())) {
            throw new ValidationFailedException("角色名/角色编码不允许为空！");
        }
        List<Role> roleList = systemRolesRepository.findByCode(role.getCode());
        if (roleList.size() > 0) {
            throw new ValidationFailedException("角色编码已经存在！");
        }
        // 新增
        role.setId(null);
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

    @Override
    @Transactional
    public void saveRoleUsers(Role role, List<String> userIds) {
        if (role == null || StringUtils.isEmpty(role.getId())) {
            throw new IllegalArgumentException("角色id不允许为空。否则无法执行角色权限的更新操作！");
        }
        role = systemRolesRepository.findOne(role.getId());
        if (CollectionUtils.isEmpty(role.getUsers())) {
            role.setUsers(new ArrayList<User>());
        }
        // 先清空关系
        role.getUsers().clear();

        List<User> users = role.getUsers();
        if (CollectionUtils.isNotEmpty(userIds)) {
            for (String userId : userIds) {
                if (StringUtils.isNotEmpty(userId)) {
                    users.add(new User(userId));
                }
            }
        }
        systemRolesRepository.save(role);
    }

    @Override
    public void update(Role inRole) throws ValidationFailedException {
        if (StringUtils.isEmpty(inRole.getName()) || StringUtils.isEmpty(inRole.getCode())) {
            throw new ValidationFailedException("角色名/角色编码不允许为空！");
        }
        if (inRole.getId() == null) {
            throw new ValidationFailedException("没有获得角色id，也许是未选择角色记录。");
        }
        Role role = systemRolesRepository.findOne(inRole.getId());
        BeanUtils.copyProperties(inRole, role, "users", "authorities", "dsAuthorities");
        systemRolesRepository.save(role);
    }

    @Override
    @Transactional
    public void delete(List<Role> roleList) throws ValidationFailedException {
        // id不为空，是更新操作
        if (CollectionUtils.isEmpty(roleList)) {
            throw new ValidationFailedException("选择角色为空，无法执行删除操作！");
        }
        systemRolesRepository.delete(roleList);
    }
}
