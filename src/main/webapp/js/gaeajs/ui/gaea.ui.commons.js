/**
 * Created by iverson on 2016-6-19 18:17:59.
 * 今天起，开始重构UR创建的一套前端js框架。重新以gaea命名。另外基于RequireJS的模块化。
 * 通用的UI组件的公用包。因为有些组件，只是做一个接口层的封装，本身并不会很复杂。例如：日期时间控件等。
 */
define(["jquery",'gaeajs-common-utils-validate',"datetimepicker"], function ($,gaeaValid,jqDateTimePicker) {
    /**
     * DateTime Picker
     * 2016-6-19 18:19:14
     */
    var datePicker = {
        options:{
            renderTo:null
        },
        init: function (options) {
            if(gaeaValid.isNull(options.renderTo)){
                console.log("renderTo属性不允许为空！");
                return;
            }
            var $datePicker = $("#"+options.renderTo);
            $datePicker.datetimepicker({
                yearStart: 2015,
                dayOfWeekStart: 1,
                timepicker:false,
                lang: 'ch',
                format:'Y-m-d',
                //format:'Y-m-d H:i',
                closeOnDateSelect:true,
                defaultDate: new Date()
                //minTime: '8:30',
                //maxTime: '18:10',
                //defaultTime: '08:30',
                //step: 10
            });
            //$datePicker.datetimepicker({
            //    yearStart: 2015,
            //    dayOfWeekStart: 1,
            //    lang: 'ch',
            //    format:'Y-m-d H:i',
            //    defaultDate: new Date(),
            //    minTime: '8:30',
            //    maxTime: '18:10',
            //    defaultTime: '08:30',
            //    step: 10
            //});
        }
    };
    /**
     * 日期时间的控件
     * 2016-6-22 16:45:55 by Iverson
     */
    var datetimePicker = {
        options:{
            renderTo:null
        },
        init: function (options) {
            if(gaeaValid.isNull(options.renderTo)){
                console.log("renderTo属性不允许为空！");
                return;
            }
            var $datetimePicker = $("#"+options.renderTo);
            $datetimePicker.datetimepicker({
                yearStart: 2015,
                dayOfWeekStart: 1,
                //timepicker:false,
                lang: 'ch',
                //format:'Y-m-d',
                format:'Y-m-d H:i',
                closeOnDateSelect:true,
                defaultDate: new Date(),
                minTime: '8:30',
                maxTime: '18:10',
                defaultTime: '09:00',
                step: 10
            });
        }

    };
    /**
     * 返回接口定义。
     */
    return {
        datePicker:datePicker,
        datetimePicker: datetimePicker
    }
});