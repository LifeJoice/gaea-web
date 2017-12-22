package org.gaea.framework.web.schema.convertor;

import org.apache.commons.collections.CollectionUtils;
import org.apache.commons.lang3.StringUtils;
import org.gaea.exception.InvalidDataException;
import org.gaea.framework.web.schema.Action;
import org.gaea.framework.web.schema.SchemaActionDefinition;
import org.gaea.framework.web.schema.XmlSchemaDefinition;
import org.gaea.framework.web.schema.domain.view.SchemaActions;
import org.gaea.framework.web.schema.domain.view.SchemaButton;
import org.gaea.framework.web.schema.domain.view.SchemaButtonGroup;
import org.gaea.framework.web.schema.view.action.ActionParam;
import org.gaea.framework.web.schema.view.action.ExcelExportButtonAction;
import org.gaea.framework.web.schema.view.action.SimpleButtonAction;
import org.gaea.util.GaeaXmlUtils;
import org.springframework.stereotype.Component;
import org.w3c.dom.Element;
import org.w3c.dom.Node;
import org.w3c.dom.NodeList;

import java.lang.reflect.InvocationTargetException;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

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
        // 遍历"button-action"
        NodeList nodes = node.getChildNodes();
        for (int i = 0; i < nodes.getLength(); i++) {
            Node viewNode = nodes.item(i);
            // xml解析会把各种换行符等解析成元素。统统跳过。
            if (!(viewNode instanceof Element)) {
                continue;
            }
            // TODO 这里有问题。为什么不管三七二十一都转为ExcelExportButtonAction类型？？
            if (XmlSchemaDefinition.BUTTON_ACTION_NAME.equals(viewNode.getNodeName())) {
                if (CollectionUtils.isEmpty(button.getActions())) {
                    button.setActions(new ArrayList<ExcelExportButtonAction>());
                }
                // 解析< button >
                Action buttonAction = parseButtonAction(viewNode);
                button.getActions().add(buttonAction);
            } else if (XmlSchemaDefinition.BUTTON_VALIDATORS_NAME.equals(viewNode.getNodeName())) {
                /**
                 * 解析button的validators
                 */
                List<Map<String, String>> validators = parseValidators(viewNode);
                button.setValidators(validators);
            }
        }
        return button;
    }

    private List<Map<String, String>> parseValidators(Node node) throws InvalidDataException {
        List<Map<String, String>> validatorList = new ArrayList<Map<String, String>>();

        // 遍历 {@code <validators>}
        NodeList nodes = node.getChildNodes();
        for (int i = 0; i < nodes.getLength(); i++) {
            Node validatorNode = nodes.item(i);
            // xml解析会把各种换行符等解析成元素。统统跳过。
            if (!(validatorNode instanceof Element)) {
                continue;
            }
            if (XmlSchemaDefinition.BUTTON_ACTION_VALIDATOR_NAME.equals(validatorNode.getNodeName()) ||
                    XmlSchemaDefinition.BUTTON_CONFIRM_VALIDATOR_NAME.equals(validatorNode.getNodeName())) {
                // 解析< button >
                Map<String, String> paramMap = parseValidator(validatorNode);
                validatorList.add(paramMap);
            }
        }
        return validatorList;
    }

    private Map<String, String> parseValidator(Node node) throws InvalidDataException {
        Map<String, String> paramMap = GaeaXmlUtils.getAttributes(node);
        paramMap.put("type", node.getNodeName());
        return paramMap;
    }

    /**
     * 先获取{@code <button-action>}的method属性。根据属性判断生成不同的action.
     *
     * @param inNode
     * @return Action的某实现。根据method判断，可能是ExcelExportButtonAction，也可能是SimpleButtonAction等。
     * @throws InvalidDataException
     */
    private Action parseButtonAction(Node inNode) throws InvalidDataException {
        // 获取node的属性列表
        Map<String, String> attributes = GaeaXmlUtils.getAttributes(inNode);
        String method = attributes.get("method");
        Action result = null;
        if (SchemaActionDefinition.METHOD_EXCEL_EXPORT_BY_TEMPLATE.equalsIgnoreCase(method)) {
            ExcelExportButtonAction excelAction = new ExcelExportButtonAction();
            excelAction = GaeaXmlUtils.copyAttributesToBean(inNode, excelAction, ExcelExportButtonAction.class);
            excelAction.setActionParamMap(new HashMap<String, ActionParam>());
            parseParamList(inNode, excelAction);
            result = excelAction;
        } else if (SchemaActionDefinition.METHOD_SUBMIT.equalsIgnoreCase(method)) {
            SimpleButtonAction simpleAction = new SimpleButtonAction();
            simpleAction = GaeaXmlUtils.copyAttributesToBean(inNode, simpleAction, SimpleButtonAction.class);
            simpleAction.setActionParamMap(new HashMap<String, ActionParam>());
            parseParamList(inNode, simpleAction);
            result = simpleAction;
        }
        return result;
    }

    /**
     * 解析{@code <button-action>}下面的所有{@code <param>}.
     * 这个方法可以给多种Action通用。
     *
     * @param inNode
     * @param action
     * @throws InvalidDataException
     */
    private void parseParamList(Node inNode, Action action) throws InvalidDataException {
        NodeList nodes = inNode.getChildNodes();
        for (int i = 0; i < nodes.getLength(); i++) {
            Node node = nodes.item(i);
            // xml解析会把各种换行符等解析成元素。统统跳过。
            if (!(node instanceof Element)) {
                continue;
            }
            if (XmlSchemaDefinition.PARAM_NAME.equals(node.getNodeName())) {
                ActionParam param = parseParam(node);
                action.getActionParamMap().put(param.getName(), param); // Map< param.name , param obj >
            }
        }
    }

    private ActionParam parseParam(Node inNode) throws InvalidDataException {
        ActionParam actionParam = new ActionParam();
        actionParam = GaeaXmlUtils.copyAttributesToBean(inNode, actionParam, ActionParam.class);
        return actionParam;
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
