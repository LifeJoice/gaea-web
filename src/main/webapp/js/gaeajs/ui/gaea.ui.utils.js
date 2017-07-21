/**
 *
 * 和UI各组件相关的公用工具。
 * 例如：某些方法需要跨几个组件共享的。如果只是单个组件的utils不需要放这里。
 *
 * Created by iverson on 2017年7月19日11:41:13
 */
define([
        "jquery", "underscore", 'underscore-string', 'gaeajs-common-utils-ajax', 'gaeajs-common-utils-validate',
        "gaeajs-data", "gaeajs-ui-events", "gaeajs-ui-form", "gaeajs-common-utils-string",
        "gaeajs-ui-definition", "gaeajs-ui-view", "gaea-system-url", 'gaeajs-ui-notify',
        "gaeajs-ui-commons", "gaeajs-ui-multiselect", "gaeajs-common", "gaeajs-ui-tabs",
        "gaeajs-common-utils", "gaeajs-context", "gaeajs-ui-dataFilterDialog", "gaeajs-ui-grid",
        "gaeajs-data-content", "gaeajs-ui-chain", "gaeajs-ui-toolbar",
        'gaea-jqui-dialog', "jquery-serializeObject", "jquery-ui-effects-all"],
    function ($, _, _s, gaeaAjax, gaeaValid,
              gaeaData, GAEA_EVENTS, gaeaForm, gaeaString,
              GAEA_UI_DEFINE, gaeaView, SYS_URL, gaeaNotify,
              gaeaUI, gaeaMultiSelect, gaeaCommon, gaeaComponents,
              gaeaCommonUtils, gaeaContext, gaeaDataFilterDialog, gaeaGrid,
              gaeaContent, gaeaViewChain, gaeaToolbar) {

        var _public = {
            isInDialog: function (jqSelector) {
                if (gaeaValid.isNull(jqSelector)) {
                    throw "没有目标选择器（jqSelector），无法验证是否在弹出框中！";
                }
                var $target = $(jqSelector);
                return $target.parents("[data-gaea-ui-dialog]").length > 0;
            }
        };

        var _private = {};

        return _public;
    });