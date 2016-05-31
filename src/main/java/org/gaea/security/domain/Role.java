package org.gaea.security.domain;

import org.hibernate.annotations.GenericGenerator;

import javax.persistence.*;
import java.io.Serializable;
import java.util.List;

/**
 * Created by Iverson on 2015/11/5.
 */
@Entity
@Table(name = "GAEA_SYS_ROLES")
public class Role implements Serializable {
    private static final long serialVersionUID = 1L;
    @Id
    @GenericGenerator(name="gaeaDateTimeIDGenerator", strategy="org.gaea.extend.hibernate.id.GaeaDateTimeIDGenerator")
    @GeneratedValue(generator = "gaeaDateTimeIDGenerator")
    private String id;
    @Column(name = "name")
    private String name;
    @Column(name = "code")
    private String code;                    // 代表性的全英文编码
    @Column(name = "description")
    private String description;
    @ManyToOne(fetch = FetchType.LAZY,cascade = CascadeType.ALL)
    @JoinColumn(name = "parent_id")
    private Role parent;
    @OneToMany(mappedBy = "parent",cascade = CascadeType.ALL,fetch = FetchType.LAZY)
    private List<Role> subRoles;
    @ManyToMany(fetch = FetchType.LAZY, cascade = {CascadeType.ALL})
    @JoinTable(
            name = "GAEA_SYS_USERS_ROLES", joinColumns = {
            @JoinColumn(name = "ROLE_ID")
    }, inverseJoinColumns = {
            @JoinColumn(name = "USER_ID")
    })
    private List<User> users;
    @ManyToMany(fetch = FetchType.LAZY, cascade = {CascadeType.ALL})
    @JoinTable(
            name = "GAEA_SYS_ROLES_AUTHORITIES", joinColumns = {
            @JoinColumn(name = "ROLE_ID")
    }, inverseJoinColumns = {
            @JoinColumn(name = "AUTHORITY_ID")
    })
    private List<Authority> authorities;

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

    public Role getParent() {
        return parent;
    }

    public void setParent(Role parent) {
        this.parent = parent;
    }

    public List<Role> getSubRoles() {
        return subRoles;
    }

    public void setSubRoles(List<Role> subRoles) {
        this.subRoles = subRoles;
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
}
