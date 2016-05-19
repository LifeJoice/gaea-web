package org.gaea.security.repository;

import org.gaea.security.domain.Resource;
import org.springframework.data.repository.CrudRepository;

/**
 * Created by iverson on 2016/1/3.
 */
public interface SystemResourcesRepository extends CrudRepository<Resource,String> {
}
