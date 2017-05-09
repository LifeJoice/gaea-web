package org.gaea.framework.web.bind.annotation;

/**
 * Created by iverson on 2017年5月8日15:50:42
 */
public enum RequestBeanDataType {
    /**
     * 默认的。普通的数据类型。转换时会根据类型匹配，利用Java反射进行处理。
     */
    DEFAULT,
    /**
     * Json格式，会利用ObjectMapper之类的去转换。
     */
    JSON
}
