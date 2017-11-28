package org.gaea.demo.entity;

import org.hibernate.annotations.GenericGenerator;

import javax.persistence.*;
import java.util.Date;
import java.sql.Timestamp;
import java.util.List;

/**
 * Created by iverson on 2017/1/16.
 */
@Entity
@Table(name = "DEMO_STUDENT")
public class DemoStudentEntity {
    private static final long serialVersionUID = 1L;
    @Id
    @GenericGenerator(name = "gaeaDateTimeIDGenerator", strategy = "org.gaea.extend.hibernate.id.GaeaDateTimeIDGenerator")
    @GeneratedValue(generator = "gaeaDateTimeIDGenerator")
    @Column(name = "ID")
    private String id;
    @Column(name = "NAME")
    private String name;
    @Column(name = "SEX")
    private int sex = 1; // 默认男
    @Column(name = "STU_NO")
    private String stuNo; // 学号
    @Column(name = "ENTRANCE_TIME")
    private Timestamp entranceTime; // 入学时间
    @Column(name = "BIRTHDAY")
    private Date birthday; // 出生日期
    @Column(name = "ADDRESS")
    private String address; // 地址
    @Column(name = "CLASS_ROLES")
    private String classRoles; // 班角色
    @Column(name = "CREATE_BY")
    private String createBy;
    @Column(name = "CREATE_TIME")
    private Date createTime;
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "CLASS_ID")
    private DemoClassEntity myClass;
    @OneToMany(mappedBy = "student", fetch = FetchType.LAZY, cascade = CascadeType.ALL, orphanRemoval = true)
    private List<DemoStudentPhotoEntity> photos;
    @Transient
    private List<String> imgType;

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

    public int getSex() {
        return sex;
    }

    public void setSex(int sex) {
        this.sex = sex;
    }

    public String getStuNo() {
        return stuNo;
    }

    public void setStuNo(String stuNo) {
        this.stuNo = stuNo;
    }

    public Timestamp getEntranceTime() {
        return entranceTime;
    }

    public void setEntranceTime(Timestamp entranceTime) {
        this.entranceTime = entranceTime;
    }

    public Date getBirthday() {
        return birthday;
    }

    public void setBirthday(Date birthday) {
        this.birthday = birthday;
    }

    public String getAddress() {
        return address;
    }

    public void setAddress(String address) {
        this.address = address;
    }

    public String getClassRoles() {
        return classRoles;
    }

    public void setClassRoles(String classRoles) {
        this.classRoles = classRoles;
    }

    public String getCreateBy() {
        return createBy;
    }

    public void setCreateBy(String createBy) {
        this.createBy = createBy;
    }

    public Date getCreateTime() {
        return createTime;
    }

    public void setCreateTime(Date createTime) {
        this.createTime = createTime;
    }

    public DemoClassEntity getMyClass() {
        return myClass;
    }

    public void setMyClass(DemoClassEntity myClass) {
        this.myClass = myClass;
    }

    public List<String> getImgType() {
        return imgType;
    }

    public void setImgType(List<String> imgType) {
        this.imgType = imgType;
    }
}
