/**
 * 基于RequireJS的模块化重构。让依赖更清晰，更简单。
 *
 * Gaea Context组件。
 * 维护一个当前页的通用上下文。其实就是一个通用的缓存体系。这样可以做一些业务数据的缓存之类的。
 * 例如：
 * 对于grid，当前选中了哪几行等。
 * Created by iverson on 2017年2月23日 14:32:01
 */
define([
        "jquery", "underscore", "underscore-string", "gaeajs-common-utils-validate", "gaeajs-common-utils-string",
        "gaeajs-ui-events", "gaeajs-common-utils"
    ],
    function ($, _, _s, gaeaValid, gaeaString,
              gaeaEvent, gaeaCommonUtils) {

        var CONTEXT = {};
        var $pageContext = CONTEXT; // 这个供表达式直读值

        var isInit = false;

        var gaeaContext = {
            /**
             * 初始化上下文。主要初始化上下文的监听事件，从而实现随时更新上下文。
             * @param {object} opts
             * @param {string} opts.id                  绑定上下文事件的id。可以理解为context组件的id。
             */
            init: function (opts) {
                gaeaValid.isNull({check: opts.id, exception: "绑定的id为空，无法初始化gaea context。"});
                if (!isInit) {
                    var $context = $("#" + opts.id);
                    gaeaEvent.registerListener(gaeaEvent.DEFINE.CONTEXT.PAGE.UPDATE, "#" + opts.id, function (event, data) {
                        //$context.on(GAEA_EVENTS.DEFINE.CONTEXT.PAGE.UPDATE, function (event, data) {
                        CONTEXT = _.extend(CONTEXT, data);
                        //});
                    });

                    isInit = true;
                }
            },
            /**
             * 获取当前上下文的某个值。
             * @param key
             * @returns {*}
             */
            getValue: function (key) {
                if (gaeaValid.isNull(key)) {
                    return null;
                }
                //var $pageContext = CONTEXT;
                var value = null;
                if (gaeaValid.isNotNull(key)) {
                    // 如果符合gaea context的取值表达式规范，就可以直接读取值
                    if (gaeaContext.isGaeaContextEL(key)) {
                        value = eval(key);
                    }
                    if (gaeaValid.isNull(value)) {
                        value = CONTEXT[key];
                    }
                }
                return value;
            },
            /**
             * 把值放入上下文中。
             * @param key
             * @param value
             */
            setValue: function (key, value) {
                gaeaValid.isNull({check: key, exception: "key为空，无法把值写入上下文。"});
                CONTEXT[key] = value;
            },
            /**
             * 清空整个上下文数据。
             */
            clear: function () {
                CONTEXT = {};
            },
            /**
             * 检查某字符串是否gaea context可识别的表达式。主要就是否包含$pageContext，这是context默认的上下文对象。
             * @param str
             * @returns {boolean}
             */
            isGaeaContextEL: function (str) {
                if (gaeaValid.isNull(str)) {
                    return false;
                }
                if (_s.startsWith(str, "$pageContext.")) {
                    return true;
                }
                return false;
            }
        };

        // 私有方法
        var _private = {};


        return gaeaContext;
    });