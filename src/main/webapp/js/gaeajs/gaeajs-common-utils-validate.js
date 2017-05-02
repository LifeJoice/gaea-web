/**
 * Created by iverson on 2016/2/14.
 * 今天起，开始重构UR创建的一套前端js框架。重新以gaea命名。另外基于RequireJS的模块化。
 *
 * DEPENDENCE:
 * RequireJS,JQuery,重写的Date.format
 */
define(["jquery", "underscore", 'underscore-string'], function ($, _, _s) {
    /**
     * 验证字符是否为空。
     * 如果opts是对象，且有exception的值，则校验不通过的时候，抛出异常。
     * 否则只是返回false。
     * @param {object} opts
     * @param {string} opts.check                   要检验的对象
     * @param {string} opts.exception               抛出的异常描述. 如果这个字段有值，则校验不通过抛出异常；否则返回false
     * @returns {boolean}
     */
    var isNotNull = function (opts) {
        if (_.isNull(opts) || _.isUndefined(opts)) {
            return false;
        }

        /**
         * 如果opts是对象，且有exception的值，则校验不通过的时候，抛出异常。
         * 否则只是返回false。
         */
        if (_.isString(opts.exception) && _s.trim(opts.exception).length > 0) {
            var check = opts.check;
            //if(_.isString(opts.exception) && _s.trim(opts.exception).length>0){
            if (isNotNull(check)) {
                return true;
                //}
            } else {
                throw opts.exception;
            }
        } else {
            // 如果没有opts.exception，直接检查本身
            var check = opts;
            try {
                if (_.isNull(check) || _.isUndefined(check)) {
                    return false;
                }
                // 去掉前后空格
                _s.trim(check);
                if (check.length == 0) {
                    return false;
                }
            } catch (error) {
                console.log("错误信息：" + error.message);
                if (error.message.indexOf("undefined")) {
                    return false;
                }
            }
        }
        return true;
    };

    /**
     * 检查是否为空。
     * 如果opts是对象，且有exception的值，则校验不通过的时候，抛出异常。
     * 否则只是返回false。
     * @param {object} opts
     * @param {string} opts.check                   要检验的对象
     * @param {string} opts.exception               抛出的异常描述. 如果这个字段有值，则校验不通过抛出异常；否则返回false
     * @returns {boolean}
     */
    var isNull = function (opts) {
        return !isNotNull(opts);
    };
    var isNotNullArray = function (inArg) {
        if (isNull(inArg)) {
            return false;
        }
        if (_.isArray(inArg) && inArg.length > 0) {
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
        $.each(rootObj, function (key, val) {
            if (parent.isNotNull(objLevelArray[0])) {
                if (key == objLevelArray[0]) {
                    isNotNull = true;
                    rootObj = val;
                    // 跳出循环
                    return false;
                }
            }
        })
        // 如果当前对象中有，继续检查子对象
        if (isNotNull && objLevelArray.length > 1) {
            // 移除第一个。然后递归继续
            objLevelArray.shift();
            isNotNull = parent.isNotNullMultiple(rootObj, objLevelArray);
        }
        return isNotNull;
    };

    /**
     * gaea校验器插件。
     */
    var gaeaValidator = {
        /**
         * 获取gaea validator配置项，对应validator的html对象。该对象其实是跟html代码一一匹配的。
         * 就是直接把该对象转换为字符串，拼接在元素（例如input）中就可以立马使用。
         * 例如：
         * crud-grid中的列配置项，有validator对象：
         * {name:"stuNo",text:"学号", width:60, validator: { html: {type:"number","data-msg":"非空。输入要求是数值。",required:"required" } }
         * @param {object} opts
         * @param {GaeaColumnValidatorHtml} opts.html
         * @returns {string} 合并后的字符串。
         */
        getHtml: function (opts) {
            var htmlStr = "";
            if (isNotNull(opts) && isNotNull(opts.html)) {
                // 遍历每一个属性
                $.each(opts.html, function (key, val) {
                    // 不是undefined|null|NaN, 但可以是""
                    if (!_.isNaN(val) && !_.isNull(val)) {
                        htmlStr += ' ' + key + '="' + val + '" ';
                    }
                });
            }
            return htmlStr;
        }
    };

    /**
     * 返回（暴露）的接口
     */
    return {
        isNull: isNull,
        isNotNull: isNotNull,
        isNotNullArray: isNotNullArray,
        isNotNullMultiple: isNotNullMultiple,
        getHtml: gaeaValidator.getHtml
    }
});