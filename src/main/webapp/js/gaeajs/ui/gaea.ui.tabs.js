/**
 * 今天起，开始重构UR创建的一套前端js框架。重新以gaea命名。另外基于RequireJS的模块化。
 *
 * 通用的UI组件。
 * Created by iverson on 2016-9-7 15:09:46.
 *
 */
define([
        "jquery", "underscore", 'underscore-string',
        'gaeajs-common-utils-validate', "gaeajs-common-utils-string", 'gaeajs-ui-definition',
        "gaeajs-data", "gaeajs-data-content", "gaeajs-ui-form",
        "jquery-ui-tabs"
    ],
    function ($, _, _s,
              gaeaValid, gaeaString, GAEA_UI_DEFINE,
              gaeaData, gaeaContent, gaeaForm) {

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
                            id: bindDivId
                        });
                    }
                });

                // 是否一开始加载全部tab, 默认是
                if (opts.initAllTabs) {
                    _private.initAllTabs($tabs);
                }

                _private.bindTabClickEvent($tabs, opts);
            }
        };

        var _private = {
            /**
             * 填充数据。
             * 其实还是调用通用填充数据，只是对于多tabs来说，除第一个tab外的其他tab由于ajax分开加载，需要在加载完后手动触发填充。
             * @param {object} opts
             * @param {object} opts.id                  容器id，要填充区域的id
             */
            fillData: function (opts) {
                if ($("#" + opts.id).parents("[data-gaea-ui-dialog]").length < 1) {
                    console.debug("从gaea tabs找不到父级的gaea dialog，无法填充数据！");
                }
                // 向上寻找包含这个tab的dialog
                var $dialog = $("#" + opts.id).parents("[data-gaea-ui-dialog]").first();
                // dialog的gaea options定义，里面有缓存数据
                var dialogOpts = $dialog.data("gaeaOptions");
                // 是否有editData，这个一般是crud dialog才会缓存的
                if (gaeaValid.isNotNull(dialogOpts["editData"])) {
                    var gaeaUI = require("gaeajs-ui-commons");
                    gaeaUI.fillData({
                        id: opts.id,
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
        /**
         * 返回接口定义。
         */
        return public;
    });