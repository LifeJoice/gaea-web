package org.gaea.framework.web.schema.view.jo;

import com.fasterxml.jackson.annotation.JsonIgnore;
import org.gaea.framework.web.schema.domain.view.SchemaColumn;

import java.io.Serializable;
import java.util.ArrayList;
import java.util.List;

/**
 * Created by Iverson on 2015/8/15.
 */
public class SchemaColumnJO implements Serializable {
    private String id;
    // group
    private String type;
    private String text;                            // 对应label
    private String name;
    @JsonIgnore
    private String dbColumnName;
    @JsonIgnore
    private String htmlName;
    @JsonIgnore
    private String htmlId;
    private Boolean hidden = true;                  // 和visible相反
    private Boolean sortable = false;
    private boolean editable = false;               // 是否可编辑
    private String width;                           // 对应htmlWidth
    private Boolean primaryKey = false;             // 是否主键
    private String dataType;
    // yyyy-mm-dd
    private String datetimeFormat = "";
    // 数据集id。一般没有。有的话，会把该列的值按数据集对应的text:value作转换。
    private String dataSetId;
    @JsonIgnore
    private List<SchemaColumn> columns = new ArrayList<SchemaColumn>();
    // column对应的查询条件定义。非必须存在。grid列表头快捷查询区用。
    private ColumnQueryConditionJO queryCondition;
    private String value;

    /* 图片列相关 */
    private String imgSrcPrefix; // 图片列，自动为<img>标签的src加上的前缀
    private String imgSrcSuffix; // 图片列，自动为<img>标签的src加上的后缀
    private String imgThumbnailSuffix; // 缩略图后缀。图片列，自动为<img>标签的src加上的后缀作为缩略图。

    // 构造方法

    public SchemaColumnJO() {
    }

    public SchemaColumnJO(String id, String name, String text, String dbColumnName, Boolean hidden, String width, String dataType) {
        this.id = id;
        this.name = name;
        this.text = text;
        this.dbColumnName = dbColumnName;
        this.hidden = hidden;
        this.width = width;
        this.dataType = dataType;
    }

    public String getId() {
        return id;
    }

    public void setId(String id) {
        this.id = id;
    }

    public String getType() {
        return type;
    }

    public void setType(String type) {
        this.type = type;
    }

    public String getText() {
        return text;
    }

    public void setText(String text) {
        this.text = text;
    }

    public String getName() {
        return name;
    }

    public void setName(String name) {
        this.name = name;
    }

    public String getDbColumnName() {
        return dbColumnName;
    }

    public void setDbColumnName(String dbColumnName) {
        this.dbColumnName = dbColumnName;
    }

    public String getHtmlName() {
        return htmlName;
    }

    public void setHtmlName(String htmlName) {
        this.htmlName = htmlName;
    }

    public String getHtmlId() {
        return htmlId;
    }

    public void setHtmlId(String htmlId) {
        this.htmlId = htmlId;
    }

    public Boolean getHidden() {
        return hidden;
    }

    public void setHidden(Boolean hidden) {
        this.hidden = hidden;
    }

    public Boolean getSortable() {
        return sortable;
    }

    public void setSortable(Boolean sortable) {
        this.sortable = sortable;
    }

    public String getWidth() {
        return width;
    }

    public void setWidth(String width) {
        this.width = width;
    }

    public Boolean getPrimaryKey() {
        return primaryKey;
    }

    public void setPrimaryKey(Boolean primaryKey) {
        this.primaryKey = primaryKey;
    }

    public String getDataType() {
        return dataType;
    }

    public void setDataType(String dataType) {
        this.dataType = dataType;
    }

    public String getDatetimeFormat() {
        return datetimeFormat;
    }

    public void setDatetimeFormat(String datetimeFormat) {
        this.datetimeFormat = datetimeFormat;
    }

    public String getDataSetId() {
        return dataSetId;
    }

    public void setDataSetId(String dataSetId) {
        this.dataSetId = dataSetId;
    }

    public List<SchemaColumn> getColumns() {
        return columns;
    }

    public void setColumns(List<SchemaColumn> columns) {
        this.columns = columns;
    }

    public ColumnQueryConditionJO getQueryCondition() {
        return queryCondition;
    }

    public void setQueryCondition(ColumnQueryConditionJO queryCondition) {
        this.queryCondition = queryCondition;
    }

    public boolean isEditable() {
        return editable;
    }

    public void setEditable(boolean editable) {
        this.editable = editable;
    }

    public String getValue() {
        return value;
    }

    public void setValue(String value) {
        this.value = value;
    }

    public String getImgSrcPrefix() {
        return imgSrcPrefix;
    }

    public void setImgSrcPrefix(String imgSrcPrefix) {
        this.imgSrcPrefix = imgSrcPrefix;
    }

    public String getImgSrcSuffix() {
        return imgSrcSuffix;
    }

    public void setImgSrcSuffix(String imgSrcSuffix) {
        this.imgSrcSuffix = imgSrcSuffix;
    }

    public String getImgThumbnailSuffix() {
        return imgThumbnailSuffix;
    }

    public void setImgThumbnailSuffix(String imgThumbnailSuffix) {
        this.imgThumbnailSuffix = imgThumbnailSuffix;
    }
}
