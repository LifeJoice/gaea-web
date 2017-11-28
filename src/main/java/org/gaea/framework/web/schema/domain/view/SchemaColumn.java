package org.gaea.framework.web.schema.domain.view;

import org.gaea.framework.web.schema.view.domain.SchemaColumnQueryCondition;

import java.util.ArrayList;
import java.util.List;

/**
 * Column支持嵌套。只要把type设置为group即可以分组。（未实现）
 * Created by Iverson on 2015/6/29.
 */
public class SchemaColumn {
    private String id;
    // group
    private String type;
    private String label;
    private String name;
    private String dbColumnName;
    private String htmlName;
    private String htmlId;
    private Boolean visible = true;
    private Boolean sortable = false;
    private String htmlWidth;
    private Boolean primaryKey = false;// 是否主键
    private String dataType;// 数据的类型。暂时主要是SQL查询时，要转换类型去查，例如日期类的，直接用字符串是查不出来的。 by Iverson 2016-6-21
    public static final String DATA_TYPE_STRING = "string";
    public static final String DATA_TYPE_DATE = "date";
    public static final String DATA_TYPE_TIME = "time";
    public static final String DATA_TYPE_DATETIME = "datetime";
    public static final String DATA_TYPE_IMG = "img"; // 这个主要是给前端用的。后端基本没用。
    // yyyy-mm-dd
    private String datetimeFormat;
    private String dataSetId; // 数据集id。一般没有。有的话，会把该列的值按数据集对应的text:value作转换。
    private List<SchemaColumn> columns = new ArrayList<SchemaColumn>();
    // column对应的查询条件定义。非必须存在。grid列表头快捷查询区用。
    private SchemaColumnQueryCondition queryCondition;
    /* 图片列相关 */
    private String imgSrcPrefix; // 图片列，自动为<img>标签的src加上的前缀
    private String imgSrcSuffix; // 图片列，自动为<img>标签的src加上的后缀
    private String imgThumbnailSuffix; // 缩略图后缀。图片列，自动为<img>标签的src加上的后缀作为缩略图。
    /* 空的替换符. 即对于结果为null的，要替换成什么显示。 */
    private String nullTo = null;
    /* 如果这个列是多个值混合的，定义一个分隔符，会按分隔符去分割后，再匹配数据集。 */
    private String multiValueSeparator;

    // 构造方法

    public SchemaColumn() {
    }

    public SchemaColumn(String id, String name, String label, String dbColumnName, Boolean visible, String htmlWidth, String dataType, String dataSetId, String datetimeFormat) {
        this.id = id;
        this.name = name;
        this.label = label;
        this.dbColumnName = dbColumnName;
        this.visible = visible;
        this.htmlWidth = htmlWidth;
        this.dataType = dataType;
        this.datetimeFormat = datetimeFormat;
        this.dataSetId = dataSetId;
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

    public String getLabel() {
        return label;
    }

    public void setLabel(String label) {
        this.label = label;
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

    public Boolean getVisible() {
        return visible;
    }

    public void setVisible(Boolean visible) {
        this.visible = visible;
    }

    public Boolean getSortable() {
        return sortable;
    }

    public void setSortable(Boolean sortable) {
        this.sortable = sortable;
    }

    public String getHtmlWidth() {
        return htmlWidth;
    }

    public void setHtmlWidth(String htmlWidth) {
        this.htmlWidth = htmlWidth;
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

    public SchemaColumnQueryCondition getQueryCondition() {
        return queryCondition;
    }

    public void setQueryCondition(SchemaColumnQueryCondition queryCondition) {
        this.queryCondition = queryCondition;
    }

    public String getImgSrcSuffix() {
        return imgSrcSuffix;
    }

    public void setImgSrcSuffix(String imgSrcSuffix) {
        this.imgSrcSuffix = imgSrcSuffix;
    }

    public String getImgSrcPrefix() {
        return imgSrcPrefix;
    }

    public void setImgSrcPrefix(String imgSrcPrefix) {
        this.imgSrcPrefix = imgSrcPrefix;
    }

    public String getImgThumbnailSuffix() {
        return imgThumbnailSuffix;
    }

    public void setImgThumbnailSuffix(String imgThumbnailSuffix) {
        this.imgThumbnailSuffix = imgThumbnailSuffix;
    }

    public String getNullTo() {
        return nullTo;
    }

    public void setNullTo(String nullTo) {
        this.nullTo = nullTo;
    }

    public String getMultiValueSeparator() {
        return multiValueSeparator;
    }

    public void setMultiValueSeparator(String multiValueSeparator) {
        this.multiValueSeparator = multiValueSeparator;
    }
}
