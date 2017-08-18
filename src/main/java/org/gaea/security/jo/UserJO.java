package org.gaea.security.jo;

import org.gaea.security.domain.Role;

import java.io.Serializable;
import java.util.List;

/**
 * 这个主要用于用户的信息（缓存、返回前端等）
 * Created by iverson on 2017/8/17.
 */
public class UserJO implements Serializable {
    private String id;
    private String name;
    private String loginName;

    public String getId() {
        return id;
    }

    public void setId(String id) {
        this.id = id;
    }

    public String getName() {
        return name;
    }

    public void setName(String name) {
        this.name = name;
    }

    public String getLoginName() {
        return loginName;
    }

    public void setLoginName(String loginName) {
        this.loginName = loginName;
    }
}
