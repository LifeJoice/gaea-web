package org.gaea.security.repository;

import org.gaea.security.domain.Authority;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.CrudRepository;

import java.util.List;

/**
 * Created by iverson on 2016-8-1 11:33:12.
 */
public interface SystemAuthoritiesRepository extends CrudRepository<Authority,String> {
    @Query(value = "select auth from Authority auth left join fetch auth.resources")
    List<Authority> findAllWithResource();
}
