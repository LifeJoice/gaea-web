/**
 * 基于RequireJS的模块化重构。让依赖更清晰，更简单。
 * 对通用表单的处理。目前主要是做一些样式的处理。
 * 功能：
 * 动态根据表单内容对表单的样式进行处理。例如：
 * 1. 如果发现一行只有一个字段的，就会把字段的长度填充满整行。
 * Created by iverson on 2016-2-19 20:27:30
 */
define(["jquery", "underscore", 'gaeajs-common-utils-ajax', 'gaeajs-common-utils-validate'], function ($, _, gaeaAjax, gaeaValid) {
    var _gaeaForm = {
        init: function (divClass) {
            var $gaeaForm = $("."+divClass);
            if(gaeaValid.isNull($gaeaForm)){
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
                    fieldBlocks.children(".fieldvalue").addClass("one-field");
                    fieldBlocks.find("input").addClass("one-field");
                    fieldBlocks.find("textarea").addClass("one-field");
                    // 加上margin，避免输入框过长挤到下面了
                    var width = fieldBlocks.find(".fieldname").css("width");
                    fieldBlocks.find(".fieldvalue").css("margin-left", width);
                }
            })
        }
    };
    return _gaeaForm;
})