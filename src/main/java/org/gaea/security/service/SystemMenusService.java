package org.gaea.security.service;

import org.gaea.security.domain.Menu;
import org.gaea.security.dto.MenuDTO;

import java.util.List;
import java.util.Set;

/**
 * Created by iverson on 2016/1/31.
 */
public interface SystemMenusService {
    void save(Menu menu);

    List<MenuDTO> findAll(Set<String> loginName);
}
