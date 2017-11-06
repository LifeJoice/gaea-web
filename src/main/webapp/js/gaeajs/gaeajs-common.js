/**
 * Created by iverson on 2016/2/14.
 * 今天起，开始重构UR创建的一套前端js框架。重新以gaea命名。另外基于RequireJS的模块化。
 *
 * 一些通用方法、功能的集合，如果功能不会膨胀得很厉害的话。
 * 例如：validate校验框架，简单的时候放在这里就好。因为用的是第三方的框架。如果以后自己写或什么的，就分出去单独一个组件。
 *
 * DEPENDENCE:
 * RequireJS,JQuery,重写的Date.format
 */
define([
        "jquery", "underscore", 'gaeajs-common-utils-validate',
        "gaeajs-common-utils-string", "gaeajs-context", "gaeajs-ui-notify",
        "jquery-validate"],
    function ($, _, gaeaValid,
              gaeaString, gaeaContext, gaeaNotify) {
        /**
         * 加载的遮罩效果 2016-6-14 19:28:54
         * 用的是SVG图。
         */
        var loading = {
            on: function () {
                if ($("#gaea-loading").length > 0) {
                    $("#gaea-loading").css("display", "block");
                } else {
                    // 网上找的svg效果
                    var html = "<div id='gaea-loading' class='gaea-loading-bg'>" +
                            //"<div class='l-wrapper'>" +
                            //'<svg viewBox="0 0 120 120" version="1.1" xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink">' +
                            //'<g id="circle" class="g-circles g-circles--v3">' +
                            //'<circle id="12" transform="translate(35, 16.698730) rotate(-30) translate(-35, -16.698730) " cx="35" cy="16.6987298" r="10"></circle>' +
                            //'<circle id="11" transform="translate(16.698730, 35) rotate(-60) translate(-16.698730, -35) " cx="16.6987298" cy="35" r="10"></circle>' +
                            //'<circle id="10" transform="translate(10, 60) rotate(-90) translate(-10, -60) " cx="10" cy="60" r="10"></circle>' +
                            //'<circle id="9" transform="translate(16.698730, 85) rotate(-120) translate(-16.698730, -85) " cx="16.6987298" cy="85" r="10"></circle>' +
                            //'<circle id="8" transform="translate(35, 103.301270) rotate(-150) translate(-35, -103.301270) " cx="35" cy="103.30127" r="10"></circle>' +
                            //'<circle id="7" cx="60" cy="110" r="10"></circle>' +
                            //'<circle id="6" transform="translate(85, 103.301270) rotate(-30) translate(-85, -103.301270) " cx="85" cy="103.30127" r="10"></circle>' +
                            //'<circle id="5" transform="translate(103.301270, 85) rotate(-60) translate(-103.301270, -85) " cx="103.30127" cy="85" r="10"></circle>' +
                            //'<circle id="4" transform="translate(110, 60) rotate(-90) translate(-110, -60) " cx="110" cy="60" r="10"></circle>' +
                            //'<circle id="3" transform="translate(103.301270, 35) rotate(-120) translate(-103.301270, -35) " cx="103.30127" cy="35" r="10"></circle>' +
                            //'<circle id="2" transform="translate(85, 16.698730) rotate(-150) translate(-85, -16.698730) " cx="85" cy="16.6987298" r="10"></circle>' +
                            //'<circle id="1" cx="60" cy="10" r="10"></circle>' +
                            //'</g>' +
                            //'</svg>' +
                        '<div class="gaea-loader"></div>' +
                            //"</div>" +
                        "</div>";
                    $("body").append(html);
                    $("#gaea-loading").css("display", "block");
                }
            },
            /**
             * 关闭遮罩
             */
            off: function () {
                var $bg = $("#gaea-loading");
                if ($bg.length > 0) {
                    $bg.css("display", "none");
                }
            }
        };
        /**
         * gaeaJS validate框架
         * 当前只是一个简单的接口层。
         */
        var gaeaValidate = {
            validate: function (options) {
                var $container = $("#" + options.containerId);
                if (gaeaValid.isNotNull($container)) {
                    // 调用第三方框架的校验，成功调用success回调
                    if ($container.valid()) {
                        if (_.isFunction(options.success)) {
                            options.success();
                        }
                    }
                }
            },
            /**
             * 初始化相关的对象的校验器。不是立刻执行校验。
             * @param options
             * @returns {*}
             */
            init: function ($target, options) {
                return $target.each(function () {
                    var $container = $(this);
                    /**
                     * 依赖第三方框架：jquery-validate
                     * 这个必须在进入页面的时候初始化。而不是在校验的时候调用。校验的手动调用是valid方法。
                     */
                    $container.validate();
                });
            },
            /**
             * 即刻执行目标对象的校验。
             *
             * @param $inTarget
             * @param opts
             * @returns {boolean}   全部校验成功（true）还是失败（false）
             */
            valid: function ($inTarget, opts) {
                var dfd = $.Deferred();// JQuery同步对象
                //var validateResult = true; // 默认校验通过
                $inTarget.each(function () {
                    var $target = $(this);
                    var gaeaOpts = $target.data("gaeaOptions");
                    if (gaeaValid.isNull(gaeaOpts.validators)) {
                        dfd.resolve();
                        return;
                    }
                    var validators = gaeaOpts.validators;
                    // 这个是后面表达式计算需要的一个上下文变量，不能删除！
                    //var $pageContext = gaeaContext.getContext();
                    if (_.isArray(validators)) {
                        /**
                         * 遍历所有校验器，如果第一个校验器校验通过，就执行第二个，第三个……如此类推。
                         * 如果第一个失败，就中止执行。
                         */
                        $.when(gaeaValidate.loopValidator(validators, 0)).done(function () {
                            // 下一个递归完成，才完结当前这个递归
                            dfd.resolve();
                        }).fail(function () {
                            dfd.reject();
                        });
                        //$.each(validators, function (i, validator) {
                        //
                        //    if(gaeaString.equalsIgnoreCase("action-validator",validator.type)) {
                        //        validateResult = gaeaValidate.genericValidate(validator);
                        //    }else if(gaeaString.equalsIgnoreCase("confirm-validator",validator.type)) {
                        //        //validateResult = gaeaValidate.confirmValidate(validator);
                        //        $.when(gaeaValidate.confirmValidate(validator)).done(function () {
                        //            validateResult = true;
                        //        }).fail(function () {
                        //            validateResult = false;
                        //        });
                        //    }
                        //    // 中断检查（循环），不再继续其他校验器
                        //        if(!validateResult){
                        //            return false;
                        //        }
                        //
                        //
                        //
                        //
                        //    //var origValidateEl = validator["check-expression"];
                        //    //var convertedValidateEl = gaeaContext.formatName(origValidateEl);
                        //    //try {
                        //    //    var validateResult = eval(convertedValidateEl);
                        //    //    result = validateResult;
                        //    //    // 校验不通过
                        //    //    if (!validateResult) {
                        //    //        gaeaNotify.warn(validator["data-msg"]);
                        //    //        // 中断检查，不再继续其他校验器
                        //    //        return false;
                        //    //    }
                        //    //} catch (err) {
                        //    //    gaeaNotify.error("校验失败！请联系系统管理员！" + err);
                        //    //}
                        //});
                    }

                    /**
                     * 依赖第三方框架：jquery-validate
                     * 这个必须在进入页面的时候初始化。而不是在校验的时候调用。校验的手动调用是valid方法。
                     */
                    //$target.validate();
                });
                //return validateResult;
                return dfd.promise();
            },
            /**
             *
             * @param validators
             * @param index
             * @returns {boolean}   如果校验不成功，返回false。其他没返回。
             */
            loopValidator: function (validators, index) {
                var dfd = $.Deferred();// JQuery同步对象
                if (index >= validators.length) {
                    return;
                }
                var validator = validators[index];
                if (gaeaString.equalsIgnoreCase("action-validator", validator.type)) {
                    $.when(gaeaValidate.genericValidate(validator)).done(function () {
                        // 当一个校验完结，递归，继续校验下一个validator
                        index++; // 下标移动，检查下一个validator
                        $.when(gaeaValidate.loopValidator(validators, index)).done(function () {
                            // 下一个递归完成，才完结当前这个递归
                            dfd.resolve();
                        }).fail(function () {
                            dfd.reject();
                        });
                    }).fail(function () {
                        dfd.reject();
                    });
                } else if (gaeaString.equalsIgnoreCase("confirm-validator", validator.type)) {
                    //validateResult = gaeaValidate.confirmValidate(validator);
                    $.when(gaeaValidate.confirmValidate(validator)).done(function () {
                        // 递归，继续校验下一个validator
                        index++; // 下标移动，检查下一个validator
                        $.when(gaeaValidate.loopValidator(validators, index)).done(function () {
                            // 下一个递归完成，才完结当前这个递归
                            dfd.resolve();
                        }).fail(function () {
                            dfd.reject();
                        });
                    }).fail(function () {
                        // 校验不通过，返回false
                        //return false;
                        dfd.reject();
                    });
                }
                return dfd.promise();
            },
            /**
             * 确认弹出框的校验
             * @param opts
             */
            confirmValidate: function (validator) {
                var dfd = $.Deferred();// JQuery同步对象
                gaeaValid.isNull({check: validator["data-msg"], exception: "系统通用校验validator的data-msg不允许为空！无法校验！"});
                var validateMsg = gaeaValid.isNotNull(gaeaContext.getValue(validator["data-msg"])) ? gaeaContext.getValue(validator["data-msg"]) : validator["data-msg"];
                var gaeaDialog = require("gaeajs-ui-dialog");
                // 同步操作，一个validator验证通过了，再resolve，再下一个
                $.when(gaeaDialog.commonDialog.confirm({
                    title: "操作确认",
                    content: validateMsg
                })).done(function () {
                    dfd.resolve();
                }).fail(function () {
                    dfd.reject();
                });
                return dfd.promise();
            },
            /**
             * 普通的校验. 基于服务端配置的表达式校验。
             * @param validator
             */
            genericValidate: function (validator) {
                var dfd = $.Deferred();// JQuery同步对象
                var result = false;
                // 这个是后面表达式计算需要的一个上下文变量，不能删除！
                var $pageContext = gaeaContext.getContext();
                var origValidateEl = validator["check-expression"];
                var convertedValidateEl = gaeaContext.formatName(origValidateEl);
                try {
                    var validateResult = eval(convertedValidateEl);
                    result = validateResult;
                    // 校验不通过
                    if (!validateResult) {
                        gaeaNotify.warn(validator["data-msg"]);
                        // 中断检查，不再继续其他校验器
                        //return false;
                        dfd.reject();
                    } else {
                        dfd.resolve();
                    }
                } catch (err) {
                    gaeaNotify.error("校验失败！请联系系统管理员！" + err);
                }
                return dfd.promise();
                //return result;
            }
        };
        /**
         * 自定义的jQuery插件validate.
         * 当前只是简单的调用第三方插件初始化。
         * @example
         * 触发校验
         * $button.gaeaValidate("valid")
         * 初始化
         * $container.valid()
         * @param {string|object} opts
         * @param {object} opts.valid
         */
        $.fn.gaeaValidate = function (opts) {
            var $this = this;
            // 初始化
            if (gaeaValid.isNull(opts)) {
                gaeaValidate.init($this, null);
                return;
            }

            /**
             * 即刻校验
             */
            if (gaeaString.equalsIgnoreCase("valid", opts) || gaeaValid.isNotNull(opts.valid)) {
                // 返回同步对象
                return gaeaValidate.valid($this, null);
            }
        };
        /**
         * 返回接口定义。
         */
        return {
            loading: loading,
            gaeaValidate: gaeaValidate
        }
    });