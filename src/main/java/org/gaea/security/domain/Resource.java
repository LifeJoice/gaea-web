package org.gaea.security.domain;

import org.hibernate.annotations.GenericGenerator;

import javax.persistence.*;
import java.io.Serializable;
import java.util.List;

/**
 * Created by Iverson on 2015/11/6.
 */
@Entity
@Table(name = "GAEA_SYS_RESOURCES")
public class Resource implements Serializable {
    private static final long serialVersionUID = 1L;
    @Id
    @GenericGenerator(name="gaeaDateTimeIDGenerator", strategy="org.gaea.extend.hibernate.id.GaeaDateTimeIDGenerator")
    @GeneratedValue(generator = "gaeaDateTimeIDGenerator")
    @Column(name = "ID")
    private Long id;
    @Column(name = "NAME")
    private String name;
    @Column(name = "RESOURCE")
    private String resource;                // 资源。暂时来说，就是URL。
    @Column(name = "LEVEL")
    private Integer level = 0;          // 在树中的级别。只是方便管理。
    @Column(name = "ORDER_SEQ")
    private Integer orderSeq;               // 如果是菜单，有个排序。
    @Column(name = "description")
    private String description;
    @ManyToOne(fetch = FetchType.LAZY,cascade = CascadeType.ALL)
    @JoinColumn(name = "PARENT_ID")
    private Resource parent;
    @ManyToMany(fetch = FetchType.LAZY, cascade = {CascadeType.ALL})
    @JoinTable(
            name = "GAEA_SYS_AUTHORITIES_RESOURCES", joinColumns = {
            @JoinColumn(name = "RESOURCE_ID")
    }, inverseJoinColumns = {
            @JoinColumn(name = "AUTHORITY_ID")
    })
    private List<Authority> authorities;

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

    public String getResource() {
        return resource;
    }

    public void setResource(String resource) {
        this.resource = resource;
    }

    public Integer getLevel() {
        return level;
    }

    public void setLevel(Integer level) {
        this.level = level;
    }

    public Integer getOrderSeq() {
        return orderSeq;
    }

    public void setOrderSeq(Integer orderSeq) {
        this.orderSeq = orderSeq;
    }

    public String getDescription() {
        return description;
    }

    public void setDescription(String description) {
        this.description = description;
    }

    public Resource getParent() {
        return parent;
    }

    public void setParent(Resource parent) {
        this.parent = parent;
    }

    public List<Authority> getAuthorities() {
        return authorities;
    }

    public void setAuthorities(List<Authority> authorities) {
        this.authorities = authorities;
    }
}
