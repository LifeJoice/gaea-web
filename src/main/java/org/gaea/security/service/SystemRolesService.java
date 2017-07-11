package org.gaea.security.service;

import org.gaea.security.domain.Role;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

/**
 * Created by Iverson on 2015/11/22.
 */
public interface SystemRolesService {
    public void save(Role role);

    void saveRoleAuthorities(Role role, List<String> authIds);

    void saveRoleUsers(Role role, List<String> userIds);
}
