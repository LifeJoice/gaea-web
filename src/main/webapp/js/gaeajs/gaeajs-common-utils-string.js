/**
 * Created by iverson on 2016/2/14.
 * 今天起，开始重构UR创建的一套前端js框架。重新以gaea命名。另外基于RequireJS的模块化。
 *
 * DEPENDENCE:
 * RequireJS,JQuery
 */
define([
    "jquery", "underscore", 'gaeajs-common-utils-validate', 'underscore-string', "json5"
], function ($, _, gaeaValid, _s) {
    var stringUtils = {
        /**
         * 判断两个字符是否相同
         * @param str1
         * @param str2
         * @returns {boolean}
         */
        equalsIgnoreCase: function (str1, str2) {
            if (gaeaValid.isNull(str1) || gaeaValid.isNull(str2)) {
                return false;
            }
            var compStr1 = new String(str1).valueOf().toUpperCase();
            var compStr2 = new String(str2).valueOf().toUpperCase();
            if (compStr1 === compStr2) {
                return true;
            }
            return false;
        },
        /**
         * A字符串是否含有B字符串。无视大小写。
         * @param baseStr
         * @param subStr
         * @returns {boolean}
         */
        containIgnoreCase: function (baseStr, subStr) {
            if (gaeaValid.isNull(baseStr) || gaeaValid.isNull(subStr)) {
                return false;
            }
            var compStr1 = new String(baseStr).valueOf().toUpperCase();
            var compStr2 = new String(subStr).valueOf().toUpperCase();
            if (_s.include(compStr1, compStr2)) {
                return true;
            }
            return false;
        },
        /**
         * 把一个字符串转换为json对象。主要是为了支持非严格的格式。
         * @param jsonStr 不带大括号的json对象字符串。例如：options:users,optionsText:'username',optionsValue:'username',value:userValue
         * @returns {{}}
         */
        parseJSON: function (jsonStr) {
            //var _s = require('underscore-string');
            var result = {};
            if (gaeaValid.isNull(jsonStr)) {
                return result;
            }
            // 如果进来的带有json的“{}”，去掉
            jsonStr = _s.trim(jsonStr);
            if (!_s.startsWith("{")) {
                jsonStr = "{" + jsonStr;
            }
            if (!_s.endsWith("}")) {
                jsonStr = jsonStr + "}";
            }
            result = JSON5.parse(jsonStr);
            //jsonStr = _s.ltrim(jsonStr,"{");
            //jsonStr = _s.rtrim(jsonStr,"}");
            //$(jsonStr.split(",")).each(function (index, element) {
            //    if(gaeaValid.isNotNull(element)){
            //        var itemArray = element.split(":");
            //        if(itemArray.length===2){
            //            var key = _s.trim(itemArray[0]);
            //            key = _s.trim(key,"'");// 去掉单引号
            //            var value = _s.trim(itemArray[1]);
            //            value = _s.trim(value,"'");// 去掉单引号
            //            // 设置为对象属性
            //            result[key] = value;
            //        }
            //    }
            //    console.log("element: "+this);
            //});
            return result;
        }
    };

    /**
     * 字符串格式化工具
     */
    stringUtils.format = {
        /**
         * 对代码的名字做简单格式化
         * @param name
         */
        getValidName: function (name) {
            if (gaeaValid.isNull(name)) {
                return;
            }
            // 是否带有点号。做转义处理。一些html id、name之类的"."是没有转义的.在JQuery中使用会出错.
            if (_s.include(name, ".")) {
                name = name.split(".").join("\\.");
            }
            // 是否带有中括号。做转义处理。一些html id、name之类的"[]"是没有转义的.在JQuery中使用会出错.
            if (_s.include(name, "[")) {
                name = name.split("[").join("\\[");
            }
            if (_s.include(name, "]")) {
                name = name.split("]").join("\\]");
            }
            return name;
        }
    };
    /**
     * 字符串的构造器。主要是生成各种log、提示信息等。
     */
    stringUtils.builder = {
        /**
         * 一个重构方法，类似console.log功能。“%s”作为占位符。
         * @param baseString
         * @param replaceArgs           这个是可变参数
         * @returns {*}
         */
        simpleBuild: function (baseString, replaceArgs/* ...argN */) {
            var args = Array.prototype.slice.call(arguments);
            if (_.isArray(args)) {
                args[0] = {
                    baseString: baseString
                };
            }
            return stringUtils.builder.build.apply(null, args);
        },
        /**
         * 类似console.log功能。“%s”作为占位符。
         * @param {object} opts
         * @param {string} opts.baseString              就是基础的一个字符串咯.
         * @param {boolean} opts.convertNull            把null替换为''
         * @param {string} replaceArgs                  这个是可变参数. 替换baseString里面占位符的字符串.
         */
        build: function (opts, replaceArgs) {
            if (gaeaValid.isNull(opts) || gaeaValid.isNull(opts.baseString)) {
                throw "没有baseString无法做字符串拼装工作。";
            }
            // 默认convertNull为true
            if (gaeaValid.isNull(opts.convertNull)) {
                opts.convertNull = true;
            }
            var result = opts.baseString;

            // 替换字符串
            if (_s.include(result, "%s")) {
                $.each(arguments, function (i, iValue) {
                    // 第一个参数是opts，忽略
                    if (i > 0) {
                        if (gaeaValid.isNotNull(iValue)) {
                            result = result.replace(/%s/, iValue);
                        } else {
                            var newStr = iValue;
                            // 如果要把null转换为''
                            if (_.isBoolean(opts.convertNull) && opts.convertNull) {
                                newStr = "";
                            }
                            result = result.replace(/%s/, newStr);
                        }
                    }
                });
            }
            return result;
        }
    };

    return stringUtils;
});