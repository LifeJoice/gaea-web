package org.gaea.workflow.aspect;

import org.gaea.framework.common.exception.WorkflowAspectException;
import org.gaea.workflow.annotation.WfCompleteTaskAfter;
import org.gaea.workflow.annotation.WfCompleteTaskBefore;
import org.gaea.workflow.annotation.WfStartProcess;
import org.gaea.workflow.demo.dayoff.domain.DayoffForm;
import org.gaea.workflow.domain.WorkflowDomain;
import org.gaea.workflow.service.WithWorkflow;
import org.gaea.workflow.service.WorkflowAspectService;
import org.apache.commons.lang3.StringUtils;
import org.aspectj.lang.JoinPoint;
import org.aspectj.lang.ProceedingJoinPoint;
import org.aspectj.lang.annotation.Around;
import org.aspectj.lang.annotation.Aspect;
import org.aspectj.lang.annotation.Before;
import org.aspectj.lang.annotation.Pointcut;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

/**
 * 工作流切面。提供工作流的相关服务整合。避免开发直接、过多调用工作流接口。
 * Created by Iverson on 2015/7/15.
 */
@Component
@Aspect
public class WorkflowAspect {
    private final Logger logger = LoggerFactory.getLogger(getClass());
    @Autowired
    WorkflowAspectService workflowAspectService;
//    @Autowired
//    private ProcessEngine processEngine;

    // 针对启动工作流的切面
    @Pointcut("@annotation(wfStartProcess) && args(workflowDomain,..)")
    public void startProcess(WfStartProcess wfStartProcess,WorkflowDomain workflowDomain) {
    }

    // 方法前切面。完成流程节点、提交流程节点。
    @Pointcut("@annotation(wfCompleteTaskBefore) && args(workflowDomain,..)")
    public void completeTaskBefore(WfCompleteTaskBefore wfCompleteTaskBefore,WorkflowDomain workflowDomain) {
    }

    // 方法后切面。完成流程节点、提交流程节点。可以读取到用户设置的WfVariables，并赋予Activiti处理。
    @Pointcut("@annotation(wfCompleteTaskAfter) && args(workflowDomain,..)")
    public void completeTaskAfter(WfCompleteTaskAfter wfCompleteTaskAfter,WorkflowDomain workflowDomain) {
    }

    @Transactional
    @Around("startProcess(wfStartProcess,workflowDomain)")
    public void aroundStartProcess(ProceedingJoinPoint joinPoint,WfStartProcess wfStartProcess,WorkflowDomain workflowDomain) throws Throwable {
        System.out.println("    AROUND >>>> 切片. class: "+joinPoint.getTarget().getClass()+" method: "+joinPoint.getSignature().getName());
        logger.info("    AROUND >>>> 对象是否实现UrWorkflowService? "+(joinPoint.getTarget() instanceof WithWorkflow));
//        System.out.println("\n我\n切\n切\n切\n切");
        DayoffForm form = (DayoffForm) workflowDomain;
        System.out.println("In Aspect form reason: "+form.getReason());
        // 目标必须实现UrWithWorkflow接口
        if(joinPoint.getTarget() instanceof WithWorkflow){
            WithWorkflow withWfService = (WithWorkflow) joinPoint.getTarget();
            if(StringUtils.isBlank(withWfService.getWorkflowProcess())){
                throw new WorkflowAspectException("实现UrWithWorkflow接口的Service返回（getWorkflowProcess）的流程定义名为空！");
            }
            // 启动流程。并把启动后的流程ID注入urWorkflowDomain中。
            workflowAspectService.startProcess(withWfService.getWorkflowProcess(), workflowDomain);
            // 运行被切片任务
            joinPoint.proceed(); //continue on the intercepted method
        }else{
            throw new WorkflowAspectException("注解了UrWfStartProcess的Service未实现UrWithWorkflow接口！未能进行相关的工作流处理！");
        }
//        System.out.println("------- BEFORE >>>切片完成！");
    }

    /**
     * 在注解的方法<b style='font-size:14px'>前</b>调用工作流接口，完成任务（completeTask）。<p/>
     * 这样就可以在随后的业务方法内获取到下个节点等信息。缺点是无法经过判断后，再通过WfVariables参数去控制流程走向。<br/>
     * 或者说，控制流程走向必须放在注解方法的上游。<p/>
     * 用法：<br/>
     * 注解在方法上。
     * @param joinPoint
     * @param wfCompleteTaskBefore
     * @param workflowDomain
     * @throws Throwable
     */
    @Transactional
    @Before("completeTaskBefore(wfCompleteTaskBefore,workflowDomain)")
    public void beforeCompleteTask(JoinPoint joinPoint,WfCompleteTaskBefore wfCompleteTaskBefore,WorkflowDomain workflowDomain) throws Throwable {
        System.out.println(" ------->> BEFORE -->> 切片Workflow Service中...");
        logger.info(" ------->> BEFORE -->> 对象是否实现UrWorkflowService? " + (joinPoint.getTarget() instanceof WithWorkflow));
        if(workflowDomain ==null){
            throw new WorkflowAspectException("UrWorkflowDomain对象为空！要完成当前流程节点，对应注解的方法签名中的domain必须实现UrWorkflowDomain，并放在方法参数第一位，且不能为空！");
        }
        // 目标必须实现UrWithWorkflow接口
        if(joinPoint.getTarget() instanceof WithWorkflow){
            WithWorkflow withWfService = (WithWorkflow) joinPoint.getTarget();
            if(StringUtils.isBlank(withWfService.getWorkflowProcess())){
                throw new WorkflowAspectException("实现UrWithWorkflow接口的Service返回（getWorkflowProcess）的流程定义名为空！");
            }
            // test
            System.out.println(" ------------->>>> mgrApproved = "+ workflowDomain.getWfVariables().get("mgrApproved"));
            // 根据流程实例id，completeTask（完成当前节点）。
            workflowAspectService.completeTask(workflowDomain);
        }else{
            throw new WorkflowAspectException("注解了UrWfStartProcess的Service未实现UrWithWorkflow接口！未能进行相关的工作流处理！");
        }
    }

    /**
     * <<b style='font-size:14px'>可用！暂时没有所以才注解！</b>
     * 在注解的方法<b style='font-size:14px'>后</b>调用工作流接口，完成任务（completeTask）。<p/>
     * 这样就可以在经过判断后，再通过WfVariables参数去控制流程走向。<br/>
     * 缺点是：随后的业务方法内<b style='font-size:14px'>无法</b>获取到下个节点等信息。<p/>
     * 用法：<br/>
     * 注解在方法上。
     * @param joinPoint
     * @param urWfCompleteTaskAfter
     * @param urWorkflowDomain
     * @throws Throwable
     */
//    @Transactional
//    @After("completeTaskAfter(urWfCompleteTaskAfter,urWorkflowDomain)")
//    public void afterCompleteTask(JoinPoint joinPoint,WfCompleteTaskAfter urWfCompleteTaskAfter,WorkflowDomain urWorkflowDomain) throws Throwable {
//        logger.debug(" ------->> AFTER -->> 切片Workflow Service中...");
//        logger.debug(" ------->> AFTER -->> 对象是否实现UrWorkflowService? " + (joinPoint.getTarget() instanceof WithWorkflow));
//        if(urWorkflowDomain==null){
//            throw new WorkflowAspectException("UrWorkflowDomain对象为空！要完成当前流程节点，对应注解的方法签名中的domain必须实现UrWorkflowDomain，并放在方法参数第一位，且不能为空！");
//        }
//        // 目标必须实现UrWithWorkflow接口
//        if(joinPoint.getTarget() instanceof WithWorkflow){
//            WithWorkflow withWfService = (WithWorkflow) joinPoint.getTarget();
//            if(StringUtils.isBlank(withWfService.getWorkflowProcess())){
//                throw new WorkflowAspectException("实现UrWithWorkflow接口的Service返回（getWorkflowProcess）的流程定义名为空！");
//            }
//            // 根据流程实例id，completeTask（完成当前节点）。
//            workflowAspectService.completeTask(urWorkflowDomain);
//        }else{
//            throw new WorkflowAspectException("注解了UrWfStartProcess的Service未实现UrWithWorkflow接口！未能进行相关的工作流处理！");
//        }
//    }
//    @Transactional
//    @Before("startProcess(urWfStartProcess)")
//    public void beforeStartProcess(JoinPoint joinPoint,WfStartProcess urWfStartProcess) throws Throwable {
//        System.out.println("    BEFORE >>>> 切片. class: "+joinPoint.getTarget().getClass()+" method: "+joinPoint.getSignature().getName());
//        logger.info("    BEFORE >>>> 对象是否实现UrWorkflowService? "+(joinPoint.getTarget() instanceof WithWorkflow));
//        System.out.println("\n我\n切\n切\n切\n切");
//        // 目标必须实现UrWithWorkflow接口
//        if(joinPoint.getTarget() instanceof WithWorkflow){
//            WithWorkflow withWfService = (WithWorkflow) joinPoint.getTarget();
//            if(StringUtils.isBlank(withWfService.getWorkflowProcess())){
//                throw new WorkflowAspectException("实现UrWithWorkflow接口的Service返回（getWorkflowProcess）的流程定义名为空！");
//            }
//            workflowAspectService.startProcess(withWfService.getWorkflowProcess());
//        }else{
//            throw new WorkflowAspectException("注解了UrWfStartProcess的Service未实现UrWithWorkflow接口！未能进行相关的工作流处理！");
//        }
////        System.out.println("------- BEFORE >>>切片完成！");
//    }


//    @After("startProcess(urWfStartProcess)")
//    public void afterStartProcess(JoinPoint joinPoint,WfStartProcess urWfStartProcess) throws WorkflowAspectException {
//        System.out.println(" ------->> AFTER -->> 切片Workflow Service中...");
//        logger.info(" ------->> AFTER -->> 对象是否实现UrWorkflowService? "+(joinPoint.getTarget() instanceof WithWorkflow));
//        if(joinPoint.getTarget() instanceof WithWorkflow){
//            WithWorkflow withWfService = (WithWorkflow) joinPoint.getTarget();
//            if(StringUtils.isBlank(withWfService.getWorkflowProcess())){
//                throw new WorkflowAspectException("实现UrWithWorkflow接口的Service返回（getWorkflowProcess）的流程定义名为空！");
//            }
//            workflowAspectService.startProcess(withWfService.getWorkflowProcess());
//        }else{
//            throw new WorkflowAspectException("注解了UrWfStartProcess的Service未实现UrWithWorkflow接口！未能进行相关的工作流处理！");
//        }
////        System.out.println("\n我\n切\n切\n切\n切");
////        System.out.println("------- BEFORE >>>切片完成！");
//    }
//
//    @Pointcut("@annotation(urWfStartProcess) && args(urWorkflowDomain,..)")
//    public void wfMethod(WfStartProcess urWfStartProcess,WorkflowDomain urWorkflowDomain) {
//    }
//
//    @Around("wfMethod(urWfStartProcess,urWorkflowDomain)")
//    public void logAround(ProceedingJoinPoint joinPoint,WfStartProcess urWfStartProcess,WorkflowDomain urWorkflowDomain) throws Throwable {
//        System.out.println(" ------->>>>切片中。是否获取UrWorkflowDomain? "+(urWorkflowDomain!=null));
//        if(urWorkflowDomain!=null){
//            System.out.println("-------->>>>切片中。wfActName: "+urWorkflowDomain.getWfActName());
//        }
//        System.out.println("    Around >>>> 切片Workflow Service中...");
//        System.out.println("          >>>> 切片. class: "+joinPoint.getTarget().getClass()+" method: "+joinPoint.getSignature().getName());
//        logger.info("    Around >>>> 对象是否实现UrWorkflowService? "+(joinPoint.getTarget() instanceof WithWorkflow));
//        if(joinPoint.getTarget() instanceof WithWorkflow){
//            WithWorkflow workflowService = (WithWorkflow) joinPoint.getTarget();
//            System.out.println(" --------->>>> PROCESS ID: "+workflowService.getWorkflowProcess());
//        }
////        System.out.println("logAround() is running!");
////        System.out.println("hijacked method : " + joinPoint.getSignature().getName());
////        System.out.println("hijacked arguments : " + Arrays.toString(joinPoint.getArgs()));
////
//        System.out.println("Around before is running!");
//        joinPoint.proceed(); //continue on the intercepted method
//        System.out.println("Around after is running!");
////
////        System.out.println("******");
//
//    }
}
