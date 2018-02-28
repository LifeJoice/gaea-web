package org.gaea.framework.web.controller;

import com.fasterxml.jackson.databind.ObjectMapper;
import org.apache.commons.lang3.StringUtils;
import org.gaea.data.dataset.domain.ConditionSet;
import org.gaea.data.dataset.domain.GaeaDataSet;
import org.gaea.data.domain.DataSetCommonQueryConditionDTO;
import org.gaea.db.GaeaSqlProcessor;
import org.gaea.db.QueryCondition;
import org.gaea.exception.*;
import org.gaea.framework.web.bind.annotation.RequestBean;
import org.gaea.framework.web.data.GaeaDefaultDsContext;
import org.gaea.framework.web.data.service.SystemDataSetService;
import org.gaea.framework.web.schema.domain.PageResult;
import org.gaea.framework.web.schema.domain.SchemaGridPage;
import org.gaea.framework.web.schema.service.GaeaXmlSchemaService;
import org.gaea.framework.web.security.GaeaWebSecuritySystem;
import org.gaea.framework.web.service.CommonViewQueryService;
import org.gaea.framework.web.utils.GaeaWebConditionUtils;
import org.gaea.framework.web.utils.GaeaWebUtils;
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
import java.util.ArrayList;
import java.util.LinkedHashMap;
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
    @Autowired
    private GaeaXmlSchemaService gaeaXmlSchemaService;
    @Autowired
    private SystemDataSetService systemDataSetService;
    @Autowired
    private GaeaSqlProcessor gaeaSqlProcessor;
    @Autowired
    private GaeaWebConditionUtils gaeaWebConditionUtils;

    private ObjectMapper mapper = new ObjectMapper();

    /**
     * 本类的默认查询方法。
     *
     * @param page
     * @param urSchemaId       xml schema id
     * @param filters          列表页的查询条件
     * @param preConditions    前置条件。如果是下钻的页面，例如从一个列表页跳到第二个列表页，则第二个列表页很可能带着某些第一个列表页的前置条件。
     * @param request
     * @param response
     * @return
     * @throws InvalidDataException
     * @throws SysLogicalException
     * @throws ValidationFailedException
     * @throws SysInitException
     */
    @RequestMapping(method = RequestMethod.POST)
    @ResponseBody
    public PageResult page(@RequestBean SchemaGridPage page, String urSchemaId, @RequestBean("filters") List<QueryCondition> filters, String preConditions,
                           HttpServletRequest request, HttpServletResponse response) throws InvalidDataException, SysLogicalException, ValidationFailedException, SysInitException {
        List<QueryCondition> newQueryConditions = new ArrayList<QueryCondition>();
        // 如果有前置条件，先转换前置条件
        if (StringUtils.isNotEmpty(preConditions)) {
            newQueryConditions.addAll(gaeaWebConditionUtils.convert(urSchemaId, preConditions));
        }
        // 再叠加当前的查询条件
        newQueryConditions.addAll(filters);

        PageResult result = commonViewQueryService.query(urSchemaId, newQueryConditions, page, GaeaWebSecuritySystem.getUserName(request));
        return result;
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
    public List<Map<String, Object>> queryByConditions(String schemaId, String conditions, Boolean isDsTranslate,
                                                       String dsId, HttpServletRequest request, HttpServletResponse response) throws ValidationFailedException, SysLogicalException, SysInitException, SystemConfigException {
        DataSetCommonQueryConditionDTO queryConditionDTO = null;
        GaeaDefaultDsContext defaultDsContext = new GaeaDefaultDsContext(GaeaWebSecuritySystem.getLoginUser().getLoginName(), String.valueOf(GaeaWebSecuritySystem.getLoginUser().getId()));

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
        // 默认需要对结果的每个字段做数据集转换
        if (isDsTranslate == null) {
            isDsTranslate = true;
        }
        try {
            List<Map<String, Object>> result = commonViewQueryService.queryByConditions(schemaId, dsId, defaultDsContext, queryConditionDTO, isDsTranslate);
            return result;
        } catch (SysLogicalException e) {
            logger.debug(e.getMessage(), e);
            throw new ValidationFailedException("系统逻辑错误！请联系管理员处理。");
        }
    }
}
