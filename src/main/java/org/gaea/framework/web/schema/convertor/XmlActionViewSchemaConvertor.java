package org.gaea.framework.web.schema.convertor;

import org.apache.commons.lang3.StringUtils;
import org.gaea.exception.InvalidDataException;
import org.gaea.framework.web.schema.XmlSchemaDefinition;
import org.gaea.framework.web.schema.domain.view.SchemaActions;
import org.gaea.framework.web.schema.domain.view.SchemaButton;
import org.gaea.framework.web.schema.domain.view.SchemaButtonGroup;
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
public class XmlActionViewSchemaConvertor implements SchemaConvertor<SchemaActions> {
    @Override
    public SchemaActions convert(Node node) throws InvocationTargetException, IllegalAccessException, InvalidDataException {
        SchemaActions schemaActions = new SchemaActions();
        schemaActions = GaeaXmlUtils.copyAttributesToBean(node, schemaActions, SchemaActions.class);
        NodeList nodes = node.getChildNodes();
        for (int i = 0; i < nodes.getLength(); i++) {
            Node viewNode = nodes.item(i);
            // xml解析会把各种换行符等解析成元素。统统跳过。
            if (!(viewNode instanceof Element)) {
                continue;
            }
            if (XmlSchemaDefinition.ACTION_BUTTON_NAME.equals(viewNode.getNodeName())) {
                // 解析< button >
                SchemaButton button = convertToButton(viewNode);
                schemaActions.getButtons().add(button);
            } else if (XmlSchemaDefinition.ACTION_BUTTON_GROUP_NAME.equals(viewNode.getNodeName())) {
                // 解析< button-group >
                SchemaButtonGroup buttonGroup = convertToButtonGroup(viewNode);
                schemaActions.getButtons().add(buttonGroup);
            }
        }
        return schemaActions;
    }

    private SchemaButton convertToButton(Node node) throws InvocationTargetException, IllegalAccessException, InvalidDataException {
        SchemaButton button = new SchemaButton();
        button.setComponentName(node.getNodeName());
        button = GaeaXmlUtils.copyAttributesToBean(node, button, SchemaButton.class);
        // 如果column.name有值，而htmlId为空，则默认使用column.name作为htmlId
        if (StringUtils.isBlank(button.getHtmlId()) && !StringUtils.isBlank(button.getName())) {
            button.setHtmlId(button.getName());
        }
        // 如果column.name有值，而htmlName为空，则默认使用column.name作为htmlName
        if (StringUtils.isBlank(button.getHtmlName()) && !StringUtils.isBlank(button.getName())) {
            button.setHtmlName(button.getName());
        }
        return button;
    }

    /**
     * 解析XML的按钮组部分。
     *
     * @param node
     * @return
     * @throws InvocationTargetException
     * @throws IllegalAccessException
     * @throws InvalidDataException
     */
    private SchemaButtonGroup convertToButtonGroup(Node node) throws InvocationTargetException, IllegalAccessException, InvalidDataException {
        SchemaButtonGroup buttonGroup = new SchemaButtonGroup();
        buttonGroup.setComponentName(node.getNodeName());
        buttonGroup = GaeaXmlUtils.copyAttributesToBean(node, buttonGroup, SchemaButtonGroup.class);
        NodeList nodes = node.getChildNodes();// < button >
        for (int i = 0; i < nodes.getLength(); i++) {
            Node viewNode = nodes.item(i);
            // xml解析会把各种换行符等解析成元素。统统跳过。
            if (!(viewNode instanceof Element)) {
                continue;
            }
            if (XmlSchemaDefinition.ACTION_BUTTON_NAME.equals(viewNode.getNodeName())) {
                // 解析< button >
                SchemaButton button = convertToButton(viewNode);
                buttonGroup.getButtons().add(button);
            }
        }
        return buttonGroup;
    }
}
