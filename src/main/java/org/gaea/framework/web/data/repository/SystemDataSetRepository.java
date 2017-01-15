package org.gaea.framework.web.data.repository;

import org.gaea.framework.web.data.domain.DataSetEntity;
import org.springframework.data.jpa.repository.JpaRepository;

/**
 * Created by iverson on 2016/12/6.
 */

public interface SystemDataSetRepository extends JpaRepository<DataSetEntity, String> {
    DataSetEntity findByName(String name);
}
