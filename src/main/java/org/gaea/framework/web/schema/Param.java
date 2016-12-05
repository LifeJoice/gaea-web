package org.gaea.framework.web.schema;

/**
 * XML Schema的Action的Param。
 * Created by iverson on 2016/11/4.
 */
public interface Param<T> {
    public String getName();

    public T getValue();
}
