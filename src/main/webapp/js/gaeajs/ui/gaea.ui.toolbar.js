/**
 * 基于RequireJS的模块化重构。让依赖更清晰，更简单。
 * Created by iverson on 2016-2-17 11:48:52.
 */
define(["jquery","underscore",'gaeajs-common-utils-ajax','gaeajs-common-utils-validate','gaeajs-ui-grid','gaeajs-ui-dialog','gaeajs-ui-workflow',"gaeajs-ui-form","gaeajs-data"],
    function ($,_,gaeaAjax,gaeaValid,gaeaGrid,gaeaDialog,gaeaWF,gaeaForm,gaeaData) {
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
        create: function (options, inViews) {
            this.options = options;
            var that = this;
            var urToolbar = $("#" + options.renderTo);
            urToolbar.addClass("finder-action-items");
            // 遍历按钮配置(views.actions.buttons)
            $.each(this.options.buttons, function (key, val) {
                var thisButton = this;
                // [1] 生成按钮的基础html。例如：<a>新增</a>
                thisButton.text = thisButton.htmlValue;     // 按钮的名称，即htmlValue属性。
                urToolbar.append(that.button._create(thisButton));
                /**
                 * [2] 处理button的关联组件
                 * 【 生成各种组件 】 根据action的linkId找到对应的组件并构造它
                 * 例如：
                 * “审批”按钮对应的是工作流的审批弹出框，则根据返回的json数据(views.dialogs[x].viewName:wf-dialog)，
                 * 找到关于工作流弹出框的描述信息，然后构造。
                 */
                if (gaeaValid.isNotNull(this.linkViewId)) {
                    var linkObj = gaeaDialog.findDialog(inViews, this.linkViewId);
                    if ("wf-dialog" == linkObj.viewName) {
                        gaeaWF.dialog.create(linkObj,this);
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
                    } else if ("dialog" == linkObj.viewName) {
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
                        var $dialogForm = $("#"+dlgFormName);
                        // 初始化dialog选项
                        var dialogPosition = {my: "left+310 top+95",at: "left top", of: window};// dialog默认弹出位置。
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
                                gaeaForm.init("gaea-form");
                                // 初始化数据相关的（数据集，MVVM等）
                                gaeaData.scanAndInit(dialogOption.id);
                            });
                            // 初始化Dialog参数
                            gaeaDialog.create(dialogOption);
                            // 打开dialog
                            gaeaDialog.open(dlgSelector,dialogPosition);
                        });
                        // 创建弹出框
                        //gaeaDialog.create(dialogOption);
                    }
                }
                /**
                 * [3] 处理页面自定义的接口
                 */
                if(gaeaValid.isNotNull(this.interfaceAction)){
                    that._createInterfaceActions(thisButton);
                }
            })
        },
        /**
         * 根据views.actions.buttons.interfaceAction的值，有各个具体的页面去实现自己的function并赋给按钮。
         * @param buttonOptions
         * @private
         */
        _createInterfaceActions: function (buttonOptions) {
            console.log("into _createInterfaceActions");
            var that = this;
            if(gaeaValid.isNotNull(that.options.interface)){
                $.each(that.options.interface, function (key, functionVal) {
                    console.log("为interface action添加事件。");
                    $("#"+buttonOptions.htmlId).click(function () {
                        var row = gaeaGrid.getSelected();
                        console.log("interface action中是否能get row？row is not null? "+gaeaValid.isNotNull(row));
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
                var html = "<a id='" + btnOptions.htmlId + "'" +
                    " class=\"medium darkslategrey button\"" +
                    "<span>" +
                    btnOptions.text +
                    "</span>" +
                    "</a>";
                return html;
            },
            _createMaculaAction: function (btnOptions) {
                var html = "<a class=\"urFinderAction\"" +
                    "id='" + btnOptions.htmlId + "'" +
                    " submit=\"" + btnOptions.href + "\"" +
                    " minrowselected=\"1\" maxrowselected=\"1\" target=\"dialog::{title: '编辑店铺', width:'520',height:'380'}\">" +
                    "<span>" +
                        //"<img src=\"/resources20150703125423/admin/app-1.0.0/themes/default/images/bundle/btn_edit.gif\">" +
                    btnOptions.text +
                    "</span>" +
                    "</a>";
                return html;
            }
        }
    };
    /**
     * 返回（暴露）的接口
     */
    return toolbar;
})