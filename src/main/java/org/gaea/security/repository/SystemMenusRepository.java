package org.gaea.security.repository;

import org.gaea.security.domain.Menu;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.CrudRepository;
import org.springframework.data.repository.query.Param;

import java.util.Collection;
import java.util.List;

/**
 * Created by iverson on 2016/1/30.
 */
public interface SystemMenusRepository extends CrudRepository<Menu,String> {
    @Query("SELECT m FROM Menu m LEFT JOIN m.resource.authorities auth WHERE auth.code IN (:AUTH_CODES)")
    List<Menu> findByAuthorities(@Param("AUTH_CODES") Collection<String> authorities);
}
