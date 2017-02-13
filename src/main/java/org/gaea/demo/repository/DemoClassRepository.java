package org.gaea.demo.repository;

import org.gaea.demo.entity.DemoClassEntity;
import org.springframework.data.repository.CrudRepository;

/**
 * Created by iverson on 2017/1/16.
 */
public interface DemoClassRepository extends CrudRepository<DemoClassEntity, String> {
}
