package org.gaea.framework.web.schema.convertor;

import org.gaea.exception.InvalidDataException;
import org.gaea.framework.web.schema.XmlSchemaDefinition;
import org.gaea.framework.web.schema.domain.SchemaGridPage;
import org.gaea.framework.web.schema.domain.SchemaViews;
import org.gaea.framework.web.schema.domain.view.*;
import org.apache.commons.lang3.StringUtils;
import org.gaea.util.GaeaXmlUtils;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Component;
import org.w3c.dom.Element;
import org.w3c.dom.Node;
import org.w3c.dom.NodeList;

import java.lang.reflect.InvocationTargetException;
import java.util.Map;

/**
 * 这个是处理Views的主类。具体不同部分（如button等）分发到各自的具体convertor去处理。
 * Created by Iverson on 2015/6/22.
 */
@Component
public class XmlViewsConvertor implements SchemaConvertor<SchemaViews> {
    @Autowired
    private XmlGridViewSchemaConvertor urXmlGridViewSchemaConvertor;
    @Autowired
    private XmlDialogViewSchemaConvertor dialogViewSchemaConvertor;
    @Autowired
    private XmlActionViewSchemaConvertor actionViewSchemaConvertor;

    public SchemaViews convert(Node xmlViewsNode) throws InvocationTargetException, IllegalAccessException, InvalidDataException {
        NodeList nodes = xmlViewsNode.getChildNodes();
        SchemaViews schemaViews = new SchemaViews();
        schemaViews = GaeaXmlUtils.copyAttributesToBean(xmlViewsNode, schemaViews, SchemaViews.class);
        for (int i = 0; i < nodes.getLength(); i++) {
            Node viewNodes = nodes.item(i);
            // xml解析会把各种换行符等解析成元素。统统跳过。
            if (!(viewNodes instanceof Element)) {
                continue;
            }
            if (XmlSchemaDefinition.GRID_NAME.equals(viewNodes.getNodeName())) {
                SchemaGrid grid = urXmlGridViewSchemaConvertor.convert(viewNodes);
                schemaViews.setGrid(grid);
                // grid转为gridDTO
                SchemaGridDTO gridDTO = urXmlGridViewSchemaConvertor.convert(grid);
                // 初始化分页
                int pageSize = StringUtils.isNumeric(grid.getPageSize()) ? Integer.parseInt(grid.getPageSize()) : 0;
                gridDTO.setPage(new SchemaGridPage(1, pageSize));
                schemaViews.setGridDTO(gridDTO);
            }
            /**
             * 如果是普通弹框、工作流组件的弹框、上传组件的弹框、增删改弹框，则作为弹框解析。
             */
            else if (XmlSchemaDefinition.DIALOG_NAME.equals(viewNodes.getNodeName())
                    || XmlSchemaDefinition.WF_DIALOG_NAME.equals(viewNodes.getNodeName())
                    || XmlSchemaDefinition.UPLOADER_DIALOG_NAME.equals(viewNodes.getNodeName())
                    || XmlSchemaDefinition.CRUD_DIALOG_NAME.equals(viewNodes.getNodeName())) {
                SchemaDialog dialog = dialogViewSchemaConvertor.convert(viewNodes);
                schemaViews.getDialogs().add(dialog);
            } else if (XmlSchemaDefinition.ACTIONS_NAME.equals(viewNodes.getNodeName())) {
                SchemaActions actions = actionViewSchemaConvertor.convert(viewNodes);
                schemaViews.setActions(actions);
            } else if (XmlSchemaDefinition.IMPORT_JAVASCRIPT_NAME.equals(viewNodes.getNodeName()) ||
                    XmlSchemaDefinition.IMPORT_CSS_NAME.equals(viewNodes.getNodeName())) {
                convertImports(schemaViews, viewNodes);
            }
        }
        return schemaViews;
    }

    // 转换XML中的import元素。
    private void convertImports(SchemaViews schemaViews, Node viewNode) {
        Map<String, String> attributes = GaeaXmlUtils.getAttributes(viewNode);
        if (XmlSchemaDefinition.IMPORT_JAVASCRIPT_NAME.equals(viewNode.getNodeName())) {
            String position = attributes.get("position");
            if ("headfirst".equals(position)) {
                if (!StringUtils.isBlank(attributes.get("src"))) {
                    schemaViews.getImports().addheadFirstJsImport(attributes.get("src"));
                }
            } else if ("bodyend".equals(position)) {
                if (!StringUtils.isBlank(attributes.get("src"))) {
                    schemaViews.getImports().addbodyendJsImport(attributes.get("src"));
                }
            } else {      // 其他无论是为空还是设置headlast,都按headlast处理
                if (!StringUtils.isBlank(attributes.get("src"))) {
                    schemaViews.getImports().addheadLastJsImport(attributes.get("src"));
                }
            }
        } else if (XmlSchemaDefinition.IMPORT_CSS_NAME.equals(viewNode.getNodeName())) {
            if (!StringUtils.isBlank(attributes.get("src"))) {
                schemaViews.getImports().addCssImport(attributes.get("src"));
            }
        }
    }
}
