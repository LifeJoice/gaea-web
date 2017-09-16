/**
 * 今天起，开始重构UR创建的一套前端js框架。重新以gaea命名。另外基于RequireJS的模块化。
 *
 * 通用的UI组件。
 * Created by iverson on 2016-9-7 15:09:46.
 *
 */

/**
 * 这个是HTML页面直接定义的Tabs类。
 * 即data-gaea-ui-tabs的定义。
 * @typedef {object} UiTabs
 * @property {string} containerId               tab的容器id
 * @property {Object.<string, UiTab>} tabs      针对每个tab的定义。结构为对象，key为某个tab的id; value为具体的配置项(UiTab)
 */

/**
 * 这个是UiTabs.tabs其中的一项的定义。
 * @typedef {object} UiTab
 * @property {UiTabEvent[]} registerEvents           注册事件和对应的处理。
 */

/**
 *
 * @typedef {object} UiTabEvent
 * @property {array} name               事件的名称。value=reload_data|...
 * @property {array} loadDataUrl      数据加载的地址。对应event name=reload_data
 */
define([
        "jquery", "underscore", 'underscore-string',
        'gaeajs-common-utils-validate', "gaeajs-common-utils-string", 'gaeajs-ui-definition',
        "gaeajs-data", "gaeajs-data-content", "gaeajs-ui-form", "gaeajs-ui-events", "gaeajs-common-utils-ajax",
        "gaeajs-common-utils", "gaeajs-ui-notify",
        "jquery-ui-tabs"
    ],
    function ($, _, _s,
              gaeaValid, gaeaString, GAEA_UI_DEFINE,
              gaeaData, gaeaContent, gaeaForm, gaeaEvents, gaeaAjax,
              gaeaUtils, gaeaNotify) {

        var _defaultOpts = {
            initAllTabs: true                   // 是否一开始就初始化所有tabs内容. 对于编辑dialog一开始不初始化所有，提交可能会有内容缺失（如果某些tab没点过）
        };

        var public = {
            /**
             * 初始化一个多tab组件。
             * @param {object} opts
             * @param {string} opts.containerId
             * @param {boolean} opts.initAllTabs        一开始加载全部
             */
            init: function (opts) {
                _.defaults(opts, _defaultOpts);
                if (gaeaValid.isNull(opts.containerId)) {
                    throw "初始化gaea tabs组件，id不允许为空！";
                }
                var $tabs = $("#" + opts.containerId);
                var strOptions = $tabs.data("gaea-ui-tabs");
                if (gaeaValid.isNotNull(strOptions)) {
                    var extraOpts = gaeaString.parseJSON(strOptions);
                    _.extend(opts, extraOpts);
                }
                // cache options
                $tabs.data("gaea-options", opts);

                /**
                 * create jQuery UI tabs widget.
                 */
                $tabs.tabs({
                    // 加载完后触发
                    load: function (event, ui) {
                        var $tab = ui.panel;
                        var tabId = $tab.attr("id");
                        //var tabId = opts.containerId;
                        // 必须第一次动态加上gaea-data-bind-area，因为整个tab区域是动态生成的。
                        if ($tab.find("[data-gaea-data-bind-area]").length < 1) {
                            $tab.attr("data-gaea-data-bind-area", true);
                        }
                        var $bindTarget = $tab.find("[data-gaea-data-bind-area]:first");
                        var bindDivId = $bindTarget.attr("id");
                        // 初始化表单的样式（load过来的内容的样式）
                        gaeaForm.init({
                            containerClass: "gaea-form"
                        });
                        //alert("this id: "+ui.panel.attr("id"));
                        // 初始化数据相关的（数据集，MVVM等）
                        //if (!gaeaData.isBinded($tab)) {
                        //    $.when(gaeaData.dataSet.scanAndInit(tabId)).done(gaeaData.binding({
                        //        containerId: tabId
                        //    }));
                        //}
                        gaeaContent.initGaeaUI({
                            id: bindDivId
                        });
                        // 隐藏tabs里面的<a>，避免每次点击tab都会重新加载。
                        $tabs.find("[aria-controls=" + tabId + "]").children("a").attr("href", "#" + tabId);

                        // 如果是编辑dialog，填充数据
                        _private.fillData({
                            //id: bindDivId
                            target: "#" + bindDivId
                        });
                    }
                });

                // 是否一开始加载全部tab, 默认是
                if (opts.initAllTabs) {
                    _private.initAllTabs($tabs);
                }
                // 初始化gaea tabs的特殊功能。例如：像reload_data的事件等，特有的，另外单独初始化。
                _private.initGaeaTabs(opts);

                _private.bindTabClickEvent($tabs, opts);
            }
        };

        var _private = {
            /**
             * 初始化gaea tabs的逻辑。
             * 例如：像reload_data的事件等，特有的，另外单独初始化。
             * @param {UiTabs} opts
             * @param {object} opts.tabs    数据结构：
             tabs:{
                                                div-class-student-tab2:{ registerEvents:[{name:'reload_data', loadDataUrl : '/gaea/demo/class-student-crud-form/tab2/load-data' }] }
                                             }
             */
            initGaeaTabs: function (opts) {
                var $tabs = $("#" + opts.containerId);
                if (gaeaValid.isNull(opts.tabs)) {
                    return;
                }
                // 读取页面配置的tabs。
                // key: 某个tab的id
                // tabOpts: 对应的配置对象
                $.each(opts.tabs, function (key, tabOpts) {
                    if (gaeaValid.isNull(key) || gaeaValid.isNull(tabOpts)) {
                        return;
                    }
                    var tabId = key;
                    /* @type {UiTab} */
                    if (_.isArray(tabOpts.registerEvents)) {

                        // 遍历配置的各个注册事件（registerEvents）
                        $.each(tabOpts.registerEvents, function (i, regEvent) {
                            /* @type{UiTabEvent} */
                            if (gaeaValid.isNull(regEvent.name)) {
                                throw "Tabs的注册事件name不允许为空！tab container id: " + opts.containerId + " tab id: " + tabId;
                            }
                            // 绑定事件（regEvent对象）
                            _private.bindEvents(opts.containerId, tabId, regEvent);
                        });
                    }
                });
            },
            /**
             * 解析registerEvent事件定义，并针对性的绑定事件
             * @param containerId
             * @param registerTabId
             * @param registerEvent
             */
            bindEvents: function (containerId, registerTabId, registerEvent) {
                //var $tabs = $("#" + containerId);
                var loadDataUrl = registerEvent.loadDataUrl;
                // 看看具体是什么事件
                if (gaeaString.equalsIgnoreCase(gaeaEvents.DEFINE.UI.RELOAD_DATA, registerEvent.name)) {
                    // reload_data事件
                    gaeaValid.isNull({
                        check: registerTabId,
                        exception: "tab id为空，无法注册reload_data事件！具体配置参考tabs->key=tab id. "
                    });
                    gaeaValid.isNull({
                        check: loadDataUrl,
                        exception: "load-data-url为空，无法注册reload_data事件！tab id: " + containerId + " id: " + registerTabId
                    });
                    if ($("#" + registerTabId).length < 1) {
                        throw "指定id找不到对应的tab（或里面的div）。id: " + registerTabId;
                    }
                    // 绑定reload_data事件
                    _private.bindReloadDataEvent(registerTabId, loadDataUrl);
                }
            },
            /**
             * 绑定reload_data事件。
             * @param bindId
             * @param reloadTarget
             * @param loadDataUrl
             */
            bindReloadDataEvent: function (bindId, loadDataUrl) {
                var $dialog = _utils.findMyDialog({
                    target: "#" + bindId
                });
                var $reloadTarget = $("#" + bindId);
                var fillDataDivId = bindId;
                // 事件绑在了tab标签上，需要找对应的标签内容容器id
                if ($reloadTarget.parent().hasClass("ui-tabs-nav")) {
                    fillDataDivId = $reloadTarget.attr("aria-controls"); // aria-controls这个是jQuery的组件特性，指向某个tab包含的内容的div id
                }

                // 注册reload_data事件
                gaeaEvents.registerListener(gaeaEvents.DEFINE.UI.RELOAD_DATA, "#" + bindId, function (event, data) {
                    /**
                     * reload_data带上的数据：
                     <p>
                     tabs在reload_data的时候，把表单数据带上。
                     这对于图片上传完，再改，再上传……反反复复之后的数据一致性，才可以控制。
                     补充：
                     还需要表单当前的数据。
                     因为当编辑的时候，例如像图片，reload_data一次后，如果删除了，又添加了图片，这个时候，第二次reload_data会不知道之前删除动作。
                     </p>
                     */
                    var requestData = $dialog.find("form:first").serializeObject(); // 获取dialog下的第一个form的数据
                    var gaeaView = require("gaeajs-ui-view");
                    // 获取链式操作，前面节点的数据。可能服务端功能需要（一般都需要）。
                    var viewChainData = gaeaView.getViewData($("#gaeaViewId").val());
                    requestData["viewChain"] = JSON.stringify(viewChainData); // 必须json化。因为数据是笼统的，没有严格的对象mapping
                    requestData["pageId"] = $dialog.data("gaeaOptions").pageId;

                    // 数据加载要求同步
                    gaeaAjax.ajax({
                        url: loadDataUrl,
                        async: false, // 同步，否则后面加载内容还有数据集会乱的
                        data: gaeaUtils.data.flattenData(requestData), // 把数据拍扁。不然传的是对象，服务端无法解析。
                        success: function (data) {
                            var gaeaUI = require("gaeajs-ui-commons");
                            gaeaUI.fillData({
                                //id: fillDataDivId,
                                target: "#" + fillDataDivId,
                                data: data
                            });
                        },
                        fail: function (data) {
                            gaeaNotify.fail(gaeaString.builder.simpleBuild("tab刷新数据（reload）失败！\n%s", JSON.stringify(data)));
                        }
                    });

                });
            },
            /**
             * 填充数据。
             * 其实还是调用通用填充数据，只是对于多tabs来说，除第一个tab外的其他tab由于ajax分开加载，需要在加载完后手动触发填充。
             * @param {object} opts
             * @param {object} opts.id                  作废了，用target！容器id，要填充区域的id
             * @param {object} opts.target              要填充数据的区域选择器
             */
            fillData: function (opts) {
                if ($(opts.target).parents("[data-gaea-ui-dialog]").length < 1) {
                    console.debug("从gaea tabs找不到父级的gaea dialog，无法填充数据！");
                }
                // 向上寻找包含这个tab的dialog
                //var $dialog = $(opts.target).parents("[data-gaea-ui-dialog]").first();
                var $dialog = _utils.findMyDialog(opts);
                // dialog的gaea options定义，里面有缓存数据
                var dialogOpts = $dialog.data("gaeaOptions");
                // 是否有editData，这个一般是crud dialog才会缓存的
                if (gaeaValid.isNotNull(dialogOpts["editData"])) {
                    var gaeaUI = require("gaeajs-ui-commons");
                    gaeaUI.fillData({
                        //id: opts.id,
                        target: opts.target,
                        data: dialogOpts["editData"]
                    });

                    //gaeaData.fieldData.init(options.id, options.data);
                    // 填充完数据后, 某些组件得触发事件才生效（例如select2需要触发change...）
                    //gaeaUI.initGaeaUIAfterData({
                    //    containerId: opts.id
                    //});
                }

            },
            /**
             * 初始化所有tabs内容
             * 对于编辑dialog一开始不初始化所有，提交可能会有内容缺失. 例如：如果某些tab没点过，就没内容，提交就是空。
             * @param {jqObject} $tabs
             */
            initAllTabs: function ($tabs) {
                $tabs.find("> .ui-tabs-nav > li").each(function (i, obj) {
                    var $this = $(this);
                    // 默认第一个是打开的，如果以后支持active不是第一个，这里需要重构
                    if (i > 0) {
                        if ($this.children("a[href]").length > 0) {
                            $tabs.tabs("load", i);
                        }
                    }
                });
            },
            /**
             *
             * @param {jqObject} $tabs
             * @param opts
             */
            bindTabClickEvent: function ($tabs, opts) {
                $tabs.tabs({
                    activate: function (event, ui) {
                        // 初始化表单的样式（load过来的内容的样式）
                        gaeaForm.init({
                            containerClass: "gaea-form"
                        });
                    }
                });
            }
        };

        var _utils = {
            /**
             * 从target往上找，找到我所属的dialog
             * @param {object} opts
             * @param {object} opts.target              要填充数据的区域选择器
             * @returns {*|jQuery}
             */
            findMyDialog: function (opts) {
                // 向上寻找包含这个tab的dialog
                var $dialog = $(opts.target).parents("[data-gaea-ui-dialog]").first();
                return $dialog;
            }
        };
        /**
         * 返回接口定义。
         */
        return public;
    });