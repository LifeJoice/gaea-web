package org.gaea.workflow.demo.dayoff.service.impl;

import org.gaea.workflow.annotation.WfCompleteTaskBefore;
import org.gaea.workflow.demo.dayoff.domain.DayoffForm;
import org.gaea.workflow.demo.dayoff.repository.DayoffRepository;
import org.gaea.workflow.demo.dayoff.service.DayoffService;
import org.gaea.workflow.demo.util.HtmlResultUtils;
import org.gaea.workflow.service.WithWorkflow;
import org.activiti.engine.ProcessEngine;
import org.activiti.engine.RepositoryService;
import org.activiti.engine.RuntimeService;
import org.activiti.engine.runtime.ProcessInstance;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

/**
 * Created by Iverson on 2015/5/18.
 */
@Service
public class DayoffServiceImpl implements DayoffService,WithWorkflow {
    public static String DAYOFF_PROCESS = "urDayOffProcess";
    @Autowired
    DayoffRepository dayoffRepository;
    @Autowired
    private ProcessEngine processEngine;

    @Override
    @Transactional
    public String save(DayoffForm dayoffForm){
        System.out.println("\n---------->>>创建、提交表单和启动工作流。\n");
//        针对特定的功能，可以把流程ID硬编码。
        if (dayoffForm == null) {
            return HtmlResultUtils.warn("<h1>user ID can't be null!</h1>");
        }
//        ProcessEngine processEngine = ProcessEngineConfiguration.createStandaloneProcessEngineConfiguration().buildProcessEngine();
        // 通过 ProcessEngine 实例获得 RepositoryService
        RepositoryService repositoryService = processEngine.getRepositoryService();
        System.out.println("\n---------->>>Activiti环境运行正常。。。\n");
        // 通过 ProcessEngine 实例获得 RuntimeService
        RuntimeService runtimeService = processEngine.getRuntimeService();
        // 使用 RuntimeService 创建一个流程的实例
        ProcessInstance process = runtimeService.startProcessInstanceByKey(DAYOFF_PROCESS);
//        String procId = runtimeService.startProcessInstanceByKey("urDayOffProcess").getId();
        System.out.println(" -- 获得流程ID了。---->>" + process.getId());
        dayoffRepository.save(dayoffForm);
        return HtmlResultUtils.success("<h1>Success!</h1>");
    }

    @Override
    @Transactional
//    @WfStartProcess
    public String saveAndWFStartProcess(DayoffForm dayoffForm){
        System.out.println("\n---------->>>创建请假单并启动工作流。\n");
        System.out.println(" reason: "+dayoffForm.getReason());
//        throw new IllegalArgumentException("测试抛出一个不知所谓的异常，看能否和切片的事务一致。");
//        针对特定的功能，可以把流程ID硬编码。
        if (dayoffForm == null) {
            return HtmlResultUtils.warn("<h1>user ID can't be null!</h1>");
        }
        dayoffRepository.save(dayoffForm);
        return HtmlResultUtils.success("<h1>Success!</h1>");
    }

    @Override
    @Transactional
    @WfCompleteTaskBefore
    public void completeTask(DayoffForm inForm, Long id) {
        System.out.println("完成节点。下一个任务：" + inForm.getWfActName());
        DayoffForm form = dayoffRepository.findOne(id);
        form.setWfActName(inForm.getWfActName());
        form.setReason(inForm.getWfApprovalReason());
        dayoffRepository.save(form);
//        throw new IllegalArgumentException("测试抛出一个不知所谓的异常，看能否和切片的事务一致。");
    }

    @Override
    public String getWorkflowProcess() {
        return DAYOFF_PROCESS;
    }
}
