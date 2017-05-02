/**
 * 基于RequireJS的模块化重构。让依赖更清晰，更简单。
 *
 * input组件。
 * 带有一些特殊的功能。例如：按钮组等
 * Created by iverson on 2016-8-25 19:56:00
 */
define([
        "jquery", "underscore", 'gaeajs-common-utils-ajax', 'gaeajs-common-utils-validate',
        "gaeajs-ui-events", "gaeajs-common-utils-string", "gaeajs-ui-definition", "gaeajs-ui-plugins"],
    function ($, _, gaeaAjax, gaeaValid,
              gaeaEvents, gaeaString, GAEA_UI_DEFINE, gaeaPlugins) {

        var TEMPLATE = {
            QUERY: {
                DIV_FIELD: '' +
                '<div class="gaea-query-buttons">' +
                '<i class="iconfont icon-eq gaea-icon" data-gaea-data="value:\'eq\'"/>' +
                '<i class="iconfont icon-gt gaea-icon" data-gaea-data="value:\'gt\'" />' +
                '<i class="iconfont icon-ge gaea-icon" data-gaea-data="value:\'ge\'" />' +
                '<i class="iconfont icon-lt gaea-icon" data-gaea-data="value:\'lt\'" />' +
                '<i class="iconfont icon-le gaea-icon" data-gaea-data="value:\'le\'" />' +
                '<i class="iconfont icon-lk gaea-icon" data-gaea-data="value:\'lk\'" />' +
                '<i class="iconfont icon-ne gaea-icon" data-gaea-data="value:\'ne\'" />' +
                '<i class="gaea-icon" style="font-size: 12px;" data-gaea-data="value:\'na\'" >N/A</i>' + // style是临时的
                '<i class="gaea-icon" style="font-size: 12px;" data-gaea-data="value:\'nna\'" >nNA</i>' + // style是临时的
                '</div>' +
                '<div class="gaea-query-input-div"><input id="<%= INPUT_ID %>" data-field-id="<%= FIELD_ID %>"></div>' // 查询字段块（包括下拉按钮）
            }
        };

        var gaeaInput = {
            defaultOpts: {
                class: ""
            },
            /**
             *
             * 在一个容器中创建一个新的input，并返回这个input的jq对象。
             * @param {object} opts
             * @param {string} opts.containerId                 input的容器（div）id
             * @param {string} opts.id                          input的id
             * @param {string} opts.name                        input的name
             * @param {string} opts.class                       input的class
             * @param {string} opts.value                       input的value
             * @param {string} opts.dataType                    数据的类型：string|date|time|datetime|...
             * @param {GaeaColumnValidator} opts.validator      gaea的crud grid的编辑列的校验定义
             * @param {function} opts.onChange                  onChange事件
             * @returns {*|jQuery|HTMLElement}
             */
            create: function (opts) {
                opts = _.extend(_.clone(gaeaInput.defaultOpts), opts);
                var $inputDiv = $("#" + opts.containerId);
                var inputTemplate = _.template('<input type="text" id="<%=ID%>" name="<%=NAME%>" class="<%=CLASS%>" value="" <%= VALIDATOR_HTML %> >');
                // 这个input有没有验证。有，生成相关的HTML验证属性。
                var inputValidateAttr = gaeaValid.isNull(opts.validator) ? "" : gaeaValid.getHtml(opts.validator);
                // create input jq object
                var $input = $(inputTemplate({
                    ID: opts.id,
                    NAME: opts.name,
                    CLASS: opts.class,
                    VALIDATOR_HTML: inputValidateAttr
                }));
                // 缓存配置信息
                $input.data("gaea-options", opts);
                /**
                 * 根据系统返回的各个字段的类型定义，做相应的转化和初始化。
                 * 例如：
                 * 日期类的字段，需要初始化日期控件。
                 */
                //if (gaeaValid.isNotNull(opts.datetimeFormat)) {
                if (gaeaString.equalsIgnoreCase(opts.dataType, GAEA_UI_DEFINE.UI.DATA.DATA_TYPE_DATE)) {
                    // 初始化日期控件
                    gaeaPlugins.datePicker.init({
                        target: $input
                    });
                } else if (gaeaString.equalsIgnoreCase(opts.dataType, GAEA_UI_DEFINE.UI.DATA.DATA_TYPE_TIME)) {
                    // TODO
                } else if (gaeaString.equalsIgnoreCase(opts.dataType, GAEA_UI_DEFINE.UI.DATA.DATA_TYPE_DATETIME)) {
                    // 初始化日期时间控件
                    gaeaPlugins.datetimePicker.init({
                        target: $input
                    });
                }
                //}

                if (gaeaValid.isNotNull(opts.containerId) && $inputDiv.length > 0) {
                    $inputDiv.append($input);
                }
                // set value
                if (gaeaValid.isNotNull(opts.value)) {
                    gaeaInput.setValue({
                        target: $input,
                        value: opts.value
                    });
                }
                // 绑定事件
                if (_.isFunction(opts.onChange)) {
                    gaeaEvents.registerListener("change", $input, opts.onChange);
                }
                return $input;
            },
            /**
             * 设定input的值。
             * 会自动去检查，是个普通input框，还是某个组件（例如datetimepicker）
             * @param {object} opts
             * @param {jqSelector|jqObject} opts.target
             * @param {string|number} opts.value
             */
            setValue: function (opts) {
                gaeaValid.isNull({
                    check: opts.target,
                    exception: "目标对象（target）为空，无法设定input的值。"
                });
                var $input = $(opts.target);
                var cacheOpts = $input.data("gaea-options");

                if (gaeaString.equalsIgnoreCase(cacheOpts.dataType, GAEA_UI_DEFINE.UI.DATA.DATA_TYPE_DATE) ||
                    gaeaString.equalsIgnoreCase(cacheOpts.dataType, GAEA_UI_DEFINE.UI.DATA.DATA_TYPE_DATETIME)) {
                    /**
                     * 设定日期控件的值。
                     */
                        // 初始化日期控件
                    gaeaPlugins.datetimePicker.setValue({
                        target: $input,
                        value: opts.value
                    });
                } else {
                    /**
                     * 普通input的值
                     */
                    $input.val(opts.value);
                }
            }
        };


        var _gaeaInput = {
            /**
             *
             * @param {object} options
             * @param {object} options.jqSelector               容器选择器1
             * @param {object} options.containerId 容器div id
             * @param {object} options.inputId 组件中输入框的id
             * @param {object} options.fieldId input的data-field-id
             * @param {object} options.change 按钮组change事件的callback
             */
            init: function (options) {
                var containerId = options.containerId;
                //var defaultClass = options.defaultClass;
                var inputId = options.inputId;
                var fieldId = options.fieldId;
                var $gaeaInput = $(options.jqSelector);
                if (gaeaValid.isNull($gaeaInput)) {
                    return;
                }
                /**
                 * 初始化查询的按钮（大于、等于、小于等），和对应的input框
                 */
                var queryFieldTemplate = _.template('<input id="<%= INPUT_ID %>" data-field-id="<%= FIELD_ID %>">');
                $gaeaInput.append(queryFieldTemplate({
                    INPUT_ID: inputId,
                    FIELD_ID: fieldId
                }));
                /**
                 * 对通用表单的样式处理
                 */
                //var $queryButtons = $gaeaInput.find(".gaea-query-buttons");
                //$queryButtons.children("i").click(function () {
                //    var $clickButton = $(this);
                //    // 点击了某个按钮，例如'大于', 把按钮移到最前面去
                //    $queryButtons.prepend(this);
                //    // 触发事件
                //    var valueObj = _gaeaInput.getValue(containerId);
                //    if (gaeaValid.isNotNull(valueObj)) {
                //        options = _.extend(options, valueObj);
                //        $gaeaInput.trigger(GAEA_EVENTS.DEFINE.UI.INPUT.CHANGE, options);
                //    }
                //});
                /**
                 * 绑定相关事件
                 */
                //_gaeaInput.initEventBinding(options);
            }
            //initEventBinding: function (options) {
            //    //var $gaeaInput = $("#" + options.containerId);
            //    GAEA_EVENTS.registerListener(GAEA_EVENTS.DEFINE.UI.INPUT.CHANGE, "#" + options.containerId, function (event, data) {
            //        var value = _gaeaInput.getValue(data.containerId);
            //        // 回调函数
            //        if (_.isFunction(options.change)) {
            //            options.change(data);
            //        }
            //    });
            //},
            /**
             * 重构到gaea.ui.grid.query中
             * @param containerId 整个gaeaInput的容器id. 例如：class= 'gaea-query-field head-query-column'
             * @returns gaeaInput里面的input的值
             */
            //getValue: function (containerId) {
            //    var result = null;
            //    var $gaeaInput = $("#" + containerId);// gaeaInput的容器。包含按钮组、输入框等
            //    if (gaeaValid.isNotNull($gaeaInput)) {
            //        // 找到gaeaInput的输入框,获取其中的值
            //        var $input = $gaeaInput.find("input");
            //        if (gaeaValid.isNotNull($input)) {
            //            //result = $input.val();
            //            // 获取gaeaInput的按钮值
            //            var dataConfigStr = $gaeaInput.find(".gaea-query-buttons i:first").data("gaea-data");
            //            var dataConfig = gaeaString.parseJSON(dataConfigStr);
            //            result = {
            //                value: $input.val(),
            //                op: dataConfig.value
            //            };
            //        }
            //    }
            //    return result;
            //}
        };
        return {
            init: _gaeaInput.init,
            create: gaeaInput.create
        };
    });