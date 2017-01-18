/**
 * 今天起，开始重构UR创建的一套前端js框架。重新以gaea命名。另外基于RequireJS的模块化。
 *
 * 通用的UI组件的公用包。因为有些组件，只是做一个接口层的封装，本身并不会很复杂。例如：日期时间控件等。
 * Created by iverson on 2016-6-19 18:17:59.
 *
 * 重构：
 * 把datatimepicker移到新包gaea.ui.plugins里面去。因为发现datetimepicker插件会和自己写的require模块冲突，导致导不入模块而undefined。
 * 以后插件都放到plugins去。
 */
define([
        "jquery", "underscore", 'underscore-string',
        'gaeajs-common-utils-validate', "gaeajs-common-utils-string", 'gaeajs-ui-definition',
        "gaeajs-ui-multiselect"
    ],
    function ($, _, _s,
              gaeaValid, gaeaString, GAEA_UI_DEFINE,
              gaeaMultiSelect) {

        var gaeaCommons = {
            initComponents: function (containerId) {
                return gaeaMultiSelect.init(containerId);
            }
        };

        /**
         * 返回接口定义。
         */
        return gaeaCommons;
    });