/**
 * 提供和macula框架有关的页面组件方法
 * dependency：
 * JQuery, gaea-common
 * jquery.serializeObject.js
 * 2015年7月9日 星期四
 */
gaea.macula.biz = {
    components: {
        findDialog: function (inViews, linkViewId) {
            var dialog = null;
            if (gaea.utils.validate.isNotNull(inViews)) {
                dialog = this._find(inViews.dialogs, linkViewId);
                //if (ur.utils.validate.isNotNull(inViews.dialogs)) {
                //    $.each(inViews.dialogs, function (key, val) {
                //        if(this.id==linkViewId){
                //            dialog = this;
                //            return false;   // 跳出循环。
                //            //return this;
                //        }
                //    })
                //}
            }
            return dialog;
        },
        findActionButton: function (inViews, id) {
            var button = null;
            if (gaea.utils.validate.isNotNull(inViews) && gaea.utils.validate.isNotNull(inViews.actions)) {
                button = this._find(inViews.actions.buttons, id);
            }
            return button;
        },
        _find: function (jsonComponents, cmpnId) {
            var findObj = null;
            if (gaea.utils.validate.isNotNull(jsonComponents)) {
                $.each(jsonComponents, function (key, val) {
                    if (this.id == cmpnId) {
                        findObj = this;
                        return false;   // 跳出循环。
                        //return this;
                    }
                })
            }
            return findObj;
        }
        //},
        //findComponent: function (inViews,linkViewId) {
        //    var findedComponent = null;
        //    if (ur.utils.validate.isNotNull(inViews)) {
        //        if (ur.utils.validate.isNotNull(inViews.dialogs)) {
        //            $.each(inViews.dialogs, function (key, val) {
        //                if(this.id==linkViewId){
        //                    findedComponent = this;
        //                    return false;
        //                    //return this;
        //                }
        //            })
        //        }
        //    }
        //    return findedComponent;
    },
    workflow: {
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
                    var row = gaea.component.grid.getSelected();
                    console.log("在workflow.dialog.create中，能否获得当前选中的行？row is null? "+gaea.utils.validate.isNull(row));
                    if(gaea.utils.validate.isNotNull(row)) {
                        if (gaea.utils.validate.isNotNull(row.wfProcInstId)) {
                            $("#wfProcInstId").val(row.wfProcInstId);
                            that.open(row);
                        } else {
                            alert("该记录还未启动流程，无法进行流程操作。");
                        }
                    }
                });
                //})
            },
            createNormalApprovalDialogAndBinding: function (inOptions, linkAction) {
                this.cache.options = inOptions;
                inOptions.autoOpen = false;
                var dlgSelector = null;
                // 指定工作流审批dialog要注入的DIV
                if (gaea.utils.validate.isNull(inOptions.renderTo)) {
                    inOptions.renderTo = "workflow-approval-dialog";
                }
                inOptions.id = inOptions.renderTo;
                dlgSelector = "#" + inOptions.id;
                var dlgFormId = inOptions.id + "-form";
                this.cache.options.formId = dlgFormId;
                if (gaea.utils.validate.isNotNull(inOptions.htmlWidth)) {
                    inOptions.width = inOptions.htmlWidth;
                }
                if (gaea.utils.validate.isNotNull(inOptions.htmlHeight)) {
                    inOptions.height = inOptions.htmlHeight;
                }
                //if(ur.utils.validate.isNotNull(inOptions.htmlId)){
                //    inOptions.htmlId = "workflow-approval-dialog";
                //}

                // 设定按钮
                var buttons = this._createButtons();
                inOptions.buttons = buttons;
                // 外面嵌入form
                var dlgContent = "<form id=\"" + dlgFormId + "\" action=\"" + inOptions.submitUrl + "\">" + $(dlgSelector).html() + "</form>";
                $(dlgSelector).html(dlgContent);
                // 初始化DIALOG
                var dialog = gaea.component.bridge.dialog.create(inOptions);
                this.cache.me = dialog;
                return this;
                //if (ur.utils.validate.isNotNull(linkAction) && ur.utils.validate.isNotNull(linkAction.htmlId)) {
                //    $("#" + linkAction.htmlId).click(function () {
                //        console.log("open dialog. dialog renderTo: " + inOptions.renderTo);
                //        dialog.urDialog("open");
                //    })
                //}
            },
            open: function (row) {
                if (gaea.utils.validate.isNull(row.wfProcInstId)) {
                    throw "没有procInstId，无法创建工作流审批Dialog。";
                }
                //console.log("open wf-dialog");
                this.cache.selectedRow = row;
                var buttons = this._createButtons();
                //this.cache.me.urDialog({buttons:buttons});
                this.cache.me.urDialog("open");
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
                var row = this.cache.selectedRow;
                var defaultApproveFunc = function () {
                    console.log("submit. row id: "+that.cache.selectedRow.id);
                    var row = that.cache.selectedRow;
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
                    $(this).urDialog("close");
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
                            $(this).urDialog("close");
                        }
                        hasCancelButton = true;
                    }
                });
                // 如果没有相关的按钮，则创建默认按钮（确定、取消）
                if (!hasApproveButton) {
                    buttons["确定"] = function () {
                        $(this).urDialog("close");
                    };
                    hasApproveButton = true;
                }
                if (!hasCancelButton) {
                    buttons["取消"] = function () {
                        $(this).urDialog("close");
                    };
                    hasCancelButton = true;
                }
                return buttons;
            }
        }
    }
}