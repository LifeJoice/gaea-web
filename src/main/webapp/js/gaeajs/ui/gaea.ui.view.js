/**
 *
 * 继续重构。
 * gaea.ui.view，具体为对应服务端的view页面。成为一个专用组件。
 * modify by Iverson on 2017年6月19日17:52:53
 *
 * gaea.ui.view,其中的view，表示一个抽象的组合，一些组件的组合。类似page。
 * 例如：
 * 列表页，就是一个view。包含了toolbar，grid，data，workflow等很多组件的组合。
 * by Iverson on 2016-6-27 10:28:51
 *
 * Created by iverson on 2016/2/14.
 * 今天起，开始重构UR创建的一套前端js框架。重新以gaea命名。另外基于RequireJS的模块化。
 */
define([
        "jquery", "underscore", 'underscore-string', 'gaeajs-common-utils-ajax', 'gaeajs-common-utils-validate',
        "gaeajs-data", "gaeajs-ui-events", "gaeajs-ui-form", "gaeajs-common-utils-string",
        "gaeajs-ui-definition", "gaeajs-ui-view", "gaea-system-url", 'gaeajs-ui-notify',
        "gaeajs-ui-commons", "gaeajs-ui-multiselect", "gaeajs-common", "gaeajs-ui-tabs",
        "gaeajs-common-utils", "gaeajs-context", "gaeajs-ui-dataFilterDialog", "gaeajs-ui-grid",
        "gaeajs-data-content", "gaeajs-ui-chain", "gaeajs-ui-toolbar",
        'gaea-jqui-dialog', "jquery-serializeObject", "jquery-ui-effects-all"],
    function ($, _, _s, gaeaAjax, gaeaValid,
              gaeaData, GAEA_EVENTS, gaeaForm, gaeaString,
              GAEA_UI_DEFINE, gaeaView, SYS_URL, gaeaNotify,
              gaeaUI, gaeaMultiSelect, gaeaCommon, gaeaComponents,
              gaeaCommonUtils, gaeaContext, gaeaDataFilterDialog, gaeaGrid,
              gaeaContent, gaeaViewChain, gaeaToolbar) {

        var _options = {};

        var public = {
            /**
             * <p>
             *     当前opts.triggers只支持click一种。即定义opts.triggers.click。以后如果有扩展，可能会有opts.triggers.hover之类的……
             * </p>
             *
             * @param {ServerView} opts
             * @param {object} opts.triggers
             * @param {GaeaUITrigger} opts.triggers.click           定义点击事件的触发器
             */
            init: function (opts) {
                var $contentCt = $(".gaea-sys-content");
                if ($contentCt.length < 1) {
                    throw "找不到内容加载区域（.gaea-sys-content)! view组件加载内容失败!";
                }
                if (gaeaValid.isNull(opts.triggers)) {
                    throw "没有相关的触发对象，无法初始化本组件！";
                }

                // 如果关联点击事件 --> 点击打开view
                if (gaeaValid.isNotNull(opts.triggers.click)) {
                    var $refButton = $(opts.triggers.click.trgSelector); // 假设是个按钮。一般是个按钮。

                    // 点击打开view
                    GAEA_EVENTS.registerListener("click", opts.triggers.click.trgSelector, function (event, ui) { // gaea的事件注册中心,注册事件

                        // validate
                        // 如果有绑定校验器，需要校验通过才能继续。
                        var buttonOpts = $refButton.data("gaeaOptions");
                        if (gaeaValid.isNotNull(buttonOpts.validators) && !$refButton.gaeaValidate("valid")) {
                            return;
                        }

                        _private.viewChainData.setChainNodeData(opts);
                        // 点击的时候，先缓存父对象（短暂）
                        // 这个得用parentId，因为opts.id是linkViewId，由于在服务端两者分开定义（对于链条第二个开始的）, opts.id和最终加载view的id有可能不一样
                        gaeaViewChain.setParent({
                            id: opts.parentId
                        });

                        // 构造加载下一个view时，服务端需要的额外数据
                        var reqData = {
                            selectedRow: gaeaContext.getValue("$pageContext['selectedRow']['gaea-grid-ct']"),
                            viewChain: gaeaContext.getValue("viewChain")
                        };
                        /**
                         * 点击按钮的时候，加载内容页。加载完成后，把view组件加入操作链，提供返回功能。
                         */
                        $contentCt.load(opts.contentUrl, gaeaCommonUtils.data.flattenData(reqData), function () {


                            // TODO 未完成。待view返回功能一起完成。
                            //gaeaToolbar.add();

                            // 清除缓存
                            _private.cleanCache(opts);
                        });

                    });
                }
            },
            /**
             * 把view加入链，并缓存。
             * @param opts
             */
            addChain: function (opts) {
                _private.addChain(opts);
            },
            /**
             * 根据某一个节点，获取这个节点（和之前）整个链条中，每一个节点的data部分，组成数组返回。
             * @param nodeId
             * @returns {Array}
             */
            getViewData: function (nodeId) {
                var nodes = gaeaViewChain.getChainData(nodeId);
                if (_.isArray(nodes)) {
                    var viewData = [];
                    $.each(nodes, function (i, val) {
                        viewData.push(val.data);
                    });
                    return viewData;
                }
                return;
            }
        };

        var _private = {
            /**
             * 把当前opts加入链，并缓存。
             * @param {ServerView} opts
             */
            addChain: function (opts) {
                var parentId;
                // check whether has parent view
                var parentView = gaeaViewChain.getParent();
                if (gaeaValid.isNotNull(parentView) && gaeaValid.isNotNull(parentView.id)) {
                    parentId = parentView.id;
                }
                // 加入弹出框链
                // 这个链，只是view的component定义的链，记录操作链条上每一个view的定义（就是ServerView），但没有这个view当时的数据
                // cache options in chain
                gaeaViewChain.add({
                    id: opts.id,
                    parentId: parentId,
                    options: opts
                });
            },
            /**
             * 清空缓存。
             * 当前主要清空前一页的selectedRow和selectedRows等。
             * @param opts
             */
            cleanCache: function (opts) {
                gaeaContext.setValue("selectedRow", "gaea-grid-ct", {});
                gaeaContext.setValue("selectedRows", "gaea-grid-ct", {});
            },
            viewChainData: {
                /**
                 * 绑定view chain的链，每个节点上的数据同步。
                 * @param opts
                 */
                setChainNodeData: function (opts) {
                    var nodeId = $("#gaeaViewId").val();
                    var newData = {
                        selectedRow: gaeaContext.getValue("lastSelectedRow"),
                        selectedRows: gaeaContext.getValue("lastSelectedRows")
                    };
                    gaeaViewChain.setNodeValue(nodeId, "data", newData);
                }
            }
        };
        // ---------------------------------------------------------------------------------------->>>> old
        //var view = {};
        ///**
        // * view的定义的内容，应该很多都是通过接口暴露给外部，所以定义的常量应该不需要放到ui.definition。
        // */
        //var GAEA_UI_VIEW_DEFINE = {
        //    LIST_VIEW: {
        //        SCHEMA_HTML_ID: "urSchemaId"
        //    }
        //};
        ///**
        // * 列表页（gaeaGrid.html）。
        // */
        //var listView = {
        //    getSchemaId: function () {
        //        return $("#" + GAEA_UI_VIEW_DEFINE.LIST_VIEW.SCHEMA_HTML_ID).val();
        //    }
        //};
        /**
         * 返回接口定义。
         */
        //return {
        //    list: listView
        //};
        // old end <<<<----------------------------------------------------------------------------------------

        return public;
    });