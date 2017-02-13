package org.gaea.demo.service.impl;

import org.gaea.demo.entity.DemoClassEntity;
import org.gaea.demo.repository.DemoClassRepository;
import org.gaea.demo.service.DemoClassService;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.sql.Date;

/**
 * Created by iverson on 2017/1/16.
 */
@Service
public class DemoClassServiceImpl implements DemoClassService {

    private final Logger logger = LoggerFactory.getLogger(DemoClassServiceImpl.class);
    @Autowired
    private DemoClassRepository demoClassRepository;

    @Override
    public void save(DemoClassEntity classEntity, String loginName) {
        classEntity.setCreateBy(loginName);
        classEntity.setCreateTime(new Date(System.currentTimeMillis()));
        demoClassRepository.save(classEntity);
    }
}
