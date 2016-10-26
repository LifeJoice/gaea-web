package org.gaea.framework.web.schema.domain;

/**
 * Created by Iverson on 2015/7/8.
 */
public interface SchemaViewsComponent {
    public String getId();
    public String getName();

    public String getComponentName();        // 组件名。例如：dialog,button之类的。
//    public String getType();
}
