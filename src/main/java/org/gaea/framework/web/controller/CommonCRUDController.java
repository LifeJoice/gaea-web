package org.gaea.framework.web.controller;

import org.gaea.exception.SysLogicalException;
import org.gaea.exception.SystemConfigException;
import org.gaea.exception.ValidationFailedException;
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
@RequestMapping("/gaea/common/crud")
public class CommonCRUDController {
    private final Logger logger = LoggerFactory.getLogger(getClass());

    @Autowired
    CommonCRUDService commonCRUDService;

    @RequestMapping(value = "/delete", produces = "plain/text; charset=UTF-8")
    public void deleteById(String urSchemaId,String gridId,String id,String wfProcInstId,
                             String deleteReason,HttpServletRequest request, HttpServletResponse response) throws ValidationFailedException, SysLogicalException, SystemConfigException {
        commonCRUDService.deleteById(urSchemaId, gridId, id,wfProcInstId,deleteReason);
    }

    /**
     * 伪删除，非真删除。对数据库只有update。
     * @param urSchemaId
     * @param gridId
     * @param id
     * @param wfProcInstId
     * @param deleteReason
     * @param request
     * @param response
     * @throws ValidationFailedException
     * @throws SysLogicalException
     */
    @RequestMapping(value = "/pseudo-delete", produces = "plain/text; charset=UTF-8")
    public void pseudoDeleteById(String urSchemaId,String gridId,String id,String wfProcInstId,
                             String deleteReason,HttpServletRequest request, HttpServletResponse response) throws ValidationFailedException, SysLogicalException, SystemConfigException {
        commonCRUDService.pseudoDeleteById(urSchemaId, gridId, id,wfProcInstId,deleteReason);
    }
}
