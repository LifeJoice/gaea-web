/**
 * gaeaDialog拆分出gaea.data.content.js
 * 因为内容加载并且初始化数据集等，并不只是dialog才会用到。把这块抽出来独立。
 *
 * Created by iverson on 2017-6-14 10:16:48
 */
define([
        "jquery", "underscore", 'underscore-string', 'gaeajs-common-utils-ajax', 'gaeajs-common-utils-validate',
        "gaeajs-data", "gaeajs-ui-events", "gaeajs-ui-form", "gaeajs-common-utils-string", "gaeajs-context",
        "gaeajs-ui-definition", "gaeajs-common-utils", "gaea-system-url", 'gaeajs-ui-notify',
        "gaeajs-ui-commons",
        'gaea-jqui-dialog', "jquery-serializeObject", "jquery-ui-effects-all"],
    function ($, _, _s, gaeaAjax, gaeaValid,
              gaeaData, GAEA_EVENTS, gaeaForm, gaeaString, gaeaContext,
              GAEA_UI_DEFINE, gaeaUtils, SYS_URL, gaeaNotify,
              gaeaUI,
              mod1, mod2, mod3) {

        var _private = {};


        var public = {
            /**
             * 加载内容. 包括初始化内容的数据集、初始化可编辑子表、初始化multi-select多选框等。
             *
             * @param {Object} options
             //* @param {string} options.formId                           当前是formId. formId外面就是dialogId。
             //* @param {string} options.id                               弹框的div id
             * @param {string} options.containerId                      弹框的div id
             * @param {string} options.contentUrl                       内容url地址
             * @param {boolean} options.editable                        dialog的内容是否可编辑
             * @param {string} options.data
             * @param {string} options.initComponentData                初始化组件的数据，例如：子表的关联，新增不需要初始化，编辑就需要。
             * @param {object} options.callback
             * @param {string} options.callback.afterBinding 绑定后的回调
             * @param callback 回调方法
             */
            loadContent: function (options, callback) {
                if (gaeaValid.isNull(options.containerId)) {
                    throw "容器containerId为空，无法加载内容！";
                }

                var dfd = $.Deferred();// JQuery同步对象

                $.when(_private.loadContent({
                    //containerId: formId,
                    containerId: options.containerId,
                    contentUrl: options.contentUrl
                })).done(function () {
                    // 初始化内容里面的UI
                    // 诸如下拉框、Grid等，还有加载对应的数据、填充数据等
                    $.when(public.initGaeaUI(options, callback)).done(function () {
                        dfd.resolve();
                    });

                });

                return dfd.promise();
            },
            /**
             * 初始化某个区域内的组件。
             * 注意！这里是初始化组件和数据，并不包括样式（内容的样式，例如：form）
             *
             * @param {Object} options
             * @param {string} options.id                               弹框的div id
             //* @param {string} options.containerId                      弹框的div id
             * @param {boolean} options.editable                        dialog的内容是否可编辑
             * @param {string} options.data
             * @param {string} options.initComponentData                初始化组件的数据，例如：子表的关联，新增不需要初始化，编辑就需要。
             * @param {object} options.callback
             * @param {string} options.callback.afterBinding 绑定后的回调
             * @param callback 回调方法
             */
            initGaeaUI: function (options, callback) {
                var dfd = $.Deferred();// JQuery同步对象

                /**
                 * 同步调用数组。数组中的每个函数，都是并行调用。并且从声明这个数组开始就会触发方法调用。
                 * 声明这个数组的目的，是为了控制，后面的data-bind处理，要等这几个方法全部执行完。
                 */
                var defferedFunctions = [
                    gaeaData.dataSet.scanAndInit(options.id)];
                /**
                 * 【重要】
                 * 至此！上面的方法都执行了。但！不代表上面的方法都执行完了！
                 * 因为上面有些方法是含有ajax的异步操作。所以需要下面这个来控制整体的同步。
                 */

                /* 待defferedFunctions数组的各个函数都运行完(其实声明数组的时候已经执行了), 才执行done的回调方法. */
                $.when.apply($, defferedFunctions).done(function () {
                    gaeaData.binding({
                        //containerId: formId
                        containerId: options.id
                    }, function () {
                        // 回调定制的函数
                        if (gaeaValid.isNotNull(options.callback) && _.isFunction(options.callback.afterBinding)) {
                            options.callback.afterBinding();
                        }
                        /**
                         * 初始化UI。
                         * 这个只是纯粹UI的初始化，例如：button，或者数据已经存在的情况。
                         */
                        var gaeaUI = require("gaeajs-ui-commons");
                        // 必须先初始化完Gaea UI 组件（包括组件的数据，例如下拉框的数据），再填充数据（例如：下拉框选中哪一个）
                        $.when(gaeaUI.initGaeaUI("#" + options.id, options.editable)).done(function () {
                            /**
                             * fill data
                             * 必须在initGaeaUI后，甚至一切后，因为，得等数据集初始化完、KO binding后生成某些DOM、然后第三方插件初始化了（例如select2），再去改数据，这样KO、第三方插件才不会出错。
                             * 例如select2，得初始化后，改数据还得调用trigger change，然后，未初始化前trigger change是没用的，也就改不了数据了。
                             */
                            if (gaeaValid.isNotNull(options.data)) {

                                gaeaUI.fillData({
                                    //id: options.id,
                                    target: "#" + options.id,
                                    data: options.data
                                });

                                //gaeaData.fieldData.init(options.id, options.data);
                                // 填充完数据后, 某些组件得触发事件才生效（例如select2需要触发change...）
                                //gaeaUI.initGaeaUIAfterData({
                                //    containerId: options.id
                                //});
                            }
                        });
                    });

                    // 整个方法loadContent的完成. 其实就是defferedFunctions里面的数据集加载、gaeaUI初始化等完成后，最后data binding完成，就是整个loadContent完成了
                    dfd.resolve();
                });

                // 初始化gaeaUI
                // TODO 这个应该移到gaea.ui.commons去。主要其实就是tabs的初始化而已。
                //gaeaComponents.init({
                //    containerId: options.id
                //});
                // 最后回调的定义
                if (_.isFunction(callback)) {
                    callback();
                }

                return dfd.promise();
            }
        };

        /**
         * copy from dialog.content
         * 纯粹就只是往某div（或元素）中加载html内容。
         *
         * @param {object} options
         * @param {string} options.containerId                   弹出框的div id, 或者form id，总之要往其中填充内容的id
         * @param {string} options.contentUrl                    加载内容的请求url
         * @param callback
         * @returns {*}
         */
        _private.loadContent = function (options, callback) {
            var $container = $("#" + options.containerId);
            // 发送服务端的数据
            var requestData = {
                selectedRows: gaeaContext.getValue("selectedRows", GAEA_UI_DEFINE.UI.GRID.GAEA_GRID_DEFAULT_ID)
            };
            // jquery.get才能返回一个jqXHR对象。作同步用。
            return $.get(options.contentUrl, gaeaUtils.data.flattenData(requestData), function (data) {
                // ------------------------------------>>>> 成功处理
                // debug. 加载的内容不能有（含data-gaea-data-bind-area的元素）id重复.
                gaeaData.utils.debug.checkViewModel({
                    containerId: options.containerId,
                    html: data
                });
                // 加载内容
                $container.html(data);
                // 初始化表单的样式（load过来的表单）
                gaeaForm.init({
                    containerClass: "gaea-form"
                });
                // 最后回调的定义
                if (_.isFunction(callback)) {
                    callback();
                }
            }).fail(function (response) {
                // ------------------------------------>>>> 失败处理
                var responseObj = JSON.parse(response.responseText);
                // 检查是否没有权限操作
                if (gaeaString.equalsIgnoreCase(responseObj.status, "403")) {
                    gaeaNotify.fail(responseObj.message);
                }
            });
        };

        /**
         * 返回（暴露）的接口
         */
        return public;
    });