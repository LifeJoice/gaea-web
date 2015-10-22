package org.gaea.framework.web.schema;

import org.gaea.framework.common.exception.ValidationFailedException;
import org.gaea.framework.common.utils.GaeaJacksonUtils;
import org.gaea.framework.common.utils.GaeaXmlUtils;
import org.gaea.framework.web.schema.convertor.XmlDataSchemaConvertor;
import org.gaea.framework.web.schema.convertor.XmlViewsConvertor;
import org.gaea.framework.web.schema.convertor.list.ListSchemaHtmlConvertor;
import org.gaea.framework.web.schema.domain.*;
import org.gaea.framework.web.schema.domain.view.*;
import org.apache.commons.lang3.StringUtils;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.context.ApplicationContext;
import org.springframework.core.io.Resource;
import org.springframework.stereotype.Component;
import org.springframework.util.StreamUtils;
import org.w3c.dom.Element;
import org.w3c.dom.Node;
import org.w3c.dom.NodeList;
import org.xml.sax.SAXException;

import javax.xml.parsers.DocumentBuilder;
import javax.xml.parsers.DocumentBuilderFactory;
import javax.xml.parsers.ParserConfigurationException;
import java.io.IOException;
import java.lang.reflect.InvocationTargetException;
import java.nio.charset.Charset;
import java.util.*;

/**
 * 这个是页面描述Schema的主类。负责处理所有的UR XML描述的页面。
 * Created by Iverson on 2015/6/22.
 */
@Component
public class GaeaXmlSchemaProcessor {
    private final Logger logger = LoggerFactory.getLogger(getClass());
    @Autowired
    private XmlDataSchemaConvertor xmlDataSchemaConvertor;
    @Autowired
    private XmlViewsConvertor urXmlViewsConvertor;
    @Autowired
    private GaeaSchemaCache gaeaSchemaCache;

    public String process(ApplicationContext springApplicationContext, String viewSchemaLocation, String schemaName) throws ValidationFailedException {
        String htmlPage = "";
        String viewSchemaPath = viewSchemaLocation + schemaName;

        try {
            logger.info(viewSchemaPath);
            // 获得HTML模板混合XML SCHEMA的页面。
            htmlPage = parseXml(viewSchemaPath, springApplicationContext);
        } catch (IOException e) {
            // 返回 null, 以便被下一个 resolver 处理
            logger.info("No file found for file: " + viewSchemaPath);
            return null;
        } catch (ParserConfigurationException e) {
            logger.error("create XML document object ERROR。", e);
            return null;
        } catch (SAXException e) {
            logger.error("XML document.parse XML SCHEMA ERROR。", e);
            return null;
        } catch (IllegalAccessException e) {
            logger.error("translate XML SCHEMA properties to bean ERROR。BeanUtils setProperty error.", e);
            return null;
        } catch (InvocationTargetException e) {
            logger.error("translate XML SCHEMA properties to bean ERROR。BeanUtils setProperty error.", e);
            return null;
        }
        logger.info("Requested file found: " + viewSchemaPath + ", viewName:" + schemaName);
        return htmlPage;
    }

    private String parseXml(String viewSchemaPath, ApplicationContext springApplicationContext) throws ValidationFailedException, IOException, SAXException, IllegalAccessException, InvocationTargetException, ParserConfigurationException {
        String resultJson = "";
        ListSchemaHtmlConvertor listSchemaHtml = null;
        GaeaXmlSchema gaeaXmlSchema = new GaeaXmlSchema();
        SchemaViews schemaViews = null;
        SchemaData schemaData = null;
        DocumentBuilderFactory dbf = DocumentBuilderFactory.newInstance();
        DocumentBuilder db = null;
        Node document = null;
        Map<String, Object> resultMap = new HashMap<String, Object>();
        try {
            listSchemaHtml = new ListSchemaHtmlConvertor(readTemplate(springApplicationContext));
            Resource resource = springApplicationContext.getResource(viewSchemaPath);
            db = dbf.newDocumentBuilder();
            // document是整个XML schema
            document = db.parse(resource.getInputStream());
            // 寻找根节点<ur-schema>
            Node rootNode = getRootNode(document);
            // 获取ur-schema的属性。
            gaeaXmlSchema = GaeaXmlUtils.copyAttributesToBean(rootNode, gaeaXmlSchema, GaeaXmlSchema.class);
            if(StringUtils.isBlank(gaeaXmlSchema.getId())){
                throw new ValidationFailedException("根元素<ur-schema>必须有ID！而且该ID为全局唯一！");
            }
            // 遍历根节点下的第一级子节点，给各个解析器去处理。
            NodeList componentNodes = rootNode.getChildNodes();

            for (int i = 0; i < componentNodes.getLength(); i++) {
                Node node = componentNodes.item(i);
                // xml解析会把各种换行符等解析成元素。统统跳过。
                if(!(node instanceof Element)){
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
            resultMap = combineSchemaInfo(gaeaXmlSchema);
            // 根据XML SCHEMA生成额外的信息
            completeSchemaLogicInfo(resultMap, gaeaXmlSchema);
            // 把最终结果转换为json字符串
            resultJson = GaeaJacksonUtils.parse(resultMap);
            logger.debug("\nresultJson\n" + resultJson);
            // 把结果注入HTML页面
            listSchemaHtml.replaceData(resultJson);
            listSchemaHtml.replaceImport(schemaViews.getImports());
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
        } catch (ValidationFailedException e){
            logger.warn("Ur System validate problem. "+e.getMessage());
        }
        // 缓存XML SCHEMA。这里没有做真正的SCHEMA缓存，只是缓存了方便列表页生成后的删除等二次操作的查询而已。
        if(gaeaSchemaCache.get(gaeaXmlSchema.getId())==null) {
            gaeaSchemaCache.put(gaeaXmlSchema.getId(), gaeaXmlSchema);
        }
        return listSchemaHtml.getContent();
    }

    /**
     * 根据XML Schema的原始信息，我们生成、完善一些关联信息。例如：<br/>
     * button的link-view-id关联的对象，和需要的一些额外信息等。
     * @param resultMap
     * @param gaeaXmlSchema
     */
    private void completeSchemaLogicInfo(Map<String, Object> resultMap, GaeaXmlSchema gaeaXmlSchema) {
        initSchemaViewComponentList(gaeaXmlSchema);
        SchemaActions actions = gaeaXmlSchema.getSchemaViews().getActions();
        // 查找button的link-view-id并组装对应的信息
        if (actions != null && actions.getButtons() != null) {
            for (SchemaButton button : actions.getButtons()) {
                if(!StringUtils.isBlank(button.getLinkViewId())){
                    SchemaViewsComponent component = gaeaXmlSchema.getViewsComponents().get(button.getLinkViewId());
                    // 找到link-view-id对应的组件
                    if(component!=null){
                        String type = component.getType();
                        if("workflow-approval".equals(type)){
                            button.setLinkComponent(type);
                        }
                    }
                }
            }
        }
    }

    /**
     * 初始化组件列表（key：组件id value：组件对象<br/>
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
            for (SchemaButton button : actions.getButtons()) {
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

    private String readTemplate(ApplicationContext springApplicationContext) throws IOException {
        String htmlPage = "";
        String gridviewTmplPath = "/WEB-INF/static/html/template/ur_gridview.html";
        Resource gridViewResource = springApplicationContext.getResource(gridviewTmplPath);
        htmlPage = StreamUtils.copyToString(gridViewResource.getInputStream(), Charset.forName("UTF-8"));
        return htmlPage;
    }

//    private String injectToView(String inJsonData, ListSchemaHtmlConvertor htmlPage) throws IOException {
////        String htmlPage = "";
////        String gridviewTmplPath = "/WEB-INF/static/html/template/ur_gridview.html";
////        Resource gridViewResource = springApplicationContext.getResource(gridviewTmplPath);
////        htmlPage = StreamUtils.copyToString(gridViewResource.getInputStream(), Charset.forName("UTF-8"));
//        htmlPage = StringUtils.replace(htmlPage, "<!UR_VIEW_SCHEMA VIEWS_GRID_JSON_DATA>", inJsonData);
//        return htmlPage;
//    }

    /**
     * 把从XML SCHEMA中读取的各种信息，例如<data>, <views:actions>, <views:dialog>等汇总到一个map中。
     *
     * @param gaeaXmlSchema
     * @return
     */
    private Map<String, Object> combineSchemaInfo(GaeaXmlSchema gaeaXmlSchema) throws IOException {
        Map<String, Object> root = new HashMap<String, Object>();
        Map<String, Object> viewsMap = new HashMap<String, Object>();
//        Map<String, Object> gridMap = null;
        SchemaViews schemaViews = gaeaXmlSchema.getSchemaViews();
        SchemaData schemaData = gaeaXmlSchema.getSchemaData();
        // Grid转换为json的结构和最终要的数据差不多。就以Grid返回的为基础。
//        gridMap = schemaViews.getGrid().getJsonData();
        // 拼装数据，转换结果集中的数据库字段名。
        DataSet dataSet = changeDbColumnNameInData(schemaData.getDataSetList().get(0),schemaViews.getGrid());
        schemaViews.getGridDTO().setData(dataSet.getSqlResult());
        schemaViews.getGridDTO().getPage().setRowCount(dataSet.getTotalElements());
//        gridMap.put("data", dataSet.getSqlResult());
        // 指定放置在页面哪个DIV中
//        gridMap.put("renderTo", schemaViews.getGrid().getRenderTo());
        viewsMap.put("dialogs", schemaViews.getDialogs());
        viewsMap.put("actions", schemaViews.getActions());
        viewsMap.put("title", schemaViews.getTitle());
        // 这些都是放在json数据根下的。
        root.put("grid", schemaViews.getGridDTO());
        root.put("views", viewsMap);
        root.put("id", gaeaXmlSchema.getId());
        return root;
    }

    /**
     * 对数据库查出来的数据结果进行处理。不能直接把数据库字段名返回到前端，而是使用别名。<p/>
     * 由于结果集是“数据库字段名:值”的键值对。直接把结果集转换json返回前端会暴露数据库的设计。<p/>
     * 所以需要把结果集中的数据库字段名改为别名，即column.name
     * @param dataSet
     * @param grid
     * @return
     */
    public DataSet changeDbColumnNameInData(DataSet dataSet,SchemaGrid grid){
        List<SchemaColumn> columns = grid.getColumns();
        List<Map<String, Object>> origResults = dataSet.getSqlResult();
        List<Map<String, Object>> newResultMapList = new ArrayList<Map<String, Object>>();
        // 遍历所有记录
        for(Map<String,Object> eachMap:origResults){
            Map<String,Object> oneResultMap = new HashMap<String, Object>();
            // 遍历一条记录的所有字段
            Set<String> keys = eachMap.keySet();
            for(String key:keys){
                boolean hasDefined = false;
                // 遍历SCHEMA的“column”元素，对数据库字段名重命名
                for (SchemaColumn column : columns) {
                    if(key.equals(column.getDbColumnName())){
                        // 把结果集中数据库字段名，按XML SCHEMA的“column”的name改名。Map一进一出。
                        oneResultMap.put(column.getName(), eachMap.get(key));   // 按新名字放入原值
                        hasDefined = true;
//                        // 键名和column.name不一致才要移除。例如：key=ID和column.name=id这种在map是会被替换的。
//                        if(!key.equalsIgnoreCase(column.getName())) {
//                            eachMap.remove(key);                               // 再删掉旧key
//                        }
                        break;
                    }
                }
                // 如果XML SCHEMA没有定义该字段的column元素，而且又设置了display-undefined-column=true，就把该值传到前端。
                if(!hasDefined && grid.getDisplayUndefinedColumn()){
                    oneResultMap.put(key, eachMap.get(key));
                }
            }
            newResultMapList.add(oneResultMap);
        }
        // 声明,释放原结果集内存
        dataSet.setSqlResult(null);
        // 设置新的结果
        dataSet.setSqlResult(newResultMapList);
        return dataSet;
    }

    /**
     * 遍历文档，寻找根节点"ur-schema"。并校验。
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
            if(XmlSchemaDefinition.ROOT_NODE.equals(node.getNodeName())){
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
