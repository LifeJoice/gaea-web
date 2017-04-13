package org.gaea.framework.web.schema;

import org.apache.commons.lang3.StringUtils;
import org.gaea.cache.CacheFactory;
import org.gaea.cache.CacheOperator;
import org.gaea.exception.SysInitException;
import org.gaea.framework.web.common.CommonDefinition;
import org.gaea.framework.web.config.SystemProperties;
import org.gaea.framework.web.schema.domain.GaeaXmlSchema;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Component;

import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;

/**
 * 作为XML SCHEMA的存在。
 * <p/>利用Spring的单例模式，做一个简单的缓存。
 * <p>
 *     整合（Redis）缓存系统，开始依赖缓存系统进行缓存。
 *     by Iverson 2017年4月13日14:02:43
 * </p>
 * Created by Iverson on 2015/8/14.
 */
@Component
public class GaeaSchemaCache {
    private final Logger logger = LoggerFactory.getLogger(GaeaSchemaCache.class);

    private final Map<String, GaeaXmlSchema> schemaCache = new ConcurrentHashMap<String, GaeaXmlSchema>();
    @Autowired
    private CacheFactory cacheFactory;

    public GaeaXmlSchema get(String id) throws SysInitException {
        if (StringUtils.isEmpty(id)) {
            throw new IllegalArgumentException("id为空，无法获取缓存的XML Schema！");
        }
        String redisRootKey = SystemProperties.get(CommonDefinition.PROP_KEY_REDIS_GAEA_SCHEMA_DEF);
        CacheOperator cacheOperator = cacheFactory.getCacheOperator();
        GaeaXmlSchema gaeaXmlSchema = cacheOperator.getHashValue(redisRootKey, id, GaeaXmlSchema.class);
        if (gaeaXmlSchema == null) {
            logger.debug("获取缓存模板失败！redis root key:{} hash key:{}", redisRootKey, id);
        }
        // 暂时先兼容以下老框架，因为对于controller和view的xml schema是实时解析的。后面改为统一全部从缓存获取。
        return gaeaXmlSchema == null ? schemaCache.get(id) : gaeaXmlSchema;
    }

    public void put(String id, GaeaXmlSchema gaeaXmlSchema) {
        schemaCache.put(id, gaeaXmlSchema);
    }

    public void cache(Map<String, GaeaXmlSchema> gaeaXmlSchemaMap) throws SysInitException {
        CacheOperator cacheOperator = cacheFactory.getCacheOperator();
        if (gaeaXmlSchemaMap != null && gaeaXmlSchemaMap.size() > 0) {
            String rootKey = SystemProperties.get(CommonDefinition.PROP_KEY_REDIS_GAEA_SCHEMA_DEF);
            cacheOperator.put(rootKey, gaeaXmlSchemaMap, GaeaXmlSchema.class);
        }
    }
}
