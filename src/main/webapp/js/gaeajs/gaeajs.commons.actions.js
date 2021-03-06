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
        "gaeajs-ui-events", "gaeajs-ui-definition", "gaeajs-ui-notify", "gaeajs-ui-dialog", "gaeajs-context",
        "gaeajs-common-utils", "gaeajs-ui-crud-grid"
    ],
    function ($, _,
              gaeaAjax, gaeaValid, gaeaString, SYS_URL,
              GAEA_EVENTS, GAEA_UI_DEFINE, gaeaNotify, gaeaDialog, gaeaContext,
              gaeaUtils, gaeaCrudGrid) {
        var actions = {};

        /**
         * 初始化一个按钮相关的所有（系统内置）操作，包括通用删除、excel导出等
         *
         * @param {object} opts
         * @param {object} opts.button schema的button定义。其中应该也包含了buttonAction，但还是单独吧。
         * @param {object} opts.buttonAction 某个button的某个action
         * @param {object} opts.data 要POST到后台的数据. 应该必须有schemaId。
         * @param {object} opts.dialog  dialog定义。如果点击是打开dialog。
         */
        actions.init = function (opts) {

            var buttonDef = opts.button;
            opts.id = buttonDef.htmlId;
            opts.action = buttonDef.action;
            var $button = $("#" + buttonDef.htmlId);
            var dialogOpts = gaeaValid.isNull(opts.dialog) ? {} : opts.dialog;

            /**
             * 【1】通用校验框架
             * 当按钮含有action/actions/onClick才校验。之所以要有这个，是因为弹出框等也有校验，这里如果不限制一下，弹出框类的会校验两次。
             * TODO 这个是有bug的。校验的同时，因为异步，其实已经绕过（校验）了。
             */
            if ((gaeaValid.isNotNull(buttonDef.action) || gaeaValid.isNotNull(buttonDef.actions) || _.isFunction(buttonDef.onClick)) &&
                gaeaValid.isNotNull(buttonDef.validators)) {
                $button.click(function (event) {
                    // validate
                    // 如果有绑定校验器，需要校验通过才能继续。
                    //if (!$button.gaeaValidate("valid")) {
                    $.when($button.gaeaValidate("valid")).fail(function () {

                        // （验证不通过）立刻中止在本元素上绑定的所有同名事件的触发！
                        event.stopImmediatePropagation();
                        return;
                    });
                });
            }

            /**
             * 对于删除按钮，需要通过监听事件进行。
             */
            if (gaeaString.equalsIgnoreCase(buttonDef.action, GAEA_UI_DEFINE.ACTION.CRUD.DELETE_SELECTED) ||
                gaeaString.equalsIgnoreCase(buttonDef.action, GAEA_UI_DEFINE.ACTION.CRUD.PSEUDO_DELETE_SELECTED)) {
                // 请求真删除
                //opts.url = SYS_URL.CRUD.DELETE;
                // 初始化通用删除功能（绑定点击事件等）
                actions.deleteSelected.init(opts);
                //} else if (gaeaString.equalsIgnoreCase(buttonDef.action, GAEA_UI_DEFINE.ACTION.CRUD.PSEUDO_DELETE_SELECTED)) {// 和上面的DELETE_SELECTED基本一样，就是请求的接口不一样
                //    // 初始化通用删除功能（绑定点击事件等）
                //    actions.deleteSelected.init(opts);// options默认伪删除
            }
            // 由于历史是用buttonDef.action, 而新的是用buttonDef.action.name
            // TODO 整合buttonDef.action.name和buttonDef.action. 整合下面的if和上面的if
            if (_.isObject(buttonDef.action)) {
                if (gaeaString.equalsIgnoreCase(buttonDef.action.name, GAEA_UI_DEFINE.ACTION.CRUD_GRID.EXCEL_IMPORT)) {
                    /**
                     * 可编辑表格的导入
                     */
                    gaeaCrudGrid.action.excelImport.init({
                        sourceId: buttonDef.id,
                        action: buttonDef.action
                    });
                } else if (gaeaString.equalsIgnoreCase(buttonDef.action.name, GAEA_UI_DEFINE.ACTION.CRUD_GRID.EXCEL_EXPORT)) {
                    /**
                     * 可编辑表格的导出
                     */
                    gaeaCrudGrid.action.excelExport.init({
                        sourceId: buttonDef.id,
                        action: buttonDef.action
                    });
                }
            }
            /**
             * 按钮点击的事件
             * 老的方式，是通过isBindOnClick配置项控制，但会比较繁琐。
             * 新的都是通过直接检查回调函数即可。
             * TODO 这个后面全部重构为基于onClick
             */
            //if ((gaeaValid.isNull(opts.isBindOnClick) || opts.isBindOnClick) && !_.isFunction(buttonDef.onClick)) {
            //    $button.click(function () {
            /**
             * 创建按钮点击的对应处理。并执行。
             */
            //opts.id = buttonDef.htmlId;
            //opts.action = buttonDef.action;

            //var buttonDef = opts.button;
            //var $button = $("#" + buttonDef.htmlId);
            if (gaeaString.equalsIgnoreCase(buttonDef.action, GAEA_UI_DEFINE.ACTION.CRUD.UPDATE)) {
                actions.crudDialog.bindUpdateTrigger(opts);
                //// 定义grid id，方便获取selected row的数据（编辑）。
                //opts.gridId = GAEA_UI_DEFINE.UI.GRID.GAEA_GRID_DEFAULT_ID;
                //actions.crudDialog.update.do(opts);

            } else if (gaeaString.equalsIgnoreCase(buttonDef.action, GAEA_UI_DEFINE.ACTION.CRUD.ADD) || gaeaString.equalsIgnoreCase("crud-dialog", dialogOpts.componentName)) {
                actions.crudDialog.bindAddTrigger(opts);
                //// 定义grid id，方便获取selected row的数据（编辑）。
                //opts.gridId = GAEA_UI_DEFINE.UI.GRID.GAEA_GRID_DEFAULT_ID;
                //actions.crudDialog.add.do(opts);

                //} else if (gaeaString.equalsIgnoreCase(buttonDef.action, GAEA_UI_DEFINE.ACTION.CRUD.DELETE_SELECTED)) {
                //    actions.deleteSelected.doRealDelete(opts);
                //} else if (gaeaString.equalsIgnoreCase(buttonDef.action, GAEA_UI_DEFINE.ACTION.CRUD.PSEUDO_DELETE_SELECTED)) {// 和上面的DELETE_SELECTED基本一样，就是请求的接口不一样
                //    actions.deleteSelected.doPseudoDelete(opts);
            } else if (gaeaString.equalsIgnoreCase("crud-dialog", dialogOpts.componentName)) {
                // TODO 现在只是暂时把crud-dialog未定义action的转到这个方法来。后面需要重构到一个更合适的入口。
                // 先借用了update action的入口
                actions.crudDialog.bindUpdateTrigger(opts);
            } else if (gaeaString.equalsIgnoreCase(buttonDef.action, GAEA_UI_DEFINE.ACTION.EXPORT_EXCEL) ||
                gaeaString.equalsIgnoreCase(buttonDef.action, GAEA_UI_DEFINE.ACTION.EXPORT_EXCEL_WITH_WIZARD)) {
                actions.excel.bindExportTrigger(opts);
            }
            /**
             * action和actions应该两者只有一个。
             * actions是更深入的action的定义。并且，设计上希望一个button能执行多个action（未实现）
             */
            if (gaeaValid.isNotNull(buttonDef.actions)) {
                //var data = _private.getSubmitData();
                //data.buttonId = buttonDef.id;
                //data.actionName = buttonDef.action;
                //if (buttonDef.actions.length > 1) {
                //    gaeaNotify.error("当前不支持一个按钮绑定多个action！请联系系统管理员检查。");
                //    return;
                //}
                ///**
                // * 暂时只支持绑定一个action。
                // */
                //actions.doAction({
                //    button: buttonDef,
                //    data: data
                //});
                _private.bindActionTrigger(opts);
            }

            /**
             * 通用action的处理。即action有值。
             * （TODO 上面的DELETE、ADD DIALOG等应该都放在这里，但历史遗留问题，后面慢慢重构吧）
             */
            //if (gaeaValid.isNotNull(buttonDef.action) && gaeaString.equalsIgnoreCase(buttonDef.action, GAEA_UI_DEFINE.ACTION.EXPORT_EXCEL)) {
            //    var data = _private.getSubmitData();
            //    data.buttonId = buttonDef.id;
            //    data.actionName = buttonDef.action;
            //    /**
            //     * 普通action的处理（没有button-action子项）
            //     * 【重要】
            //     * TODO 暂时限定export excel走这个方法。因为其他的还没改过来。
            //     */
            //    actions.doSimpleAction({
            //        button: buttonDef,
            //        data: data
            //    });
            //}
            //});
            //}

            // 绑定事件
            if (_.isFunction(opts.button.onClick)) {
                $button.on("click", opts.button.onClick);
            }
        };
        /**
         *
         * @param {object} opts
         * @param {object} opts.button schema的button定义。其中应该也包含了buttonAction，但还是单独吧。
         * @param {object} opts.buttonAction 某个button的某个action
         * @param {object} opts.data 要POST到后台的数据. 应该必须有schemaId。
         */
        actions.doAction = function (opts) {
            var button = opts.button;
            var buttonAction = button.actions[0];// 暂时只支持绑定一个action
            var data = opts.data;
            var actionMethod = buttonAction.method;
            data.method = actionMethod; // 赋予"method"属性和值. Action必须!

            //if(gaeaString.equalsIgnoreCase(actionMethod, GAEA_UI_DEFINE.ACTION.METHOD.SUBMIT)){
            var actions = button.actions;
            if (_.isArray(actions)) {

                // 遍历actions
                // 当前应该只会有一个action, 就其实一般只会执行第一个action
                $.each(actions, function (i, iObj) {
                    var action = this;
                    var methodName = action.method;
                    var extraData = {}; // 额外的数据，一般从action param来再整合当前页面动态信息
                    if (gaeaValid.isNull(action)) {
                        return;
                    }

                    if (gaeaValid.isNotNullMultiple(action.params, ["withWizard", "value"]) &&
                        gaeaString.equalsIgnoreCase(methodName, GAEA_UI_DEFINE.ACTION.METHOD.EXCEL_EXPORT_BY_TEMPLATE)) {
                        /**
                         * 带向导的导出功能
                         * 可以提供选择，要导出哪些列之类的。然后再导出。
                         * ------------------------------------------------------------------------------------ */
                        var gaeaGrid = require("gaeajs-ui-grid");
                        // 获取当前已生效的查询条件
                        var queryConditions = gaeaGrid.query.getQueryConditions({
                            id: GAEA_UI_DEFINE.UI.GRID.GAEA_GRID_DEFAULT_ID
                        });
                        var gaeaDialog = require("gaeajs-ui-dialog");
                        var dialogId = button.id + "export-wizard-dialog";

                        /**
                         * 弹出框的可选字段，来自于html的数据集配置
                         */
                        gaeaDialog.init({
                            id: dialogId,
                            contentUrl: "/js/gaeajs/ui/template/gaea_excel_template_export.html",
                            submitUrl: SYS_URL.ACTION.DO_ACTION,
                            submitType: GAEA_UI_DEFINE.ACTION.SUBMIT_TYPE.FORM_SUBMIT,
                            extraSubmitData: {
                                //actionName: GAEA_UI_DEFINE.ACTION.EXPORT_EXCEL, // 先写死吧，不然后台也得兼容
                                method: methodName,
                                schemaId: data.schemaId,
                                buttonId: button.id,
                                filters: JSON.stringify(queryConditions)
                            },
                            callback: {
                                /* 内容加载完成后，基于按模板导出组件需要，修改对应数据集的请求，加入模板名称的条件 */
                                afterLoadContent: function () {
                                    var $dialog = $("#" + dialogId);
                                    var $multiSelect = $dialog.find(".gaea-multi-select");
                                    var dataStr = $multiSelect.data("gaea-data");
                                    var dataConfig = gaeaString.parseJSON(dataStr);
                                    dataConfig.selectable.condition = {
                                        id: "anyway",
                                        values: [{
                                            name: action.params.excelTemplateId.name,
                                            value: action.params.excelTemplateId.value,
                                            type: "static"
                                        }]
                                    };
                                    $multiSelect.attr("data-gaea-data", JSON5.stringify(dataConfig));
                                    $multiSelect.data("gaea-data", dataConfig); // 保持一致性
                                }
                            }
                        });
                    } else {
                        /**
                         * 执行submit action。（action.method=submit）
                         */
                        if (gaeaString.equalsIgnoreCase(methodName, GAEA_UI_DEFINE.ACTION.METHOD.SUBMIT)) {
                            if (gaeaValid.isNull(button.submitUrl)) {
                                throw "action.method=submit, submitUrl定义不允许为空！";
                            }
                            opts.submitUrl = button.submitUrl;

                            extraData = _private.action.submit.getParamsData({
                                id: "gaea-grid-ct", // AI.TODO 暂时写死。都是从列表页的grid获取数据。后面得思考一下，action和组件间交互获取数据的问题。
                                action: action
                            });
                        }

                        // 整合extra data（一般来自param定义），执行action
                        opts.data = _.extend(data, extraData);
                        _private.submit(opts);
                    }
                });
            }
        };

        /**
         * 和_private.submit大同小异。但这个，一方面提交处理的url不是同一个。另外，一些细节的东西，例如method，是没有的。
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
                var gaeaGrid = require("gaeajs-ui-grid");
                // 获取当前已生效的查询条件
                var queryConditions = gaeaGrid.query.getQueryConditions({
                    id: GAEA_UI_DEFINE.UI.GRID.GAEA_GRID_DEFAULT_ID
                });
                //// 构建一个临时的form，来用于提交。
                //var submitFormHtml = '' +
                //    '<form action="<%= ACTION %>" method="post">' +
                //    '<input type="hidden" name="actionName" value="<%= ACTION_NAME %>">' +
                //    '<input type="hidden" name="schemaId" value="<%= SCHEMA_ID %>">' +
                //    '<input type="hidden" name="buttonId" value="<%= BUTTON_ID %>">' +
                //    '<input type="hidden" name="filters" value="">' +
                //    '</form>';
                //var formHtmlTemplate = _.template(submitFormHtml);
                //var $form = $(formHtmlTemplate({
                //    ACTION: SYS_URL.ACTION.DO_SIMPLE_ACTION,
                //    ACTION_NAME: data.actionName,
                //    SCHEMA_ID: data.schemaId,
                //    BUTTON_ID: button.id
                //}));
                //// 通过jQuery注入值，给json双引号等转义
                //$form.children("[name='filters']").val(JSON.stringify(queryConditions));
                //// create form
                //// 必须append到body中，否则报错：Form submission canceled because the form is not connected
                //// 原因：According to the HTML standards, if the form is not associated browsing context(document), form submission will be aborted.
                //$("#" + button.id).parents("body:first").append($form);
                //// 提交form
                //$form.submit();
                //// remove form
                //$form.remove();
                if (gaeaString.equalsIgnoreCase(button.action, GAEA_UI_DEFINE.ACTION.EXPORT_EXCEL_WITH_WIZARD)) {
                    /**
                     * 带向导的导出功能
                     * 可以提供选择，要导出哪些列之类的。然后再导出。
                     * ----------------------------------------------------- */
                    var gaeaDialog = require("gaeajs-ui-dialog");

                    /**
                     * 弹出框的可选字段，来自于html的数据集配置
                     */
                    gaeaDialog.init({
                        id: "gaea-excel-export",
                        contentUrl: "/js/gaeajs/ui/template/gaea_excel_export.html",
                        submitUrl: SYS_URL.ACTION.DO_SIMPLE_ACTION,
                        submitType: GAEA_UI_DEFINE.ACTION.SUBMIT_TYPE.FORM_SUBMIT,
                        extraSubmitData: {
                            actionName: GAEA_UI_DEFINE.ACTION.EXPORT_EXCEL, // 先写死吧，不然后台也得兼容
                            schemaId: data.schemaId,
                            buttonId: button.id,
                            filters: JSON.stringify(queryConditions)
                        }
                    });
                } else {
                    /**
                     * 直接按默认导出功能
                     * ----------------------------------------------------- */
                    // 创建临时form
                    var $form = gaeaUtils.dom.createSubmitForm({
                        target: $("#" + button.id).parents("body:first"), // 找最近的一个body里面创建临时form
                        action: SYS_URL.ACTION.DO_SIMPLE_ACTION,
                        params: {
                            actionName: data.actionName,
                            schemaId: data.schemaId,
                            buttonId: button.id,
                            filters: JSON.stringify(queryConditions)
                        }
                    });
                    // 提交form
                    $form.submit();
                    // 移除form
                    $form.remove();
                }
            } else {
                /**
                 * 走ajax提交路线。
                 */
                gaeaAjax.post({
                    url: SYS_URL.ACTION.DO_SIMPLE_ACTION,
                    data: data,
                    success: function (data) {
                        gaeaNotify.success(gaeaString.builder.simpleBuild("%s 操作成功。", button.msg));
                        //gaeaNotify.message(button.msg + "操作成功。");
                        // 刷新grid数据
                        $("#" + GAEA_UI_DEFINE.UI.GRID.GAEA_GRID_DEFAULT_ID).trigger(GAEA_EVENTS.DEFINE.UI.GRID.RELOAD);
                    },
                    fail: function (data) {
                        gaeaNotify.fail(gaeaString.builder.simpleBuild("%s 操作失败！", button.msg));
                        //gaeaNotify.error(button.msg + "操作失败！");
                    }
                });
            }
            //$("<form action='" + SYS_URL.ACTION.DO_ACTION + "' method='post'><input type='hidden' name='method' value='" + data.method + "'><input type='hidden' name='schemaId' value='" + data.schemaId + "'><input type='hidden' name='buttonId' value='" + button.id + "'></form>").submit();
        };

        /**
         * 通用删除操作。
         */
        actions.deleteSelected = {
            do: function (opts, data) {
                var buttonDef = opts.button;
                //var $button = $("#" + buttonDef.htmlId);
                // 默认伪删除
                var deleteURL = SYS_URL.CRUD.PSEUDO_DELETE;
                if (gaeaValid.isNotNull(opts.url)) {
                    deleteURL = opts.url;
                }
                var schemaId = $("#" + GAEA_UI_DEFINE.UI.SCHEMA.ID).val();
                var gridId = $("#" + GAEA_UI_DEFINE.UI.GRID.ID).val();
                //var row = data.selectedRow;
                // get selected row
                var row = gaeaContext.getValue(GAEA_UI_DEFINE.UI.GAEA_CONTEXT.CACHE_KEY.SELECTED_ROW, GAEA_UI_DEFINE.UI.GRID.GAEA_GRID_DEFAULT_ID);
                // 通用删除！
                gaeaAjax.ajax({
                    url: deleteURL,
                    data: {
                        id: row.id,
                        urSchemaId: schemaId,
                        //gridId: gridId,
                        wfProcInstId: row.wfProcInstId
                    },
                    success: function () {
                        gaeaNotify.success(gaeaString.builder.simpleBuild("%s 删除成功。", buttonDef.msg));
                        //gaeaNotify.message("删除成功！");
                        $("#" + GAEA_UI_DEFINE.UI.GRID.GAEA_GRID_DEFAULT_ID).trigger(GAEA_EVENTS.DEFINE.UI.GRID.RELOAD);
                    },
                    // 返回内容如果为空，则即使status=200，也会进入fail方法
                    fail: function (jqXHR, textStatus, errorThrown) {
                        // 如果返回status=200，则还是当做成功！
                        if (jqXHR.status == 200) {
                            gaeaNotify.success(gaeaString.builder.simpleBuild("%s 删除成功。", buttonDef.msg));
                            //gaeaNotify.message("删除成功！");
                            $("#" + GAEA_UI_DEFINE.UI.GRID.GAEA_GRID_DEFAULT_ID).trigger(GAEA_EVENTS.DEFINE.UI.GRID.RELOAD);
                        } else {
                            var result = jqXHR.responseJSON;
                            gaeaNotify.fail(_.template("<%=SIMPLE_MSG%><p/><%=ERROR_MSG%>")({
                                SIMPLE_MSG: "删除失败！",
                                ERROR_MSG: result.RESULT_MSG
                            }));
                        }
                    }
                });
            },
            init: function (options) {
                var buttonDef = options.button;
                ////var $button = $("#" + buttonDef.htmlId);
                //// 默认伪删除
                //var deleteURL = SYS_URL.CRUD.PSEUDO_DELETE;
                //if (gaeaValid.isNotNull(options.url)) {
                //    deleteURL = options.url;
                //}
                ///**
                // * 绑定按钮触发的删除事件。
                // */
                //GAEA_EVENTS.registerListener(GAEA_EVENTS.DEFINE.ACTION.DELETE_SELECTED, "#" + buttonDef.htmlId, function (event, data) {
                //    var schemaId = $("#" + GAEA_UI_DEFINE.UI.SCHEMA.ID).val();
                //    var gridId = $("#" + GAEA_UI_DEFINE.UI.GRID.ID).val();
                //    var row = data.selectedRow;
                //    // button define
                //    var button = data.button;
                //    // 通用删除！
                //    gaeaAjax.ajax({
                //        url: deleteURL,
                //        data: {
                //            id: row.id,
                //            urSchemaId: schemaId,
                //            gridId: gridId,
                //            wfProcInstId: row.wfProcInstId
                //        },
                //        success: function () {
                //            gaeaNotify.success(gaeaString.builder.simpleBuild("%s 删除成功。", button.msg));
                //            //gaeaNotify.message("删除成功！");
                //            $("#" + GAEA_UI_DEFINE.UI.GRID.GAEA_GRID_DEFAULT_ID).trigger(GAEA_EVENTS.DEFINE.UI.GRID.RELOAD);
                //        },
                //        // 返回内容如果为空，则即使status=200，也会进入fail方法
                //        fail: function (jqXHR, textStatus, errorThrown) {
                //            // 如果返回status=200，则还是当做成功！
                //            if (jqXHR.status == 200) {
                //                gaeaNotify.success(gaeaString.builder.simpleBuild("%s 删除成功。", button.msg));
                //                //gaeaNotify.message("删除成功！");
                //                $("#" + GAEA_UI_DEFINE.UI.GRID.GAEA_GRID_DEFAULT_ID).trigger(GAEA_EVENTS.DEFINE.UI.GRID.RELOAD);
                //            } else {
                //                var result = jqXHR.responseJSON;
                //                gaeaNotify.fail(_.template("<%=SIMPLE_MSG%><p/><%=ERROR_MSG%>")({
                //                    SIMPLE_MSG: "删除失败！",
                //                    ERROR_MSG: result.RESULT_MSG
                //                }));
                //            }
                //        }
                //    });
                //}, { unbindBefore: false});

                /**
                 * 绑定按钮点击删除
                 */
                if (gaeaString.equalsIgnoreCase(buttonDef.action, GAEA_UI_DEFINE.ACTION.CRUD.DELETE_SELECTED)) {
                    // 真删除
                    options.url = SYS_URL.CRUD.DELETE;
                    actions.deleteSelected.bindRealDeleteTrigger(options);
                } else if (gaeaString.equalsIgnoreCase(buttonDef.action, GAEA_UI_DEFINE.ACTION.CRUD.PSEUDO_DELETE_SELECTED)) {// 和上面的DELETE_SELECTED基本一样，就是请求的接口不一样
                    // 伪删除
                    actions.deleteSelected.bindPseudoDeleteTrigger(options);
                }

            },
            /**
             * 绑定点击触发真删除事件。
             * @param opts
             */
            bindRealDeleteTrigger: function (opts) {
                // unbindBefore，不要解除之前的事件，之前还有绑定一个通用校验的事件
                GAEA_EVENTS.registerListener("click", "#" + opts.button.htmlId, function (event, data) {
                    //if (gaeaString.equalsIgnoreCase(buttonDef.action, GAEA_UI_DEFINE.ACTION.CRUD.DELETE_SELECTED)) {
                    // 真删除
                    actions.deleteSelected.doRealDelete(opts);
                    //} else if (gaeaString.equalsIgnoreCase(buttonDef.action, GAEA_UI_DEFINE.ACTION.CRUD.PSEUDO_DELETE_SELECTED)) {// 和上面的DELETE_SELECTED基本一样，就是请求的接口不一样
                    //    // 伪删除
                    //    actions.deleteSelected.doPseudoDelete(opts);
                    //}
                }, {unbindBefore: false});
            },
            /**
             * 绑定点击触发伪删除事件。
             * @param opts
             */
            bindPseudoDeleteTrigger: function (opts) {
                // unbindBefore，不要解除之前的事件，之前还有绑定一个通用校验的事件
                GAEA_EVENTS.registerListener("click", "#" + opts.button.htmlId, function (event, data) {
                    //if (gaeaString.equalsIgnoreCase(buttonDef.action, GAEA_UI_DEFINE.ACTION.CRUD.DELETE_SELECTED)) {
                    //    // 真删除
                    //    actions.deleteSelected.doRealDelete(opts);
                    //} else if (gaeaString.equalsIgnoreCase(buttonDef.action, GAEA_UI_DEFINE.ACTION.CRUD.PSEUDO_DELETE_SELECTED)) {// 和上面的DELETE_SELECTED基本一样，就是请求的接口不一样
                    // 伪删除
                    actions.deleteSelected.doPseudoDelete(opts);
                    //}
                }, {unbindBefore: false});
            },
            /**
             * 真删除
             * @param {object} opts
             * @param {string} opts.id
             * @param {object} opts.button              button的服务端定义
             */
            doRealDelete: function (opts) {
                var gaeaDialog = require("gaeajs-ui-dialog");
                gaeaValid.isNull({
                    check: opts.id,
                    exception: "按钮id为空，无法触发删除事件（删除动作绑定在某按钮上）。"
                });
                var $button = $("#" + opts.id);
                // 弹框。确认删除？
                //gaeaDialog.confirmDialog({
                gaeaDialog.commonDialog.confirm({
                    title: GAEA_UI_DEFINE.TEXT.UI.DIALOG.DELETE_CONFIRM_TITLE,
                    content: GAEA_UI_DEFINE.TEXT.UI.DIALOG.DELETE_CONFIRM_CONTENT
                }, function () {
                    //// get selected row
                    //var row = gaeaContext.getValue(GAEA_UI_DEFINE.UI.GAEA_CONTEXT.CACHE_KEY.SELECTED_ROW, GAEA_UI_DEFINE.UI.GRID.GAEA_GRID_DEFAULT_ID);
                    //// trigger delete action
                    //$button.trigger(GAEA_EVENTS.DEFINE.ACTION.DELETE_SELECTED, {
                    //    selectedRow: row,
                    //    button: opts.button
                    //});

                    actions.deleteSelected.do(opts);
                });
            },
            /**
             * 伪删除
             * @param {object} opts
             * @param {string} opts.id
             * @param {object} opts.button              button的服务端定义
             */
            doPseudoDelete: function (opts) {
                gaeaValid.isNull({
                    check: opts.id,
                    exception: "按钮id为空，无法触发删除事件（删除动作绑定在某按钮上）。"
                });
                var $button = $("#" + opts.id);
                // 弹框。确认删除？
                gaeaDialog.commonDialog.confirm({
                    title: GAEA_UI_DEFINE.TEXT.UI.DIALOG.DELETE_CONFIRM_TITLE,
                    content: GAEA_UI_DEFINE.TEXT.UI.DIALOG.DELETE_CONFIRM_CONTENT
                }, function () {
                    // get selected row
                    var row = gaeaContext.getValue(GAEA_UI_DEFINE.UI.GAEA_CONTEXT.CACHE_KEY.SELECTED_ROW, GAEA_UI_DEFINE.UI.GRID.GAEA_GRID_DEFAULT_ID);
                    // trigger delete action
                    $button.trigger(GAEA_EVENTS.DEFINE.ACTION.DELETE_SELECTED, {
                        selectedRow: row,
                        button: opts.button
                    });
                });
            }
        };

        actions.crudDialog = {
            /**
             * 绑定点击打开新增弹出框。
             * @param opts
             */
            bindAddTrigger: function (opts) {
                GAEA_EVENTS.registerListener("click", "#" + opts.button.htmlId, function (event, data) {
                    // 定义grid id，方便获取selected row的数据（编辑）。
                    opts.gridId = GAEA_UI_DEFINE.UI.GRID.GAEA_GRID_DEFAULT_ID;
                    actions.crudDialog.add.do(opts);
                });
            },
            /**
             * 触发add这个行为。
             * TODO add和update都一样，合成一个！另外，也整合crud-dialog的入口。
             * @param opts
             */
            add: {
                do: function (opts) {
                    gaeaValid.isNull({
                        check: opts.id,
                        exception: "按钮id为空，无法打开更新弹出框。"
                    });
                    var $button = $("#" + opts.id);
                    //$button.trigger(GAEA_EVENTS.DEFINE.UI.DIALOG.CRUD_ADD_OPEN, opts);
                    $button.trigger(GAEA_EVENTS.DEFINE.UI.DIALOG.CRUD_OPEN, opts);
                }
            },
            update: {
                /**
                 *
                 * @param {object} opts
                 * @param {string} opts.id              button id
                 * @param {string} opts.gridId          grid id, to get selected row's id.
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
                        //var row = gaeaGrid.getSelected();
                        //opts.selectedRow = row;
                        //$button.trigger(GAEA_EVENTS.DEFINE.UI.DIALOG.CRUD_UPDATE_OPEN, opts);
                        $button.trigger(GAEA_EVENTS.DEFINE.UI.DIALOG.CRUD_OPEN, opts);
                    }
                }
            },
            /**
             * 绑定点击打开编辑弹出框。
             * @param opts
             */
            bindUpdateTrigger: function (opts) {
                GAEA_EVENTS.registerListener("click", "#" + opts.button.htmlId, function (event, data) {
                    // 定义grid id，方便获取selected row的数据（编辑）。
                    opts.gridId = GAEA_UI_DEFINE.UI.GRID.GAEA_GRID_DEFAULT_ID;
                    actions.crudDialog.update.do(opts);
                });
            }
        };

        actions.excel = {
            /**
             * 绑定点击导出excel事件。
             * @param opts
             */
            bindExportTrigger: function (opts) {
                var buttonDef = opts.button;
                GAEA_EVENTS.registerListener("click", "#" + opts.button.htmlId, function (event, data) {
                    var data = _private.getSubmitData();
                    data.buttonId = buttonDef.id;
                    data.actionName = buttonDef.action;
                    /**
                     * 普通action的处理（没有button-action子项）
                     * 【重要】
                     * TODO 暂时限定export excel走这个方法。因为其他的还没改过来。
                     */
                    actions.doSimpleAction({
                        button: opts.button,
                        data: data
                    });
                }, {unbindBefore: false});
            }
        };

        var _private = {
            /**
             * 通用的提交功能。判断submitType，如果有设定就用form提交（一般下载文件用），否则就只用post提交。
             * @param {object} opts
             * @param {object} opts.button              schema的button定义。其中应该也包含了buttonAction，但还是单独吧。
             * @param {object} opts.data                提交到后端的数据
             * @param {string} opts.submitUrl           最终提交到的url。以这个为准，无视button定义里面的（因为有些业务需要忽略button的url）
             */
            submit: function (opts) {
                var button = opts.button;
                var buttonAction = button.actions[0];// 暂时只支持绑定一个action
                var data = opts.data;
                data.method = buttonAction.method; // 赋予"method"属性和值. Action必须!
                // 生成url. 默认：SYS_URL.ACTION.DO_ACTION
                var submitUrl = gaeaValid.isNull(opts.submitUrl) ? SYS_URL.ACTION.DO_ACTION : opts.submitUrl;
                // 获取当前已生效的查询条件
                var gaeaGrid = require("gaeajs-ui-grid");
                var queryConditions = gaeaGrid.query.getQueryConditions({
                    id: GAEA_UI_DEFINE.UI.GRID.GAEA_GRID_DEFAULT_ID
                });
                /**
                 * 如果是获取文件的action，例如导出，不能用ajax。必须用submit才行。
                 */
                if (gaeaString.equalsIgnoreCase(button.submitType, GAEA_UI_DEFINE.ACTION.SUBMIT_TYPE.FORM_SUBMIT)) {
                    var submitFormHtml = '' +
                        '<form action="<%= ACTION %>" method="post">' +
                        '<input type="hidden" name="method" value="<%= METHOD %>">' +
                        '<input type="hidden" name="schemaId" value="<%= SCHEMA_ID %>">' +
                        '<input type="hidden" name="buttonId" value="<%= BUTTON_ID %>">' +
                        '<input type="hidden" name="filters" value="">' +
                        '</form>';
                    var formHtmlTemplate = _.template(submitFormHtml);
                    var $form = $(formHtmlTemplate({
                        ACTION: submitUrl,
                        METHOD: data.method,
                        SCHEMA_ID: data.schemaId,
                        BUTTON_ID: button.id
                    }));
                    // 通过jQuery注入值，给json双引号等转义
                    $form.children("[name='filters']").val(JSON.stringify(queryConditions));
                    // create form
                    // 必须append到body中，否则报错：Form submission canceled because the form is not connected
                    // 原因：According to the HTML standards, if the form is not associated browsing context(document), form submission will be aborted.
                    $("#" + button.id).parents("body:first").append($form);
                    // 提交form
                    $form.submit();
                    // 移除form
                    $form.remove();
                } else {
                    gaeaAjax.post({
                        url: submitUrl,
                        data: gaeaUtils.data.flattenData(data),
                        success: function (data) {
                            gaeaNotify.success(gaeaString.builder.simpleBuild("%s 操作成功。", button.msg));
                            // 刷新grid数据
                            $("#" + GAEA_UI_DEFINE.UI.GRID.GAEA_GRID_DEFAULT_ID).trigger(GAEA_EVENTS.DEFINE.UI.GRID.RELOAD);
                            // 触发通用的提交完成事件
                            GAEA_EVENTS.publish(GAEA_EVENTS.DEFINE.ACTION.SUBMIT_FINISHED);
                        },
                        fail: function (data) {
                            gaeaNotify.fail(gaeaString.builder.simpleBuild("%s 操作失败！", button.msg));
                            //gaeaNotify.error(button.msg + "操作失败！");
                        }
                    });
                }
            },
            /**
             * 各个系统默认定义action的相关操作。
             */
            action: {
                /**
                 * action.method=submit的相关操作。
                 */
                submit: {
                    /**
                     * 负责转换/拼装action.params为json数据并返回。
                     * @param {object} opts
                     * @param {string} opts.id
                     * @param {object} opts.action
                     * @returns {json}
                     */
                    getParamsData: function (opts) {
                        var action = opts.action;
                        var extraData = {};

                        /**
                         * 遍历param，整合param的值。
                         * 一般，param只给出name，我们需要动态从页面获取值（例如从grid）。当然，也可能param配置了固定的value。
                         */
                        var params = action.params;
                        if (_.isObject(params)) {

                            var fields = new Array();
                            // 遍历params
                            $.each(_.values(params), function (j, jObj) {
                                // 这个是用于查询特定字段的数据用
                                var field = {};
                                var actionParam = this;
                                if (gaeaValid.isNotNull(actionParam.name)) {
                                    // 优先从定义读值
                                    var value = actionParam.value;
                                    field.name = actionParam.name;
                                    field.aliasName = actionParam.aliasName;
                                    field.value = value;
                                    fields.push(field);
                                } else {
                                    console.debug("action param name为空！action: %s", JSON.stringify(action));
                                }
                            });

                            // 获取选中的所有行
                            var rowDatas = gaeaContext.getValue(GAEA_UI_DEFINE.UI.GAEA_CONTEXT.CACHE_KEY.SELECTED_ROWS, opts.id);
                            var selectedRows = _private.getFilterDatas({
                                data: rowDatas,
                                fields: fields
                            });
                            // 提交的param name和缓存的变量名一致吧
                            extraData[GAEA_UI_DEFINE.UI.GAEA_CONTEXT.CACHE_KEY.SELECTED_ROWS] = selectedRows;
                        }
                        return extraData;
                    }
                }
            },
            /**
             * 获取过滤后的数据
             * @param {object} opts
             * @param {object[]} opts.data
             * @param {object[]} opts.fields
             * @param {string} opts.fields.name
             * @param {string} opts.fields.aliasName
             * @param {string} opts.fields.value
             */
            getFilterDatas: function (opts) {
                var result = new Array();

                if (gaeaValid.isNull(opts.data)) {
                    return;
                }
                if (gaeaValid.isNull(opts.fields)) {
                    return opts.data;
                }
                // 如果data是对象，转换成数组先
                if (!_.isArray(opts.data)) {
                    opts.data = [opts.data];
                }

                // 遍历数据
                $.each(opts.data, function (i, iValue) {
                    var eachData = iValue;
                    var newData = {};
                    if (_.isArray(opts.fields)) {
                        // 遍历字段
                        $.each(opts.fields, function (j, jValue) {
                            var field = jValue;
                            var name = field.name;
                            var aliasName = field.aliasName;
                            var value = field.value;
                            // 如果有别名，就以别名定义字段; 否则就还是用原名.
                            var newName = gaeaValid.isNull(aliasName) ? name : aliasName;
                            // 再从grid select row读值
                            if (gaeaValid.isNull(value)) {
                                value = gaeaValid.isNull(eachData) ? "" : eachData[name];
                            }
                            newData[newName] = value;
                        });
                    }
                    result.push(newData);
                });

                return result;
            },
            /**
             * copy from gaea.ui.toolbar _private.getSubmitData by Iverson 2017年7月25日15:22:32
             * @param opts
             *              rowParamName row作为data的属性的名。即 data.paramName=row. 空即data=row.
             * @returns data
             */
            getSubmitData: function (opts) {
                var gaeaGrid = require("gaeajs-ui-grid");
                var data = {};
                //var row = gaeaGrid.getSelected();
                var row = gaeaContext.getValue(GAEA_UI_DEFINE.UI.GAEA_CONTEXT.CACHE_KEY.SELECTED_ROW, "gaea-grid-ct");
                // 获取页面的SCHEMA ID
                //var schemaId = gaeaView.list.getSchemaId();
                var schemaId = $("#urSchemaId").val();
                data.schemaId = schemaId;
                // 获取页面快捷查询的条件
                var queryConditions = gaeaGrid.query.getQueryConditions({
                    id: GAEA_UI_DEFINE.UI.GRID.GAEA_GRID_DEFAULT_ID
                });
                // 把数据处理一下。否则以Spring MVC接受jQuery的请求格式，对不上会抛异常。特别是数组、对象类的（带了[id]）。
                var newRow = gaeaUtils.data.flattenData(row);
                if (gaeaValid.isNotNull(opts) && gaeaValid.isNotNull(opts.rowParamName)) {
                    /**
                     * row的数据作为data的一个属性值
                     */
                    var rowParamName = opts.rowParamName;
                    data[rowParamName] = newRow;
                } else {
                    /**
                     * 需要把row值合并到data
                     */
                    data = _.extend(data, newRow);
                    data = _.extend(data, queryConditions);
                }
                return data;
            },
            bindActionTrigger: function (opts) {
                var buttonDef = opts.button;
                GAEA_EVENTS.registerListener("click", "#" + opts.button.htmlId, function (event, data) {
                    var data = _private.getSubmitData();
                    data.buttonId = buttonDef.id;
                    data.actionName = buttonDef.action;
                    if (buttonDef.actions.length > 1) {
                        gaeaNotify.error("当前不支持一个按钮绑定多个action！请联系系统管理员检查。");
                        return;
                    }
                    /**
                     * 暂时只支持绑定一个action。
                     */
                    actions.doAction({
                        button: buttonDef,
                        data: data
                    });
                }, {unbindBefore: false});
            }
        };

        return actions;
    });