package org.gaea.security.repository;

import org.gaea.security.domain.Role;
import org.springframework.data.repository.CrudRepository;

/**
 * Created by iverson on 2016-8-3 10:45:40.
 */
public interface SystemRolesRepository extends CrudRepository<Role,String> {
}
