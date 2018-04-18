package org.gaea.security.service.impl;

import org.apache.commons.collections.CollectionUtils;
import org.apache.commons.lang3.StringUtils;
import org.gaea.exception.ProcessFailedException;
import org.gaea.exception.ValidationFailedException;
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

import java.io.IOException;
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
        menu.setId("");// 避免页面端有缓存，新增都应该是空的id
        systemMenusRepository.save(menu);
    }

    @Override
    public void update(Menu inMenu) throws ValidationFailedException {
        if (inMenu == null || StringUtils.isEmpty(inMenu.getId())) {
            throw new ValidationFailedException("页面传来的资源对象为空，无法保存！");
        }
        Menu menu = systemMenusRepository.findOne(inMenu.getId());
        // 不覆盖资源权限的配置关系
        BeanUtils.copyProperties(inMenu, menu, "authorities");
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
                            BeanUtils.copyProperties(menu.getParent(), parentMenu, "subMenus");
                            menuDTOMap.put(lv2MenuName, parentMenu);
                        }
                        MenuDTO menuDTO = new MenuDTO();
                        BeanUtils.copyProperties(menu, menuDTO, "subMenus");
//                        menuDTO.setName(menu.getName());
//                        menuDTO.setLevel(menu.getLevel());
                        menuDTO.setUrl(menu.getResource().getResourceUrl());
                        parentMenu.getSubMenus().add(menuDTO);
                    }
                }
                return new ArrayList<MenuDTO>(menuDTOMap.values());
            }
        }
        return null;
    }

    @Override
    @Transactional(readOnly = true)
    public Map<String, Object> loadEditData(String id) throws ProcessFailedException, IOException {
        if (StringUtils.isEmpty(id)) {
            throw new IllegalArgumentException("id为空，无法加载编辑数据！");
        }
        Map<String, Object> result = new HashMap<String, Object>();
        Menu menu = systemMenusRepository.findOne(id);
        if (menu == null) {
            throw new ProcessFailedException("找不到对应的菜单数据，无法编辑！");
        }
        result.put("menu.id", menu.getId());
        result.put("menu.name", menu.getName());
        result.put("menu.level", menu.getLevel());
        result.put("menu.schemaId", menu.getSchemaId());
        if (menu.getParent() != null) {
            result.put("menu.parent.id", menu.getParent().getId());
        }
        if (menu.getResource() != null) {
            result.put("menu.resource.id", menu.getResource().getId());
        }

        return result;

    }

    @Override
    @Transactional
    public void delete(List<Menu> menuList) throws ValidationFailedException {
        // id不为空，是更新操作
        if (CollectionUtils.isEmpty(menuList)) {
            throw new ValidationFailedException("选择菜单为空，无法执行删除操作！");
        }
        for (Menu menu : menuList) {
            Menu menuEntity = systemMenusRepository.findOne(menu.getId());
            systemMenusRepository.delete(menuEntity);
        }
    }
}
