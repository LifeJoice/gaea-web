package org.gaea.framework.web.service.impl;

import org.apache.commons.collections.CollectionUtils;
import org.apache.commons.collections.MapUtils;
import org.apache.commons.lang3.StringUtils;
import org.gaea.data.dataset.domain.Condition;
import org.gaea.data.dataset.domain.ConditionSet;
import org.gaea.data.dataset.domain.GaeaDataSet;
import org.gaea.data.domain.DataSetCommonQueryConditionDTO;
import org.gaea.data.domain.QueryValue;
import org.gaea.data.system.SystemDataSetFactory;
import org.gaea.db.GaeaSqlProcessor;
import org.gaea.db.QueryCondition;
import org.gaea.exception.*;
import org.gaea.framework.web.data.GaeaDefaultDsContext;
import org.gaea.framework.web.data.authority.DsAuthorityResult;
import org.gaea.framework.web.data.domain.DataSetEntity;
import org.gaea.framework.web.data.service.SystemDataSetAuthorityService;
import org.gaea.framework.web.data.service.SystemDataSetService;
import org.gaea.framework.web.data.util.DataFormatHelper;
import org.gaea.framework.web.data.util.DataSetConvertHelper;
import org.gaea.framework.web.schema.GaeaSchemaCache;
import org.gaea.framework.web.schema.GaeaXmlSchemaProcessor;
import org.gaea.framework.web.schema.domain.DataSet;
import org.gaea.framework.web.schema.domain.GaeaXmlSchema;
import org.gaea.framework.web.schema.domain.PageResult;
import org.gaea.framework.web.schema.domain.SchemaGridPage;
import org.gaea.framework.web.schema.domain.view.SchemaColumn;
import org.gaea.framework.web.schema.domain.view.SchemaGrid;
import org.gaea.framework.web.schema.service.SchemaDataService;
import org.gaea.framework.web.schema.utils.GaeaSchemaUtils;
import org.gaea.framework.web.security.GaeaWebSecuritySystem;
import org.gaea.framework.web.service.CommonViewQueryService;
import org.gaea.security.jo.UserJO;
import org.gaea.util.BeanUtils;
import org.gaea.util.MathUtils;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.util.LinkedCaseInsensitiveMap;

import java.text.MessageFormat;
import java.util.ArrayList;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;

/**
 * Created by Iverson on 2015/8/17.
 */
@Service
public class CommonViewQueryServiceImpl implements CommonViewQueryService {
    private final Logger logger = LoggerFactory.getLogger(CommonViewQueryServiceImpl.class);
    @Autowired
    private GaeaSchemaCache gaeaSchemaCache;
    @Autowired
    private GaeaXmlSchemaProcessor gaeaXmlSchemaProcessor;
    @Autowired
    private GaeaSqlProcessor gaeaSqlProcessor;
    @Autowired
    private SchemaDataService schemaDataService;
    @Autowired
    private SystemDataSetAuthorityService systemDataSetAuthorityService;
    @Autowired
    private SystemDataSetService systemDataSetService;

    @Override
    public PageResult query(GaeaXmlSchema gaeaXml, List<QueryCondition> filters,
                            SchemaGridPage page, String loginName) throws ValidationFailedException, SysLogicalException, InvalidDataException, SysInitException {
        if (gaeaXml == null || StringUtils.isEmpty(gaeaXml.getId())) {
            return null;
        }
        return query(gaeaXml.getId(), filters, page, loginName);
    }

    @Override
    public PageResult query(String schemaId, List<QueryCondition> filters,
                            SchemaGridPage page, String loginName) throws ValidationFailedException, SysLogicalException, InvalidDataException, SysInitException {
        PageResult pageResult = new PageResult();
        if (StringUtils.isBlank(schemaId)) {
            throw new ValidationFailedException("未能获取Schema id (in param schema id is null).无法查询！");
        }
        GaeaXmlSchema gaeaXmlSchema = gaeaSchemaCache.get(schemaId);
        if (gaeaXmlSchema == null) {
            throw new SysLogicalException("未能从缓存获取对应的Schema对象。请检查逻辑关系！");
        }
        // 构建一个，可能权限校验有额外的条件。
        if (filters == null) {
            filters = new ArrayList<QueryCondition>();
        }
        try {
            UserJO loginUser = GaeaWebSecuritySystem.getLoginUser();
            DataSet dataSet = gaeaXmlSchema.getSchemaData().getDataSetList().get(0);
            if (dataSet == null || StringUtils.isEmpty(dataSet.getId())) {
                throw new SystemConfigException("XML Schema的DataSet配置错误。没有配置DataSet或DataSet缺少id。SchemaId : " + schemaId);
            }
            GaeaDataSet gaeaDataSet = SystemDataSetFactory.getDataSet(dataSet.getId());
            SchemaGrid grid = gaeaXmlSchema.getSchemaViews().getGrid();
            final String sql = gaeaDataSet.getSql();
            // 根据XML SCHEMA的定义，把页面传过来的查询条件做一定处理
            rebuildQueryConditionBySchema(filters, grid);
            // 获取分页的信息
            // 如果没有每页显示数量，则初始化
            if (page != null && page.getSize() <= 0) {
                Integer pageSize = StringUtils.isNumeric(grid.getPageSize()) ? Integer.parseInt(grid.getPageSize()) : SchemaGrid.DEFAULT_PAGE_SIZE;
                page.setSize(pageSize);
            }
            // 数据集权限校验
            ConditionSet authorityConditionSet = getAuthorityConditions(gaeaDataSet, loginName);
            // 如果权限校验，没有条件。可能是具有所有数据权限。创建一个空列表给后面用。
            if (authorityConditionSet == null) {
                authorityConditionSet = new ConditionSet();
                authorityConditionSet.setConditions(new ArrayList<Condition>());
            }
            // 把数据权限条件和页面的filter结合。并且权限条件是在filter前面
            // 把查询条件（可能是页面传来的、或者数据集配置的），放在权限过滤条件后面
            authorityConditionSet.getConditions().addAll(convertToConditions(filters));
            // 构建默认的SQL中表达式要用的上下文对象
            GaeaDefaultDsContext defaultDsContext = new GaeaDefaultDsContext(loginUser.getLoginName(), String.valueOf(loginUser.getId()));
            pageResult = gaeaSqlProcessor.query(sql, gaeaDataSet.getPrimaryTable(), authorityConditionSet, page, defaultDsContext, null);

            List<Map<String, Object>> dataList = pageResult.getContent();
            // 基于XML SCHEMA的结果集格式转换
            // 默认需要对结果的每个字段做数据集转换
            dataList = schemaDataService.transformViewData(dataList, grid, true);
            pageResult.setContent(dataList);

            // 设置翻页相关数据
            Long pageRowCount = pageResult.getTotalElements();                                                     // 总记录数
            Double pageCount = Math.ceil(MathUtils.div(pageRowCount.doubleValue(), Double.valueOf(page.getSize())));     // 多少页
//            pageResult.setTotalElements(pageRowCount);
            pageResult.setTotalPages(pageCount.intValue());
//            pageResult.setPage(page.getPage());
//            pageResult.setSize(page.getSize());

            return pageResult;
        } catch (SystemConfigException e) {
            logger.error(e.getMessage(), e);
        }

        return null;
    }

    private ConditionSet getAuthorityConditions(GaeaDataSet gaeaDataSet, String loginName) throws ValidationFailedException, SystemConfigException {
        /**
         * if 数据集的校验方式，不是不校验
         *      进行校验
         *      if 校验结果=没有角色对应
         *          if 数据集配置，没有角色就没有权限
         *              return 没结果对象
         *      else if 校验结果=有角色、有条件
         *          把条件和页面的filter结合。并且权限条件是在filter前面
         *      else 有角色、没条件等
         *          继续现在逻辑，不显式处理
         */
        if (gaeaDataSet.getAuthorityType() != DataSetEntity.DATASET_AUTHORITY_TYPE_NONE) {
            // 根据数据集+用户, 校验并获得结果
            DsAuthorityResult authorityResult = systemDataSetAuthorityService.authority(gaeaDataSet, loginName);
            // 判断校验结果
            // 如果结果是: 没有匹配角色
            if (authorityResult.getResult() == DsAuthorityResult.RESULT_NO_ROLE) {
                // 如果数据集配置: 没有角色就没有权限
                if (gaeaDataSet.getAuthorityType() == DataSetEntity.DATASET_AUTHORITY_TYPE_NO_ROLE_NO_PERMIT) {
                    logger.debug("用户 {} 数据权限检查, 没匹配角色. 不允许访问数据.", loginName);
                    throw new ValidationFailedException("未授权读取对应的数据。");
                } else if (gaeaDataSet.getAuthorityType() == DataSetEntity.DATASET_AUTHORITY_TYPE_NO_ROLE_ALL_PERMIT) {
                    logger.debug("用户 {} 数据权限检查, 没匹配角色. 系统配置没有角色可以访问所有数据. 允许访问数据.", loginName);
                } else if (gaeaDataSet.getAuthorityType() == DataSetEntity.DATASET_AUTHORITY_TYPE_NONE) {
                    logger.trace("该数据集配置不需要数据权限控制。");
                } else {
                    throw new ValidationFailedException("该数据集未配置合适的数据权限管理。");
                }
            } else if (authorityResult.getResult() == DsAuthorityResult.RESULT_WITH_ROLE_AND_CONDITIONS) {
                logger.trace("用户 {} 数据权限检查, 数据权限和角色匹配. 允许访问数据.", loginName);
//                return authorityResult.getQueryConditions();
                return authorityResult.getConditionSet();
            }
        }
        return null;
    }

    /**
     * 这个是结合权限过滤的查询。
     *
     * @param gaeaDataSet          数据集的定义。主要用sql，primaryTable等。
    //     * @param conditions  条件 重构删掉了，从没用过 by Iverson 2017-7-11
     * @param page
     * @param loginName   登录账户名。主要用于数据权限过滤。   @return
     * @throws ValidationFailedException
     * @throws InvalidDataException
     * @throws SystemConfigException
     */
    @Override
    public PageResult query(GaeaDataSet gaeaDataSet, SchemaGridPage page, String loginName) throws ValidationFailedException, InvalidDataException, SystemConfigException, SysInitException {
        if (gaeaDataSet != null) {
            UserJO loginUser = GaeaWebSecuritySystem.getLoginUser();
//            if (authConditions == null) {
//                authConditions = new ArrayList<QueryCondition>();
//            }
            // 数据集权限校验
            ConditionSet authorityConditionSet = getAuthorityConditions(gaeaDataSet, loginName);
            // 把数据权限条件和页面的filter结合。并且权限条件是在filter前面
//            if (authorityConditionSet != null && CollectionUtils.isNotEmpty(authorityConditionSet.getConditions())) {
//                // 把查询条件（可能是页面传来的、或者数据集配置的），放在权限过滤条件后面
//                List<Condition> originConditions = CollectionUtils.isEmpty(authConditions) ? new ArrayList<Condition>() : convertToConditions(authConditions);
//                authorityConditionSet.getConditions().addAll(originConditions);
//            }
            // 构建默认的SQL中表达式要用的上下文对象, 这个是权限校验的值对象
            GaeaDefaultDsContext defaultDsContext = new GaeaDefaultDsContext(loginUser.getLoginName(), String.valueOf(loginUser.getId()));
            return gaeaSqlProcessor.query(gaeaDataSet.getSql(), gaeaDataSet.getPrimaryTable(), authorityConditionSet, page, defaultDsContext, null);
        }
        return null;
    }

    @Override
    public PageResult query(GaeaDataSet gaeaDataSet, LinkedHashMap<ConditionSet, DataSetCommonQueryConditionDTO> conditionSetMap, SchemaGridPage page, String loginName) throws ValidationFailedException, InvalidDataException, SystemConfigException, SysInitException {
        if (gaeaDataSet != null) {
            UserJO loginUser = GaeaWebSecuritySystem.getLoginUser();
            LinkedHashMap<ConditionSet, DataSetCommonQueryConditionDTO> newSortConditionSetMap = new LinkedHashMap<ConditionSet, DataSetCommonQueryConditionDTO>(); // 新的排顺序的条件集的map
            if (conditionSetMap == null) {
                conditionSetMap = new LinkedHashMap<ConditionSet, DataSetCommonQueryConditionDTO>();
            }
            /**
             * 权限校验的条件集在第一位
             */

            ConditionSet authorityConditionSet = getAuthorityConditions(gaeaDataSet, loginName);// 数据集权限校验
            if (authorityConditionSet != null && StringUtils.isNotEmpty(authorityConditionSet.getId())) {
                newSortConditionSetMap.put(authorityConditionSet, null); // 权限校验的值对象，不是DataSetCommonQueryConditionDTO，是GaeaDefaultDsContext
            }
            /**
             * 再叠加其他条件
             */
            newSortConditionSetMap.putAll(conditionSetMap);

            // 构建默认的SQL中表达式要用的上下文对象, 这个是权限校验的值对象
            GaeaDefaultDsContext defaultDsContext = new GaeaDefaultDsContext(loginUser.getLoginName(), String.valueOf(loginUser.getId()));
            return gaeaSqlProcessor.query(gaeaDataSet.getSql(), gaeaDataSet.getPrimaryTable(), newSortConditionSetMap, page, defaultDsContext);
        }
        return null;
    }

    /**
     * <p>
     * 主要负责从schemaId和datasetId中获取合适的dataset，再调用queryByConditions(DataSet dataSet, DataSetCommonQueryConditionDTO queryConditionDTO)查询数据。
     * </p>
     * 根据查询条件进行查询。<p/>
     * 查询条件可能包括：<br/>
     * <ul>
     * <li>使用XML SCHEMA中的那个condition-set，作为条件，和对应的值。</li>
     * </ul>
     * <p>
     * schemaId,其实也是用于获取dataset. 如果schemaId和datasetId同时存在，则用dataSetId获取的DataSet.
     * </p>
     * 【重要】
     * 数据的优先级：dataSetId > schemaId
     * 数据列的定义优先级：schema.grid > dataSet.columnsDefine
     *
     * @param schemaId          可以为空。如果schemaId和datasetId同时存在，则用dataSetId.
     * @param datasetId         可以为空。如果schemaId和datasetId同时存在，则用dataSetId.
     * @param defaultDsContext
     * @param queryConditionDTO
     * @param isDsTranslate     是否需要对列进行数据集转换。例如是列表页之类的，可能是需要的；但如果是表单编辑的，那就不需要。否则填充值的时候会比较麻烦。
     * @throws ValidationFailedException
     * @throws SysLogicalException
     */
    @Override
    public List<Map<String, Object>> queryByConditions(String schemaId, String datasetId, GaeaDefaultDsContext defaultDsContext, DataSetCommonQueryConditionDTO queryConditionDTO, boolean isDsTranslate) throws ValidationFailedException, SysLogicalException, SysInitException {
        GaeaXmlSchema gaeaXmlSchema = null;
        if (StringUtils.isNotEmpty(schemaId)) {
            gaeaXmlSchema = gaeaSchemaCache.get(schemaId);
        }
        SchemaGrid grid = null;
        DataSet dataSet = null;
        LinkedCaseInsensitiveMap<SchemaColumn> columnDefineMap = null;
        boolean displayUndefinedColumn = true;
//        String sql = "";
        if (gaeaXmlSchema != null) {
//            dataSet = gaeaXmlSchema.getSchemaData().getDataSetList().get(0); // 不再从Schema中获取DataSet定义了。只获取配置的对应DataSet的名字。
            grid = gaeaXmlSchema.getSchemaViews().getGrid();
//            sql = dataSet.getSql();
            SchemaColumn columnDef = GaeaSchemaUtils.getPrimaryKeyColumn(grid);
            if (columnDef == null) {
                throw new ValidationFailedException("Schema未定义主键列，无法根据id查询。");
            }
            // 这里的column map的key，是db-column-name，不是column-name，这个要注意。
            columnDefineMap = GaeaSchemaUtils.getDbNameColumnMap(grid.getColumns());
            displayUndefinedColumn = grid.getDisplayUndefinedColumn();
        }
        /**
         * if
         *   页面传过来的DataSetId和Schema的DataSet不一样，以页面的DataSetId为准
         *   or
         *   页面传来的DataSetId不为空，而dataSet为空（即Schema获取不到）
         * then
         *   重新获取DataSet和SQL
         */
        GaeaDataSet gaeaDataSet = null;
        if ((StringUtils.isNotEmpty(datasetId))) {
            gaeaDataSet = SystemDataSetFactory.getDataSet(datasetId);
        } else {
            String dsId = gaeaXmlSchema.getSchemaData().getDataSetList().get(0).getId();
            gaeaDataSet = SystemDataSetFactory.getDataSet(dsId);
        }
        if (gaeaDataSet == null) {
            logger.debug(MessageFormat.format("找不到对应的数据集，无法进行查询。dataSet ID: {0}", datasetId));
            return null;
        }
        /**
         * 如果从Schema中获取不到列定义，才是用DataSet的<columns-define>
         * 数据列的定义优先级：schema.grid > dataSet.columnsDefine
         */
        if (columnDefineMap == null) {
            columnDefineMap = GaeaSchemaUtils.convertToSchemaColumnMap(gaeaDataSet.getColumns());
        }
        // query data
        dataSet = GaeaSchemaUtils.translateDataSet(gaeaDataSet);
        List<Map<String, Object>> newDataList = queryByConditions(dataSet, queryConditionDTO, defaultDsContext);
        // convert/format data
        // 基于XML SCHEMA的结果集格式转换，如果有传过来XML SCHEMA ID的话
        if (columnDefineMap != null && CollectionUtils.isNotEmpty(newDataList)) {
            // 转换结果的变量名
            newDataList = DataSetConvertHelper.changeDbColumnNameInData(newDataList, columnDefineMap, displayUndefinedColumn, isDsTranslate);
        } else if (gaeaDataSet.getDataFormat() != null) {
            // 转换成某种自定义的json的数据结构
            newDataList = DataFormatHelper.dataFormat(newDataList, gaeaDataSet.getDataFormat());
        }
        return newDataList;
    }

    /**
     * 根据查询条件进行查询。<p/>
     * 查询条件可能包括：<br/>
     * <ul>
     * <li>使用XML SCHEMA中的那个condition-set，作为条件，和对应的值。</li>
     * </ul>
     * <p>
     * schemaId,其实也是用于获取dataset. 如果schemaId和datasetId同时存在，则用dataSetId获取的DataSet.
     * </p>
     *
     * @param dataSet           要查询的数据集。
     * @param queryConditionDTO
     * @param defaultDsContext
     * @return
     * @throws ValidationFailedException
     * @throws SysLogicalException
     */
    @Override
    public List<Map<String, Object>> queryByConditions(DataSet dataSet, DataSetCommonQueryConditionDTO queryConditionDTO, GaeaDefaultDsContext defaultDsContext) throws ValidationFailedException, SysLogicalException {
        if (dataSet == null) {
            logger.debug("数据集为空，无法进行系统通用条件查询。");
            return null;
        }
        try {
            List<QueryCondition> newConditions = new ArrayList<QueryCondition>();// 按通用查询组装标准查询对象
            ConditionSet conditionSet = null;// SCHEMA定义的条件集合

            // 查找请求有没有对应的查询的条件集合，转换为标准查询条件，给查询处理器处理
            if (queryConditionDTO != null && StringUtils.isNotEmpty(queryConditionDTO.getId())) {
                if (dataSet.getWhere() == null || MapUtils.isEmpty(dataSet.getWhere().getConditionSets())) {
                    throw new ValidationFailedException(MessageFormat.format("数据集 {0} 缺少条件配置，无法执行请求对应的条件查询。", dataSet.getId()).toString());
                }
                conditionSet = dataSet.getWhere().getConditionSets().get(queryConditionDTO.getId());
                if (conditionSet != null && conditionSet.getConditions() != null) {
                    for (int i = 0; i < conditionSet.getConditions().size(); i++) {
                        // AI.TODO 这里不能用顺序来确定键值对应。因为对于is null之类的，是没有值的。需要增加一个标识符来做对应关系。
                        // 【重要】这里一个假设：页面value的顺序和XML SCHEMA condition的顺序是一致的。因为暂时不想把查询字段暴露到页面去。
                        Condition schemaCondition = conditionSet.getConditions().get(i);
                        QueryValue valueDTO = queryConditionDTO.getValues().get(i);// 假设顺序一致
                        QueryCondition cond = new QueryCondition();
                        cond.setPropName(schemaCondition.getPropName());// 查询字段为XML SCHEMA中的定义
                        cond.setDataType(SchemaColumn.DATA_TYPE_STRING);// 暂时默认
                        cond.setPropValue(valueDTO.getValue());// value为页面传过来的值
                        cond.setOp(schemaCondition.getOp());
                        newConditions.add(cond);
                    }
                } else {
                    logger.debug("根据查询请求的ConditionSet id获取不到系统对应的ConditionSet。请求ConditionSet id:{} 系统数据集:{} 所含ConditionSet list size:{}",
                            queryConditionDTO.getId(), dataSet.getId(), dataSet.getWhere().getConditionSets().size());
                }
            }
            List<Map<String, Object>> result = gaeaSqlProcessor.query(dataSet.getSql(), conditionSet, defaultDsContext, queryConditionDTO);
            dataSet.setSqlResult(result);
            return dataSet.getSqlResult();
        } catch (ValidationFailedException e) {
            logger.warn("系统动态查询失败。" + e.getMessage());
            throw e;
        } catch (Exception e) {
            logger.error(MessageFormat.format("根据页面条件查询数据失败。dataSet ID={0}", dataSet.getId()), e);
        }

        return null;
    }

    /**
     * 根据XML SCHEMA的定义，把页面传过来的查询条件做一定处理。
     * 例如：
     * 转换对应的数据库字段，设定查询字段对应的XML定义的类型等等。
     *
     * @param queryConditions
     * @param grid
     */
    private void rebuildQueryConditionBySchema(List<QueryCondition> queryConditions, SchemaGrid grid) throws ValidationFailedException {
        if (queryConditions != null) {
            for (QueryCondition condition : queryConditions) {
                if (StringUtils.isEmpty(condition.getPropName())) {
                    throw new ValidationFailedException(
                            MessageFormat.format("快捷查询的propertyName为空，无法查询！op={0} value={1}",
                                    condition.getOp(), condition.getPropValue()).toString());
                }
                SchemaColumn schemaColumn = GaeaSchemaUtils.getViewColumn(grid, condition.getPropName());
                if (schemaColumn != null) {
//                    throw new ValidationFailedException("无法执行查询！根据页面的条件，找不到对应grid的列。");
//                }
                    String dbName = schemaColumn.getDbColumnName();
                    condition.setPropName(dbName);
                    condition.setDataType(schemaColumn.getDataType());
                    condition.setOp(condition.getOp());
                }
            }
        }
    }

    /**
     * 一个vo到vo的类型手动转换。
     *
     * @param queryConditions
     * @return
     */
    private List<Condition> convertToConditions(List<QueryCondition> queryConditions) {
        List<Condition> conditionList = new ArrayList<Condition>();
        if (CollectionUtils.isNotEmpty(queryConditions)) {
            for (QueryCondition queryCondition : queryConditions) {
                Condition condition = new Condition();
                BeanUtils.copyProperties(queryCondition, condition);
                conditionList.add(condition);
            }
            return conditionList;
        }
        return conditionList;
    }
}
