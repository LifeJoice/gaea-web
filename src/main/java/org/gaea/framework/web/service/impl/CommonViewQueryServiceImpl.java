package org.gaea.framework.web.service.impl;

import org.gaea.data.dataset.GaeaDataSetResolver;
import org.gaea.data.dataset.domain.GaeaDataSet;
import org.gaea.data.domain.DataSetCommonQueryConditionDTO;
import org.gaea.data.domain.DataSetCommonQueryConditionValueDTO;
import org.gaea.db.GaeaSqlProcessor;
import org.gaea.db.QueryCondition;
import org.gaea.exception.SysLogicalException;
import org.gaea.exception.ValidationFailedException;
import org.gaea.framework.web.schema.GaeaSchemaCache;
import org.gaea.framework.web.schema.GaeaXmlSchemaProcessor;
import org.gaea.framework.web.schema.data.domain.SchemaCondition;
import org.gaea.framework.web.schema.data.domain.SchemaConditionSet;
import org.gaea.framework.web.schema.domain.DataSet;
import org.gaea.framework.web.schema.domain.GaeaXmlSchema;
import org.gaea.framework.web.schema.domain.PageResult;
import org.gaea.framework.web.schema.domain.view.SchemaColumn;
import org.gaea.framework.web.schema.domain.view.SchemaGrid;
import org.gaea.framework.web.schema.domain.SchemaGridPage;
import org.gaea.framework.web.schema.service.SchemaDataService;
import org.gaea.framework.web.schema.utils.GaeaSchemaUtils;
import org.gaea.framework.web.service.CommonViewQueryService;
import org.apache.commons.lang3.StringUtils;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.text.MessageFormat;
import java.util.ArrayList;
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
    @Autowired(required = false)
    private GaeaDataSetResolver gaeaDataSetResolver;

    @Override
    public PageResult query(String schemaId, List<QueryCondition> filters,
                            SchemaGridPage page, boolean translate) throws ValidationFailedException, SysLogicalException {
//        FinderTabView tabView = schema.getTabView(tabViewCode);
//        UserContext userContext = SecurityUtils.getUserContext();
        PageResult pageResult = new PageResult();
        if (StringUtils.isBlank(schemaId)) {
            throw new ValidationFailedException("未能获取Schema id (in param schema id is null).无法查询！");
        }
        GaeaXmlSchema gaeaXmlSchema = gaeaSchemaCache.get(schemaId);
        if (gaeaXmlSchema == null) {
            throw new SysLogicalException("未能从缓存获取对应的Schema对象。请检查逻辑关系！");
        }
        try {
            DataSet dataSet = gaeaXmlSchema.getSchemaData().getDataSetList().get(0);
            SchemaGrid grid = gaeaXmlSchema.getSchemaViews().getGrid();
            final String sql = dataSet.getSql();
            // 根据XML SCHEMA的定义，把页面传过来的查询条件做一定处理
            rebuildQueryConditionBySchema(filters, grid);
            // 获取分页的信息
            int pageSize = StringUtils.isNumeric(grid.getPageSize()) ? Integer.parseInt(grid.getPageSize()) : 0;
            page.setSize(pageSize);
            // 没有macula的schema，手动创建Dataset。
//            FinderDataSet finderDataSet = new FinderDataSet(gaeaXmlSchema.getSchemaData().getDataSetList().get(0).getCode());
//            DataSet dataSet = finderDataSet.getDataSet();
//        DataSet dataSet = schema.getFinderDataSet().getDataSet();
//            DataSource dataSource = dataSourceService.findByCode(dataSet.getCode());
//            String expressionText = dataSet.getSql();
            // UR自有的。转换页面查询条件为兼容macula的FinderArgument list.
//            List<FinderArgument> arguments = toFinderArguments(filters);

//            DataHandlerChain dataHandleChain = new DataHandlerChain(
//                    ApplicationContext.getBean(UrPrepareFinderHandler.class),       // UR自有的PrepareFinderHandler
//                    ApplicationContext.getBean(QueryParserDataHandler.class),
//                    ApplicationContext.getBean(QueryExecutorHandler.class));
//            ;
////        dataHandleChain.addInitialParameter(PrepareFinderHandler.FINDER_SCHEMA, this.schema);
////        dataHandleChain.addInitialParameter(PrepareFinderHandler.FINDER_TAB_VIEW, tabView);
//            dataHandleChain.addInitialParameter(PrepareFinderHandler.FINDER_ARGS, arguments);
//            dataHandleChain.addInitialParameter(QueryExecutorHandler.AUTO_FIX_PAGE_NUM, Boolean.TRUE);
//
//            if (staticParams != null && !staticParams.isEmpty()) {
//                for (FinderStaticParam staticParam : staticParams) {
//                    dataHandleChain.addInitialParameter(staticParam.getName(), staticParam.getValue());
//                }
//            }

//            Page<?> result = (Page<?>) dataHandleChain.handle(expressionText, userContext, DataSourceUtils.get(dataSource),
//                    pageable);
            pageResult = gaeaSqlProcessor.query(sql, filters, page);

//            while (result.getTotalElements() != 0 && result.getNumberOfElements() == 0) {
//                int relocatePage = result.getTotalPages() - 1;
//                Pageable relocatePageable = new PageRequest(relocatePage, pageable.getPageSize(), pageable.getSort());
//                result = (Page<?>) dataHandleChain.handle(expressionText, userContext, DataSourceUtils.get(dataSource),
//                        relocatePageable);
//            }
            dataSet.setSqlResult((List<Map<String, Object>>) pageResult.getContent());
            // 基于UR XML SCHEMA的结果集格式转换
            dataSet = schemaDataService.transformViewData(dataSet, grid);
            pageResult.setContent(dataSet.getSqlResult());
//            pageResult.setContent(result.getContent());
//            pageResult.setTotalElements(result.getTotalElements());
            return pageResult;
        } catch (Exception e) {
            logger.error(e.getMessage(), e);
        }

        return null;
    }

    /**
     * 根据查询条件进行查询。<p/>
     * 查询条件可能包括：<br/>
     * <ul>
     * <li>使用XML SCHEMA中的那个condition-set，作为条件，和对应的值。</li>
     * </ul>
     *
     * @param schemaId
     * @param datasetId
     * @param queryConditionDTO
     * @return
     * @throws ValidationFailedException
     * @throws SysLogicalException
     */
    @Override
    public List<Map<String, Object>> queryByConditions(String schemaId, String datasetId, DataSetCommonQueryConditionDTO queryConditionDTO) throws ValidationFailedException, SysLogicalException {
//        PageResult pageResult = new PageResult();
//        if(StringUtils.isBlank(schemaId)){
//            throw new ValidationFailedException("未能获取Schema id (in param schema id is null).无法查询！");
//        }
        GaeaXmlSchema gaeaXmlSchema = null;
        if (StringUtils.isNotEmpty(schemaId)) {
            gaeaXmlSchema = gaeaSchemaCache.get(schemaId);
        }
//        if(gaeaXmlSchema ==null){
//            throw new SysLogicalException("未能从缓存获取对应的Schema对象。请检查逻辑关系！");
//        }
        if (gaeaDataSetResolver == null) {
            logger.warn(" Gaea的数据集处理器 GaeaDataSetResolver 未初始化。可能无法检索所有的DataSet。");
        }
        try {
            SchemaGrid grid = null;
            DataSet dataSet = null;
            String sql = "";
            if (gaeaXmlSchema != null) {
                dataSet = gaeaXmlSchema.getSchemaData().getDataSetList().get(0);
                grid = gaeaXmlSchema.getSchemaViews().getGrid();
                sql = dataSet.getSql();
                SchemaColumn columnDef = GaeaSchemaUtils.getPrimaryKeyColumn(grid);
                if (columnDef == null) {
                    throw new ValidationFailedException("Schema未定义主键列，无法根据id查询。");
                }
            }
            // 根据XML SCHEMA的定义，把页面传过来的查询条件做一定处理
//            rebuildQueryConditionBySchema(filters,grid);
            // 获取分页的信息
//            int pageSize = StringUtils.isNumeric(grid.getPageSize())?Integer.parseInt(grid.getPageSize()):0;
//            page.setSize(pageSize);
            List<QueryCondition> newConditions = new ArrayList<QueryCondition>();// 按通用查询组装标准查询对象
            SchemaConditionSet conditionSet = null;// SCHEMA定义的条件集合

            // 查找请求有没有对应的查询的条件集合，转换为标准查询条件，给查询处理器处理
            if (queryConditionDTO != null && StringUtils.isNotEmpty(queryConditionDTO.getId())) {
                /**
                 * if
                 *   页面传过来的DataSetId和Schema的DataSet不一样，以页面的DataSetId为准
                 *   or
                 *   页面传来的DataSetId不为空，而dataSet为空（即Schema获取不到）
                 * then
                 *   重新获取DataSet和SQL
                 */
                if ((dataSet != null && StringUtils.isNotEmpty(datasetId) && !StringUtils.equalsIgnoreCase(dataSet.getId(), datasetId))
                        || (StringUtils.isNotEmpty(datasetId)) && dataSet == null) {
                    GaeaDataSet gaeaDataSet = gaeaDataSetResolver.getDataSet(datasetId);
                    if (gaeaDataSet == null) {
                        logger.debug(MessageFormat.format("找不到对应的数据集，无法进行查询。dataSet ID: {0}", datasetId));
                        return null;
                    }
                    dataSet = GaeaSchemaUtils.translateDataSet(gaeaDataSet);
                    sql = dataSet.getSql();
                }
                conditionSet = dataSet.getWhere().getConditionSets().get(queryConditionDTO.getId());
                if (conditionSet != null && conditionSet.getConditions() != null) {
                    for (int i = 0; i < conditionSet.getConditions().size(); i++) {
                        // 【重要】这里一个假设：页面value的顺序和XML SCHEMA condition的顺序是一致的。因为暂时不想把查询字段暴露到页面去。
                        SchemaCondition schemaCondition = conditionSet.getConditions().get(i);
                        DataSetCommonQueryConditionValueDTO valueDTO = queryConditionDTO.getValues().get(i);// 假设顺序一致
//                    for(SchemaCondition schemaCondition:conditionSet.getConditions()){
                        QueryCondition cond = new QueryCondition();
                        cond.setPropertyName(schemaCondition.getField());// 查询字段为XML SCHEMA中的定义
                        cond.setDataType(SchemaColumn.DATA_TYPE_STRING);// 暂时默认
                        cond.setValue(valueDTO.getValue());// value为页面传过来的值
                        cond.setOp(schemaCondition.getFieldOp());
                        newConditions.add(cond);
                    }
                }
            }
//            QueryCondition cond = new QueryCondition();
//            cond.setPropertyName(columnDef.getDbColumnName());
//            cond.setDataType(SchemaColumn.DATA_TYPE_STRING);
//            cond.setValue(id);
//            newConditions.add(cond);
            List<Map<String, Object>> result = gaeaSqlProcessor.query(sql, newConditions);
            dataSet.setSqlResult(result);
            // 基于XML SCHEMA的结果集格式转换，如果有传过来XML SCHEMA ID的话
            if (grid != null) {
                dataSet = schemaDataService.transformViewData(dataSet, grid);
            }
//            pageResult.setContent(dataSet.getSqlResult());
            return dataSet.getSqlResult();
        } catch (ValidationFailedException e){
            logger.info("系统动态查询失败。"+e.getMessage());
        }catch (Exception e) {
            logger.error(MessageFormat.format("根据页面条件查询数据失败。dataSet ID={0}", datasetId), e);
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
    private void rebuildQueryConditionBySchema(List<QueryCondition> queryConditions, SchemaGrid grid) {
        for (QueryCondition condition : queryConditions) {
            SchemaColumn schemaColumn = GaeaSchemaUtils.getViewColumn(grid, condition.getPropertyName());
//            String dbName = GaeaSchemaUtils.getDbColumnName(grid, fa.getPropertyName());
            String dbName = schemaColumn.getDbColumnName();
            condition.setPropertyName(dbName);
            condition.setDataType(schemaColumn.getDataType());
//            if(SchemaColumn.DATA_TYPE_DATE.equalsIgnoreCase(schemaColumn.getDataType())){
//                condition.setSqlType(Types.DATE);
//            }
        }
    }
}
