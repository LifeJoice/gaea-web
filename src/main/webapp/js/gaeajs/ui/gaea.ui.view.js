/**
 * gaea.ui.view,其中的view，表示一个抽象的组合，一些组件的组合。类似page。
 * 例如：
 * 列表页，就是一个view。包含了toolbar，grid，data，workflow等很多组件的组合。
 * by Iverson on 2016-6-27 10:28:51
 *
 * Created by iverson on 2016/2/14.
 * 今天起，开始重构UR创建的一套前端js框架。重新以gaea命名。另外基于RequireJS的模块化。
 */
define([
        "jquery", "underscore", "gaeajs-common-utils-string"],
    function ($, _, gaeaString) {
        var view = {};
        /**
         * view的定义的内容，应该很多都是通过接口暴露给外部，所以定义的常量应该不需要放到ui.definition。
         */
        var GAEA_UI_VIEW_DEFINE = {
            LIST_VIEW: {
                SCHEMA_HTML_ID: "urSchemaId"
            }
        };
        /**
         * 列表页（gaeaGrid.html）。
         */
        var listView = {
            getSchemaId: function () {
                return $("#" + GAEA_UI_VIEW_DEFINE.LIST_VIEW.SCHEMA_HTML_ID).val();
            }
        };
        /**
         * 返回接口定义。
         */
        return {
            list: listView
        };
    });