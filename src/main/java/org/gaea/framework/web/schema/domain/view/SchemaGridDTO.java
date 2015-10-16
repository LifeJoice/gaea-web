package org.gaea.framework.web.schema.domain.view;

import com.fasterxml.jackson.annotation.JsonIgnore;
import org.gaea.framework.web.schema.domain.SchemaGridPage;

import java.util.ArrayList;
import java.util.List;
import java.util.Map;

/**
 * Created by Iverson on 2015/8/15.
 */
public class SchemaGridDTO {
    private String id;
    @JsonIgnore
    private String datasetId;                               // 对应的数据集id。
    @JsonIgnore
    private String dsPrimaryTable;                          // 和grid删除操作（和诸如此类）的操作的1对1的主表。因为一个grid对应dataset，dataset可能是多表关联查询。但如果grid有删除功能，包括primary column，就需要对应到一张表。
    private Boolean withWorkflow = false;
    @JsonIgnore
    private Boolean displayUndefinedColumn = false;         // 如果dataset有的一个字段，但下面没有对应的column元素，是否以json传给页面。
    private String renderTo;                                // grid渲染到页面哪个div中
    private List<SchemaColumnDTO> columns = new ArrayList<SchemaColumnDTO>();
    private List<Map<String,Object>> data;                  // sql查出的grid的数据
    private GridModelDTO model;
    private SchemaGridPage page;                            // 分页信息

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

    public List<SchemaColumnDTO> getColumns() {
        return columns;
    }

    public void setColumns(List<SchemaColumnDTO> columns) {
        this.columns = columns;
    }

    public List<Map<String, Object>> getData() {
        return data;
    }

    public void setData(List<Map<String, Object>> data) {
        this.data = data;
    }

    public GridModelDTO getModel() {
        return model;
    }

    public void setModel(GridModelDTO model) {
        this.model = model;
    }

    public SchemaGridPage getPage() {
        return page;
    }

    public void setPage(SchemaGridPage page) {
        this.page = page;
    }
}
