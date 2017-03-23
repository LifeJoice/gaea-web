package org.gaea.demo.dto;

import org.gaea.demo.entity.DemoStudentEntity;

import java.sql.Date;
import java.util.List;

/**
 * 演示功能的班级
 * Created by iverson on 2017/1/16.
 */
public class DemoClassDTO {
    private static final long serialVersionUID = 1L;
    private String id;
    private String className;
    private Integer termYear; // 第几届
    private Integer currentYear; // 几年级
    private String classNo; // 几班
    private List<String> classRolesList; // 班里角色，班长……
    private String createBy;
    private Date createTime;
//    private List<DemoStudentEntity> students;

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

//    public List<DemoStudentEntity> getStudents() {
//        return students;
//    }
//
//    public void setStudents(List<DemoStudentEntity> students) {
//        this.students = students;
//    }

    public List<String> getClassRolesList() {
        return classRolesList;
    }

    public void setClassRolesList(List<String> classRolesList) {
        this.classRolesList = classRolesList;
    }
}
