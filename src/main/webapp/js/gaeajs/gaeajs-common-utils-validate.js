/**
 * Created by iverson on 2016/2/14.
 * 今天起，开始重构UR创建的一套前端js框架。重新以gaea命名。另外基于RequireJS的模块化。
 *
 * DEPENDENCE:
 * RequireJS,JQuery,重写的Date.format
 */
define(["jquery","underscore"],function ($,_) {
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
    };
    /**
     * 判断一个多级的对象是否为空。这对动态生成的对象特别有用。
     * 例如：
     * gaea.macula.views.dialogs是否为空？如果往常我们需要用4个if逐级判断，现在只需要：
     * isNotNullMultiple(obj,['macula','views','dialogs'])      // 因为rootObj就是ur对象
     * 即可。
     * @param rootObj           要检测的多级对象，例如：a
     * @param objLevelArray     级别转换为一个数组描述。例如：要检测a.b.c对象,转换为的本参数是['b','c']
     * @returns {boolean}
     */
    isNotNullMultiple = function (rootObj, objLevelArray) {
        var parent = this;
        var isNotNull = false;
        // 检查当前对象属性中是否有该对象
        $.each(rootObj,function (key, val) {
            if(parent.isNotNull(objLevelArray[0])){
                if(key==objLevelArray[0]){
                    isNotNull = true;
                    rootObj = val;
                    // 跳出循环
                    return false;
                }
            }
        })
        // 如果当前对象中有，继续检查子对象
        if(isNotNull && objLevelArray.length>1){
            // 移除第一个。然后递归继续
            objLevelArray.shift();
            isNotNull = parent.isNotNullMultiple(rootObj,objLevelArray);
        }
        return isNotNull;
    };
    /**
     * 返回（暴露）的接口
     */
    return {
        isNull: isNull,
        isNotNull: isNotNull,
        isNotNullArray:isNotNullArray,
        isNotNullMultiple:isNotNullMultiple
    }
})