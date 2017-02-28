/**
 * Created by iverson on 2016-8-5 15:15:49
 * 今天起，开始重构UR创建的一套前端js框架。重新以gaea命名。另外基于RequireJS的模块化。
 *
 * 这个是一些常用操作的封装。例如：对应schema的button的action。
 * 某种角度说，这个集合不是一个很组件的东西。只是把类似的东西归集在一起，可能会比较乱。
 * 例如：
 * 新增编辑弹框的新增action、编辑action、通用删除action等，不同的action，都放在这里。但很难说都是一种组件。
 *
 * by Iverson 2016-8-5 15:18:15
 *
 */
define([
        "jquery", "underscore",
        'gaeajs-common-utils-ajax', 'gaeajs-common-utils-validate', "gaeajs-common-utils-string", "gaea-system-url",
        "gaeajs-ui-events", "gaeajs-ui-definition", "gaeajs-ui-notify", "gaeajs-ui-dialog"
    ],
    function ($, _,
              gaeaAjax, gaeaValid, gaeaString, SYS_URL,
              GAEA_EVENTS, GAEA_UI_DEFINE, gaeaNotify, gaeaDialog) {
        var actions = {};

        /**
         *
         * @param opts
         *                  button schema的button定义。其中应该也包含了buttonAction，但还是单独吧。
         *                  buttonAction 某个button的某个action
         *                  data 要POST到后台的数据. 应该必须有schemaId。
         */
        actions.doAction = function (opts) {
            var button = opts.button;
            var buttonAction = button.actions[0];// 暂时只支持绑定一个action
            var data = opts.data;
            data.method = buttonAction.method; // 赋予"method"属性和值. Action必须!
            /**
             * 如果是获取文件的action，例如导出，不能用ajax。必须用submit才行。
             */
            if (gaeaString.equalsIgnoreCase(button.submitType, GAEA_UI_DEFINE.ACTION.SUBMIT_TYPE.FORM_SUBMIT)) {
                var submitFormHtml = '' +
                    '<form action="<%= ACTION %>" method="post">' +
                    '<input type="hidden" name="method" value="<%= METHOD %>">' +
                    '<input type="hidden" name="schemaId" value="<%= SCHEMA_ID %>">' +
                    '<input type="hidden" name="buttonId" value="<%= BUTTON_ID %>">' +
                    '</form>';
                var formHtmlTemplate = _.template(submitFormHtml);
                var jqHtmlSelector = formHtmlTemplate({
                    ACTION: SYS_URL.ACTION.DO_ACTION,
                    METHOD: data.method,
                    SCHEMA_ID: data.schemaId,
                    BUTTON_ID: button.id
                });
                $(jqHtmlSelector).submit();
            } else {
                gaeaAjax.post({
                    url: SYS_URL.ACTION.DO_ACTION,
                    data: data,
                    success: function (data) {
                        gaeaNotify.message(button.msg + "操作成功。");
                        // 刷新grid数据
                        $("#" + GAEA_UI_DEFINE.UI.GRID.GAEA_GRID_DEFAULT_ID).trigger(GAEA_EVENTS.DEFINE.UI.GRID.RELOAD);
                    },
                    fail: function (data) {
                        gaeaNotify.error(button.msg + "操作失败！");
                    }
                });
            }


            // 提交
            //gaeaAjax.post({
            //    url: SYS_URL.ACTION.DO_ACTION,
            //    data: data,
            //    success: function (data) {
            //        gaeaNotify.message(button.msg + "操作成功。");
            //        // 刷新grid数据
            //        $("#" + GAEA_UI_DEFINE.UI.GRID.GAEA_GRID_DEFAULT_ID).trigger(GAEA_EVENTS.DEFINE.UI.GRID.RELOAD);
            //    },
            //    fail: function (data) {
            //        gaeaNotify.error(button.msg + "操作失败！");
            //    }
            //});
        };

        /**
         * 和doAction大同小异。但这个，一方面提交处理的url不是同一个。另外，一些细节的东西，例如method，是没有的。
         * @param {object} opts
         * @param {object} opts.button
         * @param {string} opts.button.id
         * @param {string} opts.button.submitType           action的提交方式，是form submit，还是ajax。
         * @param {object} opts.data
         * @param {string} opts.data.actionName
         * @param {string} opts.data.schemaId
         */
        actions.doSimpleAction = function (opts) {
            var button = opts.button;
            var data = opts.data;
            //data.method = buttonAction.method; // 赋予"method"属性和值. Action必须!
            /**
             * 如果是获取文件的action，例如导出，不能用ajax。必须用submit才行。
             */
            if (gaeaString.equalsIgnoreCase(button.submitType, GAEA_UI_DEFINE.ACTION.SUBMIT_TYPE.FORM_SUBMIT)) {
                // 构建一个临时的form，来用于提交。
                var submitFormHtml = '' +
                    '<form action="<%= ACTION %>" method="post">' +
                    '<input type="hidden" name="actionName" value="<%= ACTION_NAME %>">' +
                    '<input type="hidden" name="schemaId" value="<%= SCHEMA_ID %>">' +
                    '<input type="hidden" name="buttonId" value="<%= BUTTON_ID %>">' +
                    '</form>';
                var formHtmlTemplate = _.template(submitFormHtml);
                var jqHtmlSelector = formHtmlTemplate({
                    ACTION: SYS_URL.ACTION.DO_SIMPLE_ACTION,
                    ACTION_NAME: data.actionName,
                    SCHEMA_ID: data.schemaId,
                    BUTTON_ID: button.id
                });
                // 提交form
                $(jqHtmlSelector).submit();
            } else {
                /**
                 * 走ajax提交路线。
                 */
                gaeaAjax.post({
                    url: SYS_URL.ACTION.DO_SIMPLE_ACTION,
                    data: data,
                    success: function (data) {
                        gaeaNotify.message(button.msg + "操作成功。");
                        // 刷新grid数据
                        $("#" + GAEA_UI_DEFINE.UI.GRID.GAEA_GRID_DEFAULT_ID).trigger(GAEA_EVENTS.DEFINE.UI.GRID.RELOAD);
                    },
                    fail: function (data) {
                        gaeaNotify.error(button.msg + "操作失败！");
                    }
                });
            }
            //$("<form action='" + SYS_URL.ACTION.DO_ACTION + "' method='post'><input type='hidden' name='method' value='" + data.method + "'><input type='hidden' name='schemaId' value='" + data.schemaId + "'><input type='hidden' name='buttonId' value='" + button.id + "'></form>").submit();
        };

        /**
         * 通用删除操作。
         */
        actions.deleteSelected = {
            init: function (options) {
                var buttonDef = options.button;
                var $button = $("#" + buttonDef.htmlId);
                // 默认伪删除
                var deleteURL = SYS_URL.CRUD.PSEUDO_DELETE;
                if (gaeaValid.isNotNull(options.url)) {
                    deleteURL = options.url;
                }
                /**
                 * 绑定按钮触发的删除事件。
                 */
                $button.on(GAEA_EVENTS.DEFINE.ACTION.DELETE_SELECTED, function (event, data) {
                    var schemaId = $("#" + GAEA_UI_DEFINE.UI.SCHEMA.ID).val();
                    var gridId = $("#" + GAEA_UI_DEFINE.UI.GRID.ID).val();
                    var row = data.selectedRow;
                    // 通用删除！
                    gaeaAjax.ajax({
                        url: deleteURL,
                        data: {
                            id: row.id,
                            urSchemaId: schemaId,
                            gridId: gridId,
                            wfProcInstId: row.wfProcInstId
                        },
                        success: function () {
                            gaeaNotify.message("删除成功！");
                            $("#urgrid").trigger(GAEA_EVENTS.DEFINE.UI.GRID.RELOAD);
                        },
                        // 返回内容如果为空，则即使status=200，也会进入fail方法
                        fail: function (jqXHR, textStatus, errorThrown) {
                            // 如果返回status=200，则还是当做成功！
                            if (jqXHR.status == 200) {
                                gaeaNotify.message("删除成功！");
                                $("#urgrid").trigger(GAEA_EVENTS.DEFINE.UI.GRID.RELOAD);
                            } else {
                                var result = jqXHR.responseJSON;
                                gaeaNotify.warn(_.template("<%=SIMPLE_MSG%><p/><%=ERROR_MSG%>")({
                                    SIMPLE_MSG: "删除失败！",
                                    ERROR_MSG: result.RESULT_MSG
                                }));
                            }
                        }
                    });
                });

            },
            /**
             * 真删除
             * @param {object} opts
             * @param {string} opts.id
             */
            doRealDelete: function (opts) {
                gaeaValid.isNull({
                    check: opts.id,
                    exception: "按钮id为空，无法触发删除事件（删除动作绑定在某按钮上）。"
                });
                var $button = $("#" + opts.id);
                // 弹框。确认删除？
                gaeaDialog.confirmDialog({
                    title: GAEA_UI_DEFINE.TEXT.UI.DIALOG.DELETE_CONFIRM_TITLE,
                    content: GAEA_UI_DEFINE.TEXT.UI.DIALOG.DELETE_CONFIRM_CONTENT
                }, function () {
                    var row = gaeaGrid.getSelected();
                    $button.trigger(GAEA_EVENTS.DEFINE.ACTION.DELETE_SELECTED, {
                        selectedRow: row
                    });
                });
            },
            /**
             * 伪删除
             * @param {object} opts
             * @param {string} opts.id
             */
            doPseudoDelete: function () {
                gaeaValid.isNull({
                    check: opts.id,
                    exception: "按钮id为空，无法触发删除事件（删除动作绑定在某按钮上）。"
                });
                var $button = $("#" + opts.id);
                // 弹框。确认删除？
                gaeaDialog.confirmDialog({
                    title: GAEA_UI_DEFINE.TEXT.UI.DIALOG.DELETE_CONFIRM_TITLE,
                    content: GAEA_UI_DEFINE.TEXT.UI.DIALOG.DELETE_CONFIRM_CONTENT
                }, function () {
                    var row = gaeaGrid.getSelected();
                    $button.trigger(GAEA_EVENTS.DEFINE.ACTION.DELETE_SELECTED, {
                        selectedRow: row
                    });
                });
            }
        };

        actions.crudDialog = {
            /**
             * 触发add这个行为。
             * @param opts
             */
            add: {
                do: function (opts) {
                    gaeaValid.isNull({
                        check: opts.id,
                        exception: "按钮id为空，无法打开更新弹出框。"
                    });
                    var $button = $("#" + opts.id);
                    $button.trigger(GAEA_EVENTS.DEFINE.UI.DIALOG.CRUD_ADD_OPEN, opts);
                }
            },
            update: {
                /**
                 *
                 * @param {object} opts
                 * @param {string} opts.id
                 * @param {string} opts.action
                 */
                do: function (opts) {
                    gaeaValid.isNull({
                        check: opts.id,
                        exception: "按钮id为空，无法打开更新弹出框。"
                    });
                    var $button = $("#" + opts.id);
                    if (gaeaString.equalsIgnoreCase(opts.action, GAEA_UI_DEFINE.ACTION.CRUD.UPDATE)) {
                        var gaeaGrid = require("gaeajs-ui-grid"); // 加载grid模块
                        var row = gaeaGrid.getSelected();
                        opts.selectedRow = row;
                        $button.trigger(GAEA_EVENTS.DEFINE.UI.DIALOG.CRUD_UPDATE_OPEN, opts);
                    }
                }
            }
        };

        return actions;
    });