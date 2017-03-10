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
        SUCCESS: "success",
        FAIL: "fail",
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
                    'right': '5px',
                    "bottom": "5px",
                    'z-index': '9999'
                });
        },
        message: function (msg) {
            gaeaNotify.show({
                msg: msg,
                msgType: msgDefaultType.DEFAULT
            });
        },
        success: function (msg) {
            gaeaNotify.show({
                msg: msg,
                msgType: msgDefaultType.SUCCESS
            });
        },
        fail: function (msg) {
            gaeaNotify.show({
                msg: msg,
                msgType: msgDefaultType.FAIL
            });
        },
        warn: function (msg) {
            gaeaNotify.show({
                msg: msg,
                msgType: msgDefaultType.WARN
            });
        },
        error: function (msg) {
            gaeaNotify.show({
                msg: msg,
                msgType: msgDefaultType.ERROR
            });
        },
        /**
         * 这个主要是做个映射。因为jnotify插件不一定能支持那么多类型。
         * @param {object} opts
         * @param {string} opts.msgType             消息类型。需要是gaeaNotify支持的。
         * @param {string} opts.msg                 消息体
         */
        show: function (opts) {
            if (gaeaStringUtils.equalsIgnoreCase(msgDefaultType.DEFAULT, opts.msgType)) {
                $notify.jnotifyAddMessage({
                    text: opts.msg,
                    permanent: false,
                    type: 'message'
                });
            } else if (gaeaStringUtils.equalsIgnoreCase(msgDefaultType.SUCCESS, opts.msgType) ||
                gaeaStringUtils.equalsIgnoreCase(msgDefaultType.FAIL, opts.msgType)) {
                $notify.jnotifyAddMessage({
                    text: opts.msg,
                    permanent: false,
                    type: opts.msgType
                });
            } else if (gaeaStringUtils.equalsIgnoreCase(msgDefaultType.WARN, opts.msgType) ||
                gaeaStringUtils.equalsIgnoreCase(msgDefaultType.ERROR, opts.msgType)) {
                $notify.jnotifyAddMessage({
                    text: opts.msg,
                    permanent: false,
                    type: 'error'
                });
            }
        }
    };
    return gaeaNotify;
});