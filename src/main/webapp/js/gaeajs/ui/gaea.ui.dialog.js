/**
 * 基于RequireJS的模块化重构。让依赖更清晰，更简单。
 * Created by iverson on 2016-2-17 11:48:52.
 */
define(["jquery","underscore",'gaeajs-common-utils-ajax','gaeajs-common-utils-validate','gaea-jqui-dialog'],function ($,_,gaeaAjax,gaeaValid) {
    var dialog = {
        options: {
            id: null,
            title: null,
            renderTo: null,
            width: null,
            height: null,
            maxHeight: 550, // 最大高度。这个关系自动生产高度的弹出框的最大高度。
            injectHtmlId: null,
            formId: null,
            okText: null,
            cancelText: null,
            autoOpen: false,
            resizable: true,
            // callback
            success: null,
            fail: null,
            cancel: null,
            buttons: {}
        },
        // 基于form普通弹出框
        create: function (argOptions) {
            this.options = argOptions;
            var dialog = this._createDialog();
            return dialog;
            // 设置要注入dialog的表单id（一般来说是表单id）。否则弹出框就没内容显示了。
            //dialog.contentEl = this.options.injectHtmlId;
            //dialog.show();
        },
        open: function (jqSelector) {
            $(jqSelector).gaeaDialog("open");
        },
        close: function (jqSelector) {
            $(jqSelector).gaeaDialog("close");
        },
        findDialog: function (inViews, linkViewId) {
            var dialog = null;
            if (gaeaValid.isNotNull(inViews)) {
                dialog = this._find(inViews.dialogs, linkViewId);
            }
            return dialog;
        },
        _createDialog: function () {
            var that = this;
            var dialogDivSelector = "#" + this.options.id;
            //初始化弹出框
            var dialog = $(dialogDivSelector).gaeaDialog({
                autoOpen: this.options.autoOpen,
                resizable: this.options.resizable,
                width: this.options.width,
                height: this.options.height,
                title: this.options.title,
                modal: true,
                buttons: this.options.buttons
            });
//        },
            // 老的实现，基于ExtJS 3.自动根据form内容调整高度。
//        _urAutoSizeFormDialog: function(options) {
//            var dataSelector = "#" + options.formId;
//            /* 如果没有设定大小，自动根据内容计算弹出框大小 */
//            if (ur.utils.validate.isNull(this.options.height)) {
//                var formInputSelector = dataSelector + " input,select";
//                // 表单输入项的个数
//                var inputCount = $(formInputSelector).not("input[type='hidden']").length;
//                // 输入框个数 * (输入框高度20 + 框间距5) + 最下面距离5
//                var h = inputCount * (20 + 5) + 5;
//                h += 70;    // 70是给弹出框title和操作区的。
//                this.options.height = h > this.options.maxHeight ? this.options.maxHeight : h;
//            }
//            /* 如果没有传入fail方法，则创建默认的fail方法 */
//            if (!$.isFunction(options.fail)) {
//                options.fail = function(jqXHR) {
//                    var data = $.parseJSON(jqXHR.responseText);
//                    // 显示后台传来的错误信息，可能是抛出的异常信息。
//                    ur.utils.message.show(data);
//                }
//            }
//            /* 生成UR定制的JQuery UI的弹出框 */
//            var dialog = $("#mydialog").gaeaDialog({
//                    autoOpen: false,
//                    resizable: true,
//                    width: 500,
//                    height: 320,
//                    modal: true,
//                    buttons: {
//                        "确定": function () {
//                            $("#dateoffForm").submit();
//                            $(this).gaeaDialog("close");
//                        },
//                        "取消": function () {
//                            $(this).gaeaDialog("close");
//                        }
//                    }
//                });
//
//
//
//            var dialog = new Ext.Window({
//                title: options.title,
//                height: this.options.height,
//                width: 400,
//                layout: 'form', // Iverson setting
////                    layout: 'fit',
////        contentEl: config.htmlId, // 这个改为由具体方法自己设置。因为像确认框这种不需要表单信息。
//                buttons: [
//                    {
//                        text: options.okText,
//                        handler: function() {
//                            ur.utils.ajax.post({
//                                url: options.url,
//                                data: $(dataSelector).serializeObject(), // 把form的内容自动转成json请求
//                                success: options.success,
//                                fail: options.fail
//                            });
//                            // ---------------------- form data 请求方式 ----------------------
////                            options.success();
//                            dialog.hide();
//                        }
//                    },
//                    {
//                        text: options.cancelText,
//                        handler: function() {
//                            if ($.isFunction(options.cancel)) {
//                                options.cancel();
//                            }
//                            dialog.hide();
//                        }
//                    }]
//            });
            return dialog;
        },
        _find: function (jsonComponents, cmpnId) {
            var findObj = null;
            if (gaeaValid.isNotNull(jsonComponents)) {
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
    };
    /**
     * 返回（暴露）的接口
     */
    return dialog;
})