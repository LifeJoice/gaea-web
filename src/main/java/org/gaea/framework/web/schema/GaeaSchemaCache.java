package org.gaea.framework.web.schema;

import org.gaea.framework.web.schema.domain.GaeaXmlSchema;
import org.springframework.stereotype.Component;

import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;

/**
 * 作为XML SCHEMA的存在。
 * <p/>利用Spring的单例模式，做一个简单的缓存。
 * Created by Iverson on 2015/8/14.
 */
@Component
public class GaeaSchemaCache {
    private final Map<String, GaeaXmlSchema> urSchemaCache = new ConcurrentHashMap<String, GaeaXmlSchema>();

    public GaeaXmlSchema get(String id){
        return urSchemaCache.get(id);
    }

    public void put(String id,GaeaXmlSchema gaeaXmlSchema){
        urSchemaCache.put(id, gaeaXmlSchema);
    }
}
