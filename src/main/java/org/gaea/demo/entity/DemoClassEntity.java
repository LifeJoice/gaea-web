package org.gaea.demo.entity;

import org.hibernate.annotations.GenericGenerator;

import javax.persistence.*;
import java.sql.Date;
import java.util.List;

/**
 * 演示功能的班级
 * Created by iverson on 2017/1/16.
 */
@Entity
@Table(name = "DEMO_CLASS")
public class DemoClassEntity {
    private static final long serialVersionUID = 1L;
    @Id
    @GenericGenerator(name = "gaeaDateTimeIDGenerator", strategy = "org.gaea.extend.hibernate.id.GaeaDateTimeIDGenerator")
    @GeneratedValue(generator = "gaeaDateTimeIDGenerator")
    @Column(name = "ID")
    private String id;
    @Column(name = "CLASS_NAME")
    private String className;
    @Column(name = "TERM_YEAR")
    private Integer termYear; // 第几届
    @Column(name = "CURRENT_YEAR")
    private Integer currentYear; // 几年级
    @Column(name = "CLASS_NO")
    private String classNo; // 几班
    // 和classRoleList对应的数据库字段。这个纯粹是为了测试写入获取、转换List存在。设计上不应该这样。
    @Column(name = "CLASS_HONOURS")
    private String classHonours; // 班级荣誉
    @Column(name = "CREATE_BY")
    private String createBy;
    @Column(name = "CREATE_TIME")
    private Date createTime;
    @OneToMany(mappedBy = "myClass", fetch = FetchType.LAZY)
    private List<DemoStudentEntity> students;

    public String getId() {
        return id;
    }

    public void setId(String id) {
        this.id = id;
    }

    public String getClassName() {
        return className;
    }

    public void setClassName(String className) {
        this.className = className;
    }

    public Integer getTermYear() {
        return termYear;
    }

    public void setTermYear(Integer termYear) {
        this.termYear = termYear;
    }

    public Integer getCurrentYear() {
        return currentYear;
    }

    public void setCurrentYear(Integer currentYear) {
        this.currentYear = currentYear;
    }

    public String getClassNo() {
        return classNo;
    }

    public void setClassNo(String classNo) {
        this.classNo = classNo;
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

    public List<DemoStudentEntity> getStudents() {
        return students;
    }

    public void setStudents(List<DemoStudentEntity> students) {
        this.students = students;
    }

    public String getClassHonours() {
        return classHonours;
    }

    public void setClassHonours(String classHonours) {
        this.classHonours = classHonours;
    }
}
