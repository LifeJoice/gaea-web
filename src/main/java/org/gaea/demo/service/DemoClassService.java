package org.gaea.demo.service;

import org.gaea.demo.entity.DemoClassEntity;

/**
 * Created by iverson on 2017/1/16.
 */
public interface DemoClassService {
    void save(DemoClassEntity classEntity, String loginName);
}
