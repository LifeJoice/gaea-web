package org.gaea.data.domain;

import java.util.List;

/**
 * 这个是给页面数据集通用查询用的DTO。
 * Created by iverson on 2016-7-10 14:00:08.
 */
public class DataSetCommonQueryConditionDTO {
    private String id;// 对应XML SCHEMA的<condition-set>的id
    private List<DataSetCommonQueryConditionValueDTO> values;

    public String getId() {
        return id;
    }

    public void setId(String id) {
        this.id = id;
    }

    public List<DataSetCommonQueryConditionValueDTO> getValues() {
        return values;
    }

    public void setValues(List<DataSetCommonQueryConditionValueDTO> values) {
        this.values = values;
    }
}
