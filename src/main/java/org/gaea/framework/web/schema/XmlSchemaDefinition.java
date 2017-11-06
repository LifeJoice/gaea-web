package org.gaea.framework.web.schema;

/**
 * 这是一个对XML SCHEMA中元素名的定义类。
 * <p><b>应该全部为public的静态方法或变量。</b></p>
 * 不要在这里放任何逻辑处理或和XML定义无关的。
 * <p/>为什么是class而不是接口？因为想在这里定义一些静态方法，例如getXXX之类的。可以做些静态转换逻辑（不包含复杂业务的）。
 * Created by Iverson on 2015/7/30.
 */
public class XmlSchemaDefinition {
    public static String ROOT_NODE = "ur-schema";
    public static String DATA_NAME = "data";
    public static String VIEWS_NAME = "views";
    /**
     * 这个，应该和上面的VIEWS_NAME等价。只是当前重构没彻底，所以，XML里面大的元素叫views，其中嵌套的叫view。
     * AI.TODO 后面重构，把views重构为view吧。现在代码都只用SchemaViews一个对象表示。所以代码改变没那么大。
     */
    public static String VIEW_NAME = "view";
    public static String GRID_NAME = "grid";
    public static String DIALOG_NAME = "dialog";
    public static String CRUD_DIALOG_NAME = "crud-dialog";// 增删改弹出框
    public static String WF_DIALOG_NAME = "wf-dialog";// 工作流组件的弹出框
    public static String UPLOADER_DIALOG_NAME = "uploader-dialog";// 上传组件的弹出框
    public static String ACTIONS_NAME = "actions";
    public static String IMPORT_JAVASCRIPT_NAME = "import-javascript";
    public static String IMPORT_CSS_NAME = "import-css";
    public static String PARAM_NAME = "param"; // 参数的元素名。现在主要用在"button-action"里面。以后可能也能扩展到用到其他元素中。
    /* *************************************************** DATA *************************************************** */
    public static String DATA_DATASET_NAME = "dataset";
    /* *************************************************** GRID *************************************************** */
    public static String GRID_COLUMN_NAME = "column";
    public static String GRID_COLUMN_QUERY_COND_NAME = "query-condition";
    /**
     * ********************************************************************************************************************************************************
     * ACTION/BUTTON/BUTTON GROUP
     * ********************************************************************************************************************************************************
     */
    public static String ACTION_BUTTON_NAME = "button";
    public static String ACTION_BUTTON_GROUP_NAME = "button-group";
    public static String BUTTON_ACTION_NAME = "button-action"; // "button"的子元素。
    public static String BUTTON_VALIDATORS_NAME = "validators"; // 校验规则的容器元素
    public static String BUTTON_ACTION_VALIDATOR_NAME = "action-validator"; // 不同操作校验
    public static String BUTTON_CONFIRM_VALIDATOR_NAME = "confirm-validator"; // 确认操作校验器
    /**
     * ********************************************************************************************************************************************************
     * JavaScript/Css
     * ********************************************************************************************************************************************************
     */
    public static String IMPORT_JS_PERIOD_DOM_LAST = "dom-last"; // 页面完成后，才加载的js
}
