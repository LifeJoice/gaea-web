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
         * 返回接口定义。
         */
        return utils;
    });