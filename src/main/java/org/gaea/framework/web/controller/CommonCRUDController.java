package org.gaea.framework.web.controller;

import org.gaea.framework.common.exception.SysLogicalException;
import org.gaea.framework.common.exception.ValidationFailedException;
import org.gaea.framework.web.service.CommonCRUDService;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Controller;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.ResponseBody;

import javax.servlet.http.HttpServletRequest;
import javax.servlet.http.HttpServletResponse;

/**
 * 通用的CRUD的控制器。所有功能共用。
 * Created by Iverson on 2015/8/11.
 */
@Controller
public class CommonCRUDController {
    private final Logger logger = LoggerFactory.getLogger(getClass());

    @Autowired
    CommonCRUDService commonCRUDService;

    @RequestMapping(value = "/admin/common-crud/delete.do", produces = "plain/text; charset=UTF-8")
    @ResponseBody
    public String deleteById(String urSchemaId,String gridId,Long id,String wfProcInstId,
                             String deleteReason,HttpServletRequest request, HttpServletResponse response) throws ValidationFailedException, SysLogicalException {
        logger.debug("-------->>>> into common delete. urSchemaId : " + urSchemaId+"  wfProcInstId : "+wfProcInstId);
        commonCRUDService.deleteById(urSchemaId, gridId, id,wfProcInstId,deleteReason);
        return "<h2>删除成功。</h2>";
    }
}
