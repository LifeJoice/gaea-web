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
             * @param {string} key          某个key。一般表示某一类的缓存，例如：selectRows
             * @param {string} [id]         组件id。例如两个grid的selectRows，就必须通过两个id区分。
             * @returns {*}
             */
            getValue: function (key, id) {
                if (gaeaValid.isNull(key)) {
                    return null;
                }
                //var $pageContext = CONTEXT;
                var value = null;
                // 如果符合gaea context的取值表达式规范，就可以直接读取值
                if (gaeaContext.isGaeaContextEL(key)) {
                    // 按照gaea框架标准格式化表达式
                    key = _private.gaeaEL.formatName(key);
                    value = eval(key);
                }
                // 如果经过表达式检查，值为空，以普通方式获取值。
                if (gaeaValid.isNull(value)) {
                    // 如果context[key]已经空了，就返回
                    if (gaeaValid.isNull(CONTEXT[key])) {
                        return;
                    }
                    // 如果context[key]不为空，还得进一步找context[key][id]是否为空，再返回
                    if (gaeaValid.isNotNull(id)) {
                        value = CONTEXT[key][id];
                    } else {
                        value = CONTEXT[key];
                    }
                }
                return value;
            },
            /**
             * 把值放入上下文中。
             * @param {string} key          某个key。一般表示某一类的缓存，例如：selectRows
             * @param {string} [id]         组件id。例如两个grid的selectRows，就必须通过两个id区分。
             * @param value
             */
            setValue: function (key, id, value) {
                gaeaValid.isNull({check: key, exception: "key为空，无法把值写入上下文。"});
                // init key
                if (gaeaValid.isNull(CONTEXT[key])) {
                    CONTEXT[key] = {};
                }
                // set key->id value
                if (gaeaValid.isNull(id)) {
                    CONTEXT[key] = value;
                } else {
                    CONTEXT[key][id] = value;
                }
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
                if (_s.startsWith(str, "$pageContext")) {
                    return true;
                }
                return false;
            }
        };

        // 私有方法
        var _private = {
            /**
             * gaea框架的特定表达式的处理
             */
            gaeaEL: {
                /**
                 * gaea EL的转换。
                 * <p>
                 * 主要是，JSON5在做对象转换的时候，单引号'是特殊字符。
                 * 如果在HTML页面引用一个对象的属性，而且名字比较特殊，例如：
                 * user['parent-id']...
                 * 这样的话，对于JSON5首先就得做特殊字符转换，例如：\\'
                 * 如果多个子对象就会非常复杂和难看。
                 * </p>
                 * 所以，gaea EL简化了这种写法，你只需要写user[parent-id][...]，剩下的这个方法会帮你格式化。
                 * @param name
                 */
                formatName: function (name) {
                    if (gaeaValid.isNull(name)) {
                        return;
                    }
                    name = name.replace(/\[([\w\-_.]*)\]/g, "['$1']");
                    return name;
                }
            }
        };


        return gaeaContext;
    });