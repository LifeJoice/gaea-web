package org.gaea.security.repository;

import org.gaea.security.domain.User;
import org.springframework.data.repository.CrudRepository;

import java.util.List;

/**
 * Created by iverson on 2016-8-3 14:14:19.
 */
public interface SystemUsersRepository extends CrudRepository<User,String> {
    List<User> findByLoginName(String loginName);
}
