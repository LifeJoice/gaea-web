package org.gaea.framework.web.schema.convertor.list;

import org.gaea.framework.web.schema.convertor.HtmlPage;
import org.gaea.framework.web.schema.domain.SchemaImport;

/**
 * 把XML SCHEMA中的内容注入HTML模板中。例如：数据、引入的js、css等。
 * Created by Iverson on 2015/7/25.
 */
public class ListSchemaHtmlConvertor extends HtmlPage {

    public ListSchemaHtmlConvertor(String htmlContent) {
        super(htmlContent);
    }

    public synchronized void replaceImport(SchemaImport imports) {
//        if (!StringUtils.isBlank(imports.getStrheadLastImport())) {         // headlast默认混杂了js和所有css
        replace("<!UR_VIEW_SCHEMA IMPORT_HEADLAST>", imports.getStrheadLastImport());
//        } else if (!StringUtils.isBlank(imports.getStrHeadFirstJsImport())) {
        replace("<!UR_VIEW_SCHEMA IMPORT_HEADFIRST>", imports.getStrHeadFirstJsImport());
//        } else if (!StringUtils.isBlank(imports.getStrBodyendImport())) {
        replace("<!UR_VIEW_SCHEMA IMPORT_BODYEND>", imports.getStrBodyendImport());
        // css headlast暂时未支持。和js headlast是一起的。所以这里直接把它清空。
        replace("<!UR_VIEW_SCHEMA IMPORT_CSS_HEADLAST>", "");
//        }
    }

    public synchronized void replaceData(String content) {
        replace("<!UR_VIEW_SCHEMA VIEWS_GRID_JSON_DATA>", content);
    }
}
