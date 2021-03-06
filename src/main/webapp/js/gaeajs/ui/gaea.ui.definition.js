/**
 * Created by iverson on 2016-6-25 18:41:59
 * 今天起，开始重构UR创建的一套前端js框架。重新以gaea命名。另外基于RequireJS的模块化。
 *
 * 这是GAEA UI通用的定义
 */
define(function () {
    var UI = {
        MAIN: {
            /**
             * 获取主页面的右边（内容区）的jq对象
             */
            getMainRightJQ: function () {
                return $(".gaea-main").children(".main-right");
            },
            /**
             * 获取一般内容区页的jq对象（一般是grid的父容器）
             */
            getUIPageJQ: function () {
                return $(".gaea-ui-page");
            }
        },
        /**
         * 通过
         * < div data-gaea-ui-xxx >
         * 定义的组件名
         */
        BUTTON: {
            DEFINE: "gaea-ui-button", // data-gaea-ui-button
            ACTION: {
                // 点击是新打开一个弹框
                NEW_DIALOG: "new_dialog",
                // 打开 data_filter_dialog
                DATA_FILTER_DIALOG: "data_filter_dialog",
                UPLOADER_DIALOG: "uploader_dialog", // 文件上传弹出框
                WITHOUT_VALIDATE: "without-validate" // dialog中的按钮点击，不需要触发validate
            },
            SUBMIT_ACTION: {
                WRITEBACK_IN_ONE: "writeback_in_one",
                WRITEBACK_BY_FIELD: "writeback_by_field"
            }
        },
        /**
         * UI定义的组件类型。
         */
        COMPONENT: {
            GRID: "grid",
            CRUD_GRID: "crud-grid",
            TABLE: "table",
            SELECT: "select",
            SELECT_TREE: "select-tree", // component name
            //TABS: "tabs",
            BUTTON: {
                DEFAULT: "button",
                BUTTON_GROUP: "button-group"
            },
            DIALOG: {
                COMMON_DIALOG: "dialog",
                WORKFLOW_DIALOG: "wf-dialog",
                UPLOAD_DIALOG: "uploader-dialog",
                DATA_FILTER_DIALOG: "data_filter_dialog"
            }
        },
        SELECT_TREE_DEFINE: "gaea-ui-select-tree", // 直接在html中的定义属性名
        RADIO_DEFINE: "gaea-ui-radio", // 直接在html中的radio定义
        IMG_DEFINE: "gaea-ui-img", // 直接在html中的img定义
        INPUT_DEFINE: "gaea-ui-input", // 直接在html中的gaea input定义
        DIALOG: {
            // todo 慢慢重构到component去
            TYPE: {
                COMMON_DIALOG: "dialog",
                WORKFLOW_DIALOG: "wf-dialog",
                UPLOAD_DIALOG: "uploader-dialog"
            },
            COMMON_CONFIG_DIALOG_ID: "gaeaUI_common_config_dialog" // 通用的确认弹框的默认id.因为很多地方用弹框但并不关系弹框是什么, 只是要用弹框显示点信息而已. 就共用这个就好了. 确保名字别重复就好.
        },
        TABS: {
            DEFINE: "gaea-ui-tabs"
        },
        GRID: {
            CRUD_GRID_DEFINE: "gaea-ui-crud-grid",
            ID: "gridId",
            GAEA_GRID_DEFAULT_ID: "gaea-grid-ct"
        },
        SCHEMA: {
            ID: "urSchemaId"
        },
        INPUT: {
            CLASS: "gaea-query-field"
        },
        QUERY: {
            // 定义在具体的查询输入元素（select、input、textarea……）上。
            // 解决上面的gaea-query-field下有多个输入项（针对select-tree组件这种多输入元素的），区分不出哪个是要取值提交给服务端查询
            INPUT_FIELD_CLASS: "query-input-field"
        },
        BUTTON_GROUP: {
            TEMPLATE: {
                // 整个按钮组的框架的HTML,除了按钮
                HTML: '<span class="gaea-button-group-ct">' +
                '<span id="<%= GROUP_ID %>" class="gaea-button-group">' +
                '<div id="<%= BUTTONS_PANEL_ID %>" class="detail"></div></span>' +
                '<div class="title"><%= GROUP_TEXT %><i class="fa fa-chevron-down"></i></div>' +
                '</span>',
                // 按钮组的按钮的HTML
                SUB_BUTTON_HTML: '<li id="<%= ID %>" data-url="<%= URL %>"><%=TEXT %></li>'
            }
        },
        SELECT: {
            DEFINE: "gaea-ui-select",
            DP_SELECT_DEFINE: "gaea-ui-dp-select"
        },
        SELECT2: {
            DEFINE: "gaea-ui-select2"
        },
        GAEA_CONTEXT: {
            // gaea context组件的默认绑定容器id
            ID: "gaea-context-ct",
            CACHE_KEY: {
                SELECTED_ROW: "selectedRow", // 选中的行
                SELECTED_ROWS: "selectedRows" // 选中的多行(也包括一行啦)
            }
        },
        EVENT: {
            ID: "gaea-event-ct" // 事件的绑定容器对象。因为事件总是需要依附某些元素，但如果全局事件，不好控制。就自己建一个元素专门用于绑定。
        },
        DATA: {
            DATA_TYPE_DATE: "date",
            DATA_TYPE_TIME: "time",
            DATA_TYPE_DATETIME: "datetime",
            DATA_TYPE_IMG: "img"
        },
        WRITEBACK: {
            // 回填数据的方式
            WRITEBACK_MODE: {
                APPEND: "append" // 增量
            }
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
        },
        EXPORT_EXCEL: "export-excel", // 通用导出的命令
        EXPORT_EXCEL_WITH_WIZARD: "export-excel-with-wizard", // 带导出向导的通用导出
        SUBMIT_TYPE: { // 和button的定义相关
            AJAX: "ajax",
            FORM_SUBMIT: "formSubmit"
        },
        METHOD: {
            SUBMIT: "SUBMIT",
            EXCEL_EXPORT_BY_TEMPLATE: "excelExportByTemplate"
        },
        CRUD_GRID: {
            EXCEL_IMPORT: "crudGridExcelImport",
            EXCEL_EXPORT: "crudGridExcelExport"
        }
    };
    var TEMPLATE = {
        DIV: {
            HIDDEN: '<div id="<%=ID%>" name="<%=NAME%>" style="display: none;"><%=CONTENT%></div>',
            WITH_NAME: '<div id="<%=ID%>" name="<%=NAME%>"><div class="content-text"><%=CONTENT%></div></div>'
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

    // 查询相关的
    var QUERY = {
        OP: {
            EQ: "eq",
            GT: "gt",
            GE: "ge",
            LT: "lt",
            LE: "le",
            LK: "lk",
            NE: "ne",
            NA: "na",
            NNA: "nna"
        }
    }
    /**
     * gaea-data框架定义
     * 针对< html data-gaea-data='' >
     */
    var GAEA_DATA = {
        GAEA_DATA: "gaea-data",
        DS: {
            DEFAULT_VALUE_NAME: "value" // 数据集的值的默认param name。（ liek this: text:可用, value:1 ）
        }
    };
    return {
        UI: UI,
        PAGE: PAGE,
        ACTION: ACTION,
        TEMPLATE: TEMPLATE,
        TEXT: TEXT,
        GAEA_DATA: GAEA_DATA,
        QUERY: QUERY
    };
});