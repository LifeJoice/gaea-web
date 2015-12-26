package org.gaea.security.domain;

import javax.persistence.*;
import java.io.Serializable;
import java.util.List;

/**
 * 权限
 * Created by Iverson on 2015/11/22.
 */
@Entity
@Table(name = "GAEA_SYS_AUTHORITIES")
public class Authority implements Serializable {
    private static final long serialVersionUID = 1L;
    @Id
    @GeneratedValue(strategy = GenerationType.AUTO)
    @Column(name = "ID")
    private Long id;
    @Column(name = "NAME")
    private String name;                // 一个方便记忆的权限的名字。例如：查看用户列表
    @Column(name = "CODE")
    private String code;                // 框架判断权限的全英文的编码。例如：USER_LIST_QUERY
    @Column(name = "LEVEL")
    private Integer level = 0;          // 在树中的级别。只是方便管理。
    @Column(name = "DESCRIPTION")
    private String description;
    @ManyToOne(fetch = FetchType.LAZY,cascade = CascadeType.ALL)
    @JoinColumn(name = "PARENT_ID")
    private Authority parent;
    @ManyToMany(fetch = FetchType.LAZY, cascade = {CascadeType.ALL})
    @JoinTable(
            name = "GAEA_SYS_AUTHORITIES_RESOURCES", joinColumns = {
            @JoinColumn(name = "AUTHORITY_ID")
    }, inverseJoinColumns = {
            @JoinColumn(name = "RESOURCE_ID")
    })
    private List<Resource> resources;
    @ManyToMany(fetch = FetchType.LAZY, cascade = {CascadeType.ALL})
    @JoinTable(
            name = "GAEA_SYS_ROLES_AUTHORITIES", joinColumns = {
            @JoinColumn(name = "RESOURCE_ID")
    }, inverseJoinColumns = {
            @JoinColumn(name = "ROLE_ID")
    })
    private List<Role> roles;

    public Long getId() {
        return id;
    }

    public void setId(Long id) {
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

    public Integer getLevel() {
        return level;
    }

    public void setLevel(Integer level) {
        this.level = level;
    }

    public String getDescription() {
        return description;
    }

    public void setDescription(String description) {
        this.description = description;
    }

    public Authority getParent() {
        return parent;
    }

    public void setParent(Authority parent) {
        this.parent = parent;
    }

    public List<Resource> getResources() {
        return resources;
    }

    public void setResources(List<Resource> resources) {
        this.resources = resources;
    }

    public List<Role> getRoles() {
        return roles;
    }

    public void setRoles(List<Role> roles) {
        this.roles = roles;
    }
}
