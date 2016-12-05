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
        /**
         * DateTime Picker
         * 2016-6-19 18:19:14
         */
        //var datePicker = {
        //    options:{
        //        renderTo:null
        //    },
        //    init: function (options) {
        //        if(gaeaValid.isNull(options.renderTo)){
        //            console.log("renderTo属性不允许为空！");
        //            return;
        //        }
        //        var $datePicker = $("#"+options.renderTo);
        //        $datePicker.datetimepicker({
        //            yearStart: 2015,
        //            dayOfWeekStart: 1,
        //            timepicker:false,
        //            lang: 'ch',
        //            format:'Y-m-d',
        //            //format:'Y-m-d H:i',
        //            closeOnDateSelect:true,
        //            defaultDate: new Date()
        //            //minTime: '8:30',
        //            //maxTime: '18:10',
        //            //defaultTime: '08:30',
        //            //step: 10
        //        });
        //        //$datePicker.datetimepicker({
        //        //    yearStart: 2015,
        //        //    dayOfWeekStart: 1,
        //        //    lang: 'ch',
        //        //    format:'Y-m-d H:i',
        //        //    defaultDate: new Date(),
        //        //    minTime: '8:30',
        //        //    maxTime: '18:10',
        //        //    defaultTime: '08:30',
        //        //    step: 10
        //        //});
        //    }
        //};
        /**
         * 日期时间的控件
         * 2016-6-22 16:45:55 by Iverson
         */
        //var datetimePicker = {
        //    options:{
        //        renderTo:null
        //    },
        //    init: function (options) {
        //        if(gaeaValid.isNull(options.renderTo)){
        //            console.log("renderTo属性不允许为空！");
        //            return;
        //        }
        //        var $datetimePicker = $("#"+options.renderTo);
        //        $datetimePicker.datetimepicker({
        //            yearStart: 2015,
        //            dayOfWeekStart: 1,
        //            //timepicker:false,
        //            lang: 'ch',
        //            //format:'Y-m-d',
        //            format:'Y-m-d H:i',
        //            closeOnDateSelect:true,
        //            defaultDate: new Date(),
        //            minTime: '8:30',
        //            maxTime: '18:10',
        //            defaultTime: '09:00',
        //            step: 10
        //        });
        //    }
        //
        //};

        var gaeaCommons = {
            initComponents: function (containerId) {
                return gaeaMultiSelect.init(containerId);
            }
        };

        //var initComponents = function (containerId) {
        //        var $div = $("#" + containerId);
        //        /* 遍历所有配置了data-gaea-ui的元素 */
        //        $div.find("[data-gaea-ui]").each(function (index, element) {
        //            var $this = $(this);// 默认是下拉选择框，其实可能不是。
        //            var gaeaUIStr = $this.data("gaea-ui");
        //            var dataConfig = gaeaString.parseJSON(gaeaUIStr);
        //
        //            /**
        //             * 把数据转换为table显示
        //             */
        //                if (gaeaString.equalsIgnoreCase(dataConfig.component, GAEA_UI_DEFINE.UI.COMPONENT.TABLE)) {
        //                        // 指定渲染（填充）表格的位置
        //                        dataConfig.renderTo = $this.attr("id");
        //                        // 创建表格
        //                    var grid = require("gaeajs-ui-grid");
        //                        grid.tableGrid.create(dataConfig);
        //                }
        //        });
        //};
        /**
         * 返回接口定义。
         */
        return gaeaCommons;
        //return {
        //    datePicker:datePicker,
        //    datetimePicker: datetimePicker
        //    //initComponents:initComponents
        //}
    });