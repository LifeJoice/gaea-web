package org.gaea.security;

import org.apache.commons.collections.CollectionUtils;
import org.apache.commons.lang3.BooleanUtils;
import org.apache.commons.lang3.StringUtils;
import org.gaea.exception.SysInitException;
import org.gaea.framework.web.common.CommonDefinition;
import org.gaea.framework.web.config.SystemProperties;
import org.gaea.security.domain.Role;
import org.gaea.security.domain.User;
import org.gaea.security.repository.SystemRolesRepository;
import org.gaea.security.repository.SystemUsersRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import javax.annotation.PostConstruct;
import java.util.ArrayList;
import java.util.Iterator;
import java.util.List;

/**
 * 当一个系统刚开始的时候，没有admin怎么会有用户，所以，就有了admin。
 * Created by iverson on 2017/7/30.
 */
@Service
public class InitAdminUser {

    private final Logger logger = LoggerFactory.getLogger(InitAdminUser.class);

    @Autowired
    PasswordEncoder passwordEncoder;
    @Autowired
    private SystemUsersRepository systemUsersRepository;
    @Autowired
    private SystemRolesRepository systemRolesRepository;

    @PostConstruct
    public void init() {
        try {
            initAdminUser();
        } catch (SysInitException e) {
            logger.error(e.getMessage(), e);
        }
    }

    /**
     * 初始化管理员账户。
     * 如果数据库已经有了，就忽略初始化。
     * 创建的管理员账户，默认具有所有角色。
     *
     * @throws SysInitException
     */
    @Transactional
    public void initAdminUser() throws SysInitException {
        // 默认是否初始化admin账号、初始化admin的用户名、密码，都是从.properties文件中获取
        String isInitStr = SystemProperties.get(CommonDefinition.PROP_KEY_USER_ADMIN_INIT);
        String defaultAdminName = SystemProperties.get(CommonDefinition.PROP_KEY_USER_ADMIN_USERNAME);
        String defaultAdminPassword = SystemProperties.get(CommonDefinition.PROP_KEY_USER_ADMIN_PASSWORD);

        // 默认不初始化
        boolean isInit = BooleanUtils.toBooleanObject(isInitStr) == null ? false : Boolean.parseBoolean(isInitStr);

        // 不需要初始化
        if (!isInit) {
            return;
        }

        // 开始初始化
        if (StringUtils.isEmpty(defaultAdminName) || StringUtils.isEmpty(defaultAdminPassword)) {
            throw new SysInitException("初始化admin账号失败！要初始化的admin账号或密码为空, 请检查properties文件配置！");
        }

        List<User> existAdminList = systemUsersRepository.findByLoginName(defaultAdminName);
        if (CollectionUtils.isNotEmpty(existAdminList)) {
            throw new SysInitException("初始化admin账号失败！数据库中已存在同名的admin账号！账号名：" + defaultAdminName);
        }

        User admin = new User();
        admin.setName(defaultAdminName);
        admin.setLoginName(defaultAdminName);
        admin.setPassword(passwordEncoder.encode(defaultAdminPassword));
        // 授权. 既然是admin，就授予全部权限。
        Iterable<Role> roleIterable = systemRolesRepository.findAll();
        if (roleIterable != null) {
            Iterator<Role> roleIterator = roleIterable.iterator();
            while (roleIterator.hasNext()) {
                Role role = roleIterator.next();
                admin.getRoles().add(role);
            }
        }
        systemUsersRepository.save(admin);
    }
}
