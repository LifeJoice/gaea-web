/**
 * 基于RequireJS的模块化重构。让依赖更清晰，更简单。
 *
 * input组件。
 * 带有一些特殊的功能。例如：按钮组等
 * Created by iverson on 2016-8-25 19:56:00
 */
define([
        "jquery", "underscore", 'gaeajs-common-utils-ajax', 'gaeajs-common-utils-validate',
        "gaeajs-ui-events", "gaeajs-common-utils-string", "gaeajs-ui-definition"],
    function ($, _, gaeaAjax, gaeaValid,
              GAEA_EVENTS, gaeaString, GAEA_UI_DEFINE) {

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


        var _gaeaInput = {
            /**
             *
             * @param options
             *              containerId 容器div id
             *              inputId 组件中输入框的id
             *              fieldId input的data-field-id
             *              change 按钮组change事件的callback
             */
            init: function (options) {
                var containerId = options.containerId;
                //var defaultClass = options.defaultClass;
                var inputId = options.inputId;
                var fieldId = options.fieldId;
                var $gaeaInput = $("#" + containerId);
                if (gaeaValid.isNull($gaeaInput)) {
                    return;
                }
                /**
                 * 初始化查询的按钮（大于、等于、小于等），和对应的input框
                 */
                var queryFieldTemplate = _.template(TEMPLATE.QUERY.DIV_FIELD);
                $gaeaInput.html(queryFieldTemplate({
                    INPUT_ID: inputId,
                    FIELD_ID: fieldId
                }));
                /**
                 * 对通用表单的样式处理
                 */
                var $queryButtons = $gaeaInput.find(".gaea-query-buttons");
                $queryButtons.children("i").click(function () {
                    var $clickButton = $(this);
                    // 点击了某个按钮，例如'大于', 把按钮移到最前面去
                    $queryButtons.prepend(this);
                    // 触发事件
                    var valueObj = _gaeaInput.getValue(containerId);
                    if (gaeaValid.isNotNull(valueObj)) {
                        options = _.extend(options, valueObj);
                        $gaeaInput.trigger(GAEA_EVENTS.DEFINE.UI.INPUT.CHANGE, options);
                    }
                });
                /**
                 * 绑定相关事件
                 */
                _gaeaInput.initEventBinding(options);
            },
            initEventBinding: function (options) {
                var $gaeaInput = $("#" + options.containerId);
                $gaeaInput.on(GAEA_EVENTS.DEFINE.UI.INPUT.CHANGE, function (event, data) {
                    var value = _gaeaInput.getValue(data.containerId);
                    // 回调函数
                    if (_.isFunction(options.change)) {
                        options.change(data);
                    }
                });
            },
            /**
             *
             * @param containerId 整个gaeaInput的容器id. 例如：class= 'gaea-query-field head-query-column'
             * @returns gaeaInput里面的input的值
             */
            getValue: function (containerId) {
                var result = null;
                var $gaeaInput = $("#" + containerId);// gaeaInput的容器。包含按钮组、输入框等
                if (gaeaValid.isNotNull($gaeaInput)) {
                    // 找到gaeaInput的输入框,获取其中的值
                    var $input = $gaeaInput.find("input");
                    if (gaeaValid.isNotNull($input)) {
                        //result = $input.val();
                        // 获取gaeaInput的按钮值
                        var dataConfigStr = $gaeaInput.find(".gaea-query-buttons i:first").data("gaea-data");
                        var dataConfig = gaeaString.parseJSON(dataConfigStr);
                        result = {
                            value: $input.val(),
                            op: dataConfig.value
                        };
                    }
                }
                return result;
            }
        };
        return _gaeaInput;
    });