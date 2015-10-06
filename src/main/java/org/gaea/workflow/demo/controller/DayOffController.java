package org.gaea.workflow.demo.controller;

import org.activiti.bpmn.model.BpmnModel;
import org.activiti.engine.ProcessEngine;
import org.activiti.engine.RepositoryService;
import org.activiti.engine.RuntimeService;
import org.activiti.engine.TaskService;
import org.activiti.engine.impl.ProcessEngineImpl;
import org.activiti.engine.impl.context.Context;
import org.activiti.engine.repository.Model;
import org.activiti.engine.repository.ProcessDefinition;
import org.activiti.engine.runtime.Execution;
import org.activiti.engine.runtime.ProcessInstance;
import org.activiti.engine.task.Task;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Controller;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.ResponseBody;

import javax.servlet.http.HttpServletRequest;
import javax.servlet.http.HttpServletResponse;
import java.io.*;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.logging.Level;
import java.util.logging.Logger;

/**
 * 请假申请流程。
 *
 * @author Iverson 2015-5-13
 */
@Controller
public class DayOffController {

    @Autowired
    private ProcessEngine processEngine;

    @RequestMapping("/admin/activiti/instance/{procDefId}/list-all.do")
    public String listAllProcInstance(@PathVariable String procDefId, HttpServletRequest request, HttpServletResponse response) {
        if (procDefId == null || "".equals(procDefId)) {
            request.setAttribute("RESULT_MSG", "流程定义ID不能为空。");
            return "results";
        }
        // 通过 ProcessEngine 实例获得 RuntimeService 
        RepositoryService repositoryService = processEngine.getRepositoryService();
        RuntimeService runtimeService = processEngine.getRuntimeService();
        TaskService taskService = processEngine.getTaskService();
        ProcessDefinition process = repositoryService.createProcessDefinitionQuery().processDefinitionKey(procDefId).singleResult();
        String procId = process.getId();
        System.out.println("---------->>>process id = " + procId);
//        List<ProcessInstance> instList = runtimeService.createProcessInstanceQuery()
//                .processDefinitionId(process.getId())
////                .processInstanceId(process.getId())
//                .list();
        List<ProcessInstance> instList = runtimeService.createProcessInstanceQuery().processDefinitionKey(procDefId).list();
        List<DayOffMgrDTO> dayoffList = new ArrayList<DayOffMgrDTO>();
        // 遍历流程的各个实例
        for (ProcessInstance processInstance : instList) {
            DayOffMgrDTO dto = new DayOffMgrDTO();
            System.out.println("---------->>>> 流程实例id=" + processInstance.getId());
            /**
             * processInstance.getActivityId() 实际上是task
             * key。Activiti的id和key总是比较混乱。
             */
            Task task = taskService.createTaskQuery()
                    .processDefinitionId(processInstance.getProcessDefinitionId())
                    .taskDefinitionKey(processInstance.getActivityId()).singleResult();
            // !!!这个判断分类是不严谨的。只是随便写的。
            if (task != null) {
                dto.setProcInstanceId(processInstance.getId());
                dto.setActivityTaskId(task.getId());
                dto.setActivityTaskKey(task.getTaskDefinitionKey());
                dto.setActivityTaskName(task.getName());
            } else {
                // 假设是并行节点，这个假设不一定正确。这是一棵树，简单的一级级往下找。
                List<Execution> executions = runtimeService.createNativeExecutionQuery()
                        .sql("SELECT * FROM "+processEngine.getManagementService().getTableName(Execution.class)
                        +" WHERE PROC_INST_ID_=#{processInstanceId} and IS_ACTIVE_=#{isActive}")
                        .parameter("processInstanceId", processInstance.getId())
                        .parameter("isActive", "1").list();
//                List<Execution> executions = runtimeService.createExecutionQuery()
//                        .processInstanceId(processInstance.getId()).list();
//                for (Execution exec : executions) {
                createTaskDTOs(executions, dayoffList, runtimeService, taskService);
//                }
            }
            dayoffList.add(dto);
        }
        request.setAttribute("INSTANCES", dayoffList);
        return "process-mgr";
    }

    @RequestMapping("/admin/activiti/test.do")
    public @ResponseBody
    void test(HttpServletResponse response) {
        System.out.println("\n---------->>>开始Activiti之旅。。。\n");
//        ProcessEngine processEngine = ProcessEngineConfiguration.createStandaloneProcessEngineConfiguration().buildProcessEngine();
        // 通过 ProcessEngine 实例获得 RepositoryService 
        RepositoryService repositoryService = processEngine.getRepositoryService();
        System.out.println("---------->>>Activiti环境运行正常。。。\n");
//        Model myModel = repositoryService.getModel("2501");
//        System.out.println("---------->>>流程模型已经找到。\n");
//        查看模型
        List<Model> models = repositoryService.createModelQuery().list();
        for(Model m:models){
            System.out.println("模型名称： "+m.getName());
        }
//        查看流程变化
        System.out.println("Number of process definitions: " + repositoryService.createProcessDefinitionQuery().count());
//        System.out.println("---------->>>Activiti流程运行正常。。。\n");
        // 通过 ProcessEngine 实例获得 RuntimeService
//        RuntimeService runtimeService = processEngine.getRuntimeService();
        // 使用 RuntimeService 创建一个流程的实例
//        String procId = runtimeService.startProcessInstanceByKey("urDayOffProcess").getId();
//        System.out.println(" -- 获得流程ID了。---->>" + procId);
    }

    /**
     * 通过bpmn文件发布流程。
     *
     * @param response
     * @return
     */
    @RequestMapping("/admin/activiti/deploy.do")
    public String deployProcess(HttpServletRequest request, HttpServletResponse response) {
        try {
            RepositoryService repositoryService = processEngine.getRepositoryService();
            // 这里的resourceName和inputStream的文件名字必须一致，否则会发布不成功。虽然没有错误提示。
            repositoryService.createDeployment()
                    .addInputStream("URDayOffProcess.bpmn", new FileInputStream(new File("C:\\Users\\Iverson\\Desktop\\URDayOffProcess.bpmn")))
                    .deploy();
            System.out.println(" ---------->>> Number of process definitions: " + repositoryService.createProcessDefinitionQuery().count());
            request.setAttribute("RESULT_MSG", "发布成功。");
        } catch (FileNotFoundException ex) {
            Logger.getLogger(DayOffController.class.getName()).log(Level.SEVERE, null, ex);
        }
        return "results";
    }

    /**
     * 启动流程。
     *
     * @param response
     * @return
     */
    @RequestMapping("/admin/activiti/start.do")
    public String startProcess(String processId, HttpServletRequest request, HttpServletResponse response) {
        System.out.println("\n---------->>>开始Activiti之旅。。。\n");
        if (processId == null || "".equals(processId)) {
            request.setAttribute("RESULT_MSG", "流程ID不能为空。");
            return "results";
        }
//        ProcessEngine processEngine = ProcessEngineConfiguration.createStandaloneProcessEngineConfiguration().buildProcessEngine();
        // 通过 ProcessEngine 实例获得 RepositoryService 
        RepositoryService repositoryService = processEngine.getRepositoryService();
        System.out.println("\n---------->>>Activiti环境运行正常。。。\n");
        // 通过 ProcessEngine 实例获得 RuntimeService 
        RuntimeService runtimeService = processEngine.getRuntimeService();
        // 使用 RuntimeService 创建一个流程的实例
        ProcessInstance process = runtimeService.startProcessInstanceByKey(processId);
//        String procId = runtimeService.startProcessInstanceByKey("urDayOffProcess").getId();
        System.out.println(" -- 获得流程ID了。---->>" + process.getId());
        return "results";
    }

    // 请假申请填写
    @RequestMapping("/admin/activiti/iverson/apply.do")
    public String createForm(HttpServletResponse response) {
        return "dayoff-form";
    }

    // 请假申请提交
    @RequestMapping("/admin/activiti/iverson/submitForm.do")
    public String submitForm(String processId, HttpServletRequest request, HttpServletResponse response) {
        if (processId == null || "".equals(processId)) {
            request.setAttribute("RESULT_MSG", "流程ID不能为空。");
            return "results";
        }
        // 通过 ProcessEngine 实例获得 RuntimeService 3401
        RuntimeService runtimeService = processEngine.getRuntimeService();
        // 使用 RuntimeService 创建一个流程的实例
        ProcessInstance process = runtimeService.startProcessInstanceByKey(processId);
        System.out.println(" -- 获得流程ID了。---->>" + process.getId());
        // 获取 TaskService 实例
        TaskService taskService = processEngine.getTaskService();
        // 使用 TaskService 获取指定用户组的 Task 列表并使用指定用户领取这些任务
        List<Task> tasks = taskService.createTaskQuery().processInstanceId(process.getId()).taskCandidateUser("iverson").list();
        System.out.println("\n----->>>我的任务列表。");
        for (Task task : tasks) {
            System.out.println("task id=" + task.getId() + "            name = '" + task.getName() + "'");
//            Map<String, Object> taskVariables = new HashMap<String, Object>();
//            taskVariables.put("vacationApproved", "false");
//            taskVariables.put("managerMotivation", "We have a tight deadline!");
//            taskService.complete(task.getId(), taskVariables);
            taskService.complete(task.getId());
        }
        request.setAttribute("RESULT_MSG", "请假单已提交申请。");
        return "results";
    }

    @RequestMapping("/admin/activiti/mgr/approved.do")
    public String mgrApproved(String taskId, Boolean isApproved, HttpServletRequest request, HttpServletResponse response) {
        if (taskId == null || "".equals(taskId)) {
            request.setAttribute("RESULT_MSG", "流程ID不能为空。");
            return "results";
        }
        // 获取 TaskService 实例
        TaskService taskService = processEngine.getTaskService();
        // 使用 TaskService 获取指定用户组的 Task 列表并使用指定用户领取这些任务
        Task task = taskService.createTaskQuery().taskId(taskId).singleResult();
        System.out.println("task id=" + task.getId() + "            name = '" + task.getName() + "'");
        Map<String, Object> taskVariables = new HashMap<String, Object>();
        taskVariables.put("mgrApproved", isApproved);
//            taskVariables.put("managerMotivation", "We have a tight deadline!");
        taskService.complete(task.getId(), taskVariables);
//        taskService.complete(task.getId());
        String strAprv = isApproved ? "批准" : "否决";
        request.setAttribute("RESULT_MSG", "经理已" + strAprv + "请假单。");
        return "results";
    }

    @RequestMapping("/admin/activiti/director/approved.do")
    public String directorApproved(String taskId, Boolean isApproved, HttpServletRequest request, HttpServletResponse response) {
        if (taskId == null || "".equals(taskId)) {
            request.setAttribute("RESULT_MSG", "流程节点ID不能为空。");
            return "results";
        }
        // 获取 TaskService 实例
        TaskService taskService = processEngine.getTaskService();
        // 使用 TaskService 获取指定用户组的 Task 列表并使用指定用户领取这些任务
        Task task = taskService.createTaskQuery().taskId(taskId).singleResult();
        System.out.println("task id=" + task.getId() + "            name = '" + task.getName() + "'");
        Map<String, Object> taskVariables = new HashMap<String, Object>();
        taskVariables.put("directorApproved", isApproved);
//            taskVariables.put("managerMotivation", "We have a tight deadline!");
        taskService.complete(task.getId(), taskVariables);
//        taskService.complete(task.getId());
        String strAprv = isApproved ? "批准" : "否决";
        request.setAttribute("RESULT_MSG", "总监已" + strAprv + "请假单。");
        return "results";
    }

    @RequestMapping("/admin/activiti/approved.do")
    public String approved(String taskId, Boolean isApproved, String user, HttpServletRequest request, HttpServletResponse response) {
        if (taskId == null || "".equals(taskId)) {
            request.setAttribute("RESULT_MSG", "流程节点ID不能为空。");
            return "results";
        }
        // 获取 TaskService 实例
        TaskService taskService = processEngine.getTaskService();
        // 使用 TaskService 获取指定用户组的 Task 列表并使用指定用户领取这些任务
        Task task = taskService.createTaskQuery().taskId(taskId).singleResult();
        System.out.println("task id=" + task.getId() + "            name = '" + task.getName() + "'");
        Map<String, Object> taskVariables = new HashMap<String, Object>();
        taskVariables.put("directorApproved", isApproved);
//            taskVariables.put("managerMotivation", "We have a tight deadline!");
        taskService.complete(task.getId(), taskVariables);
//        taskService.complete(task.getId());
        String strAprv = isApproved ? "批准" : "否决";
        request.setAttribute("RESULT_MSG", user + "已" + strAprv + "请假单。");
        return "results";
    }

    @RequestMapping("/admin/activiti/showWorkflowDiagram/{procInstanceId}.do")
    public void showWorkflowDiagram(@PathVariable String procInstanceId, HttpServletRequest request, HttpServletResponse response) {
        RuntimeService runtimeService = processEngine.getRuntimeService();
        RepositoryService repositoryService = processEngine.getRepositoryService();
        InputStream imageStream = null;
        ProcessInstance processInstance = runtimeService.createProcessInstanceQuery().processInstanceId(procInstanceId).singleResult();
        BpmnModel bpmnModel = repositoryService.getBpmnModel(processInstance.getProcessDefinitionId());
        List<String> activeActivityIds = runtimeService.getActiveActivityIds(procInstanceId);
        for (String activeId : activeActivityIds) {
            System.out.println(" ------------->>>> Active Id = '" + activeId + "'");
        }
        // 解决乱码问题
        ProcessEngineImpl pe = (ProcessEngineImpl) processEngine;
//        ProcessEngineImpl defaultProcessEngine = (ProcessEngineImpl) ProcessEngines.getDefaultProcessEngine();
//
//        Context.setProcessEngineConfiguration(defaultProcessEngine.getProcessEngineConfiguration());
        // 解决生成图片乱码问题
        Context.setProcessEngineConfiguration(pe.getProcessEngineConfiguration());

        imageStream = pe.getProcessEngineConfiguration().getProcessDiagramGenerator().generateDiagram(bpmnModel, "png", activeActivityIds);
//        request.setAttribute("inputStream", imageStream);

        byte[] b = new byte[1024];
        int len = -1;
        try {
            while ((len = imageStream.read(b, 0, 1024)) != -1) {
                response.getOutputStream().write(b, 0, len);
            }
        } catch (IOException e) {
            e.printStackTrace();
        }
    }

    private void createTaskDTOs(List<Execution> executions, List<DayOffMgrDTO> dtoList, RuntimeService runtimeService, TaskService taskService) {
        for (Execution exec : executions) {
            // 如果是父节点，找到最下面的叶子节点再处理
            if (exec.getParentId() != null) {
//                List<Execution> childExecs = runtimeService.createExecutionQuery().parentId(exec.getId()).list();
//                createTaskDTOs(childExecs, dtoList, runtimeService, taskService);
//            } else {
                Task task = taskService.createTaskQuery()
                        .processInstanceId(exec.getProcessInstanceId())
                        .taskDefinitionKey(exec.getActivityId()).singleResult();
                DayOffMgrDTO dto = new DayOffMgrDTO();
                dto.setProcInstanceId(exec.getProcessInstanceId());
                dto.setActivityTaskId(task.getId());
                dto.setActivityTaskKey(task.getTaskDefinitionKey());
                dto.setActivityTaskName(task.getName());
                dtoList.add(dto);
            }
        }
    }
}
