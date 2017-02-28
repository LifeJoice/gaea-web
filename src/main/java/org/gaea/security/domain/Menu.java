package org.gaea.security.domain;

import org.hibernate.annotations.GenericGenerator;

import javax.persistence.*;

/**
 * Created by iverson on 2016/1/30.
 */
@Entity
@Table(name = "GAEA_SYS_MENUS")
public class Menu {
    private static final long serialVersionUID = 1L;
    @Id
    @GenericGenerator(name="gaeaDateTimeIDGenerator", strategy="org.gaea.extend.hibernate.id.GaeaDateTimeIDGenerator")
    @GeneratedValue(generator = "gaeaDateTimeIDGenerator")
    @Column(name = "ID")
    private String id;
    @Column(name = "NAME")
    private String name;
    @OneToOne(cascade=CascadeType.REMOVE)
    @JoinColumn(name="RESOURCE_ID")
    private Resource resource;
    @Column(name = "LEVEL_NUM")
    private Integer level;          // 菜单树中的级别
    @Column(name = "STATUS")
    private Integer status;         // -1 删除 0 禁用 1 可用
    @ManyToOne(fetch = FetchType.LAZY,cascade = CascadeType.REMOVE)
    @JoinColumn(name = "PARENT_ID")
    private Menu parent;
    public static final int LEVEL_2 = 2;
    public static final int LEVEL_3 = 3;

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

    public Resource getResource() {
        return resource;
    }

    public void setResource(Resource resource) {
        this.resource = resource;
    }

    public Integer getLevel() {
        return level;
    }

    public void setLevel(Integer level) {
        this.level = level;
    }

    public Integer getStatus() {
        return status;
    }

    public void setStatus(Integer status) {
        this.status = status;
    }

    public Menu getParent() {
        return parent;
    }

    public void setParent(Menu parent) {
        this.parent = parent;
    }
}
