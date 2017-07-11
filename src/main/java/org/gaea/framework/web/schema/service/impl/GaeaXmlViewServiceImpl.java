package org.gaea.framework.web.schema.service.impl;

import org.apache.commons.lang3.StringUtils;
import org.gaea.data.dataset.domain.ConditionSet;
import org.gaea.data.dataset.domain.GaeaDataSet;
import org.gaea.data.domain.DataSetCommonQueryConditionDTO;
import org.gaea.data.system.SystemDataSetFactory;
import org.gaea.db.QueryCondition;
import org.gaea.exception.*;
import org.gaea.framework.web.data.service.SystemDataSetService;
import org.gaea.framework.web.schema.GaeaXmlSchemaProcessor;
import org.gaea.framework.web.schema.convertor.list.GridPageTemplateHelper;
import org.gaea.framework.web.schema.domain.DataSet;
import org.gaea.framework.web.schema.domain.GaeaXmlSchema;
import org.gaea.framework.web.schema.service.GaeaXmlSchemaService;
import org.gaea.framework.web.schema.service.GaeaXmlViewService;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.context.ApplicationContext;
import org.springframework.core.io.Resource;
import org.springframework.stereotype.Service;
import org.springframework.util.StreamUtils;
import org.xml.sax.SAXException;

import javax.xml.parsers.ParserConfigurationException;
import java.io.IOException;
import java.lang.reflect.InvocationTargetException;
import java.nio.charset.Charset;
import java.text.MessageFormat;
import java.util.LinkedHashMap;
import java.util.List;

/**
 * Created by iverson on 2016-12-30 14:42:20.
 */
@Service
public class GaeaXmlViewServiceImpl implements GaeaXmlViewService {
    private final Logger logger = LoggerFactory.getLogger(GaeaXmlViewServiceImpl.class);
    @Autowired
    private GaeaXmlSchemaProcessor gaeaXmlSchemaProcessor;
    @Autowired
    private SystemDataSetService systemDataSetService;
    @Autowired
    private GaeaXmlSchemaService gaeaXmlSchemaService;

//    /**
//     * 通过HTML模板，加上XML SCHEMA定义，获取最终完整的HTML页面。
//     * <p>具体参考 getViewContent(ApplicationContext springApplicationContext, String viewSchemaPath, String loginName) 接口。</p>
//     *
//     * @param springApplicationContext
//     * @param viewSchemaLocation
//     * @param schemaName
//     * @param loginName
//     * @return
//     * @throws ValidationFailedException
//     * @throws IOException
//     * @throws InvalidDataException
//     * @throws SystemConfigException
//     */
//    @Override
//    public String getViewContent(ApplicationContext springApplicationContext, String viewSchemaLocation, String schemaName, String loginName)
//            throws ValidationFailedException, IOException, InvalidDataException, SystemConfigException, SysInitException {
//        String viewSchemaPath = viewSchemaLocation + schemaName;
//        return getViewContent(springApplicationContext, viewSchemaPath, loginName, null);
//    }

    /**
     * 通过HTML模板，加上XML SCHEMA定义，获取最终完整的HTML页面。
     * <p>
     * <b>处理逻辑：</b>
     * <ol>
     * <li>首先,根据XML SCHEMA路径, 获取并解析XML SCHEMA</li>
     * <li>用XML里的XML SCHEMA的DATASET获取数据</li>
     * <li>用XML定义的grid对查出来的数据进行处理, 清洗, 转换等</li>
     * <li>把数据, view, 按钮等等汇总, 转换成json</li>
     * <li>获取HTML模板(如果没改是garaGrid.html)</li>
     * <li>把汇总后的json替换掉HTML的'UR_VIEW_SCHEMA VIEWS_GRID_JSON_DATA'占位符</li>
     * <li>把XML里面的自定义导入的css, js等, 替换html模板的占位符</li>
     * <li>最后, 把包含了转换xml schema后的信息的html页面内容返回</li>
     * </ol>
     * </p>
     * <p>
     * 已经在GaeaHtmlViewResolver校验过viewSchemaPath对应的资源必然存在（否则就会返回null给其他ViewResolver处理）。所以，这里不需要验证了。
     * </p>
     *
     * @param springApplicationContext 用于获取服务器目录下的模板
     * @param viewSchemaPath           XML SCHEMA路径
     * @param loginName                用户登录名。数据权限过滤用。
     * @param queryConditionDTOList     可以为空。schemaPath对应XML的数据集的相关查询条件.  有序。顺序就是拼装SQL的条件的顺序。
     * @return 一个HTML页面的String
     * @throws ValidationFailedException
     */
    @Override
    public String getViewContent(ApplicationContext springApplicationContext, String viewSchemaPath, String loginName, List<DataSetCommonQueryConditionDTO> queryConditionDTOList)
            throws ValidationFailedException, IOException, InvalidDataException, SystemConfigException, SysInitException, ProcessFailedException {
        String htmlPage = "";
        String jsonData = "";
        GridPageTemplateHelper listSchemaHtml = null;

        try {
            listSchemaHtml = new GridPageTemplateHelper(readTemplate(springApplicationContext));
            logger.debug(MessageFormat.format("准备开始解析Gaea xml模板 {0}.", "'" + viewSchemaPath + "'").toString());
            // 获得HTML模板混合XML SCHEMA的页面。
            GaeaXmlSchema gaeaXML = gaeaXmlSchemaProcessor.parseXml(viewSchemaPath, springApplicationContext);
            DataSet dataSet = null;
            if (gaeaXML.getSchemaData() != null && gaeaXML.getSchemaData().getDataSetList() != null && !gaeaXML.getSchemaData().getDataSetList().isEmpty()) {
                dataSet = gaeaXML.getSchemaData().getDataSetList().get(0);
                if (dataSet != null && StringUtils.isNotEmpty(dataSet.getId())) {
                    // 通过DataSet id获取缓存的数据集定义
                    GaeaDataSet gaeaDataSet = SystemDataSetFactory.getDataSet(dataSet.getId());

//            // 根据DataSet查询并填充数据
//            if (gaeaXML.getSchemaData() != null && CollectionUtils.isNotEmpty(gaeaXML.getSchemaData().getDataSetList())) {
////                DataSet ds = gaeaXmlSchemaProcessor.queryAndFillData(gaeaXML.getSchemaData().getDataSetList().get(0), gaeaXML.getSchemaViews().getGrid().getPageSize(),loginName);
//                DataSet ds = systemDataSetService.queryDataAndTotalElement(gaeaXML.getSchemaData().getDataSetList().get(0), gaeaXML.getSchemaViews().getGrid().getPageSize(), loginName);
//                gaeaXML.getSchemaData().getDataSetList().set(0, ds);
//                // 整合要返回给页面的json。包括sql数据的清洗、对应数据集的转换等。
//                Map<String, Object> dataMap = gaeaXmlSchemaProcessor.combineSchemaInfo(gaeaXML);
//                // 把最终结果转换为json字符串
//                jsonData = GaeaJacksonUtils.parse(dataMap);

                    // 如果某些查询条件（queryConditionDTOList）在系统的数据集定义中缺少，略过（虽然这样会导致查询条件的缺少）
                    LinkedHashMap<ConditionSet, DataSetCommonQueryConditionDTO> conditionSetMap = gaeaXmlSchemaService.getConditionSets(gaeaDataSet, queryConditionDTOList, false);
                    jsonData = gaeaXmlSchemaService.getJsonSchema(gaeaXML, loginName, conditionSetMap);
                }
            }
//                // 把结果注入HTML页面
                listSchemaHtml.replaceData(jsonData);
//            }
            /**
             * 根据XML SCHEMA生成额外的信息. 直接修改gaeaXML里面的内容，所以没有返回。
             * 完善要返回前端的一些额外的内容。比如：
             * 组装一个组件json列表，方便前端使用等
             */
            gaeaXmlSchemaProcessor.completeSchemaLogicInfo(gaeaXML);

            logger.debug("\nresultJson\n" + jsonData);
            // 把结果注入HTML页面
//            listSchemaHtml.replaceData(resultJson);
            // XML的各种import（js、css）插入HTML中
            listSchemaHtml.replaceImport(gaeaXML.getSchemaViews().getImports());
            htmlPage = listSchemaHtml.getContent();
        } catch (IOException e) {
            // 返回 null, 以便被下一个 resolver 处理
            logger.info("No file found for file: " + viewSchemaPath);
            throw e;
//            return null;
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
        logger.info("Requested file found: " + viewSchemaPath);
        return htmlPage;
    }


    /**
     * copy from GaeaXmlSchemaProcessor
     *
     * @param springApplicationContext
     * @return
     * @throws IOException
     */
    private String readTemplate(ApplicationContext springApplicationContext) throws IOException {
        String htmlPage = "";
        String gridviewTmplPath = "/js/gaeajs/ui/template/gaeaGrid.html";// TODO 改为在配置文件里配置。
        Resource gridViewResource = springApplicationContext.getResource(gridviewTmplPath);
        htmlPage = StreamUtils.copyToString(gridViewResource.getInputStream(), Charset.forName("UTF-8"));
        return htmlPage;
    }
}
