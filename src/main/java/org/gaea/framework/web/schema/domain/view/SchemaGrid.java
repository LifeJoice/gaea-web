package org.gaea.framework.web.schema.domain.view;

import com.fasterxml.jackson.annotation.JsonIgnore;
import org.apache.commons.lang3.StringUtils;

import java.util.ArrayList;
import java.util.List;

/**
 * Created by Iverson on 2015/6/29.
 */
public class SchemaGrid {
    private String id;
    private String datasetId;                               // 对应的数据集id。
    @JsonIgnore
    private String dsPrimaryTable;                          // 和grid删除操作（和诸如此类）的操作的1对1的主表。因为一个grid对应dataset，dataset可能是多表关联查询。但如果grid有删除功能，包括primary column，就需要对应到一张表。
    private List<SchemaColumn> columns = new ArrayList<SchemaColumn>();
    private Boolean withWorkflow = false;
    private Boolean displayUndefinedColumn = false;         // 如果dataset有的一个字段，但下面没有对应的column元素，是否以json传给页面。
    //    private Map<String, Object> jsonData;
    private String renderTo;                                // grid渲染到页面哪个div中
    private String pageSize;                                // 每页显示多少条记录

    public String getId() {
        return id;
    }

    public void setId(String id) {
        this.id = id;
    }

    public String getDatasetId() {
        return datasetId;
    }

    public void setDatasetId(String datasetId) {
        this.datasetId = datasetId;
    }

    public String getDsPrimaryTable() {
        return dsPrimaryTable;
    }

    public void setDsPrimaryTable(String dsPrimaryTable) {
        this.dsPrimaryTable = dsPrimaryTable;
    }

    public List<SchemaColumn> getColumns() {
        return columns;
    }

    public void setColumns(List<SchemaColumn> columns) {
        this.columns = columns;
    }

    public Boolean getWithWorkflow() {
        return withWorkflow;
    }

    public void setWithWorkflow(Boolean withWorkflow) {
        this.withWorkflow = withWorkflow;
    }

    public Boolean getDisplayUndefinedColumn() {
        return displayUndefinedColumn;
    }

    public void setDisplayUndefinedColumn(Boolean displayUndefinedColumn) {
        this.displayUndefinedColumn = displayUndefinedColumn;
    }

    public String getRenderTo() {
        return renderTo;
    }

    public void setRenderTo(String renderTo) {
        this.renderTo = renderTo;
    }

    /**
     * 如果jsonData为空，转换生成jsonData；否则直接返回该对象。<p/>
     * <b>这个方法直接使用已转换过的jsonData对象（类似缓存），会存在数据过期的问题。使用时要注意。</b>
     *
     * @return
     */
//    public Map<String, Object> getJsonData() throws IOException {
//        if (this.jsonData == null) {
//            jsonData = convertToJson(this);
//        }
//        return jsonData;
//    }
//
//    public void setJsonData(Map<String, Object> jsonData) {
//        this.jsonData = jsonData;
//    }

    /**
     * 本方法每次都会使用当前数据转换成jsonData再返回。数据不会过期。但性能可能会有所影响。
     *
     * @return
     */
//    public Map<String, Object> toJson() throws IOException {
//        jsonData = convertToJson(this);
//        return getJsonData();
//    }

//    private Map<String, Object> convertToJson(SchemaGrid schemaGrid) throws IOException {
//        Map<String, Object> resultMap = new HashMap<String, Object>();
//        List<SchemaColumn> columns = schemaGrid.getColumns();
////        ObjectMapper objectMapper = new ObjectMapper();
////        StringWriter fieldsWriter = new StringWriter();
////        try {
////            JsonGenerator fieldsGenerator = objectMapper.getFactory().createGenerator(fieldsWriter);
//            Map<String, Object> modelMap = new HashMap<String, Object>();
//            List<Map> fieldsList = new ArrayList<Map>();
//            List<Map> columnsList = new ArrayList<Map>();
//            for (SchemaColumn column : columns) {
//                Map<String, Object> fieldsMap = new HashMap<String, Object>();
//                Map<String, Object> columnsMap = new HashMap<String, Object>();
//                if (column.getPrimaryKey()) {
//                    modelMap.put("idProperty", column.getHtmlId());
//                }
//                fieldsMap.put("id", column.getHtmlId());
//                if (!StringUtils.isBlank(column.getHtmlId())) {
//                    columnsMap.put("id", column.getHtmlId());
//                }
//                columnsMap.put("text", column.getLabel());
//                columnsMap.put("width", column.getHtmlWidth());
//                columnsMap.put("hidden", !column.getVisible());
//                fieldsList.add(fieldsMap);
//                columnsList.add(columnsMap);
//            }
//            modelMap.put("fields", fieldsList);
//            resultMap.put("model", modelMap);
//            resultMap.put("columns", columnsList);
////            fieldsGenerator.writeObject(resultMap);
////        } catch (IOException e) {
////            e.printStackTrace();
////        }
//        return resultMap;
//    }

//    public Integer getPageSize() {
//        if(StringUtils.isNumeric(pageSize)){
//            return Integer.parseInt(pageSize);
//        }
//        return 0;
//    }

    public String getPageSize() {
        return pageSize;
    }
    public void setPageSize(String pageSize) {
        this.pageSize = pageSize;
    }
}
