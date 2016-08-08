package org.gaea.security.repository;

import org.gaea.security.domain.User;
import org.springframework.data.repository.CrudRepository;

/**
 * Created by iverson on 2016-8-3 14:14:19.
 */
public interface SystemUsersRepository extends CrudRepository<User,String> {
}
