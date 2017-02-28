package org.gaea.security.service.impl;

import org.gaea.security.domain.Menu;
import org.gaea.security.dto.MenuDTO;
import org.gaea.security.repository.SystemMenusRepository;
import org.gaea.security.service.SystemMenusService;
import org.gaea.util.BeanUtils;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.*;

/**
 * Created by iverson on 2016/1/31.
 */
@Service
public class SystemMenusServiceImpl implements SystemMenusService {
    private final Logger logger = LoggerFactory.getLogger(SystemMenusServiceImpl.class);
    @Autowired
    private SystemMenusRepository systemMenusRepository;

    @Override
    public void save(Menu menu) {
        systemMenusRepository.save(menu);
    }

    @Override
    @Transactional
    public List<MenuDTO> findAll(Set<String> authSet) {
        if (authSet != null && authSet.size() > 0) {
            List<Menu> myMenus = systemMenusRepository.findByAuthorities(authSet);
            if (myMenus != null) {
                Map<String, MenuDTO> menuDTOMap = new HashMap<String, MenuDTO>();
                for (Menu menu : myMenus) {
//                    MenuDTO menuDTO = new MenuDTO();
                    if (menu.getLevel() == Menu.LEVEL_2) {
                        MenuDTO lv2MenuDTO = menuDTOMap.get(menu.getName());
                        if (lv2MenuDTO != null) {
                            continue;
                        } else {
                            lv2MenuDTO = new MenuDTO();
                            lv2MenuDTO.setName(menu.getName());
                            lv2MenuDTO.setLevel(menu.getLevel());
                            lv2MenuDTO.setUrl(menu.getResource().getResourceUrl());
                            menuDTOMap.put(menu.getName(), lv2MenuDTO);
                        }
                    } else if (menu.getLevel() == Menu.LEVEL_3) {
                        String lv2MenuName = menu.getParent().getName();
                        MenuDTO parentMenu = menuDTOMap.get(lv2MenuName);
                        if (parentMenu == null) {
                            parentMenu = new MenuDTO();
                            BeanUtils.copyProperties(menu.getParent(), parentMenu);
                            menuDTOMap.put(lv2MenuName, parentMenu);
                        }
                        MenuDTO menuDTO = new MenuDTO();
                        menuDTO.setName(menu.getName());
                        menuDTO.setLevel(menu.getLevel());
                        menuDTO.setUrl(menu.getResource().getResourceUrl());
                        parentMenu.getSubMenus().add(menuDTO);
                    }
                }
                return new ArrayList<MenuDTO>(menuDTOMap.values());
            }
        }
        return null;
    }
}
