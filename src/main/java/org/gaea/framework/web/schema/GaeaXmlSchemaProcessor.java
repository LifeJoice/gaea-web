package org.gaea.framework.web.schema;

import org.apache.commons.collections.CollectionUtils;
import org.apache.commons.lang3.StringUtils;
import org.gaea.data.dataset.domain.DataItem;
import org.gaea.data.dataset.domain.GaeaDataSet;
import org.gaea.data.system.SystemDataSetFactory;
import org.gaea.exception.InvalidDataException;
import org.gaea.exception.ValidationFailedException;
import org.gaea.framework.web.schema.convertor.XmlDataSchemaConvertor;
import org.gaea.framework.web.schema.convertor.XmlViewsConvertor;
import org.gaea.framework.web.schema.domain.DataSet;
import org.gaea.framework.web.schema.domain.GaeaXmlSchema;
import org.gaea.framework.web.schema.domain.SchemaData;
import org.gaea.framework.web.schema.domain.SchemaViews;
import org.gaea.framework.web.schema.domain.view.*;
import org.gaea.framework.web.schema.utils.GaeaSchemaUtils;
import org.gaea.framework.web.schema.view.service.ActionsService;
import org.gaea.util.GaeaXmlUtils;
import org.gaea.util.MathUtils;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.context.ApplicationContext;
import org.springframework.core.io.Resource;
import org.springframework.stereotype.Component;
import org.w3c.dom.Element;
import org.w3c.dom.Node;
import org.w3c.dom.NodeList;
import org.xml.sax.SAXException;

import javax.xml.parsers.DocumentBuilder;
import javax.xml.parsers.DocumentBuilderFactory;
import javax.xml.parsers.ParserConfigurationException;
import java.io.IOException;
import java.lang.reflect.InvocationTargetException;
import java.util.*;

/**
 * 这个是页面描述Schema的主类。负责处理所有的UR XML描述的页面。
 * Created by Iverson on 2015/6/22.
 */
@Component
public class GaeaXmlSchemaProcessor {
    private final Logger logger = LoggerFactory.getLogger(GaeaXmlSchemaProcessor.class);
    @Autowired
    private XmlDataSchemaConvertor xmlDataSchemaConvertor;
    @Autowired
    private XmlViewsConvertor urXmlViewsConvertor;
    @Autowired
    private GaeaSchemaCache gaeaSchemaCache;
    @Autowired
    private ActionsService actionsService;

    /**
     * 解析Gaea框架的XML页面描述文件。
     *
     * @param viewSchemaPath           全路径。例如：/WEB-INF/static/view_schema/demo/demo_management.xml
     * @param springApplicationContext spring上下文。主要为了获取WEB-INF下面的内容。
     * @return
     * @throws ValidationFailedException
     * @throws IOException
     * @throws SAXException
     * @throws IllegalAccessException
     * @throws InvocationTargetException
     * @throws ParserConfigurationException
     */
    public GaeaXmlSchema parseXml(String viewSchemaPath, ApplicationContext springApplicationContext)
            throws ValidationFailedException, IOException, SAXException, IllegalAccessException, InvocationTargetException, ParserConfigurationException {
//        String resultJson = "";
//        GridPageTemplateHelper listSchemaHtml = null;
        GaeaXmlSchema gaeaXmlSchema = new GaeaXmlSchema();
        SchemaViews schemaViews = null;
        SchemaData schemaData = null;
        DocumentBuilderFactory dbf = DocumentBuilderFactory.newInstance();
        DocumentBuilder db = null;
        Node document = null;
//        Map<String, Object> resultMap = new HashMap<String, Object>();
        try {
//            listSchemaHtml = new GridPageTemplateHelper(readTemplate(springApplicationContext));
            Resource resource = springApplicationContext.getResource(viewSchemaPath);
            db = dbf.newDocumentBuilder();
            // document是整个XML schema
            document = db.parse(resource.getInputStream());
            // 寻找根节点<ur-schema>
            Node rootNode = getRootNode(document);
            // 获取ur-schema的属性。
            gaeaXmlSchema = GaeaXmlUtils.copyAttributesToBean(rootNode, gaeaXmlSchema, GaeaXmlSchema.class);
            if (StringUtils.isBlank(gaeaXmlSchema.getId())) {
                throw new ValidationFailedException("根元素<ur-schema>必须有ID！而且该ID为全局唯一！");
            }
            // 遍历根节点下的第一级子节点，给各个解析器去处理。
            NodeList componentNodes = rootNode.getChildNodes();

            for (int i = 0; i < componentNodes.getLength(); i++) {
                Node node = componentNodes.item(i);
                // xml解析会把各种换行符等解析成元素。统统跳过。
                if (!(node instanceof Element)) {
                    continue;
                }
                if (XmlSchemaDefinition.DATA_NAME.equals(node.getNodeName())) { // 生成数据
                    if (schemaData != null) {
                        throw new ValidationFailedException("一个schema中只能配置一个<data>元素！");
                    }
                    schemaData = xmlDataSchemaConvertor.convert(node);
                    gaeaXmlSchema.setSchemaData(schemaData);
                } else if (XmlSchemaDefinition.VIEWS_NAME.equals(node.getNodeName())) { // 生成视图各元素信息,例如列表、按钮等
                    if (schemaViews != null) {
                        throw new ValidationFailedException("一个schema中只能配置一个<views>元素！");
                    }
                    schemaViews = urXmlViewsConvertor.convert(node);
                    gaeaXmlSchema.setSchemaViews(schemaViews);
                }
            }
//            // 整合要返回给页面的json。包括sql数据的清洗、对应数据集的转换等。
//            resultMap = combineSchemaInfo(gaeaXmlSchema);
//            // 根据XML SCHEMA生成额外的信息
//            completeSchemaLogicInfo(resultMap, gaeaXmlSchema);
//            // 把最终结果转换为json字符串
//            resultJson = GaeaJacksonUtils.parse(resultMap);
//            logger.debug("\nresultJson\n" + resultJson);
//            // 把结果注入HTML页面
//            listSchemaHtml.replaceData(resultJson);
//            listSchemaHtml.replaceImport(schemaViews.getImports());
//            return gaeaXmlSchema;
        } catch (ParserConfigurationException e) {
            logger.warn("构建XML解析的document对象出错。");
            throw e;
        } catch (SAXException e) {
            logger.warn("document.parse转换XML SCHEMA出错。");
            throw e;
        } catch (IllegalAccessException e) {
            logger.warn("把XML SCHEMA的属性等转换为bean对象出错。BeanUtils setProperty error.");
            throw e;
        } catch (InvocationTargetException e) {
            logger.warn("把XML SCHEMA的属性等转换为bean对象出错。BeanUtils setProperty error.");
            throw e;
        } catch (ValidationFailedException e) {
            logger.warn(e.getMessage());
        } catch (InvalidDataException e) {
            logger.warn(e.getMessage());
        }
        // 缓存XML SCHEMA。这里没有做真正的SCHEMA缓存，只是缓存了方便列表页生成后的删除等二次操作的查询而已。
        if (gaeaSchemaCache.get(gaeaXmlSchema.getId()) == null) {
            gaeaSchemaCache.put(gaeaXmlSchema.getId(), gaeaXmlSchema);
        }
        return gaeaXmlSchema;
//        return listSchemaHtml.getContent();
    }

    /**
     * 根据XML Schema的原始信息，我们生成、完善一些关联信息。例如：<br/>
     * button的link-view-id关联的对象，和需要的一些额外信息等。
     * <p>
     *     直接修改gaeaXML里面的内容，所以没有返回。
     * </p>
     *
     * @param gaeaXmlSchema
     */
    public void completeSchemaLogicInfo(GaeaXmlSchema gaeaXmlSchema) {
        initSchemaViewComponentList(gaeaXmlSchema);
    }

    /**
     * 初始化组件列表（key：组件id value：组件对象<br/>
     * <p>
     *     所谓组件列表, GaeaXmlSchema.viewsComponents, 就是一个组件混合列表,我随时可以通过一个id找到对应的组件信息.方便前端各种渲染使用.
     * </p>
     * 所谓组件，就是各种<button>, <views:dialog>等。
     * <p>因为像button的link-view-id可以链接到别的组件，所以我们需要通过组件列表去在后期获取对应的组件，而不用每次都遍历。
     *
     * @param gaeaXmlSchema
     */
    private void initSchemaViewComponentList(GaeaXmlSchema gaeaXmlSchema) {
        if (gaeaXmlSchema.getSchemaViews() == null) {
            return;
        }
        SchemaActions actions = gaeaXmlSchema.getSchemaViews().getActions();
        if (actions != null && actions.getButtons() != null) {
            for (Object obj : actions.getButtons()) {
                if (obj instanceof SchemaButtonGroup) {
                    continue;
                }
                SchemaButton button = (SchemaButton) obj;
                if (!StringUtils.isBlank(button.getId())) {
                    gaeaXmlSchema.getViewsComponents().put(button.getId(), button);
                }
            }
        }
        List<SchemaDialog> dialogs = gaeaXmlSchema.getSchemaViews().getDialogs();
        if (dialogs != null) {
            for (SchemaDialog dialog : dialogs) {
                if (!StringUtils.isBlank(dialog.getId())) {
                    gaeaXmlSchema.getViewsComponents().put(dialog.getId(), dialog);
                }
            }
        }
    }

//    private String readTemplate(ApplicationContext springApplicationContext) throws IOException {
//        String htmlPage = "";
//        String gridviewTmplPath = "/js/gaeajs/ui/template/gaeaGrid.html";// TODO 改为在配置文件里配置。
//        Resource gridViewResource = springApplicationContext.getResource(gridviewTmplPath);
//        htmlPage = StreamUtils.copyToString(gridViewResource.getInputStream(), Charset.forName("UTF-8"));
//        return htmlPage;
//    }

    /**
     * 把从XML SCHEMA中读取的各种信息，例如<data>, <views:actions>, <views:dialog>等汇总到一个map中。
     * AI.TODO 急需把SchemaXXX和XXXJO分离。现在混在一起非常乱。
     * @param gaeaXmlSchema
     * @return
     */
    public Map<String, Object> combineSchemaInfo(GaeaXmlSchema gaeaXmlSchema) throws IOException, ValidationFailedException {
        Map<String, Object> root = new HashMap<String, Object>();
        Map<String, Object> viewsMap = new HashMap<String, Object>();
        SchemaViews schemaViews = gaeaXmlSchema.getSchemaViews();
        SchemaData schemaData = gaeaXmlSchema.getSchemaData();
        DataSet dataSet = null;
        if (schemaData != null && CollectionUtils.isNotEmpty(schemaData.getDataSetList())) {
            dataSet = schemaData.getDataSetList().get(0);
        }
        // 拼装数据，转换结果集中的数据库字段名。
        List<Map<String, Object>> dataList = changeDbColumnNameInData(dataSet.getSqlResult(), schemaViews.getGrid());
        schemaViews.getGridJO().setData(dataList);
        // 设置翻页相关数据
        Integer pageSize = schemaViews.getGridJO().getPage().getSize();                                     // 每页多少条
        Long pageRowCount = dataSet.getTotalElements();                                                     // 总记录数
        Double pageCount = Math.ceil(MathUtils.div(pageRowCount.doubleValue(), pageSize.doubleValue()));     // 多少页
        schemaViews.getGridJO().getPage().setRowCount(pageRowCount);
        schemaViews.getGridJO().getPage().setPageCount(pageCount.intValue());
        // 指定放置在页面哪个DIV中
        viewsMap.put("dialogs", schemaViews.getDialogs());
        viewsMap.put("actions", actionsService.toJson(schemaViews.getActions()));
        viewsMap.put("title", schemaViews.getTitle());
        // 获取grid各个column有绑定ds的。返回也前端使用。例如：快捷查询做下拉列表等。
        Map<String, List<DataItem>> columnDataSets = getColumnSimpleDataSets(schemaViews.getGrid().getColumns());
        // 这些都是放在json数据根下的。
        root.put("grid", schemaViews.getGridJO());
        root.put("views", viewsMap);
        root.put("id", gaeaXmlSchema.getId());
        root.put("columnDataSets", columnDataSets);
        return root;
    }

    /**
     * 对数据库查出来的数据结果进行处理。不能直接把数据库字段名返回到前端，而是使用别名。<p/>
     * 由于结果集是“数据库字段名:值”的键值对。直接把结果集转换json返回前端会暴露数据库的设计。<p/>
     * 所以需要把结果集中的数据库字段名改为别名，即column.name
     *
     * @param dataList
     * @param grid
     * @return
     * @throws ValidationFailedException
     */
    public List<Map<String, Object>> changeDbColumnNameInData(List<Map<String, Object>> dataList, SchemaGrid grid) throws ValidationFailedException {
        if (grid == null) {
            throw new ValidationFailedException("XML Schema grid定义为空。无法执行转换操作！");
        }
        // 这里的column map的key，是db-column-name，不是column-name，这个要注意。
        Map<String, SchemaColumn> columnMap = GaeaSchemaUtils.getDbNameColumnMap(grid.getColumns());
        return changeDbColumnNameInData(dataList, columnMap, grid.getDisplayUndefinedColumn());
    }

    /**
     * 对数据库查出来的数据结果进行处理。不能直接把数据库字段名返回到前端，而是使用别名。<p/>
     * 由于结果集是“数据库字段名:值”的键值对。直接把结果集转换json返回前端会暴露数据库的设计。<p/>
     * 所以需要把结果集中的数据库字段名改为别名，即column.name
     * <p>
     * columnMap的key之所以为DB-COLUMN-NAME，是因为这个方法本身就是把data的key，从数据库字段名改为xml column name的。<br/>
     * 在转换之前,无法通过data的key(这时候还是db column name),去找column(如果key是xml column name的话).
     * </p>
     *
     * @param dataList               sql查询的数据列表。一行 = Map < 字段名 ： 字段值 >
     * @param columnMap              Map< db_column_name : schemaColumn >
     * @param displayUndefinedColumn 是否显示XML Schema中未定义的列。如果是，则key以数据库字段名返回。
     * @return
     */
    public List<Map<String, Object>> changeDbColumnNameInData(List<Map<String, Object>> dataList, Map<String, SchemaColumn> columnMap, boolean displayUndefinedColumn) {
//        List<SchemaColumn> columns = grid.getColumns();
//        List<Map<String, Object>> origResults = dataSet.getSqlResult();
        List<Map<String, Object>> newResultMapList = new ArrayList<Map<String, Object>>();
        // 遍历所有记录
        for (Map<String, Object> rowDataMap : dataList) {
            Map<String, Object> oneResultMap = new HashMap<String, Object>();
            // 遍历一条记录的所有字段
            Set<String> keys = rowDataMap.keySet();
            for (String key : keys) {
                SchemaColumn column = columnMap.get(key);
                // 如果XML SCHEMA没有定义该字段的column元素，而且又设置了display-undefined-column=true，就把该值传到前端。
                if (column == null && displayUndefinedColumn) {
                    oneResultMap.put(key, rowDataMap.get(key));
                }
                if (column == null) {
                    continue;
                }
                // 遍历SCHEMA的“column”元素，对数据库字段名重命名
//                for (SchemaColumn column : columns) {
                // 把结果集中数据库字段名，按XML SCHEMA的“column”的name改名。Map一进一出。
//                    if (key.equalsIgnoreCase(column.getDbColumnName())) {
                /**
                 * 看看对应的列是否关联DataSet。是的话，把DataSet对应的赋值给value
                 * 例如：
                 * value=3，如果这个列有对应的dataset，则找value=3对应的，可能是 {value:3,text:三级菜单,otherValues:{key:value,key2:value2...}}
                 */
                Object newValue = getValueFromDS(rowDataMap.get(key), column.getDataSetId());
                oneResultMap.put(column.getName(), newValue);   // 按新名字放入原值
            }
            newResultMapList.add(oneResultMap);
        }
        return newResultMapList;
    }

    /**
     * 把value处理一下，根据对应的数据集，看有没有对应value的text。有，则作转换。
     * 例如：
     * 如果数据集里，有value=1，text=一级菜单，则把对象作为值返回。
     *
     * @param value
     * @param dataSetId
     * @return
     */
    private Object getValueFromDS(Object value, String dataSetId) {
        Object newValue = value;
        if (value != null) {
            if (StringUtils.isNotEmpty(dataSetId)) {
                GaeaDataSet gaeaDataSet = SystemDataSetFactory.getDataSet(dataSetId);
                if (gaeaDataSet != null) {
                    List<DataItem> dsDatas = gaeaDataSet.getStaticResults();
                    if (dsDatas != null) {
                        // 遍历数据集
                        for (DataItem dataItem : dsDatas) {
                            if (dataItem.getValue().equalsIgnoreCase(String.valueOf(value))) {
                                newValue = dataItem;
                            }
                        }
                    }
                }
            }
        }
        return newValue;
    }

    /**
     * 获取grid.column对应的数据集的集合。
     * <p>
     * 注意：
     * 目前只针对静态配置数据。sql数据集不支持！
     * </p>
     *
     * @param columns
     * @return
     */
    private Map<String, List<DataItem>> getColumnSimpleDataSets(List<SchemaColumn> columns) {
        Map<String, List<DataItem>> dataSets = new HashMap<String, List<DataItem>>();
        for (SchemaColumn column : columns) {
            String dataSetId = column.getDataSetId();
            if (StringUtils.isNotEmpty(dataSetId)) {
                GaeaDataSet gaeaDataSet = SystemDataSetFactory.getDataSet(dataSetId);
                List<DataItem> dsData = gaeaDataSet.getStaticResults();
                dataSets.put(dataSetId, dsData);
            }
        }
        return dataSets;
    }

    /**
     * 遍历文档，寻找根节点"ur-schema"。并校验。
     *
     * @param document
     * @return
     * @throws ValidationFailedException
     */
    private Node getRootNode(Node document) throws ValidationFailedException {
        NodeList nodes = document.getChildNodes();
        Node rootNode = null; // 这个应该是<ur-schema>
        for (int i = 0; i < nodes.getLength(); i++) {
            Node node = nodes.item(i);
            // xml解析会把各种换行符等解析成元素。统统跳过。
            if (!(node instanceof Element)) {
                continue;
            }
            if (XmlSchemaDefinition.ROOT_NODE.equals(node.getNodeName())) {
                rootNode = node;
                break;
            }
        }
        if (rootNode == null) {
            throw new ValidationFailedException("XML Schema根节点为空。无法构建相关页面。");
        }
        return rootNode;
    }
}
