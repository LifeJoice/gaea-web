package org.gaea.data.domain;

/**
 * 这个是给页面数据集通用查询用的DTO。
 * Created by iverson on 2016-7-10 14:00:08.
 *
 * 重构名称DataSetCommonQueryConditionValueDTO -> QueryValue，太长了。
 * Refactor by Iverson 2017年8月5日16:44:46
 */
public class QueryValue {
    private String type;
    private String name;
    private String value;

    public String getType() {
        return type;
    }

    public void setType(String type) {
        this.type = type;
    }

    public String getName() {
        return name;
    }

    public void setName(String name) {
        this.name = name;
    }

    public String getValue() {
        return value;
    }

    public void setValue(String value) {
        this.value = value;
    }
}
