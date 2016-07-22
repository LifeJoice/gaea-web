/**
 * Created by iverson on 2016/2/14.
 * 今天起，开始重构UR创建的一套前端js框架。重新以gaea命名。另外基于RequireJS的模块化。
 *
 * DEPENDENCE:
 * RequireJS,JQuery
 */
define([
    "jquery","underscore",'gaeajs-common-utils-validate','underscore-string',"json5"
],function (
    $,_,gaeaValid,_s) {
    var stringUtils = {
        /**
         * 判断两个字符是否相同
         * @param str1
         * @param str2
         * @returns {boolean}
         */
        equalsIgnoreCase: function (str1,str2) {
            if(gaeaValid.isNull(str1)||gaeaValid.isNull(str2)){
                return false;
            }
            var compStr1 = new String(str1).valueOf().toUpperCase();
            var compStr2 = new String(str2).valueOf().toUpperCase();
            if(compStr1 === compStr2){
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
            if(gaeaValid.isNull(jsonStr)){
                return result;
            }
            // 如果进来的带有json的“{}”，去掉
            jsonStr = _s.trim(jsonStr);
            if(!_s.startsWith("{")){
                jsonStr = "{"+jsonStr;
            }
            if(!_s.endsWith("}")){
                jsonStr = jsonStr+"}";
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
    return stringUtils;
});