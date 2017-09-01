package org.gaea.framework.web.common;

/**
 * Created by iverson on 2016/11/24.
 */
public class WebCommonDefinition {
    public static final String COMMON_DATASET_NAME_SEPARATOR = "_";
    // 系统通用导出excel的临时文件放置目录。导出excel的时候，会先把文件生成完放在这个目录，再返回前端。
    public static final String PROP_KEY_EXCEL_BASE_DIR = "system.poi.excel.export.temp_base_dir";
    public static final String PROP_KEY_EXCEL_EXPORT_LIMIT = "system.poi.excel.export.default_limit";
    // 系统默认的事件处理框架。决定消息发去哪里和怎么接收消费。
    public static final String PROP_KEY_SYSTEM_EVENT_FRAMEWORK = "system.event.framework";
    /* ***************************************** DataSet ***************************************** */
    // 数据集在系统启动的时候会初始化到数据库。这个过程，如果有同名的，是以哪边为准。( value: xml | database )
    // 一般是=database。数据库没有就初始化一次，有就不再更新了。因为可能用户在后台管理修改了数据集配置。
    public static final String PROP_KEY_SYSTEM_DATASET_INIT_BASE = "system.dataset.init_base";
    public static final String PROP_VALUE_INIT_BASE_XML = "xml";
    public static final String PROP_VALUE_INIT_BASE_DATABASE = "database";

    /* ***************************************** Xml Schema ***************************************** */
    // 系统启动的时候，初始化并缓存的Xml schema
    public static final String PROP_KEY_SYSTEM_XML_SCHEMA_INIT_PATH = "system.schema.init_path";
    // 缓存登录用户的key
    public static final String PROP_KEY_REDIS_USER_LOGIN = "gaea.login.users";
    // 缓存登录用户的角色列表的key
    public static final String PROP_KEY_REDIS_USER_ROLES = "gaea.login.user.roles";
    // 用户登录超时的key
    public static final String PROP_KEY_REDIS_USER_LOGIN_TIMEOUT = "system.user.login.timeout";
    // 系统当前使用的数据库. 涉及通用查询等用什么数据库的语法。
    public static final String PROP_KEY_SYSTEM_DATABASE = "system.database";
    /* ***************************************** 以下是REDIS的key在.properties的定义 ***************************************** */
    // 缓存的key：schema定义
    public static final String PROP_KEY_REDIS_GAEA_SCHEMA_DEF = "gaea.schema.def";

    /* ***************************************** Exception异常相关 ***************************************** */
    // Gaea通用异常处理HandlerExceptionResolver在Spring框架中的顺序
    public static final String PROP_KEY_EXCEPTION_RESOLVER_ORDER = "system.exception.resolver.order";

    /**
     * =============================================================================================================================================
     *                                                              properties 用户相关
     * =============================================================================================================================================
     */
    // boolean。是否初始化admin账号。取值参考Boolean.parseBoolean, 应该是T、F、Y、N、TRUE、FALSE等都可以
    public static final String PROP_KEY_USER_ADMIN_INIT = "system.user.admin.init";
    public static final String PROP_KEY_USER_ADMIN_USERNAME = "system.user.admin.loginName";
    public static final String PROP_KEY_USER_ADMIN_PASSWORD = "system.user.admin.password";

    /**
     * =============================================================================================================================================
     * 一些约定的变量名定义
     * =============================================================================================================================================
     */

    // ------------------------------ ViewChain 视图的链式操作 ------------------------------
    public static final String PARAM_NAME_VIEW_CHAIN = "viewChain";

    // ------------------------------ 从页面传来的一些通用值、对象的param name ------------------------------
    public static final String PARAM_NAME_SELECTED_ROW = "selectedRow"; // 列表页选择的一行（是最后一次选择）
    public static final String PARAM_NAME_SELECTED_ROWS = "selectedRows"; // 列表页选择的多行

    // 对于需要从Controller层传递条件给到GaeaHtmlView，进行View渲染时处理的传值的param name。
    public static final String PARAM_NAME_QUERY_CONDITIONSETS = "QUERY_CONDITIONSET";
}
