package org.gaea.framework.web.service.impl;

import org.gaea.db.GaeaSqlProcessor;
import org.gaea.db.QueryCondition;
import org.gaea.framework.common.exception.SysLogicalException;
import org.gaea.framework.common.exception.ValidationFailedException;
import org.gaea.framework.web.schema.GaeaSchemaCache;
import org.gaea.framework.web.schema.GaeaXmlSchemaProcessor;
import org.gaea.framework.web.schema.domain.DataSet;
import org.gaea.framework.web.schema.domain.GaeaXmlSchema;
import org.gaea.framework.web.schema.domain.view.SchemaGrid;
import org.gaea.framework.web.schema.utils.GaeaSchemaUtils;
import org.gaea.framework.web.service.CommonViewQueryService;
import org.apache.commons.lang3.StringUtils;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.Map;

/**
 * Created by Iverson on 2015/8/17.
 */
@Service
public class CommonViewQueryServiceImpl implements CommonViewQueryService {
    private final Logger logger = LoggerFactory.getLogger(getClass());
    @Autowired
    private GaeaSchemaCache gaeaSchemaCache;
    @Autowired
    private GaeaXmlSchemaProcessor gaeaXmlSchemaProcessor;
    @Autowired
    private GaeaSqlProcessor gaeaSqlProcessor;

    @Override
    public List<Map<String, Object>> query(String urSchemaId, List<QueryCondition> filters,
                                           Pageable pageable, boolean translate) throws ValidationFailedException, SysLogicalException {
//        FinderTabView tabView = schema.getTabView(tabViewCode);
//        UserContext userContext = SecurityUtils.getUserContext();
        if(StringUtils.isBlank(urSchemaId)){
            throw new ValidationFailedException("未能获取Schema id (in param schema id is null).无法查询！");
        }
        GaeaXmlSchema gaeaXmlSchema = gaeaSchemaCache.get(urSchemaId);
        if(gaeaXmlSchema ==null){
            throw new SysLogicalException("未能从缓存获取对应的Schema对象。请检查逻辑关系！");
        }
        try {
            DataSet dataSet = gaeaXmlSchema.getSchemaData().getDataSetList().get(0);
            SchemaGrid urGrid = gaeaXmlSchema.getSchemaViews().getGrid();
            final String sql = dataSet.getSql();
            // 转换页面传过来的name为db column name
            for (QueryCondition fa: filters){
                String dbName = GaeaSchemaUtils.getDbColumnName(urGrid, fa.getPropertyName());
                fa.setPropertyName(dbName);
            }
            // 没有macula的schema，手动创建Dataset。
//            FinderDataSet finderDataSet = new FinderDataSet(gaeaXmlSchema.getSchemaData().getDataSetList().get(0).getCode());
//            DataSet dataSet = finderDataSet.getDataSet();
//        DataSet dataSet = schema.getFinderDataSet().getDataSet();
//            DataSource dataSource = dataSourceService.findByCode(dataSet.getCode());
            String expressionText = dataSet.getSql();
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
            Page<?> result = gaeaSqlProcessor.query(sql,filters,pageable);

//            while (result.getTotalElements() != 0 && result.getNumberOfElements() == 0) {
//                int relocatePage = result.getTotalPages() - 1;
//                Pageable relocatePageable = new PageRequest(relocatePage, pageable.getPageSize(), pageable.getSort());
//                result = (Page<?>) dataHandleChain.handle(expressionText, userContext, DataSourceUtils.get(dataSource),
//                        relocatePageable);
//            }
            dataSet.setSqlResult((List<Map<String, Object>>) result.getContent());
            // 基于UR XML SCHEMA的结果集格式转换
            dataSet = gaeaXmlSchemaProcessor.changeDbColumnNameInData(dataSet, urGrid);

            return dataSet.getSqlResult();
        }catch(Exception e){
            logger.error(e.getMessage(),e);
        }

        // 数据格式化
//        @SuppressWarnings("unchecked")
//        List<Map<String, Object>> content = (List<Map<String, Object>>) result.getContent();
//        for (Map<String, Object> row : content) {
//            for (Map.Entry<String, Object> entry : row.entrySet()) {
//                FinderColumn column = schema.getColumn(entry.getKey());
//                if (column != null) {
//                    entry.setValue(ConversionUtils.convertQuietly(entry.getValue(), column.getType().getTypeClass()));
//                    if (translate) {
//                        FinderParam param = getSchemaParam(schema, column);
//                        if (param != null && !StringUtils.isBlank(param.getDataParamCode())) {
//                            entry.setValue(getArgument(param).getOptionLabel(entry.getValue()));
//                        } else if (!StringUtils.isBlank(column.getFormat())) {
//                            if (entry.getValue() instanceof Date) {
//                                entry.setValue(DateFormatUtils.format((Date) entry.getValue(), column.getFormat()));
//                            } else if (entry.getValue() instanceof Number) {
//                                entry.setValue(new NumberFormatter(column.getFormat()).print((Number) entry.getValue(),
//                                        ApplicationContext.getCurrentUserLocale()));
//
//                            }
//                        }
//                    }
//                }
//            }
//        }

        return null;
    }

//    private List<FinderArgument> toFinderArguments(List<FinderArgument> filters){
//        List<FinderArgument> arguments = new ArrayList<FinderArgument>();
//        if (filters != null && !filters.isEmpty()) {
//            for (FinderArgument finderArgument : filters) {
//                FinderColumn column = new FinderColumn();
//                column.setLabel(finderArgument.getLabel());
//                column.setName(finderArgument.getName());
//                column.setType(DataType.String);
//                FinderParam param = new FinderParam(column,null);
//                if (param != null) {
//                    finderArgument.updateValues(param, SecurityUtils.getUserContext());
//                    arguments.add(finderArgument);
//                }
//            }
//        }
//        return arguments;
//    }
}
