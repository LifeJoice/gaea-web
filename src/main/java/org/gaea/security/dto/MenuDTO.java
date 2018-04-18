package org.gaea.security.dto;

import java.util.ArrayList;
import java.util.List;

/**
 * 供页面使用的DTO。一方面不要暴露一些系统entity的属性，另外把结构组织得更好页面去解析。
 * Created by iverson on 2016/2/2.
 */
public class MenuDTO {
    private String name;
    private int level;
    private String url;
    private List<MenuDTO> subMenus = new ArrayList<MenuDTO>();
    private String schemaId; // 对应的XML Schema Id。接口用于获取json渲染。

    public String getName() {
        return name;
    }

    public void setName(String name) {
        this.name = name;
    }

    public int getLevel() {
        return level;
    }

    public void setLevel(int level) {
        this.level = level;
    }

    public String getUrl() {
        return url;
    }

    public void setUrl(String url) {
        this.url = url;
    }

    public List<MenuDTO> getSubMenus() {
        return subMenus;
    }

    public void setSubMenus(List<MenuDTO> subMenus) {
        this.subMenus = subMenus;
    }

    public String getSchemaId() {
        return schemaId;
    }

    public void setSchemaId(String schemaId) {
        this.schemaId = schemaId;
    }
}
