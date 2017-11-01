/**
 * Created by iverson on 2016-5-25 19:11:51
 * 今天起，开始重构UR创建的一套前端js框架。重新以gaea命名。另外基于RequireJS的模块化。
 *
 * 定义GaeaUI的一些通用的事件静态名
 * by Iverson 2016-6-25 16:14:35
 *
 */

/**
 * 触发器。定义一个组件被什么触发等信息。
 *
 * @typedef {object} GaeaUITrigger
 * @property {string} trgSelector                   触发选择器。由这个选择器导致的触发。参考：$(trgSelector).on(...)
 */

/**
 * @typedef {object} GaeaUiEvent
 * @property {object} trigger
 * @property {string} trigger.target    目标
 * @property {string} trigger.event     事件名
 */

define(["jquery", "underscore", "gaeajs-common-utils-validate", "gaeajs-common-utils-string"],
    function ($, _, gaeaValid, gaeaString) {

        var events = {};

        var _default = {
            registerListenerOpts: {
                // 是否去掉绑定当前对象的之前的事件
                unbindBefore: true
            }
        };

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
                    // 没有了，给下面的替代了
                    //CRUD_ADD_OPEN: "gaeaUI_event_crud_dialog_add_open",// 打开“新增”dialog
                    //CRUD_UPDATE_OPEN: "gaeaUI_event_crud_dialog_update_open",// 打开“编辑”dialog
                    CRUD_OPEN: "gaeaUI_event_crud_dialog_open",// 打开“新增编辑”dialog
                    CLOSE: "gaeaUI_event_dialog_close"                              // 对应jQuery dialog的close。主要是设定JQ的close会互相覆盖，干脆用自己的事件算了
                },
                UPLOADER_DIALOG: {
                    UPLOAD: "gaeaUI_event_uploader_dialog_upload" // 即刻上传
                },
                GRID: {
                    REFRESH_DATA: "gaeaUI_event_grid_refresh_data", // 刷新数据区事件
                    SYNC_GRID_DATA: "gaeaUI_event_grid_sync_grid_data", // 同步数据区的数据事件。一般crud grid需要，因为数据区是可编辑的。
                    RELOAD: "gaeaUI_event_grid_reload", // 刷新grid数据的事件。无需参数。
                    //SELECT: "gaeaUI_event_grid_select",  // 选中了grid的某一行的事件 // 可以留以后用
                    CACHE_SELECTED_ROW_DATA: "gaeaUI_event_grid_cache_selectedRow_data",  // 选中了grid的某一行，然后触发缓存该行的数据(selectedRow等)的事件
                    GLOBAL_LAST_SELECT_FINISHED: "gaeaUI_event_grid_global_last_select_finished"  // 全局事件！不绑定具体grid。选中了grid的某一行的事件, 并且完成了把选中行数据缓存等工作
                },
                /**
                 * 复选框组件相关事件
                 */
                MULTI_SELECT: {
                    SELECT: "gaeaUI_event_multiselect_select" // 点选中了某项
                },
                INIT_COMPLETE: "gaeaUI_event_init_complete", // 针对UI任意组件。初始化完成后（包括UI、数据等等一切）触发。
                RELOAD_DATA: "reload_data"
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
            },
            /**
             * Gaea UI 组件的一些通用回调事件名。自定义的。
             * 不是每一个组件都支持所有的事件，这个必须清楚。
             */
            CALLBACK: {
                ON_COMPLETE: "gaeaEvent_onComplete"   // 完成, 不代表成功
            }
        };

        /**
         * 注册监听事件。
         * 这个是个没有注册功能的注册器。只是给gaea框架统一调用后，可以记录当前页面注册了哪些事件，方便debug之类的。
         * eventFunction和defineFunction二选一。
         * @param {string} eventName                事件名
         * @param {string|null} jqSelector               绑定的id（某容器）.为空即为全局事件！
         * @param {function} eventFunction              事件对应处理方法。有这个就忽略下面的defineFunction.
         * @param {object} [opts]
         * @param {object} [opts.unbindBefore=true]     是否去掉绑定当前对象的之前的事件
         //* @param defineFunction            【废弃！】定义监听的方法，非event function。类似：function(){ $.on(...); }
         */
        events.registerListener = function (eventName, jqSelector, eventFunction, opts) {
            gaeaValid.isNull({check: eventName, exception: "事件名称为空，无法通过gaeaEvent注册监听事件！"});
            //gaeaValid.isNull({check: jqSelector, exception: "事件绑定的id为空，无法通过gaeaEvent注册监听事件！"});
            if (gaeaValid.isNull(opts)) {
                opts = {};
            }
            _.defaults(opts, _default.registerListenerOpts);
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
                debugStr = gaeaString.builder.simpleBuild("组件 %s 注册 %s 事件。", jqSelector, eventName);
                if (_.isFunction($bindObj.data(key))) {
                    debugStr += " 该事件已经存在！先进行解绑操作。";
                }

                // 解绑
                if (opts.unbindBefore) {
                    $bindObj.off(eventName);
                }
                // 如果需要debug已注册事件等信息，可以打开下面这个。
                console.debug(debugStr);
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
                    $(document).mouseup(function (e) {
                        //$(".main-right").mouseup(function (e) {

                        // 检查当前
                        if (gaeaValid.isNull(events.cache.lastOne)) {
                            console.debug("缓存最后操作的对象的jqSelector为空，不执行自动关闭操作。");
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
                                closeFunc(e);
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

        /**
         * gaea定义的各种event（onComplete等）的处理
         * @param {object} opts
         * @param {object} opts.id          当前元素的id。例如：是一个按钮。
         * @param {object} opts.onComplete
         */
        events.initGaeaEvent = function (opts) {
            if (gaeaValid.isNull(opts)) {
                return;
            }
            var $target = $("#" + opts.id);
            if (gaeaValid.isNotNull(opts.onComplete)) {
                opts.gaeaEventName = "onComplete"; // 这个必须和html元素上的data-gaea-ui-xx的事件名对上。否则opts里面没有对应的属性值。
                _private.bindOnComplete(opts);
            } else if (gaeaValid.isNotNull(opts["onChange"])) {
                opts.gaeaEventName = "onChange"; // 这个必须和html元素上的data-gaea-ui-xx的事件名对上。否则opts里面没有对应的属性值。
                _private.bindOnChange(opts);
            }
        };

        var _private = {
            /**
             * 根据onComplete对象定义，绑定一个gaeaEvent_onComplete事件，在触发的时候，进一步触发对应target的event。
             * @param {object} opts
             * @param {object} opts.id
             * @param {object} opts.gaeaEventName       gaea自定义的一些用于html的（事件）属性名。
             * @param {GaeaUiEvent} opts.onComplete
             */
            bindOnComplete: function (opts) {
                events.registerListener(events.DEFINE.CALLBACK.ON_COMPLETE, "#" + opts.id, function (event, data) {
                    // 通用处理
                    _private.doGaeaEvent(opts);

                    //gaeaValid.isNull({
                    //    check: opts.onComplete.trigger.target,
                    //    exception: "定义的组件（" + opts.id + "）的onComplete属性，触发对象（trigger.target）不允许为空！"
                    //});
                    //gaeaValid.isNull({
                    //    check: opts.onComplete.trigger.event,
                    //    exception: "定义的组件（" + opts.id + "）的onComplete属性，触发事件（trigger.event）不允许为空！"
                    //});
                    //var $target = $(opts.onComplete.trigger.target);
                    //if ($target.length < 1) {
                    //    throw "通过onComplete属性定义，要触发的target不存在！options: " + JSON.stringify(opts.onComplete);
                    //}
                    //$target.trigger(opts.onComplete.trigger.event);
                });
            },
            /**
             * 绑定gaea event通用处理onChange的处理。
             * 例如针对：data-gaea-ui-select="onChange: { trigger: {target:'#tab2-title' , event:'reload_data' }}"
             * @param {object} opts
             * @param {object} opts.gaeaEventName       gaea自定义的一些用于html的（事件）属性名。
             */
            bindOnChange: function (opts) {
                var $target = $("#" + opts.id);
                events.registerListener("change", "#" + opts.id, function (event, data) {
                    // 通用处理
                    _private.doGaeaEvent(opts);
                });
            },
            /**
             * 处理gaea event的逻辑。
             * <b>
             *     这个只是绑定对象事件触发后的逻辑处理。本身不负责绑定事件工作。
             * </b>
             * <p>
             * 所谓gaea event，是指绑定的某个元素的一些设置，可以通过这些设置去把一个元素的状态改变，触发另一个（些）元素的事件。
             * 例如：
             * 对于某个select，有：
             * data-gaea-ui-select="onChange: { trigger: {target:'#tab2-title' , event:'reload_data' }}"
             * 就定义了change时，触发某个tab的reload data。
             * </p>
             * @param {object} opts
             * @param {object} opts.id
             * @param {string} opts.gaeaEventName           gaea框架的定义在页面元素上的名称。非javascript的事件名
             */
            doGaeaEvent: function (opts) {
                /**
                 * @type {GaeaUiEvent}
                 */
                var gaeaEventDef = opts[opts.gaeaEventName];
                gaeaValid.isNull({
                    check: gaeaEventDef.trigger.target,
                    exception: "定义的组件（" + opts.id + "）的gaea通用事件机制:" + opts.gaeaEventName + "，触发对象（trigger.target）不允许为空！"
                });
                gaeaValid.isNull({
                    check: gaeaEventDef.trigger.event,
                    exception: "定义的组件（" + opts.id + "）的gaea通用事件机制:" + opts.gaeaEventName + "，触发事件（trigger.event）不允许为空！"
                });
                var $target = $(gaeaEventDef.trigger.target);
                if ($target.length < 1) {
                    throw "通过:" + opts.gaeaEventName + "属性定义，要触发的target不存在！options: " + JSON.stringify(gaeaEventDef);
                }
                $target.trigger(gaeaEventDef.trigger.event);
            }
        };

        return events;
    });