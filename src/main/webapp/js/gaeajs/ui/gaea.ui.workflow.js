/**
 * 基于RequireJS的模块化重构。让依赖更清晰，更简单。
 * 封装工作流相关的组件。
 * Created by iverson on 2016-2-17 11:48:52.
 */
define(["jquery", "underscore", 'gaeajs-common-utils-ajax', 'gaeajs-common-utils-validate', 'gaeajs-ui-grid', 'gaeajs-ui-dialog',
        "gaeajs-context", "gaeajs-ui-notify", "gaeajs-ui-definition", 'gaea-jqui-dialog'],
    function ($, _, gaeaAjax, gaeaValid, gaeaGrid, gaeaDialog,
              gaeaContext, gaeaNotify, GAEA_UI_DEFINE) {
    var workflow = {
        dialog: {
            cache: {
                me: null,
                options: null,
                selectedRow:null
            },
            create: function (dialogOptions,buttonOptions) {
                var that = this;
                //var dialogOption = dialogOptions;
                dialogOptions.id = dialogOptions.htmlId;   // 用htmlId作为创建dialog的DIV ID。
                this.createNormalApprovalDialogAndBinding(dialogOptions, buttonOptions);
                //$("#"+this.htmlId).click(function(){
                $("#" + buttonOptions.htmlId).click(function () {
                    //var row = gaeaGrid.getSelected();
                    //console.log("在workflow.dialog.create中，能否获得当前选中的行？row is null? "+gaeaValid.isNull(row));
                    // 获取默认的一个grid的选中行。这个代码会有点不太灵活。
                    var row = gaeaContext.getValue("selectedRow", GAEA_UI_DEFINE.UI.GRID.GAEA_GRID_DEFAULT_ID);
                    if (gaeaValid.isNull(row)) {
                        gaeaNotify.warn("未选择行数据，无法执行对应的工作流操作！");
                        return;
                    }
                        if (gaeaValid.isNotNull(row.wfProcInstId)) {
                            $("#wfProcInstId").val(row.wfProcInstId);
                            workflow.dialog.open(dialogOptions);
                        } else {
                            alert("该记录还未启动流程，无法进行流程操作。");
                        }
                    //}
                });
                //})
            },
            createNormalApprovalDialogAndBinding: function (inOptions, linkAction) {
                var gaeaDialog = require("gaeajs-ui-dialog");
                this.cache.options = inOptions;
                //inOptions.autoOpen = false;
                var dlgSelector = null;
                // 指定工作流审批dialog要注入的DIV
                if (gaeaValid.isNull(inOptions.id)) {
                    inOptions.id = "workflow-approval-dialog";
                }
                //inOptions.id = inOptions.renderTo;
                var $dialog = $("#" + inOptions.id);
                //dlgSelector = "#" + inOptions.id;
                //var dlgFormId = inOptions.id + "-form";
                //this.cache.options.formId = dlgFormId;
                if (gaeaValid.isNotNull(inOptions.htmlWidth)) {
                    inOptions.width = inOptions.htmlWidth;
                }
                if (gaeaValid.isNotNull(inOptions.htmlHeight)) {
                    inOptions.height = inOptions.htmlHeight;
                }
                //if(ur.utils.validate.isNotNull(inOptions.htmlId)){
                //    inOptions.htmlId = "workflow-approval-dialog";
                //}

                // 设定按钮
                var buttons = this._createButtons();
                inOptions.buttons = buttons;
                // 外面嵌入form
                //var dlgContent = "<form id=\"" + dlgFormId + "\" action=\"" + inOptions.submitUrl + "\">" + $(dlgSelector).html() + "</form>";
                //$(dlgSelector).html(dlgContent);
                // 初始化DIALOG
                //var dialog = gaeaDialog.create(inOptions);
                gaeaDialog.init(inOptions);
                // 填充workflow dialog的内容
                $dialog.find("form:first").append('<input type="hidden" id="wfProcInstId" name="wfProcInstId" value="">' +
                    '<input type="hidden" id="wfActName" name="wfActName" value="">' +
                    '<span><label>审批意见</label><textarea id="wfApprovalReason" name="wfApprovalReason" ></textarea></span>');
                //this.cache.me = dialog;
                return this;
                //if (ur.utils.validate.isNotNull(linkAction) && ur.utils.validate.isNotNull(linkAction.htmlId)) {
                //    $("#" + linkAction.htmlId).click(function () {
                //        console.log("open dialog. dialog renderTo: " + inOptions.renderTo);
                //        dialog.gaeaDialog("open");
                //    })
                //}
            },
            open: function (dialogOptions) {
                var row = gaeaContext.getValue("selectedRow", GAEA_UI_DEFINE.UI.GRID.GAEA_GRID_DEFAULT_ID);
                if (gaeaValid.isNull(row.wfProcInstId)) {
                    throw "没有procInstId，无法创建工作流审批Dialog。";
                }
                //console.log("open wf-dialog");
                //this.cache.selectedRow = row;
                var buttons = this._createButtons();
                //this.cache.me.gaeaDialog({buttons:buttons});
                //this.cache.me.gaeaDialog("open");
                gaeaDialog.open({
                    id: dialogOptions.id
                });
            },
            /**
             * 创建审批dialog相关的按钮。例如：批准、不批准、取消等。并且绑定相关事件。
             * @param buttonsOption
             * @returns {{}}
             * @private
             */
            _createButtons: function () {
                var that = this;
                var buttonsOption = this.cache.options.buttons;
                var buttons = {};
                var hasApproveButton = false;
                var hasNotApproveButton = false;
                var hasCancelButton = false;
                //var row = this.cache.selectedRow;
                var defaultApproveFunc = function () {
                    //console.log("submit. row id: "+that.cache.selectedRow.id);
                    //var row = that.cache.selectedRow;
                    var row = gaeaContext.getValue("selectedRow", GAEA_UI_DEFINE.UI.GRID.GAEA_GRID_DEFAULT_ID);
                    var form = $("#" + that.cache.options.formId);
                    var formFields = form.serializeObject();
                    formFields.id=row.id;
                    formFields.wfProcInstId = row.wfProcInstId;
                    formFields.wfActName = row.wfActName;
                    $.post(form.prop("action"),
                        formFields,
                        function () {
                            alert("成功");
                        }).fail(function () {
                        alert("失败");
                    });
                    //$("#" + that.cache.options.formId).submit();
                    $(this).gaeaDialog("close");
                };
                $.each(buttonsOption, function (key, val) {
                    if ("approve" == this.type) {
                        buttons[this.htmlValue] = defaultApproveFunc;
                        hasApproveButton = true;
                    } else if ("notApprove" == this.type) {
                        buttons[this.htmlValue] = defaultApproveFunc;
                        hasNotApproveButton = true;
                    } else if ("cancel" == this.type) {
                        buttons[this.htmlValue] = function () {
                            $(this).gaeaDialog("close");
                        }
                        hasCancelButton = true;
                    }
                });
                // 如果没有相关的按钮，则创建默认按钮（确定、取消）
                if (!hasApproveButton) {
                    buttons["确定"] = function () {
                        $(this).gaeaDialog("close");
                    };
                    hasApproveButton = true;
                }
                if (!hasCancelButton) {
                    buttons["取消"] = function () {
                        $(this).gaeaDialog("close");
                    };
                    hasCancelButton = true;
                }
                return buttons;
            }
        }
    };
    /**
     * 返回（暴露）的接口
     */
    return workflow;
})