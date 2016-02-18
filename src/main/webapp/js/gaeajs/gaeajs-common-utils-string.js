/**
 * Created by iverson on 2016/2/14.
 * 今天起，开始重构UR创建的一套前端js框架。重新以gaea命名。另外基于RequireJS的模块化。
 *
 * DEPENDENCE:
 * RequireJS,JQuery
 */
define(["jquery","underscore",'gaeajs-common-utils-validate'],function ($,_,gaeaValid) {
    var stringUtils = {
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
        }
    }
    return stringUtils;
})