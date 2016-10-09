package org.gaea.framework.web.schema.convertor;

import org.gaea.exception.InvalidDataException;
import org.gaea.framework.web.schema.XmlSchemaDefinition;
import org.gaea.framework.web.schema.domain.view.*;
import org.apache.commons.beanutils.BeanUtils;
import org.apache.commons.lang3.StringUtils;
import org.gaea.framework.web.view.jo.SchemaColumnJO;
import org.gaea.framework.web.view.jo.SchemaGridJO;
import org.gaea.util.GaeaXmlUtils;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Component;
import org.w3c.dom.Element;
import org.w3c.dom.Node;
import org.w3c.dom.NodeList;

import java.lang.reflect.InvocationTargetException;
import java.util.ArrayList;

/**
 * Created by Iverson on 2015/6/22.
 */
@Component
public class XmlGridViewSchemaConvertor implements SchemaConvertor<SchemaGrid> {
    private final Logger logger = LoggerFactory.getLogger(getClass());

    public SchemaGrid convert(Node gridViewNode) throws InvocationTargetException, IllegalAccessException, InvalidDataException {
        SchemaGrid grid = new SchemaGrid();
        grid = GaeaXmlUtils.copyAttributesToBean(gridViewNode, grid, SchemaGrid.class);
        NodeList nodes = gridViewNode.getChildNodes();
        for (int i = 0; i < nodes.getLength(); i++) {
            Node viewNode = nodes.item(i);
            // xml解析会把各种换行符等解析成元素。统统跳过。
            if (!(viewNode instanceof Element)) {
                continue;
            }
            if (XmlSchemaDefinition.GRID_COLUMN_NAME.equals(viewNode.getNodeName())) {
                SchemaColumn column = covertToColumn(viewNode);
                grid.getColumns().add(column);
            }
        }
        // 处理工作流相关的特殊column。如果with-workflow="true"自动加上。
        if (grid.getWithWorkflow()) {
            // 流程实例ID
            SchemaColumn wfProcInstIdColumn = new SchemaColumn("wfProcInstId", "wfProcInstId", "流程实例Id", "WF_PROC_INST_ID", false, "100", "String");
            // 当前流程节点名
            SchemaColumn wfActNameColumn = new SchemaColumn("wfActName", "wfActName", "当前节点", "WF_ACT_NAME", false, "100", "String");
            grid.getColumns().add(wfProcInstIdColumn);
            grid.getColumns().add(wfActNameColumn);
        }
        return grid;
    }

    /**
     * 把Grid转换为GridDTO。方便前端处理。
     *
     * @param origGrid
     * @return
     * @throws InvocationTargetException
     * @throws IllegalAccessException
     */
    public SchemaGridJO convert(SchemaGrid origGrid) throws InvocationTargetException, IllegalAccessException {
        SchemaGridJO gridDTO = new SchemaGridJO();
        GridModelDTO model = new GridModelDTO();
        // 复制DTO属性
        BeanUtils.copyProperties(gridDTO, origGrid);
        gridDTO.setColumns(new ArrayList<SchemaColumnJO>());
        for (int i = 0; i < origGrid.getColumns().size(); i++) {
//        for (SchemaColumn column:origGrid.getColumns()){
            SchemaColumn column = origGrid.getColumns().get(i);
            SchemaColumnJO columnDTO = new SchemaColumnJO();
            // 复制column属性
            BeanUtils.copyProperties(columnDTO, column);
            // 转换DTO里的别名字段等
            columnDTO.setText(column.getLabel());       // label即text
            columnDTO.setWidth(column.getHtmlWidth());  // htmlWidth即width
            columnDTO.setHidden(!column.getVisible());  // hidden和visible相反
            // 生成dto.model
            if (column.getPrimaryKey()) {
                model.setIdProperty(column.getHtmlId());    // 主键字段即model.idProperty
            }
            model.getFields().add(new GridModelFieldDTO(column.getHtmlId()));
            gridDTO.getColumns().add(columnDTO);
        }
        gridDTO.setModel(model);
        return gridDTO;
    }

    private SchemaColumn covertToColumn(Node columnNode) throws InvocationTargetException, IllegalAccessException, InvalidDataException {
        SchemaColumn column = new SchemaColumn();
        column = GaeaXmlUtils.copyAttributesToBean(columnNode, column, SchemaColumn.class);
        // 如果column.name有值，而htmlId为空，则默认使用column.name作为htmlId
        if (StringUtils.isBlank(column.getHtmlId()) && !StringUtils.isBlank(column.getName())) {
            column.setHtmlId(column.getName());
        }
        // 如果column.name有值，而htmlName为空，则默认使用column.name作为htmlName
        if (StringUtils.isBlank(column.getHtmlName()) && !StringUtils.isBlank(column.getName())) {
            column.setHtmlName(column.getName());
        }
        return column;
    }
}
