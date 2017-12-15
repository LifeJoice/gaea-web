package org.gaea.security.service;

import org.gaea.exception.ProcessFailedException;
import org.gaea.exception.ValidationFailedException;
import org.gaea.security.domain.Menu;
import org.gaea.security.dto.MenuDTO;

import java.io.IOException;
import java.util.List;
import java.util.Map;
import java.util.Set;

/**
 * Created by iverson on 2016/1/31.
 */
public interface SystemMenusService {
    void save(Menu menu);

    void update(Menu inMenu) throws ValidationFailedException;

    List<MenuDTO> findAll(Set<String> loginName);

    Map<String, Object> loadEditData(String id) throws ProcessFailedException, IOException;

    void delete(List<Menu> menuList) throws ValidationFailedException;
}
