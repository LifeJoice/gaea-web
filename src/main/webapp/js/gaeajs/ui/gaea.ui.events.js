/**
 * Created by iverson on 2016-5-25 19:11:51
 * 今天起，开始重构UR创建的一套前端js框架。重新以gaea命名。另外基于RequireJS的模块化。
 *
 * 定义GaeaUI的一些通用的事件静态名
 * by Iverson 2016-6-25 16:14:35
 *
 */
define(["jquery", "underscore", "gaeajs-common-utils-validate", "gaeajs-common-utils-string"],
    function ($, _, gaeaValid, gaeaString) {
        var events = {};

        /**
         * 事件注册中心。所有经过events.listen注册的事件都会记录在这里。
         * 其实也没啥用，主要是事件太多了，如果各个模块都随便注册事件，很难知道绑定的id、有什么事件等。
         * 这个方便debug用。
         * key: [bindId]:[eventName]
         * value: bind event function
         */
        var eventRegisterCenter = {
            // 放着当前页面各个注册了的事件和绑定的id
            cache: {},
            register: function (key, val) {
                eventRegisterCenter[key] = val;
            }
        };

        /**
         * 事件名的统一定义
         */
        events.DEFINE = {
            /**
             * 通用增删改的功能的事件
             */
            CRUD: {
                COMMON_UPDATE_CLICK: "gaeaUI_event_commonUpdate_click", // 通用更新触发
                COMMON_DELETE_CLICK: "gaeaUI_event_commonDelete_click" // 通用删除触发
            },
            UI: {
                /**
                 * gaea的输入框。例如用在列表页的快捷查询。
                 */
                INPUT: {
                    CHANGE: "gaeaUI_event_input_change" // 某些东西改变了。可能是值改变了，也可能是选择按钮改变了
                },
                DIALOG: {
                    INIT: "gaeaUI_event_dialog_init",// 初始化dialog
                    OPEN: "gaeaUI_event_dialog_open",// 打开dialog
                    CRUD_ADD_OPEN: "gaeaUI_event_crud_dialog_add_open",// 打开“新增”dialog
                    CRUD_UPDATE_OPEN: "gaeaUI_event_crud_dialog_update_open",// 打开“编辑”dialog
                    CLOSE: "gaeaUI_event_dialog_close"                              // 对应jQuery dialog的close。主要是设定JQ的close会互相覆盖，干脆用自己的事件算了
                },
                GRID: {
                    RELOAD: "gaeaUI_event_grid_reload", // 刷新grid数据的事件。无需参数。
                    SELECT: "gaeaUI_event_grid_select"  // 选中了grid的某一行的事件
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

        /**
         *
         * 注册监听事件。
         * 这个是个没有注册功能的注册器。只是给gaea框架统一调用后，可以记录当前页面注册了哪些事件，方便debug之类的。
         * eventFunction和defineFunction二选一。
         * @param eventName                 事件名
         * @param bindId                    绑定的id（某容器）
         * @param eventFunction             事件对应处理方法。有这个就忽略下面的defineFunction.
         * @param defineFunction            定义监听的方法，非event function。类似：function(){ $.on(...); }
         */
        events.registerListener = function (eventName, bindId, eventFunction, defineFunction) {
            gaeaValid.isNull({check: eventName, exception: "事件名称为空，无法通过gaeaEvent注册监听事件！"});
            gaeaValid.isNull({check: bindId, exception: "事件绑定的id为空，无法通过gaeaEvent注册监听事件！"});
            var key = bindId + ":" + eventName;

            // eventFunction和defineFunction二选一
            if (_.isFunction(eventFunction)) {
                console.debug("注册 %s 事件。", eventName);
                $("#" + bindId).on(eventName, eventFunction);
                // 缓存当前已经注册的事件
                eventRegisterCenter.register(key, eventFunction);
            } else if (_.isFunction(defineFunction)) {
                console.debug("注册 %s 事件。", eventName);
                // 执行定义方法。
                // 注意：不是由本方法来直接做事件绑定的！
                defineFunction();
                // 缓存当前已经注册的事件
                eventRegisterCenter.register(key, defineFunction);
            }
        };

        return events;
    });