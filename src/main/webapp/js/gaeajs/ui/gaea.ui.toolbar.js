/**
 * 基于RequireJS的模块化重构。让依赖更清晰，更简单。
 * Created by iverson on 2016-2-17 11:48:52.
 */
define([
        "jquery", "underscore", 'gaeajs-common-utils-ajax', 'gaeajs-common-utils-validate', 'gaeajs-ui-grid', 'gaeajs-ui-dialog', 'gaeajs-ui-workflow',
        "gaeajs-ui-form", "gaeajs-data", "gaeajs-common-utils-string", "gaeajs-uploader", "gaeajs-ui-definition",
        "gaeajs-ui-events", "gaeajs-common-actions", "gaea-system-url", "gaeajs-ui-notify", "gaeajs-common-utils"],
    function ($, _, gaeaAjax, gaeaValid, gaeaGrid, gaeaDialog, gaeaWF,
              gaeaForm, gaeaData, gaeaString, gaeaUploader, GAEA_UI_DEFINE,
              GAEA_EVENTS, gaeaActions, URL, gaeaNotify, gaeaUtils) {
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
                    toolbar.button._initAction(thisButton, dialogDef, row);
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
                    var $buttonList = $("<ul></ul>");
                    // < a >点击默认不带操作。由jQuery绑定事件。
                    var buttonTemplate = _.template(GAEA_UI_DEFINE.UI.BUTTON_GROUP.TEMPLATE.SUB_BUTTON_HTML);
                    /**
                     * 遍历按钮组里面的按钮。
                     * 【注意】
                     * 暂时不支持多级button嵌套！
                     */
                    $.each(buttonGroupDef.buttons, function (idx, val) {
                        var button = this;
                        // [1] 生成按钮的基础html。例如：<a>新增</a>
                        var $li = $(buttonTemplate({
                            ID: button.id,
                            TEXT: button.htmlValue,
                            URL: button.submitUrl
                        }));
                        /**
                         * 添加点击事件
                         */
                        $li.click(function () {
                            var url = $(this).data("url");
                            if (gaeaValid.isNull(url)) {
                                throw "按钮对应的请求地址为空(可能是缺少配置)。";
                            }
                            var row = gaeaGrid.getSelected();
                            // 把数据处理一下。否则以Spring MVC接受jQuery的请求格式，对不上会抛异常。特别是数组、对象类的（带了[id]）。
                            var newRow = gaeaUtils.data.flattenData(row);
                            // 提交
                            gaeaAjax.post({
                                url: url,
                                data: newRow,
                                success: function (data) {
                                    gaeaNotify.message(button.msg + "操作成功。");
                                    // 刷新grid数据
                                    $("#" + GAEA_UI_DEFINE.UI.GRID.GAEA_GRID_DEFAULT_ID).trigger(GAEA_EVENTS.DEFINE.UI.GRID.RELOAD);
                                },
                                fail: function (data) {
                                    gaeaNotify.error(button.msg + "操作失败！");
                                }
                            });
                        });
                        // 把按钮附加到按钮组
                        $buttonList.append($li);
                    });
                    $buttonsPanel.append($buttonList);
                },
                //_createMaculaAction: function (btnOptions) {
                //    var html = "<a class=\"urFinderAction\"" +
                //        "id='" + btnOptions.htmlId + "'" +
                //        " submit=\"" + btnOptions.href + "\"" +
                //        " minrowselected=\"1\" maxrowselected=\"1\" target=\"dialog::{title: '编辑店铺', width:'520',height:'380'}\">" +
                //        "<span>" +
                //            //"<img src=\"/resources20150703125423/admin/app-1.0.0/themes/default/images/bundle/btn_edit.gif\">" +
                //        btnOptions.text +
                //        "</span>" +
                //        "</a>";
                //    return html;
                //}
                _initAction: function (buttonDef, dialogDef, row) {
                    var $button = $("#" + buttonDef.htmlId);
                    //var row = gaeaGrid.getSelected();
                    var options = {
                        button: buttonDef,
                        dialog: dialogDef,
                        selectedRow: row
                    };
                    // TODO 下面这个应该移到gaeajs-action会更好吧？
                    if (gaeaString.equalsIgnoreCase(buttonDef.action, GAEA_UI_DEFINE.ACTION.CRUD.UPDATE)) {
                        // 初始化绑定事件
                        //gaeaCommonCRUD.init(options);
                        // 点击触发事件
                        $button.click(function () {
                            var row = gaeaGrid.getSelected();
                            options.selectedRow = row;
                            $button.trigger(GAEA_EVENTS.DEFINE.UI.DIALOG.CRUD_UPDATE_OPEN, options);
                        });
                    } else if (gaeaString.equalsIgnoreCase(buttonDef.action, GAEA_UI_DEFINE.ACTION.CRUD.ADD)) {
                        // 点击触发事件
                        $button.click(function () {
                            $button.trigger(GAEA_EVENTS.DEFINE.UI.DIALOG.CRUD_ADD_OPEN, options);
                        });
                    } else if (gaeaString.equalsIgnoreCase(buttonDef.action, GAEA_UI_DEFINE.ACTION.CRUD.DELETE_SELECTED)) {
                        // 请求真删除
                        options.url = URL.CRUD.DELETE;
                        // 初始化通用删除功能（绑定点击事件等）
                        gaeaActions.deleteSelected.init(options);
                        // 点击触发事件
                        $button.click(function () {
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
                        });
                    } else if (gaeaString.equalsIgnoreCase(buttonDef.action, GAEA_UI_DEFINE.ACTION.CRUD.PSEUDO_DELETE_SELECTED)) {// 和上面的DELETE_SELECTED基本一样，就是请求的接口不一样
                        // 初始化通用删除功能（绑定点击事件等）
                        gaeaActions.deleteSelected.init(options);// options默认伪删除
                        // 点击触发事件
                        $button.click(function () {
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
                        });
                    }
                }
            }
        };
        /**
         * 返回（暴露）的接口
         */
        return toolbar;
    });