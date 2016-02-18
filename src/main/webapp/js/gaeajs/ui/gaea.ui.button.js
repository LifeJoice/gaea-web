/**
 * 基于RequireJS的模块化重构。让依赖更清晰，更简单。
 * Created by iverson on 2016-2-17 11:48:52.
 */
define(["jquery","underscore",'gaeajs-common-utils-ajax','gaeajs-common-utils-validate'],function ($,_,gaeaAjax,gaeaValid) {
    var button = {
        create: function (btnOptions) {
            var buttonHtml = "";
            if (gaeaValid.isNotNull(btnOptions.size) && "small" == btnOptions.size) {
                html = "<a id='" + btnOptions.htmlId + "'" +
                    " class=\"small darkslategrey button\">" +
                    "<span>" +
                    btnOptions.text +
                    "</span>" +
                    "</a>";
            } else {
                html = "<a id='" + btnOptions.htmlId + "'" +
                    " class=\"medium darkslategrey button\">" +
                    "<span>" +
                    btnOptions.text +
                    "</span>" +
                    "</a>";
            }
            return html;
        }
    };
    /**
     * 返回（暴露）的接口
     */
    return button;
})