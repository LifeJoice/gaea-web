package org.gaea.workflow.service;

import org.gaea.workflow.domain.WorkflowDomain;

/**
 * 提供面向切片的服务方法。不建议一般功能调用此中的方法。
 * Created by Iverson on 2015/7/20.
 */
public interface WorkflowAspectService {
    void startProcess(String processDefKey, WorkflowDomain workflowDomain);

    void completeTask(WorkflowDomain workflowDomain);
}
