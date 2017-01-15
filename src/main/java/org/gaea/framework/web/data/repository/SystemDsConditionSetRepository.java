package org.gaea.framework.web.data.repository;

import org.gaea.framework.web.data.domain.DsConditionSetEntity;
import org.springframework.data.jpa.repository.JpaRepository;

/**
 * Created by iverson on 2016-12-13 11:32:01.
 */
public interface SystemDsConditionSetRepository extends JpaRepository<DsConditionSetEntity, String> {
}
