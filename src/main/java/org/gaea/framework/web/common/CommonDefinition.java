package org.gaea.framework.web.common;

/**
 * Created by iverson on 2016/11/24.
 */
public class CommonDefinition {
    // 系统通用导出excel的临时文件放置目录。导出excel的时候，会先把文件生成完放在这个目录，再返回前端。
    public static final String PROP_KEY_EXCEL_BASE_DIR = "system.poi.excel.export.temp_base_dir";
    public static final String PROP_KEY_EXCEL_EXPORT_LIMIT = "system.poi.excel.export.default_limit";
}
