package org.gaea.framework.web.schema.view.domain;

import org.gaea.framework.web.schema.Param;

/**
 * Created by iverson on 2016/11/4.
 */
public class ActionParam<T> implements Param<T> {
    private String name;
    private T value;

    @Override
    public String getName() {
        return name;
    }

    public void setName(String name) {
        this.name = name;
    }

    @Override
    public T getValue() {
        return value;
    }

    public void setValue(T value) {
        this.value = value;
    }
}
