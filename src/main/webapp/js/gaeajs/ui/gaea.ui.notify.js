/**
 * Created by iverson on 2016-5-17 15:25:33.
 * 今天起，开始重构UR创建的一套前端js框架。重新以gaea命名。另外基于RequireJS的模块化。
 * 2016-5-17 15:25:50
 * 提供页面的消息提醒的一个统一接口（facade）。封装一些自己用的接口，再去调用其他框架。
 * DEPENDENCE:
 * RequireJS,JQuery
 */
define(["jquery", "underscore", 'jquery-notify', 'gaeajs-common-utils-string'], function ($, _, jNotify, gaeaStringUtils) {
    var $notify = $("#gaea-notify");
    var options = {
        msgType: "message",
        msg: ""
    };
    var msgDefaultType = {
        DEFAULT: "message",
        WARN: "warn",
        ERROR: "error"
    };
    var gaeaNotify = {
        init: function () {
            $notify.jnotifyInizialize({
                    oneAtTime: false,
                    appendType: 'append'
                })
                .css({
                    'position': 'absolute',
//                            'marginTop': '20px',
                    'right': '20px',
                    "bottom": "10px",
                    'width': '250px',
                    'z-index': '9999'
                });
        },
        message: function (msg) {
            gaeaNotify.show(msg, msgDefaultType.DEFAULT);
        },
        warn: function (msg) {
            gaeaNotify.show(msg, msgDefaultType.WARN);
        },
        error: function (msg) {
            gaeaNotify.show(msg, msgDefaultType.ERROR);
        },
        show: function (msg, msgType) {
            //options = $.extend({},options,opt);
            if (gaeaStringUtils.equalsIgnoreCase(msgDefaultType.DEFAULT, msgType)) {
                $notify.jnotifyAddMessage({
                    text: msg,
                    permanent: false,
                    type: 'message'
                });
            } else if (gaeaStringUtils.equalsIgnoreCase(msgDefaultType.WARN, msgType)) {
                $notify.jnotifyAddMessage({
                    text: msg,
                    permanent: false,
                    type: 'error'
                });
            } else if (gaeaStringUtils.equalsIgnoreCase(msgDefaultType.ERROR, msgType)) {
                $notify.jnotifyAddMessage({
                    text: msg,
                    permanent: false,
                    type: 'error'
                });
            }
        }
    };
    return gaeaNotify;
});