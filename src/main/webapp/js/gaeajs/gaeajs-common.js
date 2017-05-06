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
        "jquery", "underscore", 'gaeajs-common-utils-validate', "jquery-validate"],
    function ($, _, gaeaValid) {
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
                        "<div class='l-wrapper'>" +
                        '<svg viewBox="0 0 120 120" version="1.1" xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink">' +
                        '<g id="circle" class="g-circles g-circles--v3">' +
                        '<circle id="12" transform="translate(35, 16.698730) rotate(-30) translate(-35, -16.698730) " cx="35" cy="16.6987298" r="10"></circle>' +
                        '<circle id="11" transform="translate(16.698730, 35) rotate(-60) translate(-16.698730, -35) " cx="16.6987298" cy="35" r="10"></circle>' +
                        '<circle id="10" transform="translate(10, 60) rotate(-90) translate(-10, -60) " cx="10" cy="60" r="10"></circle>' +
                        '<circle id="9" transform="translate(16.698730, 85) rotate(-120) translate(-16.698730, -85) " cx="16.6987298" cy="85" r="10"></circle>' +
                        '<circle id="8" transform="translate(35, 103.301270) rotate(-150) translate(-35, -103.301270) " cx="35" cy="103.30127" r="10"></circle>' +
                        '<circle id="7" cx="60" cy="110" r="10"></circle>' +
                        '<circle id="6" transform="translate(85, 103.301270) rotate(-30) translate(-85, -103.301270) " cx="85" cy="103.30127" r="10"></circle>' +
                        '<circle id="5" transform="translate(103.301270, 85) rotate(-60) translate(-103.301270, -85) " cx="103.30127" cy="85" r="10"></circle>' +
                        '<circle id="4" transform="translate(110, 60) rotate(-90) translate(-110, -60) " cx="110" cy="60" r="10"></circle>' +
                        '<circle id="3" transform="translate(103.301270, 35) rotate(-120) translate(-103.301270, -35) " cx="103.30127" cy="35" r="10"></circle>' +
                        '<circle id="2" transform="translate(85, 16.698730) rotate(-150) translate(-85, -16.698730) " cx="85" cy="16.6987298" r="10"></circle>' +
                        '<circle id="1" cx="60" cy="10" r="10"></circle>' +
                        '</g>' +
                        '</svg>' +
                        "</div>" +
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
            }
        };
        /**
         * 自定义的jQuery插件validate.
         * 当前只是简单的调用第三方插件初始化。
         * @param options
         */
        $.fn.gaeaValidate = function (options) {
            return this.each(function () {
                var $container = $(this);
                /**
                 * 依赖第三方框架：jquery-validate
                 * 这个必须在进入页面的时候初始化。而不是在校验的时候调用。校验的手动调用是valid方法。
                 */
                $container.validate();
            });
        };
        /**
         * 返回接口定义。
         */
        return {
            loading: loading,
            gaeaValidate: gaeaValidate
        }
    });