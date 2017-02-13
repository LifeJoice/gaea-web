/**
 * 基于RequireJS的模块化重构。让依赖更清晰，更简单。
 * Created by iverson on 2016-2-17 11:48:52.
 */
define([
        "jquery", "underscore", 'underscore-string', 'gaeajs-common-utils-ajax', 'gaeajs-common-utils-validate',
        "gaeajs-data", "gaeajs-ui-events", "gaeajs-ui-form", "gaeajs-common-utils-string",
        "gaeajs-ui-definition", "gaeajs-ui-view", "gaea-system-url", 'gaeajs-ui-notify',
        "gaeajs-ui-commons", "gaeajs-ui-multiselect", "gaeajs-common", "gaeajs-ui-components",
        "gaeajs-common-utils",
        'gaea-jqui-dialog', "jquery-serializeObject", "jquery-ui-effects-all"],
    function ($, _, _s, gaeaAjax, gaeaValid,
              gaeaData, GAEA_EVENTS, gaeaForm, gaeaString,
              GAEA_UI_DEFINE, gaeaView, SYS_URL, gaeaNotify,
              gaeaUI, gaeaMultiSelect, gaeaCommon, gaeaComponents,
              gaeaCommonUtils) {

        var _private = {};

        var TEMPLATE = {
            NEW_DIALOG_INNER_CONTAINER: '<div><form id="<%= FORM_ID %>" action="<%= ACTION %>"></form></div>',
            CHAIN: {
                NAME: "<%= PARENT_ID %>-><%= ID %>",                                 // dialog1->dialog2
                NAME_SEPARATOR: "->"
            }
        };

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
            /**
             * 替代原来的create方法。
             * @param {object} opts
             * @param {string} opts.id                              就是dialog id
             * @param {string} opts.parentId
             * @param {string} opts.openStyle
             * @param {string} opts.submitAction                    新的弹出框的提交方式。是直接提交到后台，还是只是回写到parent dialog的某个值中
             * @param {string} opts.writeBack
             * @param {string} opts.submitUrl
             * @param {string} opts.contentUrl
             * @param {string} opts.refInputId                      关联的父级dialog的输入框id
             * @param {boolean} opts.initHtml                       是否需要初始化弹出框的相关html（例如div、form等）。不包括弹出框内容。
             */
            init: function (opts) {
                if (gaeaValid.isNull(opts.id)) {
                    throw "id为空，无法创建dialog。";
                }

                // initOption
                var dialogOpts = _private.getInitOption(opts);
                opts.dialogOptions = dialogOpts;

                // 加入弹出框链
                _private.chain.add({
                    id: opts.id,
                    parentId: opts.parentId,
                    options: dialogOpts
                });

                // init HTML
                if (gaeaValid.isNull(opts.initHtml) || opts.initHtml) {
                    _private.initHtml(opts);
                }
                var formId = dialog.utils.getFormId(opts.id);

                /**
                 * 简单初始化jQuery.validate，并不是进行校验。
                 * 创建了dialog html后，对里面的form也得做validate的初始化。否则jQuery.validate插件会报错：
                 * jquery.validate.js:404 Uncaught TypeError: Cannot read property 'settings' of undefined(…)
                 * 不知道为什么它会自动对form进行关联（虽然不会校验），虽然都还没有启用它。
                 */
                if (!gaeaCommonUtils.dom.checkUnique(formId)) {
                    throw "form id不唯一，jQuery validate插件可能会无法处理。id: " + formId;
                }
                // 只是简单初始化，避免抛出undefined错误
                $("#" + formId).validate();

                // loadContent
                /**
                 * 加载HTML内容，初始化里面的数据集、复选框组件、按钮等，包括按钮相关的进一步打开弹出框等
                 */
                $.when(
                    dialog.loadContent({
                        formId: dialog.utils.getFormId(opts.id),
                        dialogId: opts.id,
                        contentUrl: opts.contentUrl
                    })
                ).done(function () {
                    // 打开dialog
                    dialog.open(opts);
                });

            },
            /**
             *
             * @param {object} opts
             * @param {string} opts.id
             * @param {string} opts.submitUrl
             * @param {string} opts.submitAction                    可空（对于弹出而不是open inOne）。新的弹出框的提交方式。是直接提交到后台，还是只是回写到parent dialog的某个值中
             * @param {string} opts.refInputId                      可空（对于弹出而不是open inOne）。关联的父级dialog的输入框id
             */
            create: function (opts) {
                // initOption
                var dialogOpts = _private.getInitOption({
                    id: opts.id,
                    submitUrl: opts.submitUrl,
                    submitAction: opts.submitAction,
                    refInputId: opts.refInputId
                });

                _options = dialogOpts;
                var dialog = _private.createDialog();
                return dialog;
            },
            /**
             *
             * @param {Object} opts
             * @param {string} opts.id                          要打开的dialog的id
             * @param {string} opts.parentId                    父级dialog的id
             * @param {string} opts.openStyle                   打开方式。new：新弹出一个 inOne：在当前parentId内打开（不弹出）
             * @param {string} [opts.position]                  打开位置。否则默认。
             * @param {string} opts.submitUrl                   点击确认按钮提交的url
             * @param {string} opts.dialogOptions               初始化弹出框的option对象（height,width,autoOpen,按钮等）。要用于打开后的缓存。
             */
            open: function (opts) {
                if (gaeaValid.isNull(opts.id)) {
                    throw "id为空，无法打开弹出框。";
                }
                var $dialog = $("#" + opts.id);

                // 初始化Dialog
                // openStyle != inOne的, 才需要初始化. inOne的, 其实就只是一个div, 不需要调用jQuery dialog组件.
                if (gaeaValid.isNull(opts.openStyle) || gaeaString.equalsIgnoreCase(opts.openStyle, "new")) {
                    dialog.create(opts);
                }

                // 初始化dialog打开位置
                if (gaeaValid.isNotNull(opts.position)) {
                    $dialog.gaeaDialog("option", "position", opts.position);
                }

                /**
                 * 如果没有定义openStyle，或者openStyle=new，就弹出框；否则在当前弹框中打开。
                 */
                if (gaeaValid.isNull(opts.openStyle) || gaeaString.equalsIgnoreCase(opts.openStyle, "new")) {
                    $dialog.gaeaDialog("open");
                } else if (gaeaString.equalsIgnoreCase(opts.openStyle, "inOne") && gaeaValid.isNotNull(opts.parentId)) {
                    _private.inOne.open(opts);
                } else {
                    throw "不能识别的dialog配置。无法打开dialog。dialog配置：" + JSON.stringify(opts);
                }
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
                    dialog = _private.find(inViews.dialogs, linkViewId);
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
                var $dialog = dialog.create({
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
            /**
             * 预初始化dialog的HTML。主要是为了一些交互的效果，需要先有HTML容器的初始化。
             * @param opts
             */
            preInitHtml: function (opts) {
                _private.preInitHtml(opts);
            },
            /**
             * 加载内容. 包括初始化内容的数据集、初始化可编辑子表、初始化multi-select多选框等。
             *
             * @param {Object} options
             * @param {string} options.formId                           当前是formId. formId外面就是dialogId。
             * @param {string} options.dialogId                         弹框的div id
             * @param {string} options.contentUrl                       内容url地址
             * @param {string} options.data
             * @param {string} options.initComponentData                初始化组件的数据，例如：子表的关联，新增不需要初始化，编辑就需要。
             * @param {object} options.callback
             * @param {string} options.callback.afterBinding 绑定后的回调
             * @param callback 回调方法
             */
            loadContent: function (options, callback) {

                var dfd = $.Deferred();// JQuery同步对象

                $.when(_private.loadContent({
                    containerId: options.formId,
                    contentUrl: options.contentUrl
                })).done(function () {
                    /**
                     * 同步调用数组。数组中的每个函数，都是并行调用。并且从声明这个数组开始就会触发方法调用。
                     * 声明这个数组的目的，是为了控制，后面的data-bind处理，要等这几个方法全部执行完。
                     */
                    var defferedFunctions = [
                        gaeaData.dataSet.scanAndInit(options.dialogId), gaeaUI.initGaeaUI(options.dialogId), gaeaData.component.init(options.dialogId)];
                    // defferedFunctions中的各个函数已经执行完一遍。

                    /* 初始化gaeaData的组件的数据 */
                    if (gaeaValid.isNotNull(options.initComponentData) && options.initComponentData) {
                        // 初始化gaea-ui关联的gaea-data，即数据。例如：编辑页的子表
                        defferedFunctions.push(gaeaData.component.initData(options.dialogId));
                    }
                    if (gaeaValid.isNotNull(options.data)) {
                        defferedFunctions.push(gaeaData.fieldData.init(options.dialogId, options.data));
                    }
                    /**
                     * 【重要】
                     * 至此！上面的方法都执行了。但！不代表上面的方法都执行完了！
                     * 因为上面有些方法是含有ajax的异步操作。所以需要下面这个来控制整体的同步。
                     */

                    /* 待defferedFunctions数组的各个函数都运行完(其实声明数组的时候已经执行了), 才执行done的回调方法. */
                    $.when.apply($, defferedFunctions).done(function () {
                        gaeaData.binding({
                            containerId: options.formId
                        }, function () {
                            // 初始化binding后的组件。（或某些组件需要binding后进一步初始化）
                            gaeaData.component.initAfterBinding(options.dialogId);
                            // 回调定制的函数
                            if (gaeaValid.isNotNull(options.callback) && _.isFunction(options.callback.afterBinding)) {
                                options.callback.afterBinding();
                            }
                        });

                        // 整个方法loadContent的完成. 其实就是defferedFunctions里面的数据集加载、gaeaUI初始化等完成后，最后data binding完成，就是整个loadContent完成了
                        dfd.resolve();
                    });


                    // 初始化gaeaUI
                    // TODO 这个应该移到gaea.ui.commons去。主要其实就是tabs的初始化而已。
                    gaeaComponents.init({
                        containerId: options.dialogId
                    });
                    // 最后回调的定义
                    if (_.isFunction(callback)) {
                        callback();
                    }
                });

                return dfd.promise();
            },
            /**
             * 该弹框是否打开过并缓存。检查缓存弹出框打开链。有，就是打开过。
             * @param id
             * @returns {*|boolean}
             */
            isOpen: function (id) {
                return _private.chain.exist(id);
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
             * @param {Object} options
             * @param {Object} options.dialog
             * @param {string} options.dialog.htmlId
             * @param {string} options.dialog.submitUrl
             * @param {Object} options.button
             * @param {string} options.openStyle   new | inOne 打开的方式。弹出一个新的，还是整合进当前的弹框。
             * @param {string} options.parentId
             */
            init: function (options) {

                // initOption
                var dialogOpts = _private.getInitOption({
                    id: options.dialog.htmlId,
                    submitUrl: options.dialog.submitUrl,
                    submitAction: options.submitAction,
                    refInputId: options.refInputId
                });

                // 加入弹出框链
                _private.chain.add({
                    id: options.dialog.htmlId,
                    //parentId:opts.parentId,
                    options: dialogOpts
                });


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
                //var dlgSelector = "#" + dialogOption.id;
                _private.initHtml({
                    id: dialogOption.id,
                    parentId: options.parentId,
                    openStyle: options.openStyle,
                    submitUrl: options.dialog.submitUrl
                });

                /**
                 * 创建了dialog html后，对里面的form也得做validate的初始化。否则jQuery.validate插件会报错：
                 * jquery.validate.js:404 Uncaught TypeError: Cannot read property 'settings' of undefined(…)
                 * 不知道为什么它会自动对form进行关联（虽然不会校验），虽然都还没有启用它。
                 */
                var formId = dialog.utils.getFormId(dialogOption.id);
                if (!gaeaCommonUtils.dom.checkUnique(formId)) {
                    throw "form id不唯一，jQuery validate插件可能会无法处理。id: " + formId;
                }
                // 只是简单初始化，避免抛出undefined错误
                $("#" + formId).validate();
                // 检查当前页面有没有对应的DIV，没有创建一个。
                //dialog.utils.createDialogDiv({
                //    id: dialogOption.id,
                //    parentId:options.parentId,
                //    openStyle:"inOne"
                //});
                //var $dialogDiv = $("#" + dialogOption.id);
                var dlgFormName = dialogOption.id + "-form";
                //var contentCtTemplate = _.template(TEMPLATE.NEW_DIALOG_INNER_CONTAINER);
                //// 给dialog中的表单，外包一层form
                ////$dialogDiv.html("<form id=\"" + dlgFormName + "\" action=\"" + dialogOption.submitUrl + "\"></form>");
                //$dialogDiv.html(contentCtTemplate({
                //    FORM_ID:dlgFormName,
                //    ACTION:dialogOption.submitUrl
                //}));
                //var $dialogForm = $("#" + dlgFormName);
                // 初始化dialog选项
                var dialogPosition = {my: "left+310 top+95", at: "left top", of: window};// dialog默认弹出位置。
                dialogOption.dialogPosition = dialogPosition;
                dialogOption.autoOpen = false;
                dialogOption.width = 940;// 默认弹出框的宽度
                dialogOption.buttons = dialog.button.initButtons({
                    submitUrl: dialogOption.submitUrl,
                    formId: dlgFormName,
                    dialogId: dialogOption.id
                });


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
                } else if (gaeaString.equalsIgnoreCase(buttonDef.action, GAEA_UI_DEFINE.ACTION.CRUD.ADD)) {
                    // 初始化新增弹出框。包括点击触发。
                    crudDialog.initAddDialog({
                        buttonDef: buttonDef,
                        dialogOptions: dialogOption,
                        parentId: options.parentId
                        //openStyle:"inOne"
                    });
                }
            },
            /**
             * 初始化新增弹出框。
             * @param options
             *              parentId
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

                    //var atFirstAfterLoadCallback = null;
                    //if (gaeaValid.isNotNull(buttonDef.listeners)) {
                    //    atFirstAfterLoadCallback = buttonDef.listeners.afterLoadInClick;
                    //}
                    // TODO 下面这几个要重构一下。感觉loadContent这个方法封装得不太好。整个思路要重新捋一捋。
                    // 获取要编辑的数据
                    //var editData = crudDialog.getData();
                    //var afterBindingCallback = function (containerId) {
                    //    //// 获取要编辑的数据
                    //    //var editData = crudDialog.getData();
                    //    // TODO 下面暂时先不启用。还未完成可配置。
                    //    // 初始化编辑框的数据
                    //    //gaeaData.fieldData.init(containerId,editData);
                    //};
                    //var atLastAfterLoadCallback = afterBindingCallback;
                    //if (options.fillAfterDsLoading) {
                    //    atLastAfterLoadCallback = null;
                    //}

                    /**
                     * 对于dialog、crudDialog来说，加载内容和数据集是共同的。所以这部分是公用的。
                     * 但是crudDialog多了加载编辑数据，和填充编辑数据的部分。
                     */
                        //dialog.loadContent(dlgFormName, options.dialogOptions, atFirstAfterLoadCallback, atLastAfterLoadCallback, afterBindingCallback, null);

                    $.when(
                        dialog.loadContent({
                            formId: dlgFormName,// 加载内容的容器id
                            dialogId: dialogId,
                            contentUrl: options.dialogOptions.contentUrl,// 加载内容的地址
                            //data:null,
                            initComponentData: false,
                            callback: {
                                afterLoad: null,
                                afterBinding: null
                            }
                        })
                    ).done(function () {
                        //// 初始化Dialog参数
                        //dialog.create(options.dialogOptions);
                        // 打开dialog
                        dialog.open({
                                id: dialogId,
                                position: options.dialogOptions.dialogPosition,
                                parentId: options.parentId,
                                openStyle: options.openStyle,
                                submitUrl: options.dialogOptions.submitUrl
                            }
                        );
                    });
                    //dialog.loadContent({
                    //    formId: dlgFormName,// 加载内容的容器id
                    //    dialogId: dialogId,
                    //    contentUrl: options.dialogOptions.contentUrl,// 加载内容的地址
                    //    //data:null,
                    //    initComponentData: false,
                    //    callback: {
                    //        afterLoad: null,
                    //        afterBinding: null
                    //    }
                    //});

                    //// 初始化Dialog参数
                    //dialog.create(options.dialogOptions);
                    //// 打开dialog
                    //dialog.open({
                    //    id:dialogId,
                    //    position:options.dialogOptions.dialogPosition,
                    //    parentId:options.parentId,
                    //    openStyle:options.openStyle
                    //}
                    //);
                });
            },
            /**
             * TODO initUpdateDialog未做类似initAddDialog的重构
             * 初始化更新弹出框。
             * 很多内容基本和新增弹出框是一样的，不同的有：
             * 加载要编辑的数据（包括对应的子表数据）、提交的时候需要带上主表的id等
             * @param options
             *              parentDialogId
             *              dialogOptions
             *                  id
             *                  contentUrl
             *              buttonDef
             *                  htmlId
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


                    //var atFirstAfterLoadCallback = null;
                    //if (gaeaValid.isNotNull(buttonDef.listeners)) {
                    //    atFirstAfterLoadCallback = buttonDef.listeners.afterLoadInClick;
                    //}
                    // TODO 下面这几个要重构一下。感觉loadContent这个方法封装得不太好。整个思路要重新捋一捋。
                    // 获取要编辑的数据，关联id在js的缓存中。
                    var queryCondition = gaeaData.parseCondition({
                        id: 'byId', values: [{type: 'pageContext', value: 'id'}]
                    });
                    var editData = crudDialog.getData(queryCondition);
                    //var afterBindingCallback = function (containerId) {
                    //    //// 获取要编辑的数据
                    //    //var editData = crudDialog.getData();
                    //    // TODO 下面暂时先不启用。还未完成可配置。
                    //    // 初始化编辑框的数据
                    //    //gaeaData.fieldData.init(containerId,editData);
                    //};
                    //var atLastAfterLoadCallback = afterBindingCallback;
                    //if (options.fillAfterDsLoading) {
                    //    atLastAfterLoadCallback = null;
                    //}

                    /**
                     * 对于dialog、crudDialog来说，加载内容和数据集是共同的。所以这部分是公用的。
                     * 但是crudDialog多了加载编辑数据，和填充编辑数据的部分。
                     */
                    dialog.loadContent({
                        formId: dlgFormName,// 加载内容的容器id
                        dialogId: dialogId,
                        contentUrl: options.dialogOptions.contentUrl,// 加载内容的地址
                        data: editData,
                        initComponentData: true,
                        callback: {
                            afterLoad: null,
                            afterBinding: null
                        }
                    });
                    //// 初始化Dialog参数
                    //dialog.create(options.dialogOptions);
                    // 打开dialog
                    dialog.open({
                            id: dialogId,
                            position: options.dialogOptions.dialogPosition,
                            parentDialogId: options.parentDialogId,
                            submitUrl: options.dialogOptions.submitUrl
                        }
                        //dlgSelector, options.dialogOptions.dialogPosition
                    );
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
            //loadContent: function (options, callback) {
            //
            //    $.when(_private.loadContent(options)).done(function () {
            //        /**
            //         * 同步调用数组。数组中的每个函数，都是并行调用。并且从声明这个数组开始就会触发方法调用。
            //         * 声明这个数组的目的，是为了控制，后面的data-bind处理，要等这几个方法全部执行完。
            //         */
            //        var defferedFunctions = [
            //            gaeaData.dataSet.scanAndInit(options.dialogId), gaeaUI.initGaeaUI(options.dialogId), gaeaData.component.init(options.dialogId)];
            //        // defferedFunctions中的各个函数已经执行完一遍。
            //
            //        /* 初始化gaeaData的组件的数据 */
            //        if (gaeaValid.isNotNull(options.initComponentData) && options.initComponentData) {
            //            // 初始化gaea-ui关联的gaea-data，即数据。例如：编辑页的子表
            //            defferedFunctions.push(gaeaData.component.initData(options.dialogId));
            //        }
            //        if (gaeaValid.isNotNull(options.data)) {
            //            defferedFunctions.push(gaeaData.fieldData.init(options.dialogId, options.data));
            //        }
            //        /**
            //         * 【重要】
            //         * 至此！上面的方法都执行了。但！不代表上面的方法都执行完了！
            //         * 因为上面有些方法是含有ajax的异步操作。所以需要下面这个来控制整体的同步。
            //         */
            //
            //        /* 待defferedFunctions数组的各个函数都运行完(其实声明数组的时候已经执行了), 才执行done的回调方法. */
            //        $.when.apply($, defferedFunctions).done(function () {
            //            gaeaData.binding({
            //                containerId: options.containerId
            //            }, function () {
            //                // 初始化binding后的组件。（或某些组件需要binding后进一步初始化）
            //                gaeaData.component.initAfterBinding(options.dialogId);
            //                // 回调定制的函数
            //                if (_.isFunction(options.callback.afterBinding)) {
            //                    options.callback.afterBinding();
            //                }
            //            });
            //        });
            //
            //
            //        // 初始化gaeaUI
            //        gaeaComponents.init({
            //            containerId: options.dialogId
            //        });
            //        // 最后回调的定义
            //        if (_.isFunction(callback)) {
            //            callback();
            //        }
            //    });
            //
            //
            //},
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
                    success: function (data) {
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
            }
            /**
             * 创建CRUD弹出框的默认按钮：确认、取消。
             * 确认：把dialog中的form，按配置的submitUrl提交。
             * 取消：由于crud dialog还有data-bind，所以还涉及到解绑，然后把dialog HTML清空（因为编辑过会有残留数据）。然后才关闭dialog。
             *
             * @param options {object}
             * @param {string} submitUrl
             * @param {string} formId                       formId作为边界，执行通用校验
             * @param {string} dialogId
             * @param {string} data            form之外的数据，如果和form里面的同名则会覆盖。
             * @returns {{确定: buttons."确定", 取消: buttons."取消"}}
             */
            //initDialogButtons: function (options) {
            //    var $dialog = $("#" + options.dialogId);
            //    var $dialogForm = $("#" + options.formId);
            //    var buttons = {
            //        "确定": function () {
            //            // 调用校验框架，校验ok才提交。
            //            gaeaCommon.gaeaValidate.validate({
            //                containerId: options.formId,// 校验的范围（某表单）
            //                // 成功回调
            //                success: function () {
            //                    // 把extra的data合并（覆盖）form的data
            //                    var formData = $("#" + options.formId).serializeObject();
            //                    var requestData = _.extend(formData, crudDialog.cache.update.submitData);
            //                    // 提交
            //                    gaeaAjax.post({
            //                        url: options.submitUrl,
            //                        data: requestData,
            //                        success: function (data) {
            //                            gaeaNotify.message("保存成功。");
            //                            // 刷新grid数据
            //                            $("#urgrid").trigger(GAEA_EVENTS.DEFINE.UI.GRID.RELOAD);
            //                            // 取消数据绑定
            //                            gaeaData.unbind(options.dialogId);
            //                            // 清空表单内容
            //                            $dialogForm.html("");
            //                            // 关闭弹出框
            //                            dialog.close("#" + options.dialogId);
            //                        },
            //                        fail: function (data) {
            //                            gaeaNotify.error("保存失败！");
            //                        }
            //                    });
            //                    //// 刷新数据，其实这里应该优化一下，不该不关三七二十一就刷新
            //                    dialog.close("#" + options.dialogId);
            //                }
            //            });
            //        },
            //        "取消": function () {
            //            /**
            //             * 必须首先关闭dialog。否则后面的操作会把整个dialog的DOM删除。jQuery dialog的事件就统统失效了。
            //             */
            //            dialog.close("#" + options.dialogId);
            //            // 取消数据绑定. 这里也会把dialog的DOM干掉！需要注意！
            //            gaeaData.unbind(options.dialogId);
            //            // 清空表单内容
            //            // 彻底删除相关的HTML DOM
            //            $dialogForm.html("");
            //        }
            //    };
            //    return buttons;
            //}
        };


        dialog.button = {
            /**
             * 创建CRUD弹出框的默认按钮：确认、取消。
             * 确认：把dialog中的form，按配置的submitUrl提交。
             * 取消：由于crud dialog还有data-bind，所以还涉及到解绑，然后把dialog HTML清空（因为编辑过会有残留数据）。然后才关闭dialog。
             *
             * @param {object} options
             * @param {string} options.submitUrl
             * @param {string} options.submitAction                 点击确定提交的方式。为空则直接提交到submitUrl. writeback_in_one: 回写到上一个dialog（根据弹出框链，需要openStyle=inOne才行）的某字段（refInputId）。
             * @param {object} options.writeBack                    按字段名回写的具体配置项. writeback_by_field需要。
             * @param {string} options.id
             * @param {string} options.refInputId                   关联的父级dialog的输入框id
             * @param {string} options.data                         form之外的数据，如果和form里面的同名则会覆盖。
             * @returns {{确定: buttons."确定", 取消: buttons."取消"}}
             */
            initButtons: function (options) {
                //var $dialog = $("#" + options.id);
                options.formId = dialog.utils.getFormId(options.id);
                //var $dialogForm = $("#" + options.formId);
                var okFunction = null;

                /**
                 * 确定按钮
                 */
                if (gaeaString.equalsIgnoreCase(GAEA_UI_DEFINE.UI.BUTTON.SUBMIT_ACTION.WRITEBACK_IN_ONE, options.submitAction)) {
                    // 回写的弹出框也需要进行校验
                    okFunction = function () {
                        // 调用校验框架，校验ok才继续。
                        gaeaCommon.gaeaValidate.validate({
                            containerId: options.formId,// 校验的范围（某表单）
                            // 成功回调
                            success: function () {
                                // 执行业务逻辑
                                _private.inOne.writeBackInOne(options);
                                // 关闭
                                _private.inOne.close(options);
                                // 替换按钮
                                _private.inOne.replaceParentButton(options);
                            }
                        });
                    }
                }
                if (gaeaString.equalsIgnoreCase(GAEA_UI_DEFINE.UI.BUTTON.SUBMIT_ACTION.WRITEBACK_BY_FIELD, options.submitAction)) {
                    // 回写的弹出框也需要进行校验
                    okFunction = function () {
                        // 调用校验框架，校验ok才继续。
                        gaeaCommon.gaeaValidate.validate({
                            containerId: options.formId,// 校验的范围（某表单）
                            // 成功回调
                            success: function () {
                                // 执行业务逻辑, 按字段名回填。
                                _private.inOne.writeBackByField(options);
                                // 关闭
                                _private.inOne.close(options);
                                // 替换按钮
                                _private.inOne.replaceParentButton(options);
                            }
                        });
                    }
                }
                else {
                    okFunction = function () {
                        dialog.button.action.submit(options);
                    }
                }

                /**
                 * 取消按钮
                 */
                var cancelFunction = null;
                if (gaeaString.equalsIgnoreCase(GAEA_UI_DEFINE.UI.BUTTON.SUBMIT_ACTION.WRITEBACK_IN_ONE, options.submitAction)) {
                    cancelFunction = function () {
                        _private.inOne.close(options);
                        // 替换按钮
                        _private.inOne.replaceParentButton(options);
                    }
                } else {
                    cancelFunction = function () {
                        dialog.button.close(options);
                    }
                }

                var buttons = {
                    "确定": okFunction,
                    "取消": cancelFunction
                };

                return buttons;
            },
            /**
             * dialog的取消按钮的操作。
             * @param opts
             */
            close: function (opts) {
                var formId = dialog.utils.getFormId(opts.id);
                var $dialogForm = $("#" + formId);
                /**
                 * 必须首先关闭dialog。否则后面的操作会把整个dialog的DOM删除。jQuery dialog的事件就统统失效了。
                 */
                dialog.close("#" + opts.id);
                // 取消数据绑定. 这里也会把dialog的DOM干掉！需要注意！
                gaeaData.unbind(opts.id);
                // 清空表单内容
                // 彻底删除相关的HTML DOM
                $dialogForm.html("");
            },
            /**
             * 按钮的一些操作定义。
             */
            action: {
                /**
                 * 一般弹出框的确认按钮的操作。
                 * @param options
                 */
                submit: function (options) {
                    var $dialogForm = $("#" + options.formId);
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
                                    gaeaData.unbind(options.id);
                                    // 清空表单内容
                                    $dialogForm.html("");
                                    // 关闭弹出框
                                    dialog.close("#" + options.id);
                                },
                                fail: function (data) {
                                    gaeaNotify.error("保存失败！");
                                }
                            });
                            //// 刷新数据，其实这里应该优化一下，不该不关三七二十一就刷新
                            dialog.close("#" + options.id);
                        }
                    });
                }
            }
        };

        dialog.utils = {
            /**
             * 创建一个空的dialog要用的DIV（不是dialog！）。在系统统一定义的地方。不是乱放。
             * 会检查id，没有才创建。
             * div的id和name，都统一用传入参数的id。
             * @param {object} options
             * @param {string} options.id
             * @param {string} options.parentId
             * @param {string} options.content
             * @param {string} options.openStyle   new | inOne
             */
            createDialogDiv: function (options) {
                if ($("#" + options.id).length < 1) {
                    var content = options.content;
                    if (gaeaValid.isNull(content)) {
                        content = "";
                    }
                    /**
                     * 没有设置openStyle，或设了new，则创建一个新的，独立于其他弹框。
                     * 如果是inOne，则创建一个，在parentId内。这样就不做重复弹出。
                     */
                    if (gaeaValid.isNull(options.openStyle) || gaeaString.equalsIgnoreCase(options.openStyle, "new")) {
                        $("#" + GAEA_UI_DEFINE.PAGE.GAEA_GRID_HTML.DIALOG_AREA).append(_.template(GAEA_UI_DEFINE.TEMPLATE.DIV.WITH_NAME)({
                            ID: options.id,
                            NAME: options.id,
                            CONTENT: content
                        }));
                    } else if (gaeaString.equalsIgnoreCase(options.openStyle, "inOne") && gaeaValid.isNotNull(options.parentId)) {
                        // 获取缓存的弹框链中，对应的最顶级dialog
                        var rootDialogId = _private.chain.getRootId(options.parentId);
                        if (gaeaValid.isNull(rootDialogId)) {
                            rootDialogId = options.parentId;
                        }
                        /**
                         * 如果是inOne，则在提供的父级id内，创建dialog的区块。
                         */
                        $("#" + rootDialogId).append(_.template(GAEA_UI_DEFINE.TEMPLATE.DIV.HIDDEN)({
                            ID: options.id,
                            NAME: options.id,
                            CONTENT: content
                        }));
                    }
                }
            },
            getFormId: function (dialogId) {
                return dialogId + "-form";
            }
        };

        /**
         * 弹框链相关。
         * 所谓弹框链，就是：
         * 例如有一个弹框，里面有一个按钮，点一下，又弹一个框；新弹框里面有个按钮，点一下又弹一个框……
         * 如果，我们从第二个开始不弹框，改为覆盖当前弹框的内容，注意是内容！
         * 则，这些共用同一个框的（本来应该是弹框的），所有弹框会形成一个链路。从而确保，最后一个弹框点确认的时候，可以回到第二个；第二个点确认，可以回到第三个……
         */
        _private.chain = {
            cache: {
                /**
                 * 已打开的弹出框的链路表。
                 * key：所有打开弹出框的id组合，基于id以打开顺序拼凑而成。
                 * value：应该对应的是dialog.option
                 */
                openDialogChainList: {
                    // { dialog1->dialog2:{ dialog1:{...}, dialog1->dialog2:{...} }, dialog3->dialog4:{dialog3:{...}, dialog3->dialog4:{...} } }
                }
            },
            // 新建一个弹出链
            new: function (key, value) {
                if (gaeaValid.isNull(key)) {
                    throw "id为空，无法获取对应的弹框链。";
                }
                _private.chain.cache.openDialogChainList[key] = value;
            },
            /**
             *
             * @param {object} opts
             * @param {string} opts.id
             * @param {string} opts.parentId
             * @param {object} opts.options                             要缓存的对象。一般是当前弹框的一些配置项，例如：按钮
             */
            add: function (opts) {
                if (gaeaValid.isNull(opts.id)) {
                    throw "dialog id为空，无法缓存新的弹出框操作链。";
                }
                // 不知道为什么，第一次创建的按钮也有了缓存
                //if(_private.chain.exist(opts.id)){
                //    throw "缓存错误。缓存的弹出框操作链已存在该id："+opts.id;
                //}
                // 如果没有父级弹框id，且当前弹出框id也还没缓存过
                if (gaeaValid.isNull(opts.parentId)) {
                    _private.chain.new(opts.id, opts.options);
                } else {
                    // 找到缓存的父级弹框的操作链. parentChain应该是一个对象。
                    var parentChain = _private.chain._private.pickEndWith(opts.parentId);
                    var newKeyTemplate = _.template(TEMPLATE.CHAIN.NAME);
                    if (_.isNull(parentChain)) {
                        throw "通过parent id，找不到要加入的已存在的弹框链。id: " + opts.parentId;
                    }
                    // 命名当前弹框的操作链名称
                    var newKey = newKeyTemplate({
                        PARENT_ID: _.keys(parentChain)[0],
                        ID: opts.id
                    });
                    //parentChain[newKey] = opts.options;
                    _private.chain._private.add(newKey, opts.options);
                }
            },
            getEndWith: function (opts) {
                if (gaeaValid.isNull(opts.id)) {
                    throw "id为空，无法获取对应的弹框链。";
                }
                return _private.chain._private.pickEndWith(opts.id);
            },
            /**
             * 获取id的上一级的parent dialog id。
             * @param id
             * @returns {*}
             */
            getParentId: function (id) {
                gaeaValid.isNull({
                    check: id,
                    exception: "dialog id为空，无法获取对应的弹出框操作链的第一个弹出框id。"
                });
                var myChain = _private.chain.getEndWith({id: id});

                gaeaValid.isNull({
                    check: myChain,
                    exception: "根据id无法找到缓存的弹框链中，对应的最顶级dialog id。可能是框架的缓存功能异常。id: " + id
                });
                //if(gaeaValid.isNull(parentChain)){
                //    throw "根据id无法找到缓存的弹框链中，对应的最顶级dialog id。可能是框架的缓存功能异常。id: "+id;
                //    //return null;
                //}
                var chainKey = _.keys(myChain)[0];
                // 自己就是最根本，返回null
                if (!_s.include(chainKey, TEMPLATE.CHAIN.NAME_SEPARATOR)) {
                    return null;
                }
                // 把名字按'->'分隔符切分，并返回最后一个（认为就是root dialog id）。
                // initial去掉最后一个（就是自己），然后再返回（相当倒数第二个）
                return _.last(_.initial(chainKey.split(TEMPLATE.CHAIN.NAME_SEPARATOR)));
            },
            /**
             * 获取id对应的缓存弹框链的最顶级的dialog的id。
             * @param id
             * @returns {string} id
             */
            getRootId: function (id) {
                if (gaeaValid.isNull(id)) {
                    throw "dialog id为空，无法获取对应的弹出框操作链的第一个弹出框id。";
                }
                var parentChain = _private.chain.getEndWith({id: id});
                if (gaeaValid.isNull(parentChain)) {
                    //throw "根据id无法找到缓存的弹框链中，对应的最顶级dialog id。可能是框架的缓存功能异常。id: "+id;
                    return null;
                }
                var parentChainKey = _.keys(parentChain)[0];
                // 把名字按'->'分隔符切分，并返回第一个（认为就是root dialog id）。
                return parentChainKey.split(TEMPLATE.CHAIN.NAME_SEPARATOR)[0];
            },
            isRoot: function (id) {
                if (gaeaValid.isNull(id)) {
                    throw "dialog id为空。";
                }
                if (!gaeaValid.isNull(_private.chain._private.pick(id))) {
                    return true;
                }
                return false;
            },
            /**
             * 检查缓存的弹出框链是否已经有该弹出框id。
             * @param id
             * @returns {boolean}
             */
            exist: function (id) {
                var dialogChain = _private.chain._private.pickChain(id);
                if (_.isNull(dialogChain)) {
                    return false;
                }
                return true;
            },
            _private: {
                /**
                 * 往缓存中写入一个新的弹出框。
                 * @param key           当前弹出框和前面n多弹出框的id的组合名
                 * @param value         值。一般是当前弹出框的配置项。
                 */
                add: function (key, value) {
                    if (gaeaValid.isNull(key)) {
                        throw "(缓存弹出框链)key为空, 无法进行缓存弹出框链信息的操作.";
                    }
                    _private.chain.cache.openDialogChainList[key] = value;
                },
                /**
                 * 精确获取缓存弹框链的某一个id和对应的值。
                 * @param id
                 * @returns {object}
                 */
                pick: function (id) {
                    var result = _.pick(_private.chain.cache.openDialogChainList, function (value, key, object) {
                        return gaeaString.equalsIgnoreCase(key, id);
                    });
                    // pick方法找不到，会返回一个空的（{}）对象，而不是null
                    if (_.isEmpty(result)) {
                        return null;
                    }
                    return result;
                },
                /**
                 * 从缓存的dialog弹出链中，找到id对应的那个key的value。
                 * @param id
                 * @returns {对象}
                 */
                pickChain: function (id) {
                    var result = _.pick(_private.chain.cache.openDialogChainList, function (value, key, object) {
                        return _s.include(key, id);
                    });
                    // pick方法找不到，会返回一个空的（{}）对象，而不是null
                    if (_.isEmpty(result)) {
                        return null;
                    }
                    return result;
                },
                /**
                 * 找到我所在的链的具体位置, 即key end with id就是我。
                 * 例如，对于id=dialog2就是：
                 * {
                     dialog1: ... ,
                     dialog1->dialog2 : ...,               <----- 这就是我
                     dialog1->dialog2->dialog3 : ...
                   }
                 * @param id
                 * @returns {object} chainObject    一个根据id找到的在缓存中的值，像这样：{ ***->id : value }
                 */
                pickEndWith: function (id) {
                    // 找到我所在的链（正常应该唯一）
                    //var chain = _private.chain._private.pickChain(id);
                    //if (gaeaValid.isNull(chain)) {
                    //    return null;
                    //}
                    /**
                     * 找到我所在的链的具体位置, 即key end with id就是我。
                     * 例如，对于id=dialog2就是：
                     * {
                     * dialog1: ... ,
                     * dialog1->dialog2 : ...,               <----- 这就是我
                     * dialog1->dialog2->dialog3 : ...
                     * }
                     */
                    var result = _.pick(_private.chain.cache.openDialogChainList, function (value, key, object) {
                        return _s.endsWith(key, id);
                    });

                    // pick方法找不到，会返回一个空的（{}）对象，而不是null
                    if (_.isEmpty(result)) {
                        return null;
                    }
                    return result;
                }
            }
        };

        /**
         * 打开方式（openStyle）为inOne的相关处理。
         * 对于inOne类型，即多个弹出框共用一个弹出窗体的。相关特殊操作包括：
         * 打开的时候，不直接弹出新的弹出框，而是共用当前弹出框；关闭的时候，也不直接关闭弹出框；确定的时候，需要把值回写等。
         */
        _private.inOne = {
            /**
             * 打开方式（openStyle）为inOne的确定按钮的处理。
             * 把新打开的dialog的所有值，填充到父级dialog的某个字段去。
             * @param {object} opts
             * @param {string} opts.formId
             * @param {string} opts.submitAction
             * @param {string} opts.refInputId
             */
            writeBackInOne: function (opts) {
                var $dialogForm = $("#" + opts.formId);
                if (gaeaString.equalsIgnoreCase(GAEA_UI_DEFINE.UI.BUTTON.SUBMIT_ACTION.WRITEBACK_IN_ONE, opts.submitAction)) {
                    var $parentInput = $("#" + opts.refInputId);
                    var formData = $dialogForm.serializeObject();
                    // 保存时得json转一下，否则变成[ Object object ]这样了
                    $parentInput.val(JSON.stringify(formData));
                }
            },
            /**
             * 把新打开的dialog的所有值，按照name填充回上一个弹出框的同名字段中。
             * @param {object} opts
             * @param {string} opts.formId
             * @param {string} opts.submitAction
             * @param {string} opts.refInputId
             * @param {object} opts.writeBack               按字段名回写的具体配置项
             * @param {string} opts.writeBack.fromCtId      源容器的id
             * @param {string} opts.writeBack.fromFieldPrefix
             * @param {string} opts.writeBack.toCtId        源容器的id
             * @param {string} opts.writeBack.toFieldPrefix
             */
            writeBackByField: function (opts) {
                if (gaeaValid.isNull(opts.writeBack.fromCtId) || gaeaValid.isNull(opts.writeBack.toCtId)) {
                    throw "writeBack.fromCtId 或 toCtId为空，无法复制。";
                }
                if (gaeaString.equalsIgnoreCase(GAEA_UI_DEFINE.UI.BUTTON.SUBMIT_ACTION.WRITEBACK_BY_FIELD, opts.submitAction)) {
                    gaeaData.utils.copyByField(opts.writeBack);
                }
            },
            /**
             * 打开弹出框。
             * @param {object} opts
             * @param {string} opts.id                          要打开的dialog的id
             * @param {string} opts.parentId                    父级dialog的id
             * @param {string} opts.openStyle                   打开方式。new：新弹出一个 inOne：在当前parentId内打开（不弹出）
             * @param {string} opts.dialogOptions               初始化弹出框的option对象（height,width,autoOpen,按钮等）。要用于打开后的缓存。
             */
            open: function (opts) {
                if (gaeaValid.isNull(opts.id)) {
                    throw "dialog id为空，无法打开inOne dialog。";
                }
                var $dialog = $("#" + opts.id);
                var rootDialogId = _private.chain.getRootId(opts.id);
                var $rootDialog = $("#" + rootDialogId);
                // parent id为空, 应该是打开普通dialog, 而不是inOne dialog
                if (gaeaValid.isNull(opts.parentId)) {
                    throw "dialog parent id为空，无法打开inOne dialog。";
                }

                // 替换dialog的按钮
                $rootDialog.gaeaDialog("option", "buttons", opts.dialogOptions.buttons);

                _private.inOne.show(opts);
            },
            show: function (opts) {
                var $dialog = $("#" + opts.id);
                // 隐藏原来的页面
                if (_private.chain.isRoot(opts.parentId)) {
                    // 父级是根dialog，就不能全部隐藏了。不然大家都看不到了。
                    $("#" + opts.parentId).children("div:first").hide();
                } else {
                    // 父级非根级dialog，可以直接隐藏
                    $("#" + opts.parentId).hide();
                }

                // 当前页滑动展示
                _private.inOne._private.showChild($dialog);
            },
            /**
             * dialog的关闭操作。
             * <b>这个主要用于打开方式（openStyle）是inOne的多级dialog。</b>
             * <p>但如果是根dialog，也会调用普通dialog的close方法。</p>
             * @param {object} opts
             * @param {string} opts.id              dialog id
             */
            close: function (opts) {
                gaeaValid.isNull({
                    check: opts.id,
                    exception: "dialog id为空，不能做取消dialog操作。"
                });
                var $dialog = $("#" + opts.id);
                var parentDialogId = _private.chain.getParentId(opts.id);

                // 如果自己就是最顶级dialog，则调用普通dialog的关闭功能
                if (gaeaValid.isNull(parentDialogId)) {
                    dialog.button.close({
                        id: opts.id
                    });
                    return;
                }

                var $parentDialog = $("#" + parentDialogId);
                // 显示父页面
                if (_private.chain.isRoot(parentDialogId)) {
                    // 父级是根dialog，就不能全部显示，显示第一个子div（默认代表根dialog内容）
                    _private.inOne._private.showParent($parentDialog.children("div:first"));
                } else {
                    // 父级非根级dialog，可以直接显示
                    _private.inOne._private.showParent($parentDialog);
                }
                // 当前页隐藏
                $dialog.hide();
            },
            /**
             * 替换当前弹框的按钮，为缓存中父级dialog的按钮。
             * <b>这个只适用于打开方式（openStyle）是inOne的多级dialog。</b>
             * @param {object} opts
             * @param {string} opts.id              dialog id
             */
            replaceParentButton: function (opts) {
                gaeaValid.isNull({
                    check: opts.id,
                    exception: "dialog id为空，不能做取消dialog操作。"
                });
                var parentDialogId = _private.chain.getParentId(opts.id);
                var cacheParentDialog = _private.chain.getEndWith({id: parentDialogId});
                var cacheDialogOptions = _.values(cacheParentDialog)[0];
                // 替换dialog的按钮
                var rootDialogId = _private.chain.getRootId(opts.id);
                var $rootDialog = $("#" + rootDialogId);
                $rootDialog.gaeaDialog("option", "buttons", cacheDialogOptions.buttons);
            },
            _private: {
                /**
                 * inOne展示父级dialog。动画不同。
                 * @param $dialog           jQuery对象
                 */
                showParent: function ($dialog) {
                    $dialog.show("slide", {direction: "left"}, 500);
                },
                /**
                 * inOne展示子级dialog。动画不同。
                 * @param $dialog           jQuery对象
                 */
                showChild: function ($dialog) {
                    $dialog.show("slide", {direction: "right"}, 500);
                }
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
            // jquery.get才能返回一个jqXHR对象。作同步用。
            return $.get(options.contentUrl, function (data) {
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
            });
        };

        /**
         * 初始化弹出框的一些配置项。包括：宽、高、是否自动打开等。按钮也是在这里初始化。
         * @param {object} opts
         * @param {string} opts.id
         * @param {string} opts.submitUrl
         * @param {string} options.submitAction                 点击确定提交的方式。为空则直接提交到submitUrl. writeback_in_one: 回写到上一个dialog（根据弹出框链，需要openStyle=inOne才行）的某字段（refInputId）。
         * @param {string} options.refInputId                   关联的父级dialog的输入框id
         *
         * @returns {object} opts
         */
        _private.getInitOption = function (opts) {
            //dialogOption = _.extend(crudDialog.options, dialogOption);
            //var linkObj = dialogOption.dialog;
            //var buttonDef = options.button;
            //var selectedRow = null;
            if (gaeaValid.isNull(opts.id)) {
                throw "没有 id，无法创建Dialog。";
            }
            if (_private.chain.exist(opts.id)) {
                console.debug("dialog已经打开过，并缓存。");
                //throw "dialog已经打开过，并缓存。无法再创建。";
            }
            //dialogDef = linkObj;
            //var dialogOption = _.clone(linkObj);
            // 用htmlId作为创建dialog的DIV ID。
            //dialogOption.id = linkObj.htmlId;
            //var dlgSelector = "#" + dialogOption.id;
            //// 检查当前页面有没有对应的DIV，没有创建一个。
            //dialog.utils.createDialogDiv({
            //    id: dialogOption.id,
            //    parentId:dialogOption.parentId,
            //    openStyle:"inOne"
            //});
            //var $dialogDiv = $("#" + dialogOption.id);
            //var formId = opts.id + "-form";
            //var contentCtTemplate = _.template(TEMPLATE.NEW_DIALOG_INNER_CONTAINER);
            //// 给dialog中的表单，外包一层form
            ////$dialogDiv.html("<form id=\"" + dlgFormName + "\" action=\"" + dialogOption.submitUrl + "\"></form>");
            //$dialogDiv.html(contentCtTemplate({
            //    FORM_ID:dlgFormName,
            //    ACTION:dialogOption.submitUrl
            //}));
            //var $dialogForm = $("#" + dlgFormName);
            // 初始化dialog选项
            var dialogPosition = {my: "left+310 top+95", at: "left top", of: window};// dialog默认弹出位置。
            opts.dialogPosition = dialogPosition;
            opts.autoOpen = false;
            opts.width = 940;// 默认弹出框的宽度
            opts.buttons = dialog.button.initButtons(opts);
            //opts.buttons = dialog.button.initButtons({
            //    submitUrl: opts.submitUrl,
            //    formId: dialog.utils.getFormId(opts.id),
            //    dialogId: opts.id
            //});


            // 监听grid的选中事件，以便进行CRUD操作
            // 通过grid的选中事件，获取选中行的数据等
            // TODO 'urgrid'这个必须改为XML配置ACTION，利用bindOptions属性获取
            //$("#urgrid").on(GAEA_EVENTS.DEFINE.UI.GRID.SELECT, function (event, data) {
            //    console.log("trigger grid select event in gaeaUI dialog.");
            //    selectedRow = data.selectedRow;
            //    crudDialog.cache.selectedRow = selectedRow;
            //});

            //var $button = $("#" + buttonDef.htmlId);
            //if (gaeaString.equalsIgnoreCase(buttonDef.action, GAEA_UI_DEFINE.ACTION.CRUD.UPDATE)) {
            //    // 创建CRUD dialog的时候，初始化监听
            //    gaeaData.listen(GAEA_EVENTS.DEFINE.CONTEXT.PAGE.UPDATE, dialogOption.id);
            //    /**
            //     * 点击“编辑”按钮触发。
            //     */
            //    crudDialog.initUpdateDialog({
            //        buttonDef: buttonDef,
            //        dialogOptions: dialogOption
            //    });
            //} else if (gaeaString.equalsIgnoreCase(buttonDef.action, GAEA_UI_DEFINE.ACTION.CRUD.ADD)) {
            //    // 初始化新增弹出框。包括点击触发。
            //    crudDialog.initAddDialog({
            //        buttonDef: buttonDef,
            //        dialogOptions: dialogOption,
            //        parentId:options.parentId,
            //        openStyle:"inOne"
            //    });
            //}
            return opts;
        };

        /**
         * 创建dialog的div，和里面的form。
         * 无论div还是form，都会进行id检查，确保不会重复创建。
         * @param {object} opts
         * @param {string} opts.id                              就是dialog id
         * @param {string} opts.parentId
         * @param {string} opts.openStyle
         * @param {string} opts.submitUrl
         */
        _private.initHtml = function (opts) {
            if (gaeaValid.isNull(opts.id)) {
                throw "没有 id，无法创建Dialog。";
            }
            var formId = dialog.utils.getFormId(opts.id);

            //if(_private.chain.exist(opts.id)){
            //    throw "dialog已经打开过，并缓存。无法再创建。id: "+opts.id;
            //}
            if ($("#" + opts.id).length > 0) {
                console.debug("该HTML元素在页面已经存在了。忽略创建。id：%s", opts.id);
            } else {
                // 检查当前页面有没有对应的DIV，没有创建一个div。
                dialog.utils.createDialogDiv({
                    id: opts.id,
                    parentId: opts.parentId,
                    openStyle: opts.openStyle
                });
            }

            // 创建div里面的子div和form
            if ($("#" + formId).length > 0) {
                console.debug("该HTML元素在页面已经存在了。忽略创建。id：%s", formId);
            } else {
                var $dialogDiv = $("#" + opts.id);
                //var formId = opts.id + "-form";
                var contentCtTemplate = _.template(TEMPLATE.NEW_DIALOG_INNER_CONTAINER);
                $dialogDiv.html(contentCtTemplate({
                    FORM_ID: formId,
                    ACTION: opts.submitUrl
                }));
            }
        };

        /**
         * 预初始化dialog的HTML。主要是为了一些交互的效果，需要先有HTML容器的初始化。
         * @param {object} opts
         * @param {string} opts.id                              就是dialog id
         * @param {string} opts.parentId
         * @param {string} opts.openStyle
         * @param {string} opts.submitUrl
         */
        _private.preInitHtml = function (opts) {
            if (gaeaString.equalsIgnoreCase(opts.openStyle, "inOne") && gaeaValid.isNotNull(opts.parentId)) {
                _private.initHtml(opts);

                // 对form进行简单处理
                var formId = dialog.utils.getFormId(opts.id);
                /**
                 * 简单初始化jQuery.validate，并不是进行校验。
                 * 创建了dialog html后，对里面的form也得做validate的初始化。否则jQuery.validate插件会报错：
                 * jquery.validate.js:404 Uncaught TypeError: Cannot read property 'settings' of undefined(…)
                 * 不知道为什么它会自动对form进行关联（虽然不会校验），虽然都还没有启用它。
                 */
                if (!gaeaCommonUtils.dom.checkUnique(formId)) {
                    throw "form id不唯一，jQuery validate插件可能会无法处理。id: " + formId;
                }
                // 只是简单初始化，避免抛出undefined错误
                $("#" + formId).validate();
            } else {
                throw "openStyle不等于inOne，或缺失parentId，都会导致无法进行HTML预初始化。";
            }
        };

        _private.find = function (jsonComponents, cmpnId) {
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
        };

        _private.createDialog = function () {
            //var that = this;
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
            return dialog;
        };


        /**
         * 返回（暴露）的接口
         */
        //dialog.initCrudDialog = crudDialog.init;
        //return dialog;
        return {
            init: dialog.init,
            initCrudDialog: crudDialog.init,
            findDialog: dialog.findDialog,
            create: dialog.create,
            open: dialog.open,
            close: dialog.close,
            confirmDialog: dialog.confirmDialog,
            preInitHtml: dialog.preInitHtml
        };
    });