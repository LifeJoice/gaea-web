package org.gaea.workflow.demo.controller;

import org.gaea.workflow.demo.util.HtmlResultUtils;
import org.activiti.engine.ProcessEngine;
import org.activiti.engine.TaskService;
import org.activiti.engine.task.Task;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Controller;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.ResponseBody;

import javax.servlet.http.HttpServletRequest;
import javax.servlet.http.HttpServletResponse;
import java.util.List;

/**
 * Created by Iverson on 2015/5/18.
 */
@Controller
public class UserTaskController {
    @Autowired
    private ProcessEngine processEngine;

    @RequestMapping("/admin/activiti/task/listbyuser.do")
    @ResponseBody
    public String listTaskByUser(String userId, HttpServletRequest request, HttpServletResponse response) {
        System.out.println("\n---------->>>开始Activiti之旅。。。\n");
        if (userId == null || "".equals(userId)) {
            return HtmlResultUtils.warn("<h1>user ID can't be null!</h1>");
        }
        // 通过 ProcessEngine 实例获得 RepositoryService
        TaskService taskService = processEngine.getTaskService();
        List<Task> myTasks = taskService.createTaskQuery().taskCandidateOrAssigned(userId).list();
        for(Task t:myTasks){
            System.out.println("我的任务： "+t.getName());
        }
        return HtmlResultUtils.success("<h1>Success!</h1>");
    }
}
