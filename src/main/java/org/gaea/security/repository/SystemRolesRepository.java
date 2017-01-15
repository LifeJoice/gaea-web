package org.gaea.security.repository;

import org.gaea.security.domain.Role;
import org.gaea.security.domain.User;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.CrudRepository;

import java.util.List;

/**
 * Created by iverson on 2016-8-3 10:45:40.
 */
public interface SystemRolesRepository extends CrudRepository<Role,String> {
    @Query(value = "select r from Role r where r.users in (?1)")
    List<Role> findByUser(List<User> users);
}
