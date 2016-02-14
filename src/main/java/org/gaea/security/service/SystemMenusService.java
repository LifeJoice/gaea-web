package org.gaea.security.service;

import org.gaea.security.dto.MenuDTO;

import java.util.List;
import java.util.Set;

/**
 * Created by iverson on 2016/1/31.
 */
public interface SystemMenusService {
    List<MenuDTO> findAll(Set<String> loginName);
}
