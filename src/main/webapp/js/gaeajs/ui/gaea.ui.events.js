/**
 * Created by iverson on 2016-5-25 19:11:51
 * 今天起，开始重构UR创建的一套前端js框架。重新以gaea命名。另外基于RequireJS的模块化。
 *
 * 定义GaeaUI的一些通用的事件静态名
 * by Iverson 2016-6-25 16:14:35
 *
 */
define(function () {
    var events = {};
    events.DEFINE = {
        /**
         * 通用增删改的功能的事件
         */
        CRUD: {
            COMMON_UPDATE_CLICK: "gaeaUI_event_commonUpdate_click", // 通用更新触发
            COMMON_DELETE_CLICK: "gaeaUI_event_commonDelete_click" // 通用删除触发
        },
        UI: {
            DIALOG: {
                INIT: "gaeaUI_event_dialog_init",// 初始化dialog
                OPEN: "gaeaUI_event_dialog_open",// 打开dialog
                CRUD_ADD_OPEN: "gaeaUI_event_crud_dialog_add_open",// 打开“新增”dialog
                CRUD_UPDATE_OPEN: "gaeaUI_event_crud_dialog_update_open"// 打开“编辑”dialog
            },
            GRID: {
                SELECT: "gaeaUI_event_grid_select"
            },
            /**
             * 复选框组件相关事件
             */
            MULTI_SELECT: {
                SELECT: "gaeaUI_event_multiselect_select" // 点选中了某项
            },
            INIT_COMPLETE: "gaeaUI_event_init_complete" // 针对UI任意组件。初始化完成后（包括UI、数据等等一切）触发。
        },
        /**
         * action操作。
         */
        ACTION: {
            DELETE_SELECTED: "gaeaUI_event_action_delete_selected"
        },
        CONTEXT: {
            PAGE: {
                UPDATE: "gaeaEvent_page_context_update"
            }
        }
    };
    return events;
});