package org.gaea.framework.web.schema.convertor;

import org.gaea.framework.web.schema.domain.view.SchemaButton;
import org.gaea.framework.web.schema.domain.view.SchemaDialog;
import org.apache.commons.lang3.StringUtils;
import org.gaea.util.GaeaXmlUtils;
import org.springframework.stereotype.Component;
import org.w3c.dom.Element;
import org.w3c.dom.Node;
import org.w3c.dom.NodeList;

import java.lang.reflect.InvocationTargetException;

/**
 * Created by Iverson on 2015/7/6.
 */
@Component
public class XmlDialogViewSchemaConvertor implements SchemaConvertor<SchemaDialog> {
    @Override
    public SchemaDialog convert(Node node) throws InvocationTargetException, IllegalAccessException {
        SchemaDialog schemaDialog = new SchemaDialog();
        schemaDialog.setViewName(node.getNodeName());
        schemaDialog = GaeaXmlUtils.copyAttributesToBean(node, schemaDialog, SchemaDialog.class);
        NodeList nodes = node.getChildNodes();
        for (int i = 0; i < nodes.getLength(); i++) {
            Node viewNode = nodes.item(i);
            // xml解析会把各种换行符等解析成元素。统统跳过。
            if(!(viewNode instanceof Element)){
                continue;
            }
            if("button".equals(viewNode.getNodeName())){
                SchemaButton button = covertToButton(viewNode);
                schemaDialog.getButtons().add(button);
            }
        }
        return schemaDialog;
    }

    private SchemaButton covertToButton(Node node) throws InvocationTargetException, IllegalAccessException {
        SchemaButton button = new SchemaButton();
        button = GaeaXmlUtils.copyAttributesToBean(node, button, SchemaButton.class);
        // 如果column.name有值，而htmlId为空，则默认使用column.name作为htmlId
        if(StringUtils.isBlank(button.getHtmlId()) && !StringUtils.isBlank(button.getName())){
            button.setHtmlId(button.getName());
        }
        // 如果column.name有值，而htmlName为空，则默认使用column.name作为htmlName
        if(StringUtils.isBlank(button.getHtmlName()) && !StringUtils.isBlank(button.getName())){
            button.setHtmlName(button.getName());
        }
        return button;
    }
}
