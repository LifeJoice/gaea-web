package org.gaea.workflow.domain;

import javax.persistence.Column;
import javax.persistence.MappedSuperclass;
import javax.persistence.Transient;
import java.io.Serializable;
import java.util.HashMap;
import java.util.Map;

/**
 * Created by Iverson on 2015/7/12.
 */
@MappedSuperclass
public abstract class WorkflowDomain<PK extends Serializable> {

    private static final long serialVersionUID = 1L;
    /* 流程实例ID */
    @Column(name = "WF_PROC_INST_ID", nullable = true, length = 64)
    private String wfProcInstId;
    /* 所处节点名称 */
    @Column(name = "WF_ACT_NAME", nullable = true, length = 255)
    private String wfActName;
    @Transient
    private Map<String,Object> wfVariables;         // 工作流在流转过程中的变量集合。
    @Transient
    private String wfApprovalReason;                // 审批的理由

    public String getWfProcInstId() {
        return wfProcInstId;
    }

    public void setWfProcInstId(String wfProcInstId) {
        this.wfProcInstId = wfProcInstId;
    }

    public String getWfActName() {
        return wfActName;
    }

    public void setWfActName(String wfActName) {
        this.wfActName = wfActName;
    }

    public String getWfApprovalReason() {
        return wfApprovalReason;
    }

    public void setWfApprovalReason(String wfApprovalReason) {
        this.wfApprovalReason = wfApprovalReason;
    }

    public Map<String, Object> getWfVariables() {
        if(wfVariables==null){
            wfVariables = new HashMap<String, Object>();
        }
        return wfVariables;
    }

    public void setWfVariables(Map<String, Object> wfVariables) {
        this.wfVariables = wfVariables;
    }
}
