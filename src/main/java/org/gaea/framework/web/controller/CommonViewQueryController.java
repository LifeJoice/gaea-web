package org.gaea.framework.web.controller;

import com.fasterxml.jackson.databind.ObjectMapper;
import org.apache.commons.lang3.StringUtils;
import org.gaea.data.domain.DataSetCommonQueryConditionDTO;
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
import java.io.IOException;
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

    private ObjectMapper mapper = new ObjectMapper();

    /**
     * 本类的默认查询方法。
     *
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
            PageResult result = commonViewQueryService.query(urSchemaId, filters, page, true);
            return result;
//            return (List<Map<String, Object>>) result.getContent();
        } catch (ValidationFailedException e) {
            logger.warn(e.getMessage());
        } catch (SysLogicalException e) {
            logger.warn(e.getMessage());
        }
        return null;
    }

    /**
     * 根据一定的查询条件查询数据。SQL从DataSet中获取。如果SchemaId不为空，可以用Schema的grid定义的column对返回数据进行格式化。
     *
     * @param schemaId
     * @param conditions json数据。页面的查询条件。例如：{"id":"byId","values":[{"type":"pageContext","value":"1606011835xXDTu"}]}
     * @param dsId       数据集id
     * @param request
     * @param response
     * @return
     * @throws ValidationFailedException
     * @throws SysLogicalException
     */
    @RequestMapping(value = "/byCondition", method = RequestMethod.POST)
    @ResponseBody
    public List<Map<String, Object>> queryByConditions(String schemaId, String conditions,
                                                       String dsId, HttpServletRequest request, HttpServletResponse response) throws ValidationFailedException, SysLogicalException {
        DataSetCommonQueryConditionDTO queryConditionDTO = null;
        if (StringUtils.isNotEmpty(conditions)) {
            try {
                queryConditionDTO = mapper.readValue(conditions, DataSetCommonQueryConditionDTO.class);
            } catch (IOException e) {
                logger.debug("转换查询条件失败！", e);
                throw new ValidationFailedException("转换查询条件失败！");
            }
        }
        // 数据集ID（dsId）和SCHEMA ID（schemaId）必须要有其一
        if (StringUtils.isEmpty(dsId) && StringUtils.isEmpty(schemaId)) {
            return null;
        }
        try {
            List<Map<String, Object>> result = commonViewQueryService.queryByConditions(schemaId, dsId, queryConditionDTO);
            return result;
        } catch (SysLogicalException e) {
            logger.debug(e.getMessage(), e);
            throw new ValidationFailedException("系统逻辑错误！请联系管理员处理。");
        }
    }
}
