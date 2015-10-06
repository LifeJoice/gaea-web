package org.gaea.framework.web.schema.convertor;

import org.w3c.dom.Node;

/**
 * Created by Iverson on 2015/7/6.
 */
public interface SchemaConvertor<T> {
    public T convert(Node node) throws Exception;
}
