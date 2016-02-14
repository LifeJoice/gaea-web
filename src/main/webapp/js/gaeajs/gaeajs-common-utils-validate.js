/**
 * Created by iverson on 2016/2/14.
 * 今天起，开始重构UR创建的一套前端js框架。重新以gaea命名。另外基于RequireJS的模块化。
 *
 * DEPENDENCE:
 * RequireJS,JQuery,重写的Date.format
 */
define(["underscore"],function (_) {
    var isNotNull = function (inArg) {
        try {
            if (_.isNull(inArg)) {
                return false;
            }
            if (_.isUndefined(inArg)) {
                return false;
            }
        } catch (error) {
            console.log("错误信息：" + error.message);
            if (error.message.indexOf("undefined")) {
                return false;
            }
        }
        return true;
    };
    var isNull = function (inArg) {
        if (_.isNull(inArg)) {
            return true;
        }
        if (_.isUndefined(inArg)) {
            return true;
        }
        return false;
    };
    var isNotNullArray = function (inArg) {
        if(isNull(inArg)){
            return false;
        }
        if(_.isArray(inArg) && inArg.length>0){
            return true;
        }
        return false;
    }
    return {
        isNull: isNull,
        isNotNull: isNotNull,
        isNotNullArray:isNotNullArray
    }
})