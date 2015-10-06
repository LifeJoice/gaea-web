package org.gaea.workflow.demo.dayoff.controller;

import org.gaea.workflow.demo.dayoff.domain.DayoffForm;
import org.gaea.workflow.demo.dayoff.service.DayoffService;
import org.gaea.workflow.demo.dayoff.service.impl.DayoffServiceImpl;
import org.gaea.workflow.demo.util.HtmlResultUtils;
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
import org.springframework.web.bind.annotation.ResponseBody;

import javax.servlet.http.HttpServletRequest;
import javax.servlet.http.HttpServletResponse;
import java.io.IOException;
import java.io.InputStream;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

/**
 * Created by Iverson on 2015/5/18.
 */
@Controller
public class DayoffController {

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
    @Autowired
    private ProcessEngineConfiguration processEngineConfiguration;

    // TODO 这个已经不可用了。删了吧
    @RequestMapping("/admin/wf-demo/dayoff/view.do")
    public String view(HttpServletRequest request, HttpServletResponse response) {
//        return "redirect:/resources"+org.macula.Configuration.getAppVersion()+"/demo/dayoff/form.html";
        return null;
    }

    /**
     * 列出某用户所有待办
     * @param assignee
     * @param request
     * @param response
     * @return
     */
    @RequestMapping("/admin/wf-demo/dayoff/mytodolist.do")
    @ResponseBody
    public String listMyTodoList(String assignee,HttpServletRequest request, HttpServletResponse response) {
        System.out.println("---------->>>>列出我所有的待办");
        StringBuffer result = new StringBuffer("");
        // 使用 RuntimeService 创建一个流程的实例
        ProcessInstance process = runtimeService.createProcessInstanceQuery().processDefinitionKey(DayoffServiceImpl.DAYOFF_PROCESS).singleResult();
        List<Task> tasks = taskService.createTaskQuery().taskAssignee(assignee).list();
        for (Task task:tasks){
            result.append("<h2>"+task.getName()+"</h2>");
        }
        return result.toString();
    }

    @RequestMapping("/admin/wf-demo/dayoff/start.do")
    @ResponseBody
    public String startProcess(DayoffForm form, HttpServletRequest request, HttpServletResponse response) {
        System.out.println("\n---------->>>创建、提交表单和启动工作流。\n");
//        针对特定的功能，可以把流程ID硬编码。
        String processId = "urDayOffProcess";
        if (form == null) {
            return HtmlResultUtils.warn("<h1>user ID can't be null!</h1>");
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

    /**
     * 保存请假单，但不提交。
     * @param form
     * @param request
     * @param response
     * @return
     */
    @RequestMapping(value="/admin/wf-demo/dayoff/save.do",produces="plain/text; charset=UTF-8")
    @ResponseBody
    public String test(DayoffForm form, HttpServletRequest request, HttpServletResponse response) {
        dayoffService.save(form);
        return "<h2>保存请假单成功。</h2>";
    }

    /**
     * 提交请假单。触发流程走向下一步。
     * @param procInstanceId
     * @param request
     * @param response
     * @return
     */
    @RequestMapping(value="/admin/wf-demo/dayoff/submit.do",produces="plain/text; charset=UTF-8")
    @ResponseBody
    public String submit(String procInstanceId, HttpServletRequest request, HttpServletResponse response) {
        // 查找活动的Task
        Task task = taskService.createTaskQuery().executionId(procInstanceId).active().singleResult();
        System.out.println("---------->>>>当前Task： " + task.getId() + " : " + task.getName());
        Map<String,Object> variables = new HashMap<String,Object>();
        variables.put("submitForm",true);
        taskService.complete(task.getId(), variables);
        return "<h2>请假单已提交。</h2>";
    }

    // 经理审批
    @RequestMapping(value="/admin/wf-demo/dayoff/mgrApproved.do",produces="plain/text; charset=UTF-8")
    @ResponseBody
    public String mgrApproved(String procInstanceId, HttpServletRequest request, HttpServletResponse response) {
        // 查找活动的Task
        Task task = taskService.createTaskQuery().executionId(procInstanceId).active().singleResult();
        System.out.println("---------->>>>当前Task： " + task.getId() + " : " + task.getName());
        Map<String,Object> variables = new HashMap<String,Object>();
        variables.put("mgrApproved",true);
        taskService.complete(task.getId(), variables);
        return "<h2>请假单经理已提交。</h2>";
    }

    /**
     * 显示某实例的流程图。这个必须在流程进行中才可以。
     * @param procInstanceId
     * @param request
     * @param response
     */
    @RequestMapping("/admin/wf-demo/dayoff/showWorkflowDiagram/{procInstanceId}.do")
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
        // 解决乱码问题
        ProcessEngineImpl pe = (ProcessEngineImpl) processEngine;
//        ProcessEngineImpl defaultProcessEngine = (ProcessEngineImpl) ProcessEngines.getDefaultProcessEngine();
//
        // 解决生成图片乱码问题
//        pe.getProcessEngineConfiguration().setActivityFontName("微软雅黑");
//        Context.setProcessEngineConfiguration(pe.getProcessEngineConfiguration());

//        imageStream = new DefaultProcessDiagramGenerator().generateDiagram(bpmnModel, "png", activeActivityIds);
        imageStream = processEngineConfiguration.getProcessDiagramGenerator().generateDiagram(bpmnModel, "png", activeActivityIds);
//        imageStream = processEngineConfiguration.getProcessDiagramGenerator().generateDiagram(bpmnModel, "png", "宋体","宋体",null);
//        BufferedImage bi = new DefaultProcessDiagramGenerator().generateImage(bpmnModel, "png", activeActivityIds, Collections.<String>emptyList(), "宋体", "宋体", null, 1.0);
//        request.setAttribute("inputStream", imageStream);

        byte[] b = new byte[1024];
        int len = -1;
        try {
//            FileOutputStream fw = new FileOutputStream(new File("C:\\Users\\Iverson\\Desktop\\activiti_test\\workflow.png"));
            while ((len = imageStream.read(b, 0, 1024)) != -1) {
//                fw.write(b, 0, len);
                response.getOutputStream().write(b, 0, len);
            }
//            fw.close();
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
    @RequestMapping("/admin/wf-demo/dayoff/showWorkflowDiagram.do")
    public void showWorkflowDiagram(HttpServletRequest request, HttpServletResponse response) {
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

    // 初步测试结束。转移到NewDayoffController继续。
//    @RequestMapping("/admin/wf-demo/test.do")
//    public String test(){
//        DayoffForm form = new DayoffForm();
//        form.setReason("hello");
//        form.getWfVariables().put("mgrApproved", true);
//        dayoffService.saveAndWFStartProcess(form);
//        return "school/school_schema.xml";
//    }
}
