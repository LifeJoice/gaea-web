package org.gaea.workflow.service.impl;

import org.gaea.workflow.service.WorkflowRuntimeService;
import org.activiti.engine.RuntimeService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

/**
 * Created by Iverson on 2015/8/31.
 */
@Service
public class WorkflowRuntimeServiceImpl implements WorkflowRuntimeService {
    @Autowired
    private RuntimeService runtimeService;

    @Override
    public void delProcessInstance(String processInstanceId, String deleteReason){
        runtimeService.deleteProcessInstance(processInstanceId,deleteReason);
    }
}
