package org.gaea.framework.web.schema;

import org.gaea.cache.GaeaCacheOperator;
import org.gaea.data.cache.CacheFactory;
import org.gaea.data.cache.CacheOperator;
import org.gaea.exception.SysInitException;
import org.gaea.framework.web.schema.domain.GaeaXmlSchema;
import org.gaea.poi.cache.GaeaPoiCache;
import org.gaea.poi.domain.ExcelTemplate;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.BeansException;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.context.ApplicationContext;
import org.springframework.context.ApplicationContextAware;
import org.springframework.stereotype.Component;

/**
 * 缓存统一的工厂类。
 * 主要是需要一个静态方法去获取一些系统启动就已经初始化的东西。例如缓存的各种XML定义等。
 * Created by iverson on 2016-11-1 11:31:53.
 */
@Component
public class SystemCacheFactory implements ApplicationContextAware, CacheFactory {

    private static Logger logger = LoggerFactory.getLogger(SystemCacheFactory.class);
    private static ApplicationContext applicationContext;
    private static GaeaSchemaCache gaeaSchemaCache;
    private static GaeaPoiCache gaeaPoiCache;
    @Autowired
    private GaeaCacheOperator gaeaCacheOperator;

    public void setApplicationContext(ApplicationContext ac) throws BeansException {
        applicationContext = ac;
        if (applicationContext != null) {
            /**
             * 初始化一系列缓存处理器。
             */
            gaeaSchemaCache = applicationContext.getBean(GaeaSchemaCache.class);
            gaeaPoiCache = applicationContext.getBean(GaeaPoiCache.class);
        } else {
            logger.debug("无法获取GaeaSchemaCache，因为applicationContext为空，获取不到GaeaSchemaCache.");
        }
    }

    @Override
    public CacheOperator getCacheOperator() throws SysInitException {
        if (gaeaCacheOperator == null) {
            throw new SysInitException("系统缓存功能未初始化成功。无法获取CacheOperator.");
        }
        return gaeaCacheOperator;
    }

    /**
     * 获取缓存的Gaea XML Schema定义。
     *
     * @param schemaId
     * @return
     */
    public static GaeaXmlSchema getGaeaSchema(String schemaId) {
        GaeaXmlSchema gaeaXmlSchema = gaeaSchemaCache.get(schemaId);
        return gaeaXmlSchema;
    }

    /**
     * 获取缓存的Gaea POI excel template定义。
     *
     * @param templateId
     * @return
     * @throws SysInitException
     */
    public static ExcelTemplate getExcelTemplate(String templateId) throws SysInitException {
        return gaeaPoiCache.getExcelTemplate(templateId);
    }
}
