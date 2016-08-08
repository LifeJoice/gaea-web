/**
 * Created by iverson on 2016-6-25 18:41:59
 * 今天起，开始重构UR创建的一套前端js框架。重新以gaea命名。另外基于RequireJS的模块化。
 *
 * 这是GAEA UI通用的定义
 */
define(function () {
    var UI = {
        /**
         * UI定义的组件类型。
         */
        COMPONENT: {
            GRID: "grid",
            TABLE: "table",
            SELECT: "select"
        },
        DIALOG: {
            TYPE: {
                COMMON_DIALOG: "dialog",
                WORKFLOW_DIALOG: "wf-dialog",
                UPLOAD_DIALOG: "uploader-dialog"
            }
        },
        GRID:{
            ID:"gridId"
        },
        SCHEMA:{
            ID:"urSchemaId"
        }
    };
    var PAGE = {
        // gaeaGrid.html页
        GAEA_GRID_HTML: {
            DIALOG_AREA: "gaea-dialog-area"      // 放置dialog（动态生成dialog）的区域
        }
    };
    var ACTION = {
        CRUD: {
            ADD: "add",// 新增操作，跟服务端配置对应
            DELETE_SELECTED: "deleteSelected",// 删除选择的行
            PSEUDO_DELETE_SELECTED: "pseudoDeleteSelected",// 伪删除选择的行
            UPDATE: "update"// 新增操作，跟服务端配置对应
        }
    };
    var TEMPLATE = {
        DIV: {
            WITH_NAME: '<div id="<%=ID%>" name="<%=NAME%>"></div>'
        },
        INPUT: {
            HIDDEN: '<input type="hidden" id="<%=ID%>" name="<%=NAME%>" value="<%=VALUE%>" >'
        }
    };
    return {
        UI: UI,
        PAGE: PAGE,
        ACTION: ACTION,
        TEMPLATE: TEMPLATE
    };
});