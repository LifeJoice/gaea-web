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

        var public = {
            options: {
                containerId: null
            },
            /**
             *
             * @param {object} opts
             * @param {string} opts.containerId
             */
            init: function (opts) {
                if (gaeaValid.isNull(opts.containerId)) {
                    throw "初始化gaea tabs组件，id不允许为空！";
                }
                //var myOptions = _.clone(components.options);
                //myOptions = _.extend(myOptions, opts);
                var $tabs = $("#" + opts.containerId);
                //if (gaeaValid.isNotNull($tabs)) {
                //    $tabs.find("[data-gaea-ui]").each(function (idx, val) {
                //        var $this = $(this);
                //        var gaeaUIStr = $this.data("gaea-ui");
                //        var gaeaUI = gaeaString.parseJSON(gaeaUIStr);
                //if (gaeaString.equalsIgnoreCase(GAEA_UI_DEFINE.UI.COMPONENT.TABS, gaeaUI.component)) {

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
                    }
                });
                //}
                //});
                //}
            }
        };
        /**
         * 返回接口定义。
         */
        return public;
    });