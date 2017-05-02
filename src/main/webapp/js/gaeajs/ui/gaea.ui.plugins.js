/**
 * 今天起，开始重构UR创建的一套前端js框架。重新以gaea命名。另外基于RequireJS的模块化。
 *
 *
 * 插件的公用包。各种插件的封装调用就放在这里。
 * 因为有些插件会和自己的require模块冲突。从commons包分离出来。
 * 因为有些组件，只是做一个接口层的封装，本身并不会很复杂。例如：日期时间控件等。
 * copy from gaea.ui.commons.
 * Created by iverson on 2016-7-26 15:22:30
 */
define([
        "jquery", "underscore", 'underscore-string',
        'gaeajs-common-utils-validate', "datetimepicker", "gaeajs-common-utils-string"
    ],
    function ($, _, _s,
              gaeaValid, jqDateTimePicker, gaeaString) { // jqDateTimePicker不用，但依赖，需要导入
        /**
         * DateTime Picker
         * 2016-6-19 18:19:14
         */
        var datePicker = {
            options: {
                renderTo: null
            },
            /**
             *
             * @param {object} options
             * @param {jqSelector|jqObject} options.target
             */
            init: function (options) {
                if (gaeaValid.isNull(options.target)) {
                    throw "target为空，无法创建dateTimePicker！";
                }
                var $datePicker = $(options.target);
                $datePicker.datetimepicker({
                    yearStart: 2015,
                    dayOfWeekStart: 1,
                    timepicker: false,
                    lang: 'ch',
                    format: 'Y-m-d',
                    //format:'Y-m-d H:i',
                    closeOnDateSelect: true,
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
            options: {
                target: null
            },
            /**
             *
             * @param {object} options
             * @param {jqSelector|jqObject} options.target
             */
            init: function (options) {
                if (gaeaValid.isNull(options.target)) {
                    throw "target为空，无法创建dateTimePicker！";
                }
                var $datetimePicker = $(options.target);
                $datetimePicker.datetimepicker({
                    yearStart: 2015,
                    dayOfWeekStart: 1,
                    //timepicker:false,
                    lang: 'ch',
                    //format:'Y-m-d',
                    format: 'Y-m-d H:i',
                    closeOnDateSelect: true,
                    defaultDate: new Date(),
                    minTime: '8:30',
                    maxTime: '18:10',
                    defaultTime: '09:00',
                    step: 10
                });
            },
            /**
             * 这个是DatePicker和DateTimePicker通用的。
             *
             * @param {object} options
             * @param {jqSelector|jqObject} options.target
             * @param {string|number} options.value
             */
            setValue: function (options) {
                gaeaValid.isNull({
                    check: options.target,
                    exception: "目标对象（target）为空，无法设定datetimepicker的值。"
                });
                if (gaeaValid.isNotNull(options.value)) {
                    // 如果是数值，就用new Date
                    if (_.isNumber(options.value)) {
                        $(options.target).datetimepicker({
                            value: new Date(options.value)
                        });
                    } else if (_.isString(options.value)) {
                        /**
                         * 如果是字符串，要求和datetimepicker的格式一致的字符串，例如：2017-1-1
                         */
                        $(options.target).datetimepicker({
                            value: options.value
                        });
                    }
                }
            }

        };

        /**
         * 滚动自动居中小插件。
         * 选择器选择的是，要居中的容器（一般是某div）。
         * @param {object} opts
         * @param {*} opts.target               监控的目标滚动对象
         * @param {int} opts.timeout            超时的时间，每隔多少ms刷新一次位置。
         * @param {int} opts.extraMinus         距离左边额外减去的量。例如，对于内容区，可能得减去左边的菜单栏才准；但如果在dialog里面，就不需要减了。
         */
        $.fn.extend({
            gaeaScrollCenter: function (options) {
                //if (gaeaValid.isNull(options.target)) {
                //    throw "target参数为空，无法初始化gaeaScrollCenter.";
                //}
                var defaultOpts = {
                    timeout: 250,
                    extraMinus: 0
                };
                options = $.extend({}, defaultOpts, options);
                var $centerDiv = $(this);
                var $target = $(options.target);
                $target.scroll(function () {
                    var timer = $(this).data('gaeaScrollCenterTimer');
                    // 每次滚动的时候都清空这个计时器
                    clearTimeout(timer);
                    // 设定计时器，时间到执行function
                    $(this).data('gaeaScrollCenterTimer', setTimeout(function () {
                        /**
                         * scrollLeft：滚动的（看不到的）前半部分
                         * offset().left：当前块在当前可视区（下图实线部分）距离左边的距离
                         * <-   scrollLeft   ->
                         *                     |<-    offset().left ->|
                         * ...................._________________________________________________________.......
                         *                                             |                     |
                         *                                             |     target div      |
                         *                                             |                     |
                         * ...................._________________________________________________________.......
                         */
                        var scrollLeft = $target.scrollLeft();
                        var myLeft = scrollLeft + ($target.width() / 2) - $centerDiv.width() / 2 - options.extraMinus;
                        $centerDiv.animate({left: myLeft + 'px'});
                    }, options.timeout));
                });

            }
        });

        /**
         * 返回接口定义。
         */
        return {
            datePicker: datePicker,
            datetimePicker: datetimePicker
            //initComponents:initComponents
        }
    });