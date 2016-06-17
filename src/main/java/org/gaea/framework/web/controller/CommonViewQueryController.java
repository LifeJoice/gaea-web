package org.gaea.framework.web.controller;

import org.gaea.db.QueryCondition;
import org.gaea.exception.SysLogicalException;
import org.gaea.exception.ValidationFailedException;
import org.gaea.framework.web.bind.annotation.RequestBean;
import org.gaea.framework.web.schema.domain.PageResult;
import org.gaea.framework.web.schema.domain.SchemaGridPage;
import org.gaea.framework.web.service.CommonViewQueryService;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
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
@RequestMapping("/sys/query")
public class CommonViewQueryController {
    private final Logger logger = LoggerFactory.getLogger(getClass());
    @Autowired
    private CommonViewQueryService commonViewQueryService;

    /**
     * 本类的默认查询方法。
     * @param page
     * @param urSchemaId
     * @param filters
     * @param request
     * @param response
     * @return
     */
    @RequestMapping(method = RequestMethod.POST)
    @ResponseBody
    public PageResult page(@RequestBean SchemaGridPage page, String urSchemaId, @RequestBean("filters") List<QueryCondition> filters,
//                        @RequestBean("staticParams") List<FinderStaticParam> staticParams,
                           HttpServletRequest request, HttpServletResponse response) {
        try {
//            Pageable pageable1 = new PageRequest(page.getPage(),page.getSize());
            PageResult result = commonViewQueryService.query(urSchemaId,filters, page, true);
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
