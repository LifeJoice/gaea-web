package org.gaea.framework.common;

import org.slf4j.LoggerFactory;

/**
 * Created by iverson on 2017/3/30.
 */
public class GaeaLoggerHelper {

    public static void error(Class clz, String baseStr) {
        LoggerFactory.getLogger(clz).error(baseStr);
    }
}
