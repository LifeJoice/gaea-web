package org.gaea.framework.web.schema.view.action;

import org.gaea.framework.web.schema.Param;

/**
 * Created by iverson on 2016/11/4.
 */
public class ActionParam<T> implements Param<T> {
    private String name;
    private String aliasName;
    private T value;

    @Override
    public String getName() {
        return name;
    }

    public void setName(String name) {
        this.name = name;
    }

    public String getAliasName() {
        return aliasName;
    }

    public void setAliasName(String aliasName) {
        this.aliasName = aliasName;
    }

    @Override
    public T getValue() {
        return value;
    }

    public void setValue(T value) {
        this.value = value;
    }
}
