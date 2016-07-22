package org.gaea.data.domain;

/**
 * 这个是给页面数据集通用查询用的DTO。
 * Created by iverson on 2016-7-10 14:00:08.
 */
public class DataSetCommonQueryConditionValueDTO {
    private String type;
    private String value;

    public String getType() {
        return type;
    }

    public void setType(String type) {
        this.type = type;
    }

    public String getValue() {
        return value;
    }

    public void setValue(String value) {
        this.value = value;
    }
}
