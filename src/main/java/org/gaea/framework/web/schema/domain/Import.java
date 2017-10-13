package org.gaea.framework.web.schema.domain;

import java.io.Serializable;

/**
 * 因为不能放在SchemaImport作为内部类使用（Jackson序列化不了），所以独立出来。
 * Created by iverson on 2017/10/13.
 */
public class Import implements Serializable {
    private String src;

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
}
