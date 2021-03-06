package org.gaea.framework.web.schema.view.jo;

import java.io.Serializable;

/**
 * 列的查询条件定义
 * Created by iverson on 2017/3/27.
 */
public class ColumnQueryConditionJO implements Serializable {
    // 组件名称。需要跟前端框架一一对应
    private String component;
    // 是否可以多选。默认单选。
    private boolean isMultiple = false;
    /* 查询条件是否可见 */
    private boolean visible = true;

    public String getComponent() {
        return component;
    }

    public void setComponent(String component) {
        this.component = component;
    }

    public boolean isMultiple() {
        return isMultiple;
    }

    public void setMultiple(boolean multiple) {
        isMultiple = multiple;
    }

    public boolean isVisible() {
        return visible;
    }

    public void setVisible(boolean visible) {
        this.visible = visible;
    }
}
