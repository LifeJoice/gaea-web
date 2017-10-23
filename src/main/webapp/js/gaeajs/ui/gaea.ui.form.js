/**
 * 基于RequireJS的模块化重构。让依赖更清晰，更简单。
 * 对通用表单的处理。目前主要是做一些样式的处理。
 * 功能：
 * 动态根据表单内容对表单的样式进行处理。例如：
 * 1. 如果发现一行只有一个字段的，就会把字段的长度填充满整行。
 * Created by iverson on 2016-2-19 20:27:30
 */
define([
        "jquery", "underscore", 'gaeajs-common-utils-ajax', 'gaeajs-common-utils-validate',
        "gaeajs-common"],
    function ($, _, gaeaAjax, gaeaValid,
              gaeaCommon) {
        var _gaeaForm = {
            options: {
                containerClass: null,
                enableValidate: true // 是否启用通用校验。
            },
            init: function (opts) {
                var myOptions = _.clone(_gaeaForm.options);
                myOptions = _.extend(myOptions, opts);
                var $gaeaForm = $("." + myOptions.containerClass);
                if (gaeaValid.isNull($gaeaForm)) {
                    return;
                }
                /**
                 * 对通用表单的样式处理
                 */
                $gaeaForm.children(".row").each(function (key, value) {
                    var fieldBlocks = $(this).children(".field-block");
                    var fieldsCount = fieldBlocks.length;
                    // 如果是一行就一个输入项，则自动把输入框延展到最后
                    if (fieldsCount == 1) {
                        fieldBlocks.removeClass("field-block").addClass("one-field-block");
                        //fieldBlocks.children(".fieldvalue").addClass("one-field");
                        //fieldBlocks.find("input").addClass("one-field");
                        //fieldBlocks.find("textarea").addClass("one-field");
                        // 加上margin，避免输入框过长挤到下面了
                        //var width = fieldBlocks.find(".fieldname").css("width");
                        //fieldBlocks.find(".fieldvalue").css("margin-left", width);
                    }
                });
                /**
                 * 初始化启用表单校验。
                 * 但即使不启用，如果用HTML5的方式，浏览器还是会默认校验。所以可能在低版本浏览器才有用。
                 */
                if (myOptions.enableValidate) {
                    $gaeaForm.gaeaValidate();
                }
            }
        };

        /**
         * 获取某个dialog（例如data-filter-dialog）相关的dialog的form的数据，作为gaeaContext构造查询条件。
         * 怎么找关联的dialog？通过dialog弹出链找到最顶级的dialog，下面的第一个form。
         * 因为像data-filter-dialog这种，它不是构建在顶级dialog里面的，不能直接通过元素父级找。
         * @param {string} dialogId
         */
        _gaeaForm.getRelateFormData = function (dialogId) {
            var gaeaUIChain = require("gaeajs-ui-chain");
            var rootDialogId = gaeaUIChain.getRootId(dialogId);
            var $rootDialog = $("#" + rootDialogId);
            var result = {};
            if ($rootDialog.length > 0 && $rootDialog.find("form:first").length > 0) {
                var $form = $rootDialog.find("form:first");
                if (gaeaValid.isNull($form.attr("id"))) {
                    return result;
                }
                var formId = $form.attr("id");
                result[formId] = $form.serializeObject();
            }
            return result;
        };

        return _gaeaForm;
    });