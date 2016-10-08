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
            SELECT: "select",
            TABS: "tabs"
        },
        DIALOG: {
            TYPE: {
                COMMON_DIALOG: "dialog",
                WORKFLOW_DIALOG: "wf-dialog",
                UPLOAD_DIALOG: "uploader-dialog"
            },
            COMMON_CONFIG_DIALOG_ID: "gaeaUI_common_config_dialog" // 通用的确认弹框的默认id.因为很多地方用弹框但并不关系弹框是什么, 只是要用弹框显示点信息而已. 就共用这个就好了. 确保名字别重复就好.
        },
        GRID: {
            ID: "gridId"
        },
        SCHEMA: {
            ID: "urSchemaId"
        },
        INPUT: {
            CLASS: "gaea-query-field"
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
            WITH_NAME: '<div id="<%=ID%>" name="<%=NAME%>"><%=CONTENT%></div>'
        },
        INPUT: {
            HIDDEN: '<input type="hidden" id="<%=ID%>" name="<%=NAME%>" value="<%=VALUE%>" >'
        }
    };
    var TEXT = {
        UI: {
            DIALOG: {
                DELETE_CONFIRM_TITLE: "删除确认",
                DELETE_CONFIRM_CONTENT: "确认删除当前记录？"
            }
        }
    };
    /**
     * gaea-data框架定义
     * 针对< html data-gaea-data='' >
     */
    var GAEA_DATA = {
        GAEA_DATA: "gaea-data"
    };
    return {
        UI: UI,
        PAGE: PAGE,
        ACTION: ACTION,
        TEMPLATE: TEMPLATE,
        TEXT: TEXT,
        GAEA_DATA: GAEA_DATA
    };
});