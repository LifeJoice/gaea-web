/**
 * dependency:
 * gaea-common.js
 * gaea-jquery.ui.dialog.custom.js
 * 2015年7月6日 星期一
 */
/*
ur.macula.biz = {
    workflow: {
        createNormalApprovalDialogAndBinding: function (inOptions,linkAction,procInstId) {
            if(ur.utils.validate.isNull(procInstId)){
                throw "没有procInstId，无法创建工作流审批Dialog。";
            }
            inOptions.autoOpen = false;
            if(ur.utils.validate.isNotNull(inOptions.htmlWidth)){
                inOptions.width = inOptions.htmlWidth;
            }
            if(ur.utils.validate.isNotNull(inOptions.htmlHeight)){
                inOptions.height = inOptions.htmlHeight;
            }
            //if(ur.utils.validate.isNotNull(inOptions.htmlId)){
            //    inOptions.htmlId = "workflow-approval-dialog";
            //}
            // 指定工作流审批dialog要注入的DIV
            if(ur.utils.validate.isNull(inOptions.renderTo)) {
                inOptions.renderTo = "workflow-approval-dialog";
            }
            // 设定按钮
            var buttons = this._createNormalButtons(inOptions.buttons);
            inOptions.buttons = buttons;
            // 初始化DIALOG
            var dialog = ur.component.biz.create(inOptions);
            if(ur.utils.validate.isNotNull(linkAction) && ur.utils.validate.isNotNull(linkAction.htmlId)) {
                $("#" + linkAction.htmlId).click(function () {
                    console.log("open dialog. dialog renderTo: "+inOptions.renderTo);
                    dialog.urDialog("open");
                })
            }
        },
        _createNormalButtons: function (buttonsOption) {
            var buttons = {};
            var hasOkButton = false;
            var hasCancelButton = false;
            $.each(buttonsOption, function (key,val) {
                if("approve"==this.type){
                    buttons[this.htmlValue] = function () {
                        $(this).urDialog("close");
                    };
                    hasOkButton = true;
                }else if("cancel"==this.type){
                    buttons[this.htmlValue] = function () {
                        $(this).urDialog("close");
                    }
                    hasCancelButton = true;
                }
            });
            if(!hasOkButton){
                buttons["确定"] = function () {
                    $(this).urDialog("close");
                };
                hasOkButton = true;
            }
            if(!hasCancelButton){
                buttons["取消"] = function () {
                    $(this).urDialog("close");
                };
                hasCancelButton = true;
            }
            return buttons;
        }
    }
}
*/




