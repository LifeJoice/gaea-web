package org.gaea.framework.web.schema.convertor;

import org.gaea.data.convertor.XmlDataSetConvertor;
import org.gaea.data.dataset.domain.GaeaDataSet;
import org.gaea.data.dataset.domain.Where;
import org.gaea.data.xml.DataSetSchemaDefinition;
import org.gaea.db.GaeaSqlProcessor;
import org.gaea.exception.InvalidDataException;
import org.gaea.exception.ValidationFailedException;
import org.gaea.framework.web.schema.GaeaSchemaCache;
import org.gaea.framework.web.schema.GaeaXmlSchemaProcessor;
import org.gaea.framework.web.schema.XmlSchemaDefinition;
import org.gaea.framework.web.schema.domain.DataSet;
import org.gaea.framework.web.schema.domain.PageResult;
import org.gaea.framework.web.schema.domain.SchemaData;
import org.apache.commons.lang3.StringUtils;
import org.gaea.framework.web.schema.domain.SchemaGridPage;
import org.gaea.framework.web.schema.utils.GaeaSchemaUtils;
import org.gaea.util.GaeaStringUtils;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.context.annotation.Scope;
import org.springframework.data.domain.Page;
import org.springframework.stereotype.Component;
import org.w3c.dom.CharacterData;
import org.w3c.dom.Element;
import org.w3c.dom.Node;
import org.w3c.dom.NodeList;

import java.util.List;
import java.util.Map;

/**
 * 负责对XML SCHEMA中的<data>元素进行解析。获取数据并返回。
 * Created by Iverson on 2015/6/22.
 */
@Component
@Scope("prototype")
public class XmlDataSchemaConvertor {
    private final Logger logger = LoggerFactory.getLogger(getClass());
    @Autowired
    private GaeaSchemaCache gaeaSchemaCache;
    @Autowired
    private GaeaXmlSchemaProcessor gaeaXmlSchemaProcessor;
    @Autowired
    private GaeaSqlProcessor gaeaSqlProcessor;
    @Autowired
    private XmlDataSetConvertor xmlDataSetConvertor;

    /**
     * 转换XML SCHEMA的"data"标签。提取其中的SQL，并查询出SQL结果。
     *
     * @param xmlDataNode
     * @return
     * @throws ValidationFailedException
     */
    public SchemaData convert(Node xmlDataNode) throws ValidationFailedException, InvalidDataException {
        SchemaData schemaData = new SchemaData();
        NodeList nodes = xmlDataNode.getChildNodes();
        for (int i = 0; i < nodes.getLength(); i++) {
            Node dataSetNode = nodes.item(i);
            // xml解析会把各种换行符等解析成元素。统统跳过。
            if (!(dataSetNode instanceof Element)) {
                continue;
            }
            if (XmlSchemaDefinition.DATA_DATASET_NAME.equals(dataSetNode.getNodeName())) {
                DataSet dataSet = convertDataSet(dataSetNode);
                schemaData.getDataSetList().add(dataSet);
            } else {
                loggerWarnNodeName(dataSetNode.getNodeName());
            }
        }
        // 根据前面解析的XML SCHEMA的DATASET配置，查询结果并回填。
        schemaData.setDataSetList(sqlQuery(schemaData.getDataSetList()));
//        DataSource dataSource = dataSourceService.findByCode(schemaData.getDataSetList().get(0).getCode());
//
//
//
//        // 构造查询handler，并查询数据。
//        QueryExecutorHandler executorHandler = new QueryExecutorHandler();
//        for(DataSet dataSet:schemaData.getDataSetList()) {
//            if(StringUtils.isBlank(dataSet.getSql())){
//                continue;
//            }
//            executorHandler.setPageable(null);
//            executorHandler.setDataSource(DataSourceUtils.get(dataSource));
//            executorHandler.setInputParameters(null);
//            Page<?> handleResult = (Page<?>) executorHandler.handle(dataSet.getSql(), SecurityUtils.getUserContext());
//            logger.debug(" 【SQL】 "+dataSet.getSql()+"\n results="+(handleResult.getContent()!=null?handleResult.getContent().size():"null"));
//            dataSet.setSqlResult((List<Map<String, Object>>) handleResult.getContent());
//        }
//        String jsonData = convertToJson(handleResult);
        return schemaData;
    }

    /**
     * 把Schema中的<data><dataset></dataset></data>中转换出来。
     *
     * @param xmlDataSetNode
     * @return
     * @throws ValidationFailedException
     */
    private DataSet convertDataSet(Node xmlDataSetNode) throws ValidationFailedException, InvalidDataException {
        GaeaDataSet gaeaDataSet = xmlDataSetConvertor.convertDataSet(xmlDataSetNode);
        DataSet dataSet = GaeaSchemaUtils.translateDataSet(gaeaDataSet);
//        Element dataSetElement = (Element) xmlDataSetNode;
//        NodeList nodes = dataSetElement.getChildNodes();
//        for (int i = 0; i < nodes.getLength(); i++) {
//            Node n = nodes.item(i);
//            // xml解析会把各种换行符等解析成元素。统统跳过。
//            if(!(n instanceof Element)){
//                continue;
//            }
//            if("data-source".equals(n.getNodeName())){
//                Element dsElement = (Element) n;
//                String dsCode = dsElement.getAttribute("code");
//                dataSet.setCode(dsCode);
//            }else if ("data-sql".equals(n.getNodeName())){
//                NodeList list = n.getChildNodes();
//                for (int j = 0; j < list.getLength(); j++) {
//                    Node sqlNode = list.item(j);
//                    // xml解析会把各种换行符等解析成元素。统统跳过。
//                    if(StringUtils.isBlank(GaeaStringUtils.cleanFormatChar(sqlNode.getTextContent()))){
//                        continue;
//                    }
//                    if (!(sqlNode instanceof CharacterData)) {
//                        continue;
////                        throw new ValidationFailedException("<data-sql>标签中的SQL必须包含在CDATA中!");
//                    }
//                    CharacterData sqlData = (CharacterData) sqlNode;
//                    String sql = sqlData.getData();
//                    dataSet.setSql(sql);
//                }
//            }else if (DataSetSchemaDefinition.DS_DATASET_WHERE_NODE_NAME.equals(n.getNodeName())) {
//                // <where>的解析
//                Where whereCondition = convertWhere(n);
//                dataSet.setWhere(whereCondition);
//            }else{
//                loggerWarnNodeName(n.getNodeName());
//            }
//        }
        return dataSet;
    }

    private void loggerWarnNodeName(String nodeName) {
        logger.warn("Xml schema中包含错误数据。data中包含非dataset信息: <" + nodeName + ">");
    }

    /**
     * 根据dataSetList中dataset的配置信息（sql，数据源等），查询结果并回填。
     *
     * @param dataSetList
     * @return 回填了查询结果的dataSetList
     */
    private List<DataSet> sqlQuery(List<DataSet> dataSetList) {
//        DataSource dataSource = dataSourceService.findByCode(dataSetList.get(0).getCode());
        // 遍历dataSet list，并为其中每个dataset查询结果，并把数据结果回填
        for (DataSet dataSet : dataSetList) {
            if (StringUtils.isBlank(dataSet.getSql())) {
                continue;
            }
            // TODO 使用macula的查询链。未彻底迁移完成，例如还有分页等
//            DataHandlerChain dataHandleChain = new DataHandlerChain(
//                    ApplicationContext.getBean(UrPrepareFinderHandler.class),       // UR自有的PrepareFinderHandler
//                    ApplicationContext.getBean(QueryParserDataHandler.class),
//                    ApplicationContext.getBean(QueryExecutorHandler.class));
//            ;
////        dataHandleChain.addInitialParameter(PrepareFinderHandler.FINDER_SCHEMA, this.schema);
////        dataHandleChain.addInitialParameter(PrepareFinderHandler.FINDER_TAB_VIEW, tabView);
////            dataHandleChain.addInitialParameter(PrepareFinderHandler.FINDER_ARGS, arguments);
//            dataHandleChain.addInitialParameter(QueryExecutorHandler.AUTO_FIX_PAGE_NUM, Boolean.TRUE);
//
////            if (staticParams != null && !staticParams.isEmpty()) {
////                for (FinderStaticParam staticParam : staticParams) {
////                    dataHandleChain.addInitialParameter(staticParam.getName(), staticParam.getValue());
////                }
////            }
//
//            Page<?> handleResult = (Page<?>) dataHandleChain.handle(dataSet.getSql(), SecurityUtils.getUserContext(), DataSourceUtils.get(dataSource),
//                    null);
//            Pageable pageable = new PageRequest(1,20);
            PageResult pageResultSet = gaeaSqlProcessor.query(dataSet.getSql(), null, new SchemaGridPage(1, 5));

            logger.debug("\n【SQL】 " + dataSet.getSql() + "\n Query results number : " + (pageResultSet.getContent() != null ? pageResultSet.getContent().size() : "null"));
            dataSet.setSqlResult((List<Map<String, Object>>) pageResultSet.getContent());
            dataSet.setTotalElements(pageResultSet.getTotalElements());
        }
        return dataSetList;
    }
}
