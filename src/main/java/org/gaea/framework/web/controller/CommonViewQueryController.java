package org.gaea.framework.web.controller;

import org.gaea.db.QueryCondition;
import org.gaea.framework.common.exception.SysLogicalException;
import org.gaea.framework.common.exception.ValidationFailedException;
import org.gaea.framework.web.bind.annotation.RequestToBean;
import org.gaea.framework.web.service.CommonViewQueryService;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Controller;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestMethod;
import org.springframework.web.bind.annotation.ResponseBody;

import javax.servlet.http.HttpServletRequest;
import javax.servlet.http.HttpServletResponse;
import java.util.List;
import java.util.Map;

/**
 * 这是页面的通用查询控制器。<p/>
 * 通用列表页的所有分页、查询、高级查询操作都在这里进行。
 * Created by Iverson on 2015/8/17.
 */
@Controller
public class CommonViewQueryController {
    private final Logger logger = LoggerFactory.getLogger(getClass());
    @Autowired
    private CommonViewQueryService commonViewQueryService;

    @RequestMapping(value = "/admin/common/query.do", method = RequestMethod.POST)
    @ResponseBody
    public List<Map<String, Object>> page(String urSchemaId, @RequestToBean("filters") List<QueryCondition> filters,
//                        @RequestToBean("staticParams") List<FinderStaticParam> staticParams,
                                          Pageable pageable,HttpServletRequest request, HttpServletResponse response) {
        try {
            Pageable pageable1 = new PageRequest(1,20);
            List<Map<String, Object>> result = commonViewQueryService.query(urSchemaId,filters, pageable, true);
            return result;
//            return (List<Map<String, Object>>) result.getContent();
        } catch (ValidationFailedException e) {
            logger.warn(e.getMessage());
        } catch (SysLogicalException e) {
            logger.warn(e.getMessage());
        }
        return null;
    }
}
