package org.gaea.security.domain;

import org.gaea.data.dataset.domain.DsAuthRole;
import org.gaea.framework.web.data.authority.entity.DsAuthorityEntity;
import org.hibernate.annotations.GenericGenerator;

import javax.persistence.*;
import java.io.Serializable;
import java.util.List;

/**
 * Created by Iverson on 2015/11/5.
 */
@Entity
@Table(name = "GAEA_SYS_ROLES")
public class Role implements Serializable, DsAuthRole {
    private static final long serialVersionUID = 1L;
    @Id
    @GenericGenerator(name="gaeaDateTimeIDGenerator", strategy="org.gaea.extend.hibernate.id.GaeaDateTimeIDGenerator")
    @GeneratedValue(generator = "gaeaDateTimeIDGenerator")
    private String id;
    @Column(name = "name", nullable = false)
    private String name;
    @Column(name = "code", unique = true, nullable = false)
    private String code;                    // 代表性的全英文编码
    @Column(name = "description")
    private String description;
    //    @ManyToOne(fetch = FetchType.LAZY,cascade = CascadeType.ALL)
//    @JoinColumn(name = "parent_id")
//    private Role parent;
//    @OneToMany(mappedBy = "parent",cascade = CascadeType.ALL,fetch = FetchType.LAZY)
//    private List<Role> subRoles;
    @ManyToMany(fetch = FetchType.LAZY)
    @JoinTable(
            name = "GAEA_SYS_USERS_ROLES", joinColumns = {
            @JoinColumn(name = "ROLE_ID")
    }, inverseJoinColumns = {
            @JoinColumn(name = "USER_ID")
    })
    private List<User> users;
    @ManyToMany(fetch = FetchType.LAZY)
    @JoinTable(
            name = "GAEA_SYS_ROLES_AUTHORITIES", joinColumns = {
            @JoinColumn(name = "ROLE_ID")
    }, inverseJoinColumns = {
            @JoinColumn(name = "AUTHORITY_ID")
    })
    private List<Authority> authorities;
    /**
     * 一个角色，可能对应n个数据集权限控制组。
     */
    @ManyToMany(fetch = FetchType.LAZY)
    @JoinTable(
            name = "GAEA_SYS_DS_AUTHORITIES_ROLES", joinColumns = {
            @JoinColumn(name = "ROLE_ID")
    }, inverseJoinColumns = {
            @JoinColumn(name = "DS_AUTHORITY_ID")
    })
    private List<DsAuthorityEntity> dsAuthorities;

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

    public String getCode() {
        return code;
    }

    public void setCode(String code) {
        this.code = code;
    }

    public String getDescription() {
        return description;
    }

    public void setDescription(String description) {
        this.description = description;
    }

    public List<User> getUsers() {
        return users;
    }

    public void setUsers(List<User> users) {
        this.users = users;
    }

    public List<Authority> getAuthorities() {
        return authorities;
    }

    public void setAuthorities(List<Authority> authorities) {
        this.authorities = authorities;
    }

    public List<DsAuthorityEntity> getDsAuthorities() {
        return dsAuthorities;
    }

    public void setDsAuthorities(List<DsAuthorityEntity> dsAuthorities) {
        this.dsAuthorities = dsAuthorities;
    }
}
