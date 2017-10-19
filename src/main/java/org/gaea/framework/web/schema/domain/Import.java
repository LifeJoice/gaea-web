package org.gaea.framework.web.schema.domain;

import java.io.Serializable;

/**
 * 因为不能放在SchemaImport作为内部类使用（Jackson序列化不了），所以独立出来。
 * Created by iverson on 2017/10/13.
 */
public class Import implements Serializable {
    private String src;
    // 要放在(HTML)文档中的位置
    private String position = "";
    /**
     * js的加载周期
     * 当前，主要针对列表页的额外js，可以在gaeaGrid.html的所有元素生成完后，再加载js
     * value: default|dom-last
     */
    private String period = "default";

    public Import() {
    }

    public Import(String src) {
        this.src = src;
    }

    public String getSrc() {
        return src;
    }

    public void setSrc(String src) {
        this.src = src;
    }

    public String getPosition() {
        return position;
    }

    public void setPosition(String position) {
        this.position = position;
    }

    public String getPeriod() {
        return period;
    }

    public void setPeriod(String period) {
        this.period = period;
    }
}
