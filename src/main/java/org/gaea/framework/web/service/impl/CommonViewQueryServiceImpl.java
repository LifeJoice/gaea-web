package org.gaea.framework.web.service.impl;

import org.apache.commons.lang3.time.FastDateFormat;
import org.gaea.db.GaeaSqlProcessor;
import org.gaea.db.QueryCondition;
import org.gaea.exception.SysLogicalException;
import org.gaea.exception.ValidationFailedException;
import org.gaea.framework.web.schema.GaeaSchemaCache;
import org.gaea.framework.web.schema.GaeaXmlSchemaProcessor;
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

import java.sql.Types;
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

    @Override
    public PageResult query(String schemaId, List<QueryCondition> filters,
                            SchemaGridPage page, boolean translate) throws ValidationFailedException, SysLogicalException {
//        FinderTabView tabView = schema.getTabView(tabViewCode);
//        UserContext userContext = SecurityUtils.getUserContext();
        PageResult pageResult = new PageResult();
        if(StringUtils.isBlank(schemaId)){
            throw new ValidationFailedException("未能获取Schema id (in param schema id is null).无法查询！");
        }
        GaeaXmlSchema gaeaXmlSchema = gaeaSchemaCache.get(schemaId);
        if(gaeaXmlSchema ==null){
            throw new SysLogicalException("未能从缓存获取对应的Schema对象。请检查逻辑关系！");
        }
        try {
            DataSet dataSet = gaeaXmlSchema.getSchemaData().getDataSetList().get(0);
            SchemaGrid grid = gaeaXmlSchema.getSchemaViews().getGrid();
            final String sql = dataSet.getSql();
            // 根据XML SCHEMA的定义，把页面传过来的查询条件做一定处理
            rebuildQueryConditionBySchema(filters,grid);
            // 获取分页的信息
            int pageSize = StringUtils.isNumeric(grid.getPageSize())?Integer.parseInt(grid.getPageSize()):0;
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
            pageResult = gaeaSqlProcessor.query(sql,filters, page);

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
        }catch(Exception e){
            logger.error(e.getMessage(),e);
        }

        return null;
    }

    /**
     * 根据XML SCHEMA的定义，把页面传过来的查询条件做一定处理。
     * 例如：
     * 转换对应的数据库字段，设定查询字段对应的XML定义的类型等等。
     * @param queryConditions
     * @param grid
     */
    private void rebuildQueryConditionBySchema(List<QueryCondition> queryConditions, SchemaGrid grid){
        for (QueryCondition condition: queryConditions){
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
