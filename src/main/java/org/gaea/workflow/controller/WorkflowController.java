package org.gaea.workflow.controller;

import org.gaea.workflow.demo.dayoff.service.impl.DayoffServiceImpl;
import org.activiti.bpmn.model.BpmnModel;
import org.activiti.engine.*;
import org.activiti.engine.impl.ProcessEngineImpl;
import org.activiti.engine.repository.ProcessDefinition;
import org.activiti.engine.runtime.ProcessInstance;
import org.activiti.engine.task.Task;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Controller;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;

import javax.servlet.http.HttpServletRequest;
import javax.servlet.http.HttpServletResponse;
import java.io.IOException;
import java.io.InputStream;
import java.util.List;

/**
 * 提供一些工作流框架的通用方法。例如：查看流程图等。
 * Created by Iverson on 2015/8/30.
 */
@Controller
public class WorkflowController {
    @Autowired
    private ProcessEngine processEngine;
    @Autowired
    private RuntimeService runtimeService;
    @Autowired
    private TaskService taskService;
    @Autowired
    private RepositoryService repositoryService;
    @Autowired
    private ProcessEngineConfiguration processEngineConfiguration;

    /**
     * 显示某实例的流程图。这个必须在流程进行中才可以。
     * @param procInstanceId
     * @param request
     * @param response
     */
    @RequestMapping("/admin/workflow/showdiagram/{procInstanceId}")
    public void showWorkflowDiagram(@PathVariable String procInstanceId, HttpServletRequest request, HttpServletResponse response) {
        InputStream imageStream = null;
        ProcessInstance processInstance = runtimeService.createProcessInstanceQuery().processInstanceId(procInstanceId).singleResult();
        BpmnModel bpmnModel = repositoryService.getBpmnModel(processInstance.getProcessDefinitionId());
        List<String> activeActivityIds = runtimeService.getActiveActivityIds(procInstanceId);
        for (String activeId : activeActivityIds) {
            System.out.println(" ------------->>>> Active Id = '" + activeId + "'");
        }
        // 查找活动的Task
        Task t = taskService.createTaskQuery().executionId(procInstanceId).active().singleResult();
        System.out.println("---------->>>>当前Task： "+t.getId()+" : "+t.getName());
        imageStream = processEngineConfiguration.getProcessDiagramGenerator().generateDiagram(bpmnModel, "png", activeActivityIds);

        byte[] b = new byte[1024];
        int len = -1;
        try {
            while ((len = imageStream.read(b, 0, 1024)) != -1) {
                response.getOutputStream().write(b, 0, len);
            }
            imageStream.close();
        } catch (IOException e) {
            e.printStackTrace();
        }
    }

    /**
     * 获得某流程的流程图。不会展示当前实例去到哪一步。
     * @param request
     * @param response
     */
    @RequestMapping("/admin/workflow/showdiagram-definition/{procDefinition}")
    public void showWorkflowDefinitionDiagram(@PathVariable String procDefinition,HttpServletRequest request, HttpServletResponse response) {
        // 始终查找最新的流程发布版本
        ProcessDefinition process = repositoryService.createProcessDefinitionQuery().processDefinitionKey(DayoffServiceImpl.DAYOFF_PROCESS).latestVersion().singleResult();
        InputStream imageStream = null;
//        ProcessInstance processInstance = runtimeService.createProcessInstanceQuery().processInstanceId(procInstanceId).singleResult();
        BpmnModel bpmnModel = repositoryService.getBpmnModel(process.getId());
        // 解决乱码问题
        ProcessEngineImpl pe = (ProcessEngineImpl) processEngine;
        imageStream = processEngineConfiguration.getProcessDiagramGenerator().generatePngDiagram(bpmnModel);

        byte[] b = new byte[1024];
        int len = -1;
        try {
            while ((len = imageStream.read(b, 0, 1024)) != -1) {
                response.getOutputStream().write(b, 0, len);
            }
            imageStream.close();
        } catch (IOException e) {
            e.printStackTrace();
        }
    }
}
