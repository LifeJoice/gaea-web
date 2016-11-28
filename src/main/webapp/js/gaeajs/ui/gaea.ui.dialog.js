/**
 * 基于RequireJS的模块化重构。让依赖更清晰，更简单。
 * Created by iverson on 2016-2-17 11:48:52.
 */
define([
        "jquery", "underscore", 'gaeajs-common-utils-ajax', 'gaeajs-common-utils-validate',
        "gaeajs-data", "gaeajs-ui-events", "gaeajs-ui-form", "gaeajs-common-utils-string",
        "gaeajs-ui-definition", "gaeajs-ui-view", "gaea-system-url", 'gaeajs-ui-notify',
        "gaeajs-ui-commons", "gaeajs-ui-multiselect", "gaeajs-common", "gaeajs-ui-components",
        'gaea-jqui-dialog', "jquery-serializeObject"],
    function ($, _, gaeaAjax, gaeaValid,
              gaeaData, GAEA_EVENTS, gaeaForm, gaeaString,
              GAEA_UI_DEFINE, gaeaView, SYS_URL, gaeaNotify,
              gaeaUI, gaeaMultiSelect, gaeaCommon, gaeaComponents) {
        var _options = {
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
        };

        var dialog = {
            // 基于form普通弹出框
            create: function (argOptions) {
                _options = argOptions;
                var dialog = this._createDialog();
                return dialog;
                // 设置要注入dialog的表单id（一般来说是表单id）。否则弹出框就没内容显示了。
                //dialog.contentEl = this.options.injectHtmlId;
                //dialog.show();
            },
            open: function (jqSelector, position) {
                if (gaeaValid.isNotNull(position)) {
                    $(jqSelector).gaeaDialog("option", "position", position);
                }
                $(jqSelector).gaeaDialog("open");
            },
            /**
             * 关闭dialog
             * @param jqSelector
             */
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
            /**
             * 共用的确认弹框。
             * 需求：弹个框，显示一句话，OK就callbak，不OK就取消。
             * @param options
             *              id dialog的div id.也可以为空, 就大家一起公用了. 其实也不影响.
             *              title 弹框的标题
             *              content 弹框的内容
             * @param callback
             */
            confirmDialog: function (options, callback) {
                var dialogId = options.id;// DOM的id
                if (gaeaValid.isNull(dialogId)) {
                    dialogId = GAEA_UI_DEFINE.UI.DIALOG.COMMON_CONFIG_DIALOG_ID; // 共用
                }
                dialog.utils.createDialogDiv({
                    id: dialogId,
                    content: options.content
                });
                var $dialog = this.create({
                    id: dialogId,
                    title: options.title,
                    buttons: {
                        "确认": function () {
                            callback();
                            $(this).gaeaDialog("destroy");
                            $(this).remove();
                        },
                        "取消": function () {
                            $(this).gaeaDialog("destroy");
                        }
                    }
                });
                $dialog.gaeaDialog("open");
            },
            _createDialog: function () {
                var that = this;
                var dialogDivSelector = "#" + _options.id;
                //初始化弹出框
                var dialog = $(dialogDivSelector).gaeaDialog({
                    autoOpen: _options.autoOpen,
                    resizable: _options.resizable,
                    width: _options.width,
                    height: _options.height,
                    title: _options.title,
                    modal: true,
                    buttons: _options.buttons
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
            },
            /**
             * 加载内容
             * @private
             */
            loadContent: function (options, callback) {
                var $container = $("#" + options.containerId);
                // jquery.get才能返回一个jqXHR对象。作同步用。
                return $.get(options.contentUrl, function (data) {
                    // 加载内容
                    $container.html(data);
                    // 一开始的回调
                    //if (gaeaValid.isNotNull(atFirstAfterLoadCallback)) {
                    //    atFirstAfterLoadCallback();
                    //}
                    // 初始化表单的样式（load过来的表单）
                    gaeaForm.init({
                        containerClass: "gaea-form"
                    });
                    //// 初始化HTML页声明的UI，例如生成table等
                    ////gaeaUI.initComponents(dialogOption.id);// TODO 取消看看。发现没调用！！！
                    //// 初始化数据相关的（数据集，MVVM等）
                    //gaeaData.dataSet.scanAndInit(dialogOption.id);
                    ////gaeaData.scanAndInit(dialogOption.id, afterBindingCallback);
                    //// 初始化数据组件。例如：可编辑表格等 TODO 初始化UI的数据
                    //gaeaData.component.init(dialogOption.id,null);
                    ////// 初始化编辑框的数据
                    //if(gaeaValid.isNotNull(data)) {
                    //    gaeaData.fieldData.init(dialogOption.id, data);
                    //}
                    //// 最后，绑定整个页面
                    //gaeaData.binding(dialogOption.id,afterBindingCallback);
                    //// 最后回调的定义
                    //if (gaeaValid.isNotNull(atLastAfterLoadCallback)) {
                    //    atLastAfterLoadCallback(dialogOption.id);
                    //}
                    //// 获取要编辑的数据
                    //var editData = crudDialog.getData();
                    // 最后回调的定义
                    if (_.isFunction(callback)) {
                        callback();
                    }
                });
            }
        };
        var crudDialog = {
            options: {
                // 在数据集加载完后，再填充要编辑的数据？（编辑数据覆盖数据集数据）
                fillAfterDsLoading: true
            },
            cache: {
                update: {
                    submitData: {}
                },
                selectedRow: null // 缓存选中的grid的行数据。这个对crudDialog是必须的。
            },
            /**
             *
             * @param options
             */
            init: function (options) {
                options = _.extend(crudDialog.options, options);
                var linkObj = options.dialog;
                var buttonDef = options.button;
                var selectedRow = null;
                if (gaeaValid.isNull(linkObj.htmlId)) {
                    throw "没有htmlId(对于页面DIV ID)，无法创建Dialog。";
                }
                //dialogDef = linkObj;
                var dialogOption = _.clone(linkObj);
                // 用htmlId作为创建dialog的DIV ID。
                dialogOption.id = linkObj.htmlId;
                var dlgSelector = "#" + dialogOption.id;
                // 检查当前页面有没有对应的DIV，没有创建一个。
                dialog.utils.createDialogDiv({
                    id: dialogOption.id
                });
                var $dialogDiv = $("#" + dialogOption.id);
                var dlgFormName = dialogOption.id + "-form";
                // 给dialog中的表单，外包一层form
                $dialogDiv.html("<form id=\"" + dlgFormName + "\" action=\"" + dialogOption.submitUrl + "\"></form>");
                var $dialogForm = $("#" + dlgFormName);
                // 初始化dialog选项
                var dialogPosition = {my: "left+310 top+95", at: "left top", of: window};// dialog默认弹出位置。
                dialogOption.dialogPosition = dialogPosition;
                dialogOption.autoOpen = false;
                dialogOption.width = 940;// 默认弹出框的宽度
                dialogOption.buttons = crudDialog.initDialogButtons({
                    submitUrl: dialogOption.submitUrl,
                    formId: dlgFormName,
                    dialogId: dialogOption.id
                });
                //dialogOption.buttons = {
                //    "确定": function () {
                //        // 改为不用submit，用post。因为submit是把参数拼在url。
                //        //$dialogForm.submit();
                //
                //
                //
                //        gaeaAjax.post({
                //            url: dialogOption.submitUrl,
                //            data: $("#"+dlgFormName).serializeObject(),
                //            success: function (data) {
                //                gaeaNotify.message("保存成功。");
                //                dialog.close(dlgSelector);
                //                // 取消数据绑定
                //                gaeaData.unbind(dialogOption.id);
                //                // 清空表单内容
                //                $dialogForm.html("");
                //            },
                //            fail: function (data) {
                //                gaeaNotify.error(_.template("加载数据集<%= dsName %>失败!")({dsName: configOptions.dataset}));
                //            }
                //        });
                //
                //
                //
                //
                //        //var queryConditions = new Object();         // 查询请求数据
                //        //queryConditions.urSchemaId = $("#urSchemaId").val();
                //        //ur.utils.ajax.post({
                //        //    url: "/admin/common/query.do",
                //        //    data: queryConditions,
                //        //    success: function (data) {
                //        //        //alert("成功。id: " + data[0].id);
                //        //        // 用查询结果，刷新数据列表
                //        //        ur.component.bridge.grid.refreshData(data);
                //        //    },
                //        //    fail: function (data) {
                //        //        alert("失败");
                //        //    }
                //        //})
                //        //// 刷新数据，其实这里应该优化一下，不该不关三七二十一就刷新
                //        dialog.close(dlgSelector);
                //    },
                //    "取消": function () {
                //        // 取消数据绑定
                //        gaeaData.unbind(dialogOption.id);
                //        // 清空表单内容
                //        $dialogDiv.html("");
                //        //$dialogForm.html("");
                //        dialog.close(dlgSelector);
                //    }
                //};


                // 监听grid的选中事件，以便进行CRUD操作
                // 通过grid的选中事件，获取选中行的数据等
                // TODO 'urgrid'这个必须改为XML配置ACTION，利用bindOptions属性获取
                $("#urgrid").on(GAEA_EVENTS.DEFINE.UI.GRID.SELECT, function (event, data) {
                    console.log("trigger grid select event in gaeaUI dialog.");
                    selectedRow = data.selectedRow;
                    crudDialog.cache.selectedRow = selectedRow;
                });

                var $button = $("#" + buttonDef.htmlId);
                if (gaeaString.equalsIgnoreCase(buttonDef.action, GAEA_UI_DEFINE.ACTION.CRUD.UPDATE)) {
                    // 创建CRUD dialog的时候，初始化监听
                    gaeaData.listen(GAEA_EVENTS.DEFINE.CONTEXT.PAGE.UPDATE, dialogOption.id);
                    /**
                     * 点击“编辑”按钮触发。
                     */
                    crudDialog.initUpdateDialog({
                        buttonDef: buttonDef,
                        dialogOptions: dialogOption
                    });


                    //$button.on(GAEA_EVENTS.DEFINE.UI.DIALOG.CRUD_UPDATE_OPEN, function (event, data) {
                    //    console.log("row id: "+selectedRow.id+
                    //        "\nschemaId: "+gaeaView.list.getSchemaId()+
                    //        "\nschemaId: "+$("#urSchemaId").val()
                    //    );
                    //    // 更新上下文的相关信息
                    //    $dialogDiv.trigger(GAEA_EVENTS.DEFINE.CONTEXT.PAGE.UPDATE, {
                    //        PAGE_CONTEXT:{
                    //            id:selectedRow.id
                    //        }
                    //    });
                    //    //var linkObj = options.dialog;
                    //    //var buttonDef = options.button;
                    //    //var selectedRow = data.selectedRow;
                    //    //var queryConditions = new Object();         // 查询请求数据
                    //    //queryConditions.urSchemaId = $("#urSchemaId").val();
                    //    // 数据加载要求同步
                    //    //gaeaAjax.ajax({
                    //    //    url: SYS_URL.QUERY.BY_ID,
                    //    //    async:false,
                    //    //    data: {
                    //    //        id:selectedRow.id,
                    //    //        schemaId:gaeaView.list.getSchemaId()
                    //    //    },
                    //    //    success: function (data) {
                    //    //        // 用查询结果，刷新数据列表
                    //    //        //ur.component.bridge.grid.refreshData(data);
                    //    //        alert("成功");
                    //    //    },
                    //    //    fail: function (data) {
                    //    //        alert("失败");
                    //    //    }
                    //    //});
                    //
                    //
                    //    var atFirstAfterLoadCallback = null;
                    //    if (gaeaValid.isNotNull(buttonDef.listeners)) {
                    //        atFirstAfterLoadCallback = buttonDef.listeners.afterLoadInClick;
                    //    }
                    //    // TODO 下面这几个要重构一下。感觉loadContent这个方法封装得不太好。整个思路要重新捋一捋。
                    //    // 获取要编辑的数据
                    //    var editData = crudDialog.getData();
                    //    var afterBindingCallback = function (containerId) {
                    //        //// 获取要编辑的数据
                    //        //var editData = crudDialog.getData();
                    //        // TODO 下面暂时先不启用。还未完成可配置。
                    //        // 初始化编辑框的数据
                    //        //gaeaData.fieldData.init(containerId,editData);
                    //    };
                    //    var atLastAfterLoadCallback = afterBindingCallback;
                    //    if(options.fillAfterDsLoading){
                    //        atLastAfterLoadCallback = null;
                    //    }
                    //
                    //    /**
                    //     * 对于dialog、crudDialog来说，加载内容和数据集是共同的。所以这部分是公用的。
                    //     * 但是crudDialog多了加载编辑数据，和填充编辑数据的部分。
                    //     */
                    //    dialog.loadContent(dlgFormName,dialogOption,atFirstAfterLoadCallback,atLastAfterLoadCallback, afterBindingCallback,editData);
                    //    // TODO 这个load里面的内容，得封装一下
                    //    //$dialogForm.load(dialogOption.contentUrl, function () {
                    //    //    if (gaeaValid.isNotNull(buttonDef.listeners)) {
                    //    //        buttonDef.listeners.afterLoadInClick();
                    //    //    }
                    //    //    // 初始化表单的样式（load过来的表单）
                    //    //    gaeaForm.init("gaea-form");
                    //    //    // 初始化数据相关的（数据集，MVVM等）
                    //    //    gaeaData.scanAndInit(dialogOption.id, function () {
                    //    //        // 获取要编辑的数据
                    //    //        //var editData = crudDialog.getData();
                    //    //        //// 初始化编辑框的数据
                    //    //        //gaeaData.fieldData.init(dialogOption.id,editData);
                    //    //    });
                    //    //    // 获取要编辑的数据
                    //    //    var editData = crudDialog.getData();
                    //    //    // 初始化编辑框的数据
                    //    //    gaeaData.fieldData.init(dialogOption.id,editData);
                    //    //});
                    //    // 初始化Dialog参数
                    //    dialog.create(dialogOption);
                    //    // 打开dialog
                    //    dialog.open(dlgSelector,dialogPosition);
                    //});
                } else if (gaeaString.equalsIgnoreCase(buttonDef.action, GAEA_UI_DEFINE.ACTION.CRUD.ADD)) {
                    // 初始化新增弹出框。包括点击触发。
                    crudDialog.initAddDialog({
                        buttonDef: buttonDef,
                        dialogOptions: dialogOption
                    });
                }


                //// 为按钮添加事件（加载内容）
                //$("#" + this.htmlId).click(function () {
                //    //console.log("Go. Open dialog.");
                //    //$dialogDiv.html("<form id=\"" + dlgFormName + "\" action=\"" + dialogOption.submitUrl + "\"></form>");
                //    // afterLoadInClick，必须放在callback中，才能触发里面的一些初始化脚本（特别跟load的内容相关的）
                //    $dialogForm.load(dialogOption.contentUrl, function () {
                //        if (gaeaValid.isNotNull(thisButton.listeners)) {
                //            thisButton.listeners.afterLoadInClick();
                //        }
                //        // 初始化表单的样式（load过来的表单）
                //        gaeaForm.init("gaea-form");
                //        // 初始化数据相关的（数据集，MVVM等）
                //        gaeaData.scanAndInit(dialogOption.id);
                //    });
                //    // 初始化Dialog参数
                //    gaeaDialog.create(dialogOption);
                //    // 打开dialog
                //    gaeaDialog.open(dlgSelector,dialogPosition);
                //});
            },
            /**
             * 初始化新增弹出框。
             * @param options
             */
            initAddDialog: function (options) {
                var dialogId = options.dialogOptions.id;
                var buttonDef = options.buttonDef;
                var $button = $("#" + buttonDef.htmlId);
                var dlgFormName = dialogId + "-form";
                var dlgSelector = "#" + dialogId;
                $button.on(GAEA_EVENTS.DEFINE.UI.DIALOG.CRUD_ADD_OPEN, function (event, data) {
                    //console.log("row id: "+selectedRow.id+
                    //    "\nschemaId: "+gaeaView.list.getSchemaId()+
                    //    "\nschemaId: "+$("#urSchemaId").val()
                    //);

                    var atFirstAfterLoadCallback = null;
                    if (gaeaValid.isNotNull(buttonDef.listeners)) {
                        atFirstAfterLoadCallback = buttonDef.listeners.afterLoadInClick;
                    }
                    // TODO 下面这几个要重构一下。感觉loadContent这个方法封装得不太好。整个思路要重新捋一捋。
                    // 获取要编辑的数据
                    //var editData = crudDialog.getData();
                    var afterBindingCallback = function (containerId) {
                        //// 获取要编辑的数据
                        //var editData = crudDialog.getData();
                        // TODO 下面暂时先不启用。还未完成可配置。
                        // 初始化编辑框的数据
                        //gaeaData.fieldData.init(containerId,editData);
                    };
                    var atLastAfterLoadCallback = afterBindingCallback;
                    if (options.fillAfterDsLoading) {
                        atLastAfterLoadCallback = null;
                    }

                    /**
                     * 对于dialog、crudDialog来说，加载内容和数据集是共同的。所以这部分是公用的。
                     * 但是crudDialog多了加载编辑数据，和填充编辑数据的部分。
                     */
                        //dialog.loadContent(dlgFormName, options.dialogOptions, atFirstAfterLoadCallback, atLastAfterLoadCallback, afterBindingCallback, null);

                    crudDialog.loadContent({
                        containerId: dlgFormName,// 加载内容的容器id
                        dialogId: dialogId,
                        contentUrl: options.dialogOptions.contentUrl,// 加载内容的地址
                        //data:null,
                        initComponentData: false,
                        callback: {
                            afterLoad: null,
                            afterBinding: null
                        }
                    });

                    // 初始化Dialog参数
                    dialog.create(options.dialogOptions);
                    // 打开dialog
                    dialog.open(dlgSelector, options.dialogOptions.dialogPosition);
                });
            },
            /**
             * 初始化更新弹出框。
             * 很多内容基本和新增弹出框是一样的，不同的有：
             * 加载要编辑的数据（包括对应的子表数据）、提交的时候需要带上主表的id等
             * @param options
             */
            initUpdateDialog: function (options) {
                var dialogId = options.dialogOptions.id;
                var $dialogDiv = $("#" + dialogId);
                var buttonDef = options.buttonDef;
                var dialogDef = options.dialogOptions;
                var $button = $("#" + buttonDef.htmlId);
                var dlgFormName = dialogId + "-form";
                var $dialogForm = $("#" + dlgFormName);
                var dlgSelector = "#" + dialogId;
                /**
                 * 点击“编辑”事件触发。
                 */
                $button.on(GAEA_EVENTS.DEFINE.UI.DIALOG.CRUD_UPDATE_OPEN, function (event, data) {
                    var selectedRow = crudDialog.cache.selectedRow;
                    console.log("row id: " + selectedRow.id +
                        "\nschemaId: " + gaeaView.list.getSchemaId() +
                        "\nschemaId: " + $("#urSchemaId").val()
                    );
                    // 更新上下文的相关信息
                    $dialogDiv.trigger(GAEA_EVENTS.DEFINE.CONTEXT.PAGE.UPDATE, {
                        PAGE_CONTEXT: {
                            id: selectedRow.id,
                            selectedRow: selectedRow
                        }
                    });
                    // 因为是update弹出框，设置整个编辑的对象的id
                    if (gaeaValid.isNotNull(dialogDef.idField)) {
                        // 设定编辑数据的总id
                        crudDialog.cache.update.submitData[dialogDef.idField] = selectedRow.id;
                    }


                    var atFirstAfterLoadCallback = null;
                    if (gaeaValid.isNotNull(buttonDef.listeners)) {
                        atFirstAfterLoadCallback = buttonDef.listeners.afterLoadInClick;
                    }
                    // TODO 下面这几个要重构一下。感觉loadContent这个方法封装得不太好。整个思路要重新捋一捋。
                    // 获取要编辑的数据，关联id在js的缓存中。
                    var queryCondition = gaeaData.parseCondition({
                        id: 'byId', values: [{type: 'pageContext', value: 'id'}]
                    });
                    var editData = crudDialog.getData(queryCondition);
                    var afterBindingCallback = function (containerId) {
                        //// 获取要编辑的数据
                        //var editData = crudDialog.getData();
                        // TODO 下面暂时先不启用。还未完成可配置。
                        // 初始化编辑框的数据
                        //gaeaData.fieldData.init(containerId,editData);
                    };
                    var atLastAfterLoadCallback = afterBindingCallback;
                    if (options.fillAfterDsLoading) {
                        atLastAfterLoadCallback = null;
                    }

                    /**
                     * 对于dialog、crudDialog来说，加载内容和数据集是共同的。所以这部分是公用的。
                     * 但是crudDialog多了加载编辑数据，和填充编辑数据的部分。
                     */
                    crudDialog.loadContent({
                        containerId: dlgFormName,// 加载内容的容器id
                        dialogId: dialogId,
                        contentUrl: options.dialogOptions.contentUrl,// 加载内容的地址
                        data: editData,
                        initComponentData: true,
                        callback: {
                            afterLoad: null,
                            afterBinding: null
                        }
                    });
                    // 初始化Dialog参数
                    dialog.create(options.dialogOptions);
                    // 打开dialog
                    dialog.open(dlgSelector, options.dialogOptions.dialogPosition);
                    // 因为是update弹出框，设置整个编辑的对象的id
                    //if(gaeaValid.isNotNull(dialogDef.idField)){
                    //    var findIdTemplate = _.template("input[name='<%=NAME%>']");
                    //    if($dialogForm.find(findIdTemplate({
                    //            NAME: dialogDef.idField
                    //        })).length<1) {
                    //        $dialogForm.append(_.template(GAEA_UI_DEFINE.TEMPLATE.INPUT.HIDDEN)({
                    //            ID: dialogDef.idField,
                    //            NAME: dialogDef.idField,
                    //            VALUE: selectedRow.id
                    //        }));
                    //    }
                    //}
                });
            },
            /**
             * 加载内容
             *
             * @param options
             *              containerId 当前就是formId
             *              dialogId
             *              contentUrl 内容地址
             *              data
             *              initComponentData 初始化组件的数据，例如：子表的关联，新增不需要初始化，编辑就需要。
             *              callback 回调方法
             *                  afterBinding 绑定后的回调
             * @param callback
             */
            loadContent: function (options, callback) {

                $.when(dialog.loadContent(options)).done(function () {

                    //// 初始化数据相关的（数据集，MVVM等），未绑定
                    //gaeaData.dataSet.scanAndInit(options.dialogId);
                    ////gaeaData.scanAndInit(dialogOption.id, afterBindingCallback);
                    //// 初始化页面的相关组件（multi-select等，但不包括可编辑table）
                    //gaeaUI.initComponents(options.dialogId);
                    //// 初始化数据组件。例如：可编辑表格等
                    //gaeaData.component.init(options.dialogId);
                    //if (gaeaValid.isNotNull(options.initComponentData) && options.initComponentData) {
                    //    // 初始化gaea-ui关联的gaea-data，即数据。例如：编辑页的子表
                    //    gaeaData.component.initData(options.dialogId);
                    //}
                    ////// 初始化编辑框的数据
                    //if (gaeaValid.isNotNull(options.data)) {
                    //    gaeaData.fieldData.init(options.dialogId, options.data);
                    //}
                    //// 最后，绑定整个页面
                    //gaeaData.binding(options.containerId, function () {
                    //    // 初始化binding后的组件。（或某些组件需要binding后进一步初始化）
                    //    gaeaData.component.initAfterBinding(options.dialogId);
                    //    // 回调定制的函数
                    //    if (_.isFunction(options.callback.afterBinding)) {
                    //        options.callback.afterBinding();
                    //    }
                    //});


                    var defferedFunctions = [
                        gaeaData.dataSet.scanAndInit(options.dialogId), gaeaUI.initComponents(options.dialogId), gaeaData.component.init(options.dialogId)];
                    //defferedFunctions.push(gaeaData.dataSet.scanAndInit(options.dialogId));
                    //defferedFunctions.push(gaeaUI.initComponents(options.dialogId));
                    //defferedFunctions.push(gaeaData.component.init(options.dialogId));
                    if (gaeaValid.isNotNull(options.initComponentData) && options.initComponentData) {
                        // 初始化gaea-ui关联的gaea-data，即数据。例如：编辑页的子表
                        defferedFunctions.push(gaeaData.component.initData(options.dialogId));
                    }
                    if (gaeaValid.isNotNull(options.data)) {
                        defferedFunctions.push(gaeaData.fieldData.init(options.dialogId, options.data));
                    }

                    $.when.apply($, defferedFunctions).done(function () {
                        gaeaData.binding({
                            containerId: options.containerId
                        }, function () {
                            // 初始化binding后的组件。（或某些组件需要binding后进一步初始化）
                            gaeaData.component.initAfterBinding(options.dialogId);
                            // 回调定制的函数
                            if (_.isFunction(options.callback.afterBinding)) {
                                options.callback.afterBinding();
                            }
                        });
                    });


                    // 初始化gaeaUI
                    gaeaComponents.init({
                        containerId: options.dialogId
                    });
                    // 最后回调的定义
                    if (_.isFunction(callback)) {
                        callback();
                    }
                });


                //dialog.loadContent(options, function () {
                //    // 初始化数据相关的（数据集，MVVM等），未绑定
                //    gaeaData.dataSet.scanAndInit(options.dialogId);
                //    //gaeaData.scanAndInit(dialogOption.id, afterBindingCallback);
                //    // 初始化页面的相关组件（multi-select等，但不包括可编辑table）
                //    gaeaUI.initComponents(options.dialogId);
                //    // 初始化数据组件。例如：可编辑表格等
                //    gaeaData.component.init(options.dialogId);
                //    if (gaeaValid.isNotNull(options.initComponentData) && options.initComponentData) {
                //        // 初始化gaea-ui关联的gaea-data，即数据。例如：编辑页的子表
                //        gaeaData.component.initData(options.dialogId);
                //    }
                //    //// 初始化编辑框的数据
                //    if (gaeaValid.isNotNull(options.data)) {
                //        gaeaData.fieldData.init(options.dialogId, options.data);
                //    }
                //    // 最后，绑定整个页面
                //    gaeaData.binding(options.containerId, function () {
                //        // 初始化binding后的组件。（或某些组件需要binding后进一步初始化）
                //        gaeaData.component.initAfterBinding(options.dialogId);
                //        // 回调定制的函数
                //        if (_.isFunction(options.callback.afterBinding)) {
                //            options.callback.afterBinding();
                //        }
                //    });
                //    // 初始化gaeaUI
                //    gaeaComponents.init({
                //        containerId:options.dialogId
                //    });
                //    // 最后回调的定义
                //    if (_.isFunction(callback)) {
                //        callback();
                //    }
                //});


                //var $container = $("#"+options.containerId);
                //$container.load(options.contentUrl, function () {
                //    // 一开始的回调
                //    if (gaeaValid.isNotNull(atFirstAfterLoadCallback)) {
                //        atFirstAfterLoadCallback();
                //    }
                //    // 初始化表单的样式（load过来的表单）
                //    gaeaForm.init("gaea-form");
                //    // 初始化HTML页声明的UI，例如生成table等
                //    //gaeaUI.initComponents(dialogOption.id);// TODO 取消看看。发现没调用！！！
                //    // 初始化数据相关的（数据集，MVVM等）
                //    gaeaData.dataSet.scanAndInit(dialogOption.id);
                //    //gaeaData.scanAndInit(dialogOption.id, afterBindingCallback);
                //    // 初始化数据组件。例如：可编辑表格等 TODO 初始化UI的数据
                //    gaeaData.component.init(dialogOption.id,null);
                //    //// 初始化编辑框的数据
                //    if(gaeaValid.isNotNull(data)) {
                //        gaeaData.fieldData.init(dialogOption.id, data);
                //    }
                //    // 最后，绑定整个页面
                //    gaeaData.binding(dialogOption.id,afterBindingCallback);
                //    // 最后回调的定义
                //    if (gaeaValid.isNotNull(atLastAfterLoadCallback)) {
                //        atLastAfterLoadCallback(dialogOption.id);
                //    }
                //    //// 获取要编辑的数据
                //    //var editData = crudDialog.getData();
                //});
            },
            getData: function (condition) {
                var result = null;
                var conditions = {};
                //conditions.id = selectedRow.id;
                conditions.schemaId = gaeaView.list.getSchemaId();
                conditions.conditions = JSON.stringify(condition);
                // 数据加载要求同步
                gaeaAjax.ajax({
                    url: SYS_URL.QUERY.BY_CONDITION,
                    async: false,
                    data: conditions,
                    //data: {
                    //    id:selectedRow.id,
                    //    schemaId:gaeaView.list.getSchemaId()
                    //},
                    success: function (data) {
                        //if(_.isArray(data)){
                        //    if(data.length>1){
                        //        result = data;
                        //    }else{
                        //        result = data[0];
                        //    }
                        //}else{
                        //    result = data;
                        //}
                        result = data[0];
                        // 用查询结果，刷新数据列表
                        //ur.component.bridge.grid.refreshData(data);
                        //alert("成功");
                    },
                    fail: function (data) {
                        alert("失败");
                    }
                });
                return result;
            },
            /**
             * 创建CRUD弹出框的默认按钮：确认、取消。
             * 确认：把dialog中的form，按配置的submitUrl提交。
             * 取消：由于crud dialog还有data-bind，所以还涉及到解绑，然后把dialog HTML清空（因为编辑过会有残留数据）。然后才关闭dialog。
             *
             * @param options
             *              submitUrl
             *              formId
             *              dialogId
             *              data            form之外的数据，如果和form里面的同名则会覆盖。
             * @returns {{确定: buttons."确定", 取消: buttons."取消"}}
             */
            initDialogButtons: function (options) {
                var $dialog = $("#" + options.dialogId);
                var $dialogForm = $("#" + options.formId);
                var buttons = {
                    "确定": function () {
                        // 调用校验框架，校验ok才提交。
                        gaeaCommon.gaeaValidate.validate({
                            containerId: options.formId,// 校验的范围（某表单）
                            // 成功回调
                            success: function () {
                                // 把extra的data合并（覆盖）form的data
                                var formData = $("#" + options.formId).serializeObject();
                                var requestData = _.extend(formData, crudDialog.cache.update.submitData);
                                // 提交
                                gaeaAjax.post({
                                    url: options.submitUrl,
                                    data: requestData,
                                    success: function (data) {
                                        gaeaNotify.message("保存成功。");
                                        // 刷新grid数据
                                        $("#urgrid").trigger(GAEA_EVENTS.DEFINE.UI.GRID.RELOAD);
                                        // 取消数据绑定
                                        gaeaData.unbind(options.dialogId);
                                        // 清空表单内容
                                        $dialogForm.html("");
                                        // 关闭弹出框
                                        dialog.close("#" + options.dialogId);
                                    },
                                    fail: function (data) {
                                        gaeaNotify.error("保存失败！");
                                    }
                                });
                                //// 刷新数据，其实这里应该优化一下，不该不关三七二十一就刷新
                                dialog.close("#" + options.dialogId);
                            }
                        });
                    },
                    "取消": function () {
                        /**
                         * 必须首先关闭dialog。否则后面的操作会把整个dialog的DOM删除。jQuery dialog的事件就统统失效了。
                         */
                        dialog.close("#" + options.dialogId);
                        // 取消数据绑定. 这里也会把dialog的DOM干掉！需要注意！
                        gaeaData.unbind(options.dialogId);
                        // 清空表单内容
                        // 彻底删除相关的HTML DOM
                        $dialogForm.html("");
                    }
                };
                return buttons;
            }
        };


        dialog._button = {
            initAction: function (buttonDef, dialogDef) {
                var $button = $("#" + button.htmlId);
                var options = {
                    button: buttonDef,
                    dialog: dialogDef
                };
                // TODO 下面这个应该移到gaeajs-action会更好吧？
                if (gaeaString.equalsIgnoreCase(thisButton.action, GAEA_UI_DEFINE.CRUD.ACTION.UPDATE)) {
                    // 初始化绑定事件
                    gaeaCommonCRUD.init(options);
                    // 点击触发事件
                    $button.click(function () {
                        $button.trigger(GAEA_EVENTS.DEFINE.CRUD.COMMON_UPDATE_CLICK, options);
                    });
                }
            }
        };

        dialog.utils = {
            /**
             * 创建一个空的dialog要用的DIV（不是dialog！）。在系统统一定义的地方。不是乱放。
             *
             * @param options
             */
            createDialogDiv: function (options) {
                if ($("#" + options.id).length < 1) {
                    var content = options.content;
                    if (gaeaValid.isNull(content)) {
                        content = "";
                    }
                    $("#" + GAEA_UI_DEFINE.PAGE.GAEA_GRID_HTML.DIALOG_AREA).append(_.template(GAEA_UI_DEFINE.TEMPLATE.DIV.WITH_NAME)({
                        ID: options.id,
                        NAME: options.id,
                        CONTENT: content
                    }));
                }
            }
        };
        /**
         * 返回（暴露）的接口
         */
        dialog.initCrudDialog = crudDialog.init;
        return dialog;
    });