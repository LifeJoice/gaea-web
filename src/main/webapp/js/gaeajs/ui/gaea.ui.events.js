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

        events.cache = {
            // 是否已经注册了自动关闭事件。这个应该只需要初始化一次。
            isRegisterAutoClose: false,
            // jqSelector.最近一个操作组件的jqSelector。
            lastOne: "",
            // 已注册的自动关闭的列表。key: jqSelector value: closeFunction
            autoCloseList: {}
        };
        /**
         * !!!!!没用了。因为ajax刷新后，这个缓存就清空了。但实际上很多事件还是继续存在！
         *
         * 事件注册中心。所有经过events.listen注册的事件都会记录在这里。
         * 其实也没啥用，主要是事件太多了，如果各个模块都随便注册事件，很难知道绑定的id、有什么事件等。
         * 这个方便debug用。
         * key: [bindId]:[eventName]
         * value: bind event function
         */
        //var eventRegisterCenter = {
        //    // 放着当前页面各个注册了的事件和绑定的id
        //    cache: {},
        //    register: function (key, val) {
        //        eventRegisterCenter[key] = val;
        //    },
        //    isExists: function (key) {
        //        if (gaeaValid.isNotNull(eventRegisterCenter[key])) {
        //            return true;
        //        }
        //        return false;
        //    }
        //};

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
                    REFRESH_DATA: "gaeaUI_event_grid_refresh_data", // 刷新数据区事件
                    SYNC_GRID_DATA: "gaeaUI_event_grid_sync_grid_data", // 同步数据区的数据事件。一般crud grid需要，因为数据区是可编辑的。
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
                DELETE_SELECTED: "gaeaUI_event_action_delete_selected",
                SUBMIT_FINISHED: "gaeaUI_event_action_submit_finished"
            },
            CONTEXT: {
                PAGE: {
                    UPDATE: "gaeaEvent_page_context_update"
                }
            }
        };

        /**
         * 注册监听事件。
         * 这个是个没有注册功能的注册器。只是给gaea框架统一调用后，可以记录当前页面注册了哪些事件，方便debug之类的。
         * eventFunction和defineFunction二选一。
         * @param {string} eventName                事件名
         * @param {string|null} jqSelector               绑定的id（某容器）.为空即为全局事件！
         * @param {function} eventFunction            事件对应处理方法。有这个就忽略下面的defineFunction.
         * @param {object} [opts]                   暂时无用。配置项。
         //* @param defineFunction            【废弃！】定义监听的方法，非event function。类似：function(){ $.on(...); }
         */
        events.registerListener = function (eventName, jqSelector, eventFunction, opts) {
            gaeaValid.isNull({check: eventName, exception: "事件名称为空，无法通过gaeaEvent注册监听事件！"});
            //gaeaValid.isNull({check: jqSelector, exception: "事件绑定的id为空，无法通过gaeaEvent注册监听事件！"});
            // 如果没有指定jqSelector，则使用全局容器
            if (gaeaValid.isNull(jqSelector)) {
                jqSelector = "#gaea-event-ct";
            }
            // 构造唯一的对象和事件id，作为缓存事件列表的key
            var key = jqSelector + ":" + eventName;
            var debugStr = "";
            var $bindObj = $(jqSelector);

            // eventFunction和defineFunction二选一
            if (_.isFunction(eventFunction)) {
                debugStr = gaeaString.builder.simpleBuild("注册 %s 事件。", eventName);
                if (_.isFunction($bindObj.data(key))) {
                    debugStr += " 该事件已经存在！先进行解绑操作。";
                }

                // 解绑
                $bindObj.off(eventName);
                // 如果需要debug已注册事件等信息，可以打开下面这个。
                //console.debug(debugStr);
                // 绑定事件
                $bindObj.on(eventName, eventFunction);
                // 缓存当前已经注册的事件
                $bindObj.data(key, eventFunction);
                //} else if (_.isFunction(defineFunction)) {
                //    console.debug("注册 %s 事件。", eventName);
                //    // 执行定义方法。
                //    // 注意：不是由本方法来直接做事件绑定的！
                //    defineFunction();
                //    // 缓存当前已经注册的事件
                //    eventRegisterCenter.register(key, defineFunction);
            }
        };

        /**
         * 发布（触发）全局事件。一般的事件，如果你知道对象id，就可以针对性的去触发。但全局的，需要自己有个框架去实现。
         * <p>
         *     我们定义了一个<span id="gaea-event-ct">在gaeaGrid.html专门作为绑定全局事件。
         * </p>
         *
         * @param {string} eventName            事件名。
         * @param {object} [data]               随事件传递的数据。
         * @param {object} [opts]               暂时没用。
         */
        events.publish = function (eventName, data, opts) {
            gaeaValid.isNull({
                check: eventName,
                exception: "gaea event不允许发布空的事件！"
            });
            $("#gaea-event-ct").trigger(eventName, data);
        };

        /**
         * 自动关闭功能。
         */
        events.autoClose = {
            /**
             * 注册一个东东，当你的鼠标不再点击它的时候，它就会自动关闭。
             * 因为需要监听全局鼠标事件，就不想一个组件的关闭就加一个事件。
             * 相反，通过维护一个最新点击的组件jqSelector，当鼠标离开该容器的时候，就自动关闭。
             * @param {string} jqSelector               jq选择器。用于识别焦点是否离开了它，就触发关闭。
             * @param {function} [closeFunction]        关闭的方法。例如有自定义的动画等。可以为空，则直接display=none.
             * @param {object} opts                     暂时没用。
             */
            registerAutoClose: function (jqSelector, closeFunction, opts) {
                gaeaValid.isNull({
                    check: jqSelector,
                    exception: "jqSelector不允许为空，"
                });
                // 还没注册，可以注册
                if (!events.cache.isRegisterAutoClose) {
                    // 这个把选择器定位在document可能会比较耗性能。还是定位在内容区比较好。
                    //$(document).mouseup(function (e) {
                    $(".main-right").mouseup(function (e) {

                        // 检查当前
                        if (gaeaValid.isNull(events.cache.lastOne)) {
                            console.debug("没有注册最后操作的对象的jqSelector，无法关闭。");
                            return;
                        }
                        // 依赖setMe()寻找最后点击的对象，并关闭
                        var iJqSelector = events.cache.lastOne;
                        var container = $(iJqSelector);
                        var closeFunc = events.cache.autoCloseList[iJqSelector];

                        if (!container.is(e.target) // if the target of the click isn't the container...
                            && container.has(e.target).length === 0) // ... nor a descendant of the container
                        {
                            /**
                             * if 有定义关闭方法（可能有特定的效果之类的）
                             *      执行特定关闭方法
                             * else
                             *      display=none
                             */
                            if (_.isFunction(closeFunc)) {
                                closeFunc();
                            } else {
                                container.hide();
                            }
                        }
                    });
                    // 置为已注册
                    events.cache.isRegisterAutoClose = true;
                }
                // 缓存，同名即覆盖
                events.cache.autoCloseList[jqSelector] = closeFunction;
            },
            /**
             * 设定（缓存）最后点击的是什么东东，这样自动关闭才好去做。而不是把所有注册过的都关一遍。
             * @param {object} opts
             * @param {string} opts.jqSelector          一个JQ选择器，当焦点离开这个选择器的时候就关闭。
             */
            setMe: function (opts) {
                if (gaeaValid.isNull(opts.jqSelector)) {
                    return;
                }
                events.cache.lastOne = opts.jqSelector;
            }
        };

        return events;
    });