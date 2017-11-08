/**
 * 基于RequireJS的模块化重构。让依赖更清晰，更简单。
 *
 * Gaea Context组件。
 * 维护一个当前页的通用上下文。其实就是一个通用的缓存体系。这样可以做一些业务数据的缓存之类的。
 * 例如：
 * 对于grid，当前选中了哪几行等。
 * Created by iverson on 2017年2月23日 14:32:01
 */

/**
 * 缓存的属性说明。
 *
 * @typedef {object} GaeaContext
 * @property {string} id                            selected row id
 * @property {object} selectedRow                   选中的行
 * @property {object[]} selectedRows                选中的多行
 * @property {object} gaeaViewChain                 gaea.ui.chain 链的相关数据
 * @property {object} viewChain                     view链的相关数据
 //* @property {ServerDialog.Button[]} buttons
 */
define([
        "jquery", "underscore", "underscore-string", "gaeajs-common-utils-validate", "gaeajs-common-utils-string",
        "gaeajs-ui-events", "gaeajs-common-utils"
    ],
    function ($, _, _s, gaeaValid, gaeaString,
              gaeaEvent, gaeaCommonUtils) {

        /**
         * gaeaContext组件，依赖页面有一个
         * <span class="gaea-sys-content-context"></span>
         * 的元素，作为缓存data关联的对象。
         */
        if ($(".gaea-sys-content-context").length < 1) {
            throw "缺少class=gaea-sys-content-context元素，初始化gaeaContext组件失败！";
        }
        var CONTEXT = $(".gaea-sys-content-context").data();

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
                var $pageContext = CONTEXT;
                var value = "";
                // 如果符合gaea context的取值表达式规范，就可以直接读取值
                if (gaeaContext.isGaeaContextEL(key)) {
                    // 按照gaea框架标准格式化表达式
                    key = _private.gaeaEL.formatName(key);
                    try {
                        value = eval(key);
                        if (gaeaValid.isNull(value)) {
                            value = "";
                        }
                        return value;
                    } catch (err) {
                        // debug. 上下文有点像黑盒，有时候可能不知道哪里的值缺失了
                        tools.gaeaEL.debugUndefined(key);
                    }
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
             * AI.TODO 这个尚未彻底改造完！key还是只能两级！
             * @param {string} rootKey          某个key。一般表示某一类的缓存，例如：selectRows
             * @param {string...} [id]          组件id1, [id1.]id2, [id1.id2.]id3。动态数组。例如两个grid的selectRows，就必须通过两个id区分。
             * @param val                       值
             */
            setValue: function (rootKey, id, val) {
                gaeaValid.isNull({check: rootKey, exception: "key为空，无法把值写入上下文。"});
                var value = arguments[arguments.length - 1];
                // init key
                if (gaeaValid.isNull(CONTEXT[rootKey])) {
                    CONTEXT[rootKey] = {};
                }
                // set key->id value
                if (arguments.length == 1) {
                    // 只有一个参数，直接叠加值
                    _.extend(CONTEXT, value);
                } else if (gaeaValid.isNull(id) || arguments.length < 3) {
                    CONTEXT[rootKey] = value;
                } else {
                    CONTEXT[rootKey][id] = value;
                }
                // refresh
                $(".gaea-sys-content-context").data(CONTEXT);
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
            },
            /**
             * 获取整个上下文。一般情况不建议直接调用，这个主要是给validator做表达式验证用！
             * @returns {*|jQuery}
             */
            getContext: function () {
                return $(".gaea-sys-content-context").data();
            },
            /**
             * 把某个带有上下文变量的字符串（同时含有其他普通字符），把上下文变量替换成实际的值。
             * 例如：
             * "确定要执行编辑操作？$pageContext[selectedRow][gaea-grid-ct][className]"  --->  "确定要执行编辑操作？一年二班"
             * @param elStr 某个带有（也可以不带有）上下文变量$pageContext的字符串
             * @returns {*}
             */
            parseElString: function (elStr) {
                if (gaeaValid.isNull(elStr)) {
                    return;
                }
                if (!_s.include(elStr, "$pageContext")) {
                    return elStr;
                }
                // 按照gaea框架标准格式化表达式
                elStr = _private.gaeaEL.formatName(elStr);
                //value = eval(key);
                var result = _private.gaeaEL.parseExpString(elStr, gaeaContext.getContext());
                return result;
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
                    // 转换特殊定义符
                    name = _private.gaeaEL.convertEL(name);
                    return name;
                },
                /**
                 * 负责把一个含有gaea的表达式的string，转换为一个标准string。
                 * gaea表达式中含有$pageContext变量，把这些变量转换为实际的值。getValue只能获取$pageContext开始的，而这个方法能获取$pageContext在字符串任意位置的。
                 * <p>
                 * 例如：
                 *      你好啊，$pageContext['selectedRow']['gaea-grid-ct']['className'] 的第 $pageContext['selectedRow']['gaea-grid-ct']['termYear']届同学
                 *      -------->>>> 你好啊，一年二班 的第 2015届同学
                 * </p>
                 * @param origString
                 */
                parseExpString: function (origString, $pageContext) {
                    //var origString = "你好啊，$pageContext['selectedRow']['gaea-grid-ct']['className'] 的第 $pageContext['selectedRow']['gaea-grid-ct']['termYear']届同学";
                    //var $pageContext = $(".gaea-sys-content-context").data();

                    var gaeaExpPattern = /\$pageContext(?:\[[\w\-_.']*\])*/g;
                    var checkResult; // exp pattern执行检查后返回的对象
                    var i = 0;
                    var matchExpArr = []; // 所有匹配的关键字的数组

                    while ((checkResult = gaeaExpPattern.exec(origString)) != null) {
                        //console.log(checkResult);
                        matchExpArr.push(checkResult[0]);
//console.log("replaced: \n"+exp.replace(result[0],eval(result[0])));
//                        i++;
//                        if(i>5){break;};
                    }
                    // 再根据匹配后的关键字，一个个替换
                    for (var j = 0; j < matchExpArr.length; j++) {
                        origString = origString.replace(matchExpArr[j], eval(matchExpArr[j]));
                    }
                    //console.log("after replace: "+origString);
                    return origString;
                },
                /**
                 * 转换表达式的特殊定义符({gaea#***})等。
                 * @param origExp
                 */
                convertEL: function (origExp) {
                    origExp = _s.replaceAll(origExp, "{gaea#and}", "&&");
                    origExp = _s.replaceAll(origExp, "{gaea#or}", "||");
                    origExp = _s.replaceAll(origExp, "{gaea#gt}", ">");
                    origExp = _s.replaceAll(origExp, "{gaea#lt}", "<");
                    origExp = _s.replaceAll(origExp, "{gaea#ge}", ">=");
                    origExp = _s.replaceAll(origExp, "{gaea#le}", "<=");
                    return origExp;
                }
            }
        };

        // 工具
        var tools = {
            gaeaEL: {
                debugUndefined: function (elStr) {
                    try {
                        var partEL = "";
                        // 这个供表达式直读值, 不能看没引用就删掉
                        // 获取缓存context。不知道为什么不能直接访问到CONTEXT变量
                        var $pageContext = $(".gaea-sys-content-context").data();
                        /**
                         * 参考：
                         "$pageContext['selectedRow']['gaea-grid-ct']['name']".split(/(\[[\'\w\']*\])/);
                         result ==> ["$pageContext", "['selectedRow']", "['gaea-grid-ct']", "['name']", ""]
                         */
                        $.each(elStr.split(/(\[\'[\w]*\'\])/g), function (i, iValue) {
                            if (gaeaValid.isNull(iValue)) {
                                return;
                            }
                            partEL += iValue;
                            if (i > 0) {
                                if (gaeaValid.isNull(eval(partEL))) {
                                    console.warn("尝试执行 %s 获取上下文的值，但 %s 部分为空！", elStr, partEL);
                                    return false;
                                }
                            }
                        });
                    } catch (err) {
                        console.warn("debug失败。输入string：%s", elStr);
                    }
                }
            }
        };

        return _.extend(gaeaContext, {
            formatName: _private.gaeaEL.formatName
        });
    });