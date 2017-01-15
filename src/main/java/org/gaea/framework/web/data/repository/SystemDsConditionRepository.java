package org.gaea.framework.web.data.repository;

import org.gaea.framework.web.data.domain.DsConditionEntity;
import org.springframework.data.repository.CrudRepository;

/**
 * Created by iverson on 2016-12-13 11:32:01.
 */
public interface SystemDsConditionRepository extends CrudRepository<DsConditionEntity, String> {

//    Long deleteByConditionSetId(String conditionSetId);
}
