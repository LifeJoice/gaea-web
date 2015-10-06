package org.gaea.workflow.service.impl;

import org.gaea.workflow.demo.dayoff.service.DayoffService;
import org.gaea.workflow.domain.WorkflowDomain;
import org.gaea.workflow.service.WorkflowAspectService;
import org.activiti.engine.*;
import org.activiti.engine.runtime.ProcessInstance;
import org.activiti.engine.task.Task;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

/**
 * Created by Iverson on 2015/7/20.
 */
@Service
@Transactional
public class WorkflowAspectServiceImpl implements WorkflowAspectService {

    private final Logger logger = LoggerFactory.getLogger(getClass());

    @Autowired
    private ProcessEngine processEngine;
    @Autowired
    private HistoryService historyService;
    @Autowired
    private DayoffService dayoffService;
    @Autowired
    private RuntimeService runtimeService;
    @Autowired
    private TaskService taskService;
    @Autowired
    private RepositoryService repositoryService;

    @Override
    @Transactional
    public void startProcess(String processDefKey, WorkflowDomain workflowDomain){
        System.out.println("\n---------->>>创建、提交表单和启动工作流。 Process Define: "+processDefKey);
//        针对特定的功能，可以把流程ID硬编码。
//        String processId = "urDayOffProcess";
//        if (form == null) {
//            return HtmlResultUtils.warn("<h1>user ID can't be null!</h1>");
//        }
//        ProcessEngine processEngine = ProcessEngineConfiguration.createStandaloneProcessEngineConfiguration().buildProcessEngine();
        // 通过 ProcessEngine 实例获得 RepositoryService
        RepositoryService repositoryService = processEngine.getRepositoryService();
        System.out.println("\n---------->>>Activiti环境运行正常。。。\n");
        // 通过 ProcessEngine 实例获得 RuntimeService
//        RuntimeService runtimeService = processEngine.getRuntimeService();
        // 使用 RuntimeService 创建一个流程的实例
        ProcessInstance process = runtimeService.startProcessInstanceByKey(processDefKey);
//        String procId = runtimeService.startProcessInstanceByKey("urDayOffProcess").getId();
        System.out.println(" -- 获得流程ID了。---->>" + process.getId());
        // 查找活动的Task
        Task task = taskService.createTaskQuery().executionId(process.getId()).active().singleResult();
        System.out.println("---------->>>>当前Task： " + task.getId() + " : " + task.getName());
        workflowDomain.setWfProcInstId(process.getId());
        workflowDomain.setWfActName(task.getName());
//        workflowDomain.setWfProcInstId("测试ID");
    }

    @Override
    @Transactional
    public void completeTask(WorkflowDomain workflowDomain){
        System.out.println("\n---------->>>完成工作流节点。 Process instance id: "+ workflowDomain.getWfProcInstId());
        String wfProcInstId = workflowDomain.getWfProcInstId();
        // 查找活动的Task
        Task task = taskService.createTaskQuery().executionId(wfProcInstId).active().singleResult();
        if(task==null){
            logger.warn("找不到活动的Task。无法进行工作流操作——'completeTask'。流程实例id="+wfProcInstId);
            return;
        }
        logger.debug("---------->>>>当前Task： " + task.getId() + " : " + task.getName());
        taskService.complete(task.getId(), workflowDomain.getWfVariables());
        // 获取最新的Task
        task = taskService.createTaskQuery().executionId(wfProcInstId).active().singleResult();
        // 设置domain里面的活动Task的名字，供具体功能去记录。
        workflowDomain.setWfActName(task.getName());
    }
}
