package org.gaea.framework.web.common;

/**
 * Created by iverson on 2016/11/24.
 */
public class CommonDefinition {
    public static final String COMMON_DATASET_NAME_SEPARATOR = "_";
    // 系统通用导出excel的临时文件放置目录。导出excel的时候，会先把文件生成完放在这个目录，再返回前端。
    public static final String PROP_KEY_EXCEL_BASE_DIR = "system.poi.excel.export.temp_base_dir";
    public static final String PROP_KEY_EXCEL_EXPORT_LIMIT = "system.poi.excel.export.default_limit";
    // 系统默认的事件处理框架。决定消息发去哪里和怎么接收消费。
    public static final String PROP_KEY_SYSTEM_EVENT_FRAMEWORK = "system.event.framework";
    // DATA SET
    // 数据集在系统启动的时候会初始化到数据库。这个过程，如果有同名的，是以哪边为准。( value: xml | database )
    // 一般是=database。数据库没有就初始化一次，有就不再更新了。因为可能用户在后台管理修改了数据集配置。
    public static final String PROP_KEY_SYSTEM_DATASET_INIT_BASE = "system.dataset.init_base";
    public static final String PROP_VALUE_INIT_BASE_XML = "xml";
    public static final String PROP_VALUE_INIT_BASE_DATABASE = "database";

    public static final String PROP_KEY_REDIS_USER_LOGIN = "gaea.login.users";
    // 缓存登录用户的角色列表的key
    public static final String PROP_KEY_REDIS_USER_ROLES = "gaea.login.user.roles";
    // 用户登录超时的key
    public static final String PROP_KEY_REDIS_USER_LOGIN_TIMEOUT = "system.user.login.timeout";
    // 系统当前使用的数据库. 涉及通用查询等用什么数据库的语法。
    public static final String PROP_KEY_SYSTEM_DATABASE = "system.database";
}
