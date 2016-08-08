package org.gaea.security.service.impl;

import org.gaea.security.domain.Role;
import org.gaea.security.repository.SystemRolesRepository;
import org.gaea.security.service.SystemRolesService;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

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
}
