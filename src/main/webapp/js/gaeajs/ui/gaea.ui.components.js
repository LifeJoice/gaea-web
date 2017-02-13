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
        "gaeajs-data", "gaeajs-ui-multiselect",
        "jquery-ui-tabs"
    ],
    function ($, _, _s,
              gaeaValid, gaeaString, GAEA_UI_DEFINE,
              gaeaData, gaeaMultiSelect) {

        var components = {
            options: {
                containerId: null
            },
            // TODO 这个应该移到gaea.ui.commons去。主要其实就是tabs的初始化而已。
            init: function (options) {
                var myOptions = _.clone(components.options);
                myOptions = _.extend(myOptions, options);
                var $container = $("#" + myOptions.containerId);
                if (gaeaValid.isNotNull($container)) {
                    $container.find("[data-gaea-ui]").each(function (idx, val) {
                        var $this = $(this);
                        var gaeaUIStr = $this.data("gaea-ui");
                        var gaeaUI = gaeaString.parseJSON(gaeaUIStr);
                        if (gaeaString.equalsIgnoreCase(GAEA_UI_DEFINE.UI.COMPONENT.TABS, gaeaUI.component)) {
                            $this.tabs({
                                load: function (event, ui) {
                                    var $tab = ui.panel;
                                    var tabId = $tab.attr("id");
                                    // 必须第一次动态加上gaea-data-bind-area，因为整个tab区域是动态生成的。
                                    $tab.attr("data-gaea-data-bind-area", true);
                                    //alert("this id: "+ui.panel.attr("id"));
                                    // 初始化数据相关的（数据集，MVVM等）
                                    if (!gaeaData.isBinded($tab)) {
                                        $.when(gaeaData.dataSet.scanAndInit(tabId)).done(gaeaData.binding({
                                            containerId: tabId
                                        }));
                                    }
                                    // 隐藏tabs里面的<a>，避免每次点击tab都会重新加载。
                                    $this.find("[aria-controls=" + tabId + "]").children("a").attr("href", "#" + tabId);
                                }
                            });
                        }
                    });
                }
            }
        };
        /**
         * 返回接口定义。
         */
        return components;
    });