package org.gaea.workflow.demo.controller;

/**
 * 请假流程的DTO
 *
 * @author Iverson 2014-7-6
 */
public class DayOffMgrDTO {

    private String procInstanceId;
    private String activityTaskId;
    private String activityTaskKey;
    private String activityTaskName;

    public String getProcInstanceId() {
        return procInstanceId;
    }

    public void setProcInstanceId(String procInstanceId) {
        this.procInstanceId = procInstanceId;
    }

    public String getActivityTaskId() {
        return activityTaskId;
    }

    public void setActivityTaskId(String activityTaskId) {
        this.activityTaskId = activityTaskId;
    }

    public String getActivityTaskKey() {
        return activityTaskKey;
    }

    public void setActivityTaskKey(String activityTaskKey) {
        this.activityTaskKey = activityTaskKey;
    }

    public String getActivityTaskName() {
        return activityTaskName;
    }

    public void setActivityTaskName(String activityTaskName) {
        this.activityTaskName = activityTaskName;
    }

}
