package org.gaea.workflow.demo.dayoff.controller;

import org.gaea.workflow.demo.dayoff.domain.DayoffForm;
import org.gaea.workflow.demo.dayoff.service.DayoffService;
import org.apache.commons.lang3.StringUtils;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Controller;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.ResponseBody;

import javax.servlet.http.HttpServletRequest;
import javax.servlet.http.HttpServletResponse;

/**
 * Created by Iverson on 2015/7/20.
 */
@Controller
public class NewDayOffController {
    @Autowired
    private DayoffService dayoffService;

    @RequestMapping(value = "/admin/wf-demo/new-dayoff/view.do", produces = "plain/text; charset=UTF-8")
    public String view(HttpServletRequest request, HttpServletResponse response) {
        return "/static/html/dayoff/dayoff.html";
    }

    @RequestMapping(value = "/admin/wf-demo/new-dayoff/saveAndStartProcess.do", produces = "plain/text; charset=UTF-8")
    @ResponseBody
    public String saveAndStartProcess(DayoffForm form, HttpServletRequest request, HttpServletResponse response) {
        System.out.println("-------->>>> into saveAndStartProcess. ");
        dayoffService.saveAndWFStartProcess(form);
        return "<h2>保存并提交请假单。</h2>";
    }

    @RequestMapping(value = "/admin/wf-demo/new-dayoff/complete.do", produces = "plain/text; charset=UTF-8")
    @ResponseBody
    public String completeTask(DayoffForm form, HttpServletRequest request, HttpServletResponse response) {
        System.out.println("-------->>>> into complete task. id: "+request.getParameter("id"));
        if (form != null && !StringUtils.isBlank(form.getWfProcInstId()) && !StringUtils.isBlank(request.getParameter("id"))) {
            if("经理审批".equals(form.getWfActName())){
                // 控制经理审批的判断流向。
                form.getWfVariables().put("mgrApproved",false);
            }
            dayoffService.completeTask(form,new Long(request.getParameter("id")));
        }
        return "<h2>提交请假单经理审批。</h2>";
    }

    @RequestMapping("/admin/wf-demo/new-dayoff/list.do")
    public String list() {
//        DayoffForm form = new DayoffForm();
//        form.setReason("hello");
//        form.getWfVariables().put("mgrApproved", true);
//        dayoffService.saveAndWFStartProcess(form);
        return "demo/dayoff_demo.xml";
    }
}
