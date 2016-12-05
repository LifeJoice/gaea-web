package org.gaea.framework.web.config;

import org.apache.commons.collections.MapUtils;
import org.apache.commons.lang3.StringUtils;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.core.io.DefaultResourceLoader;
import org.springframework.core.io.Resource;
import org.springframework.core.io.ResourceLoader;
import org.springframework.core.io.support.EncodedResource;
import org.springframework.core.io.support.PropertiesLoaderUtils;

import java.io.IOException;
import java.util.Properties;
import java.util.concurrent.ConcurrentHashMap;

/**
 * 系统通用的静态的Properties的加载类。
 * <p><b>默认入口：classpath:config/sys/system.properties的system.property_file_locations配置项。</b></p>
 * <p>
 * 静态方法加载.在系统启动时即记载.但未测试过。因为好像现在tomcat的类加载不会自动运行静态代码？<br/>
 * 但无论如何，测试过，用Spring @POSTConstruct和普通Servlet（即使该Servlet在Spring的DispatchServlet之前）加载都是没有问题的。
 * </p>
 * Created by iverson on 2016/11/24.
 */
public class SystemProperties {
    private static final Logger logger = LoggerFactory.getLogger(SystemProperties.class);
    private static ConcurrentHashMap<String, String> propMap = null;
    // 默认开始读取的配置文件
    public static final String DEFAULT_BEGIN_PROPERTY_FILE = "classpath:config/sys/system.properties";
    // 默认加载那些property文件
    public static final String DEFAULT_LOAD_FILES_KEY = "system.property_file_locations";

    static void init() {
        try {

            ResourceLoader loader = new DefaultResourceLoader();
            Resource resource = loader.getResource(DEFAULT_BEGIN_PROPERTY_FILE);
            /**
             * 先加载系统的最top的property配置文件
             */
            if (resource.exists()) {
                Properties properties = null;
                properties = PropertiesLoaderUtils.loadProperties(new EncodedResource(resource, "UTF-8"));
                // 把properties文件里的值，放到全局的map中缓存
                initProperties(properties, DEFAULT_BEGIN_PROPERTY_FILE);
                /**
                 * 从原始property文件获取真正要加载property的文件位置
                 * 支持多个文件。配置项里用“,”隔开即可。
                 */
                String allPropLocations = SystemProperties.get(DEFAULT_LOAD_FILES_KEY);
                if (StringUtils.isNotEmpty(allPropLocations)) {
                    String[] resourceLocations = allPropLocations.split(",");
                    for (String location : resourceLocations) {
                        Resource r = loader.getResource(location);
                        if (r.exists()) {
                            Properties p = null;
                            p = PropertiesLoaderUtils.loadProperties(new EncodedResource(r, "UTF-8"));
                            // 把properties文件里的值，放到全局的map中缓存
                            initProperties(p, location);
                        }
                    }
                }
            } else {
                logger.warn("系统初始化，无法加载对应的配置文件。可能影响系统的运作。properties file location: " + DEFAULT_BEGIN_PROPERTY_FILE);
            }
        } catch (IOException e) {
            logger.error("系统初始化，无法加载对应的配置文件。可能影响系统的运作。", e);
        }
    }

    public static String get(String key) {
        if (propMap == null) {
            init();
        }
        if (StringUtils.isEmpty(key)) {
            return null;
        }
        if (MapUtils.isNotEmpty(propMap)) {
            return propMap.get(key);
        }
        return null;
    }

    private static void initProperties(Properties properties, String logLocation) {
        // 遍历，把properties文件里的键值对都放进map。
        for (Object k : properties.keySet()) {
            String key = k.toString();
            String value = properties.get(k).toString();
            if (propMap == null) {
                propMap = new ConcurrentHashMap<String, String>();
            }
            if (StringUtils.isEmpty(value)) {
                continue;
            }
            if (propMap.containsKey(key)) {
                logger.warn("初始化读取配置文件，发现重复值！key：" + key + " file path：" + logLocation + ". 值 '" + propMap.get(key) + "' 被值 '" + properties.get(k) + "' 覆盖！");
            }
            propMap.put(key, value);
        }
    }
}
