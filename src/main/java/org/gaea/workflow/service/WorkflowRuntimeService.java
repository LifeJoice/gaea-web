package org.gaea.workflow.service;

/**
 * Created by Iverson on 2015/8/31.
 */
public interface WorkflowRuntimeService {
    void delProcessInstance(String processInstanceId, String deleteReason);
}
