package org.gaea.framework.web.repository;

import org.gaea.workflow.demo.dayoff.domain.DayoffForm;
import org.springframework.data.repository.CrudRepository;
import org.springframework.data.repository.NoRepositoryBean;
import org.springframework.stereotype.Component;

/**
 * User类只是随便挂靠的。
 * Created by Iverson on 2015/8/11.
 */
@NoRepositoryBean
public interface CommonCRUDRepository {
    public int deleteById(String tableName, Long id);
}
