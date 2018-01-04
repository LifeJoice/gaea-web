/**
 * HTML页面各种组件相关依赖、相互触发、更新等的封装。
 * Created by iverson on 2017年12月28日 星期四
 *
 */
define([
        "jquery", "underscore", 'underscore-string',
        'gaeajs-common-utils-validate', "gaeajs-common-utils-string", "gaeajs-data", "gaeajs-ui-events", "gaeajs-common-utils-ajax",
        "gaeajs-common-utils", "gaeajs-ui-notify"
    ],
    function ($, _, _s,
              gaeaValid, gaeaString, gaeaData, gaeaEvents, gaeaAjax,
              gaeaUtils, gaeaNotify) {


        var public = {
            /**
             * 解析registerEvent事件定义，并针对性的绑定事件
             * @param {jqSelector} target
             * @param registerEvent
             */
            bindEvents: function (target, registerEvent) {
                //var $tabs = $("#" + containerId);
                var loadDataUrl = registerEvent.loadDataUrl;
                // 看看具体是什么事件
                if (gaeaString.equalsIgnoreCase(gaeaEvents.DEFINE.UI.RELOAD_DATA, registerEvent.name)) {
                    // reload_data事件
                    gaeaValid.isNull({
                        check: target,
                        exception: "id为空，无法注册reload_data事件！"
                    });
                    if ($(target).length < 1) {
                        throw "指定target找不到对应的元素（或里面的div）。target: " + target;
                    }
                    // 绑定reload_data事件
                    if (gaeaValid.isNotNull(loadDataUrl)) { // 根据URL去重新加载数据
                        _private.bindReloadDataEventByUrl(target, loadDataUrl);
                    } else { // 一般是依赖的多级触发
                        _private.bindCommonReloadData(target);
                    }
                }
            }
        };

        var _private = {
            /**
             * 绑定reload_data事件。根据某个url刷新数据。
             * copy from gaea.ui.tabs by Iverson 2017年12月28日14:30:51
             * @param target
             * @param loadDataUrl
             */
            bindReloadDataEventByUrl: function (target, loadDataUrl) {
                gaeaValid.isNull({
                    check: loadDataUrl,
                    exception: "load-data-url为空，无法注册reload_data事件！bind target id: " + targetId
                });

                var gaeaDialog = require("gaeajs-ui-dialog");
                var $dialog = gaeaDialog.utils.findRootDialog(target);
                var $reloadTarget = $(target);
                var fillDataDivId = target;
                // 事件绑在了tab标签上，需要找对应的标签内容容器id
                if ($reloadTarget.parent().hasClass("ui-tabs-nav")) {
                    fillDataDivId = "#" + $reloadTarget.attr("aria-controls"); // aria-controls这个是jQuery的组件特性，指向某个tab包含的内容的div id
                }

                // 注册reload_data事件
                gaeaEvents.registerListener(gaeaEvents.DEFINE.UI.RELOAD_DATA, target, function (event, data) {
                    /**
                     * reload_data带上的数据：
                     <p>
                     tabs在reload_data的时候，把表单数据带上。
                     这对于图片上传完，再改，再上传……反反复复之后的数据一致性，才可以控制。
                     补充：
                     还需要表单当前的数据。
                     因为当编辑的时候，例如像图片，reload_data一次后，如果删除了，又添加了图片，这个时候，第二次reload_data会不知道之前删除动作。
                     </p>
                     */
                    var requestData = $dialog.find("form:first").serializeObject(); // 获取dialog下的第一个form的数据
                    var gaeaView = require("gaeajs-ui-view");
                    // 获取链式操作，前面节点的数据。可能服务端功能需要（一般都需要）。
                    var viewChainData = gaeaView.getViewData($("#gaeaViewId").val());
                    requestData["viewChain"] = JSON.stringify(viewChainData); // 必须json化。因为数据是笼统的，没有严格的对象mapping
                    requestData["pageId"] = $dialog.data("gaeaOptions").pageId;

                    // 数据加载要求同步
                    gaeaAjax.ajax({
                        url: loadDataUrl,
                        async: false, // 同步，否则后面加载内容还有数据集会乱的
                        data: gaeaUtils.data.flattenData(requestData), // 把数据拍扁。不然传的是对象，服务端无法解析。
                        success: function (data) {
                            var gaeaUI = require("gaeajs-ui-commons");
                            gaeaUI.fillData({
                                //id: fillDataDivId,
                                target: fillDataDivId,
                                data: data
                            });
                        },
                        fail: function (data) {
                            gaeaNotify.fail(gaeaString.builder.simpleBuild("刷新数据（reload）失败！\n%s", JSON.stringify(data)));
                        }
                    });

                });
            },
            /**
             * 这个是普通的reload_data事件处理。表示不是从load-data-url获取数据。
             * 有很多种可能。当前只有从数据集获取数据。
             * @param opts
             */
            bindCommonReloadData: function (target) {
                var $target = $(target);
                var gaeaData = require("gaeajs-data");
                // 注册reload_data事件
                gaeaEvents.registerListener(gaeaEvents.DEFINE.UI.RELOAD_DATA, target, function (event, data) {
                    // 触发select的数据刷新。因为select是依赖KO的，不能在这里直接刷新。
                    gaeaData.select.dpSelect.triggerReloadData(target, data);
                });
            }
        };

        return public;
    });