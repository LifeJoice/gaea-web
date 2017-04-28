package org.gaea.framework.web.schema.service.impl;

import org.apache.commons.collections.CollectionUtils;
import org.apache.commons.lang3.StringUtils;
import org.gaea.exception.InvalidDataException;
import org.gaea.exception.SysInitException;
import org.gaea.exception.SystemConfigException;
import org.gaea.exception.ValidationFailedException;
import org.gaea.framework.web.common.CommonDefinition;
import org.gaea.framework.web.config.SystemProperties;
import org.gaea.framework.web.data.service.SystemDataSetService;
import org.gaea.framework.web.schema.GaeaSchemaCache;
import org.gaea.framework.web.schema.GaeaXmlSchemaProcessor;
import org.gaea.framework.web.schema.SystemCacheFactory;
import org.gaea.framework.web.schema.domain.DataSet;
import org.gaea.framework.web.schema.domain.GaeaXmlSchema;
import org.gaea.framework.web.schema.service.GaeaXmlSchemaService;
import org.gaea.util.GaeaJacksonUtils;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.context.ApplicationContext;
import org.springframework.core.io.Resource;
import org.springframework.core.io.ResourceLoader;
import org.springframework.core.io.support.ResourcePatternUtils;
import org.springframework.stereotype.Service;
import org.xml.sax.SAXException;

import javax.annotation.PostConstruct;
import javax.xml.parsers.ParserConfigurationException;
import java.io.IOException;
import java.lang.reflect.InvocationTargetException;
import java.util.HashMap;
import java.util.Map;

/**
 * Created by iverson on 2017/3/30.
 */
@Service
public class GaeaXmlSchemaServiceImpl implements GaeaXmlSchemaService {
    private final Logger logger = LoggerFactory.getLogger(GaeaXmlSchemaServiceImpl.class);
    @Autowired
    private ResourceLoader resourceLoader;
    @Autowired
    private GaeaSchemaCache gaeaSchemaCache;
    @Autowired
    private GaeaXmlSchemaProcessor gaeaXmlSchemaProcessor;
    @Autowired
    private SystemDataSetService systemDataSetService;

    /**
     * 系统启动的时候，自动初始化并缓存XML Schema。
     */
    @PostConstruct
    public void systemInit() {
        try {
            init();
        } catch (Exception e) {
            logger.error("Gaea xml schema初始化失败！" + e.getMessage(), e);
        }
    }

    /**
     * 初始化system.properties里面配置了路径的xml schema。解析后放在缓存。
     *
     * @throws IOException
     * @throws SysInitException
     */
    public synchronized void init() throws IOException, SysInitException {

        // 读取配置的路径对应的文件。支持classpath:/com/**/*.xml这样的模糊匹配
        Resource[] arrayR = ResourcePatternUtils.getResourcePatternResolver(resourceLoader).getResources(SystemProperties.get(CommonDefinition.PROP_KEY_SYSTEM_XML_SCHEMA_INIT_PATH));
        Map<String, GaeaXmlSchema> allGaeaXmlSchemaMap = new HashMap<String, GaeaXmlSchema>();
            /* 读取XML文件，把DataSet读取和转换处理。 */
        if (arrayR != null) {
            for (Resource r : arrayR) {
                GaeaXmlSchema gaeaXmlSchema = null;
                try {
                    gaeaXmlSchema = gaeaXmlSchemaProcessor.parseXml(r);
                } catch (Exception e) {
                    logger.error("Gaea xml schema初始化失败！" + e.getMessage(), e);
                }
                if (gaeaXmlSchema != null) {
                    allGaeaXmlSchemaMap.put(gaeaXmlSchema.getId(), gaeaXmlSchema);
                }
            }

            // cache
            gaeaSchemaCache.cache(allGaeaXmlSchemaMap);
        }
    }

    /**
     * 根据指定的文件路径（viewSchemaPath)获取xml，解析xml schema，查询获取对应的数据集的数据，然后转换成json返回。
     * 这个是实时解析的，不读缓存！
     *
     * @param springApplicationContext
     * @param viewSchemaPath
     * @param loginName                对应的数据集的数据权限过滤用
     * @return
     * @throws IllegalAccessException
     * @throws ParserConfigurationException
     * @throws IOException
     * @throws SysInitException
     * @throws SAXException
     * @throws InvocationTargetException
     * @throws ValidationFailedException
     * @throws InvalidDataException
     * @throws SystemConfigException
     */
    @Override
    public String getJsonSchema(ApplicationContext springApplicationContext, String viewSchemaPath, String loginName) throws IllegalAccessException, ParserConfigurationException, IOException, SysInitException, SAXException, InvocationTargetException, ValidationFailedException, InvalidDataException, SystemConfigException {
        // 获得HTML模板混合XML SCHEMA的页面。
        GaeaXmlSchema gaeaXML = gaeaXmlSchemaProcessor.parseXml(viewSchemaPath, springApplicationContext);
        return getJsonSchema(gaeaXML, loginName);
    }

    /**
     * 根据指定的xml schema，查询获取对应的数据集的数据，然后转换成json返回。
     *
     * @param gaeaXML
     * @param loginName 对应的数据集的数据权限过滤用
     * @return
     * @throws ValidationFailedException
     * @throws InvalidDataException
     * @throws SystemConfigException
     */
    @Override
    public String getJsonSchema(GaeaXmlSchema gaeaXML, String loginName) throws ValidationFailedException, InvalidDataException, SystemConfigException {

        String jsonData = "";
        try {
            // 根据DataSet查询并填充数据
            if (gaeaXML.getSchemaData() != null && CollectionUtils.isNotEmpty(gaeaXML.getSchemaData().getDataSetList())) {
                DataSet ds = systemDataSetService.queryDataAndTotalElement(gaeaXML.getSchemaData().getDataSetList().get(0), gaeaXML.getSchemaViews().getGrid().getPageSize(), loginName);
                gaeaXML.getSchemaData().getDataSetList().set(0, ds);
                // 整合要返回给页面的json。包括sql数据的清洗、对应数据集的转换等。
                Map<String, Object> dataMap = gaeaXmlSchemaProcessor.combineSchemaInfo(gaeaXML);
                // 把最终结果转换为json字符串
                jsonData = GaeaJacksonUtils.parse(dataMap);
            }
            /**
             * 根据XML SCHEMA生成额外的信息. 直接修改gaeaXML里面的内容，所以没有返回。
             * 完善要返回前端的一些额外的内容。比如：
             * 组装一个组件json列表，方便前端使用等
             */
            logger.debug("\nresultJson\n" + jsonData);
        } catch (IOException e) {
            throw new InvalidDataException("Xml schema定义和数据转换json读写失败！" + e.getMessage(), e);
        }
        return jsonData;
    }

    /**
     * 根据指定的schema id获取缓存的xml schema解析对象，查询对应的数据集的数据，然后转换成json返回。
     * 这个XML schema的定义是读缓存的，数据集的数据是实时查询的。
     *
     * @param schemaId
     * @param loginName 对应的数据集的数据权限过滤用
     * @return
     * @throws SysInitException
     * @throws ValidationFailedException
     * @throws InvalidDataException
     * @throws SystemConfigException
     */
    @Override
    public String getJsonSchema(String schemaId, String loginName) throws SysInitException, ValidationFailedException, InvalidDataException, SystemConfigException {
        if (StringUtils.isEmpty(schemaId)) {
            throw new IllegalArgumentException("schema id为空，无法获取schema的定义！");
        }
        GaeaXmlSchema gaeaXmlSchema = SystemCacheFactory.getGaeaSchema(schemaId);
        if (gaeaXmlSchema == null) {
            throw new ValidationFailedException("找不到对应的Schema。请检查是否缺少了相关的配置/放错了位置/命名错误等。");
        }
        return getJsonSchema(gaeaXmlSchema, loginName);
    }
}