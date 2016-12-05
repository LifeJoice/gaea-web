/**
 * 基于RequireJS的模块化重构。让依赖更清晰，更简单。
 * Created by iverson on 2016-2-17 11:48:52.
 */
define([
        "jquery", "underscore", 'gaeajs-common-utils-ajax', 'gaeajs-common-utils-validate', 'gaeajs-ui-grid', 'gaeajs-ui-dialog', 'gaeajs-ui-workflow',
        "gaeajs-ui-form", "gaeajs-data", "gaeajs-common-utils-string", "gaeajs-uploader", "gaeajs-ui-definition",
        "gaeajs-ui-events", "gaeajs-common-actions", "gaea-system-url", "gaeajs-ui-notify", "gaeajs-common-utils",
        "gaeajs-ui-view", "gaea-system-url"],
    function ($, _, gaeaAjax, gaeaValid, gaeaGrid, gaeaDialog, gaeaWF,
              gaeaForm, gaeaData, gaeaString, gaeaUploader, GAEA_UI_DEFINE,
              GAEA_EVENTS, gaeaActions, URL, gaeaNotify, gaeaUtils,
              gaeaView, SYS_URL) {
        var toolbar = {
            options: {
                renderTo: null,
                buttons: [
                    {
                        id: null,
                        name: null,
                        text: null,
                        type: null,
                        href: null,
                        linkViewId: null,
                        linkComponent: null,
                        // 监听事件。例如：单击等……
                        listeners: {
                            click: null,
                            afterLoadInClick: null
                        }
                    }
                ],
                /**
                 * 接口实现。一组key : func，key对应schema的interface-action，func就是实现。
                 * 如果key=buttons.interfaceAction，则对应按钮的onclick事件会被key对应的func代替。
                 */
                interface: null
            },
            /**
             * 创建ToolBar。
             * @param options
             * @param inViews
             */
            create: function (options, inViews) {
                this.options = options;
                var that = this;
                var containerId = options.renderTo;
                var $container = $("#" + options.renderTo);
                $container.addClass("finder-action-items");
                // 遍历按钮配置(views.actions.buttons)
                $.each(this.options.buttons, function (key, val) {
                    var thisButton = this;
                    var $button = $("#" + this.htmlId);
                    var dialogDef = null;
                    /**
                     * if 是按钮组
                     *      按照按钮组的逻辑处理
                     * else if 普通按钮
                     *      创建普通按钮
                     */
                    if (gaeaString.equalsIgnoreCase(GAEA_UI_DEFINE.UI.COMPONENT.BUTTON.BUTTON_GROUP, thisButton.componentName)) {
                        /**
                         * 按钮组
                         */
                        $container.append(toolbar.button.createButtonGroup({
                            buttonDef: thisButton,
                            containerId: containerId
                        }));
                    } else if (gaeaString.equalsIgnoreCase(GAEA_UI_DEFINE.UI.COMPONENT.BUTTON.DEFAULT, thisButton.componentName)) {
                        /**
                         * 普通按钮
                         */
                            // [1] 生成按钮的基础html。例如：<a>新增</a>
                        thisButton.text = thisButton.htmlValue;     // 按钮的名称，即htmlValue属性。
                        $container.append(that.button._create(thisButton));
                    } else {
                        throw "不可识别的toolbar component类型: " + thisButton.componentName;
                    }
                    /**
                     * [2] 处理button的关联组件
                     * 【 生成各种组件 】 根据action的linkId找到对应的组件并构造它
                     * 例如：
                     * “审批”按钮对应的是工作流的审批弹出框，则根据返回的json数据(views.dialogs[x].componentName:wf-dialog)，
                     * 找到关于工作流弹出框的描述信息，然后构造。
                     */
                    if (gaeaValid.isNotNull(this.linkViewId)) {
                        var linkObj = gaeaDialog.findDialog(inViews, this.linkViewId);
                        if ("wf-dialog" == linkObj.componentName) {
                            dialogDef = linkObj;
                            gaeaWF.dialog.create(linkObj, this);
                            //var dialogOption = linkObj;
                            //dialogOption.id = linkObj.htmlId;   // 用htmlId作为创建dialog的DIV ID。
                            //ur.macula.biz.workflow.dialog.createNormalApprovalDialogAndBinding(dialogOption, val);
                            ////$("#"+this.htmlId).click(function(){
                            //$("#" + this.htmlId).click(function () {
                            //    var row = ur.component.grid.getSelected();
                            //    if (ur.utils.validate.isNotNull(row.wfProcInstId)) {
                            //        $("#wfProcInstId").val(row.wfProcInstId);
                            //        //var dialogOption = linkObj;
                            //        // 用htmlId作为创建dialog的DIV ID。
                            //        //dialogOption.id = linkObj.htmlId;
                            //        //ur.macula.biz.workflow.dialog.createNormalApprovalDialogAndBinding(dialogOption, val, row.wfProcInstId);
                            //        ur.macula.biz.workflow.dialog.open(row);
                            //    } else {
                            //        alert("该记录还未启动流程，无法进行流程操作。");
                            //    }
                            //});
                        }
                        /**
                         * 如果有上传组件的dialog，则初始化上传组件。
                         */
                        else if (gaeaString.equalsIgnoreCase("uploader-dialog", linkObj.componentName)) {
                            console.log("初始化uploader-dialog");
                            dialogDef = linkObj;
                            gaeaUploader.uploader(null, linkObj, this);
                        }
                        /**
                         * 处理增删改dialog。
                         */
                        else if ("crud-dialog" == linkObj.componentName) {
                            //var $button = $("#" + button.htmlId);
                            var row = gaeaGrid.getSelected();
                            var options = {
                                button: thisButton,
                                dialog: linkObj,
                                selectedRow: row
                            };
                            gaeaDialog.initCrudDialog(options);
                        }
                        /**
                         * 最后，处理普通dialog。
                         */
                        else if ("dialog" == linkObj.componentName) {
                            if (gaeaValid.isNull(linkObj.htmlId)) {
                                throw "没有htmlId(对于页面DIV ID)，无法创建Dialog。";
                            }
                            var dialogOption = linkObj;
                            // 用htmlId作为创建dialog的DIV ID。
                            dialogOption.id = linkObj.htmlId;
                            var dlgSelector = "#" + dialogOption.id;
                            var $dialogDiv = $("#" + dialogOption.id);
                            var dlgFormName = dialogOption.id + "-form";
                            // 给dialog中的表单，外包一层form
                            $dialogDiv.html("<form id=\"" + dlgFormName + "\" action=\"" + dialogOption.submitUrl + "\"></form>");
                            var $dialogForm = $("#" + dlgFormName);
                            // 初始化dialog选项
                            var dialogPosition = {my: "left+310 top+95", at: "left top", of: window};// dialog默认弹出位置。
                            dialogOption.autoOpen = false;
                            dialogOption.width = 940;// 默认弹出框的宽度
                            dialogOption.buttons = {
                                "确定": function () {
                                    $dialogForm.submit();
                                    //var queryConditions = new Object();         // 查询请求数据
                                    //queryConditions.urSchemaId = $("#urSchemaId").val();
                                    //ur.utils.ajax.post({
                                    //    url: "/admin/common/query.do",
                                    //    data: queryConditions,
                                    //    success: function (data) {
                                    //        //alert("成功。id: " + data[0].id);
                                    //        // 用查询结果，刷新数据列表
                                    //        ur.component.bridge.grid.refreshData(data);
                                    //    },
                                    //    fail: function (data) {
                                    //        alert("失败");
                                    //    }
                                    //})
                                    //// 刷新数据，其实这里应该优化一下，不该不关三七二十一就刷新
                                    gaeaDialog.close(dlgSelector);
                                },
                                "取消": function () {
                                    gaeaDialog.close(dlgSelector);
                                    // 取消数据绑定
                                    gaeaData.unbind(dialogOption.id);
                                    // 清空表单内容
                                    $dialogForm.html("");
                                }
                            };
                            // 为按钮添加事件（加载内容）
                            $("#" + this.htmlId).click(function () {
                                //console.log("Go. Open dialog.");
                                //$dialogDiv.html("<form id=\"" + dlgFormName + "\" action=\"" + dialogOption.submitUrl + "\"></form>");
                                // afterLoadInClick，必须放在callback中，才能触发里面的一些初始化脚本（特别跟load的内容相关的）
                                $dialogForm.load(dialogOption.contentUrl, function () {
                                    if (gaeaValid.isNotNull(thisButton.listeners)) {
                                        thisButton.listeners.afterLoadInClick();
                                    }
                                    // 初始化表单的样式（load过来的表单）
                                    gaeaForm.init({
                                        containerClass: "gaea-form"
                                    });
                                    // 初始化数据相关的（数据集，MVVM等）
                                    gaeaData.scanAndInit(dialogOption.id);
                                });
                                // 初始化Dialog参数
                                gaeaDialog.create(dialogOption);
                                // 打开dialog
                                gaeaDialog.open(dlgSelector, dialogPosition);
                            });
                            // 创建弹出框
                            //gaeaDialog.create(dialogOption);
                        }
                    }
                    /**
                     * [3] 处理页面自定义的接口
                     */
                    if (gaeaValid.isNotNull(this.interfaceAction)) {
                        that._createInterfaceActions(thisButton);
                    }
                    /**
                     * [3] 触发事件框架，去寻找有没有对应的系统功能要处理之类的。
                     */
                    toolbar.button._initAction({
                        button: thisButton,
                        dialog: dialogDef,
                        selectedRow: row
                    });
                });
            },
            /**
             * 根据views.actions.buttons.interfaceAction的值，有各个具体的页面去实现自己的function并赋给按钮。
             * @param buttonOptions
             * @private
             */
            _createInterfaceActions: function (buttonOptions) {
                console.log("into _createInterfaceActions");
                var that = this;
                if (gaeaValid.isNotNull(that.options.interface)) {
                    $.each(that.options.interface, function (key, functionVal) {
                        console.log("为interface action添加事件。");
                        $("#" + buttonOptions.htmlId).click(function () {
                            var row = gaeaGrid.getSelected();
                            console.log("interface action中是否能get row？row is not null? " + gaeaValid.isNotNull(row));
                            functionVal(row);
                        });
                    })
                }
            },
            button: {
                /**
                 * 给构造Toolbar的json对象添加click事件。
                 * 在本方法后，会为传入的inViews对象的actions.button添加事件（click等）。要注意inViews对象的变化。
                 * @param inViews       后台返回XML SCHEMA json的views对象。
                 * @param buttonId      要添加事件的button的id
                 * @param onClick
                 * @returns {*}
                 */
                afterLoadInClick: function (inViews, buttonId, onClick) {
                    if (gaeaValid.isNotNullMultiple(inViews, ["actions", "buttons"])) {
                        //&& ur.utils.validate.isNotNull(inViews.actions)
                        //    && ur.utils.validate.isNotNull(inViews.actions.buttons)){
                        $.each(inViews.actions.buttons, function (key, val) {
                            if (this.id == buttonId) {
                                if (gaeaValid.isNotNull(this.listeners)) {
                                    this.listeners.afterLoadInClick = onClick;
                                } else {
                                    this.listeners = {
                                        afterLoadInClick: onClick
                                    }
                                }
                                return false;   // 跳出循环。
                            }
                        })
                    }
                    return inViews;
                },
                _create: function (btnOptions) {
                    var html = "<span><a id='" + btnOptions.htmlId + "'" +
                        " class=\"medium darkslategrey button\"" +
                        "<span>" +
                        btnOptions.text +
                        "</span>" +
                        "</a></span>";
                    return html;
                },
                /**
                 * 创建按钮组。
                 * @param opts
                 *              buttonDef 按钮组定义
                 *              containerId 整个按钮组的容器id
                 */
                createButtonGroup: function (opts) {
                    var buttonGroupDef = opts.buttonDef;
                    var $container = $("#" + opts.containerId);
                    var buttonPanelId = buttonGroupDef.id + "-buttons-panel";
                    var groupTemplate = _.template(GAEA_UI_DEFINE.UI.BUTTON_GROUP.TEMPLATE.HTML);
                    // 创建按钮组的整体框架（即除了按钮）
                    $container.append(groupTemplate({
                        GROUP_ID: buttonGroupDef.id,
                        GROUP_TEXT: buttonGroupDef.text,
                        BUTTONS_PANEL_ID: buttonPanelId
                    }));
                    var $buttonsPanel = $("#" + buttonPanelId);
                    //var $buttonList = $("<ul></ul>");
                    // < a >点击默认不带操作。由jQuery绑定事件。
                    var buttonTemplate = _.template(GAEA_UI_DEFINE.UI.BUTTON_GROUP.TEMPLATE.SUB_BUTTON_HTML);
                    /**
                     * 遍历按钮组里面的按钮。
                     * 【注意】
                     * 暂时不支持多级button嵌套！
                     */
                    $.each(buttonGroupDef.buttons, function (idx, val) {
                        var button = this;
                        // [1] 先创建容器
                        if (idx == 0) {
                            $buttonsPanel.append('<ul></ul>');
                        }
                        // [2] 生成按钮组的基础html。例如：<li>新增</li>
                        var $li = $(buttonTemplate({
                            ID: button.id,
                            TEXT: button.htmlValue,
                            URL: button.submitUrl
                        }));
                        // 要把DOM先构建出来，否则后面依附不了事件。
                        $buttonsPanel.children("ul").append($li);
                        /**
                         * [3] 点击事件，和触发事件等。
                         * isBindOnClick为false。因为这里
                         * 这里，主要是delete等方法，初始化一些监听全局事件。
                         * 还有，添加点击事件。
                         */
                        toolbar.button._initAction({
                            button: button,
                            jqButton: $li,
                            isBindOnClick: true // 是否绑定onclick
                        });
                    });
                },
                /**
                 * 初始化action操作。其实主要就是绑定按钮点击的事件。
                 * 当然，有些按钮需要多初始化一些功能，例如监听一些事件等。
                 * @param opts
                 *              button
                 *              isBindOnClick 是否绑定click事件。如果是按钮的，可以为空。默认绑定。对于按钮组，这个应该为false，不绑定。
                 * @private
                 */
                _initAction: function (opts) {
                    var buttonDef = opts.button;
                    var $button = $("#" + buttonDef.htmlId);
                    /**
                     * 对于删除按钮，需要通过监听事件进行。
                     */
                    if (gaeaString.equalsIgnoreCase(buttonDef.action, GAEA_UI_DEFINE.ACTION.CRUD.DELETE_SELECTED)) {
                        // 请求真删除
                        opts.url = URL.CRUD.DELETE;
                        // 初始化通用删除功能（绑定点击事件等）
                        gaeaActions.deleteSelected.init(opts);
                    } else if (gaeaString.equalsIgnoreCase(buttonDef.action, GAEA_UI_DEFINE.ACTION.CRUD.PSEUDO_DELETE_SELECTED)) {// 和上面的DELETE_SELECTED基本一样，就是请求的接口不一样
                        // 初始化通用删除功能（绑定点击事件等）
                        gaeaActions.deleteSelected.init(opts);// options默认伪删除
                    }
                    /**
                     * 按钮点击的事件
                     */
                    if (gaeaValid.isNull(opts.isBindOnClick) || opts.isBindOnClick) {
                        $button.click(function () {
                            /**
                             * 创建按钮点击的对应处理。并执行。
                             */
                            var onClickFunction = _private.createOnClickFunc(opts);
                            onClickFunction();
                        });
                    }
                }
            }
        };

        var _private = {
            button: {
                /**
                 *
                 * @param opts
                 *                  button schema的button定义。其中应该也包含了buttonAction，但还是单独吧。
                 *                  buttonAction 某个button的某个action
                 *                  data 要POST到后台的数据. 应该必须有schemaId。
                 */
                doAction: function (opts) {
                    var button = opts.button;
                    var buttonAction = button.actions[0];// 暂时只支持绑定一个action
                    var data = opts.data;
                    data.method = buttonAction.method; // 赋予"method"属性和值. Action必须!
                    /**
                     * 如果是获取文件的action，例如导出，不能用ajax。必须用submit才行。
                     */
                    //$("<form action='" + SYS_URL.ACTION.DO_ACTION + "' method='post'><input type='hidden' name='method' value='" + data.method + "'><input type='hidden' name='schemaId' value='" + data.schemaId + "'><input type='hidden' name='buttonId' value='" + button.id + "'></form>").submit();
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
                },
                /**
                 * 和doAction大同小异。但这个，一方面提交处理的url不是同一个。另外，一些细节的东西，例如method，是没有的。
                 * @param opts
                 */
                doSimpleAction: function (opts) {
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
                }
            },
            /**
             *
             * @param opts
             *              rowParamName row作为data的属性的名。即 data.paramName=row. 空即data=row.
             * @returns data
             */
            getSubmitData: function (opts) {
                var data = {};
                var row = gaeaGrid.getSelected();
                // 获取页面的SCHEMA ID
                var schemaId = gaeaView.list.getSchemaId();
                data.schemaId = schemaId;
                // 获取页面快捷查询的条件
                var queryConditions = gaeaGrid.query.getQueryConditions();
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
            /**
             * 创建按钮点击时的处理方法。
             * 因为这个方法，普通按钮和按钮组要共用。所以重构，从_initAction中重构过来，整合了按钮组的功能和原来按钮的功能于一体。
             * @param opts
             * @returns {*}
             */
            createOnClickFunc: function (opts) {
                var clickFunction;
                var buttonDef = opts.button;
                var $button = $("#" + buttonDef.htmlId);
                //var opts = {
                //    button: buttonDef,
                //    dialog: dialogDef,
                //    selectedRow: row
                //};
                // TODO 下面这个应该移到gaeajs-action会更好吧？
                if (gaeaString.equalsIgnoreCase(buttonDef.action, GAEA_UI_DEFINE.ACTION.CRUD.UPDATE)) {
                    // 初始化绑定事件
                    //gaeaCommonCRUD.init(options);
                    // 点击触发事件
                    clickFunction = function () {
                        var row = gaeaGrid.getSelected();
                        opts.selectedRow = row;
                        $button.trigger(GAEA_EVENTS.DEFINE.UI.DIALOG.CRUD_UPDATE_OPEN, opts);
                    };
                } else if (gaeaString.equalsIgnoreCase(buttonDef.action, GAEA_UI_DEFINE.ACTION.CRUD.ADD)) {
                    // 点击触发事件
                    clickFunction = function () {
                        $button.trigger(GAEA_EVENTS.DEFINE.UI.DIALOG.CRUD_ADD_OPEN, opts);
                    };
                } else if (gaeaString.equalsIgnoreCase(buttonDef.action, GAEA_UI_DEFINE.ACTION.CRUD.DELETE_SELECTED)) {
                    //// 请求真删除
                    //opts.url = URL.CRUD.DELETE;
                    //// 初始化通用删除功能（绑定点击事件等）
                    //gaeaActions.deleteSelected.init(opts);
                    // 点击触发事件
                    clickFunction = function () {
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
                    };
                } else if (gaeaString.equalsIgnoreCase(buttonDef.action, GAEA_UI_DEFINE.ACTION.CRUD.PSEUDO_DELETE_SELECTED)) {// 和上面的DELETE_SELECTED基本一样，就是请求的接口不一样
                    //// 初始化通用删除功能（绑定点击事件等）
                    //gaeaActions.deleteSelected.init(opts);// options默认伪删除
                    // 点击触发事件
                    clickFunction = function () {
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
                    };
                } else if (gaeaValid.isNotNull(buttonDef.actions)) {
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
                    _private.button.doAction({
                        button: buttonDef,
                        //buttonAction: buttonDef.actions[0],
                        data: data
                    });
                    //});
                } else if (gaeaValid.isNotNull(buttonDef.action) && gaeaString.equalsIgnoreCase(buttonDef.action, GAEA_UI_DEFINE.ACTION.EXPORT_EXCEL)) {
                    var data = _private.getSubmitData();
                    data.buttonId = buttonDef.id;
                    data.actionName = buttonDef.action;
                    /**
                     * 普通action的处理（没有button-action子项）
                     * 【重要】
                     * TODO 暂时限定export excel走这个方法。因为其他的还没改过来。
                     */
                    _private.button.doSimpleAction({
                        button: buttonDef,
                        data: data
                    });
                }
                return clickFunction;
            }
        };
        /**
         * 返回（暴露）的接口
         */
        return toolbar;
    });