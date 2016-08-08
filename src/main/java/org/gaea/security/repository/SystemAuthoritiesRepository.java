package org.gaea.security.repository;

import org.gaea.security.domain.Authority;
import org.springframework.data.repository.CrudRepository;

/**
 * Created by iverson on 2016-8-1 11:33:12.
 */
public interface SystemAuthoritiesRepository extends CrudRepository<Authority,String> {
}
