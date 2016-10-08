/**
 * 今天起，开始重构UR创建的一套前端js框架。重新以gaea命名。另外基于RequireJS的模块化。
 *
 * 通用工具。
 * Created by iverson on 2016-7-26 16:39:54
 *
 */
define([
        "jquery", "underscore", 'underscore-string',
        'gaeajs-common-utils-validate', "gaeajs-common-utils-string"
    ],
    function ($, _, _s,
              gaeaValid, gaeaString) {

        var utils = {};

        utils.array = {
            /**
             * 合并两个数组并返回。
             * @param arr1
             * @param arr2
             * @returns {Array}
             */
            combine: function (arr1, arr2) {
                var result = new Array();
                if (gaeaValid.isNotNull(arr1)) {
                    // 如果不是数组，转换成数组合并
                    if (!_.isArray(arr1)) {
                        arr1 = [arr1];
                    }
                    result = result.concat(arr1);
                }
                if (gaeaValid.isNotNull(arr2)) {
                    // 如果不是数组，转换成数组合并
                    if (!_.isArray(arr2)) {
                        arr2 = [arr2];
                    }
                    result = result.concat(arr2);
                }
                return result;
            }
        };

        /**
         * 和JQuery defer相关的，或者JS同步相关的方法。
         */
        utils.defer = {
            /**
             * 一般的defer function的数组，在push进数组的时候就会发生调用。这个会导致重复调用。
             * 因为在用$.when.apply( functions...)的时候，又会调用一次。
             * 而最糟糕的是，done方法在第一次push完成后就触发了。
             * 所以，以下测试就是：
             * functions数组，push进去的方式是：function, 而不是function()
             * 这样不会在构造数组的时候就触发方法的调用。当然换来的，就是得多一个functionExecutor包装器，来做function的调用。
             *
             * @param funcArray
             */
            functionsExecutor: function (funcArray) {
                if (gaeaValid.isNull(funcArray) || !_.isArray(funcArray)) {
                    throw "不正确使用。输入参数非function数组。";
                }
                var dfd = $.Deferred();// JQuery同步对象
                var deferreds = new Array();
                // 遍历方法数组，逐一推到deferred数组中。是以function()的方式哦。会触发一次调用。
                $.each(funcArray, function (idx, func) {
                    deferreds.push(func());
                });
                /**
                 * 当deferreds方法数组都执行完后，执行done函数。
                 * 默认是把各个方法的回调结果放入一个对象后，返回给上下文。
                 */
                $.when.apply($, deferreds).done(function (arg1/* ... argN */) {
                    var data = {};
                    // 不确定有多少输入参数。when调用了多少方法，就有多少个输入参数
                    data.gaeaArgs = Array.prototype.slice.call(arguments);
                    dfd.resolveWith(data);
                });
                return dfd.promise();
            }
        };
        /**
         * 返回接口定义。
         */
        return utils;
    });