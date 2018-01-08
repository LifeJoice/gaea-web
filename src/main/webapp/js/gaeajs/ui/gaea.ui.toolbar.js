/**
 * 基于RequireJS的模块化重构。让依赖更清晰，更简单。
 * Created by iverson on 2016-2-17 11:48:52.
 */

/**
 * 服务端定义的按钮
 *
 * @typedef {object} ServerButton
 * @property {string} id
 * @property {string} name
 * @property {string} htmlName
 * @property {string} htmlId
 * @property {string} htmlValue
 * @property {string} type
 * @property {string} href
 * @property {string} linkViewId
 * @property {string} linkComponent
 * @property {string} componentName
 * @property {string} submitUrl
 * @property {string} submitType
 * @property {string} msg
 * @property {string} text                              按钮的文本。在初始化的时候从htmlValue复制而来。非服务端初始化。
 * @property {string} size                              要生成大按钮，还是小按钮。为空默认medium. value: small|medium|
 * @property {string} action
 * @property {string} actions
 * @property {GaeaValidator[]} validators               校验定义对象数组。
 */

define([
        "jquery", "underscore", 'gaeajs-common-utils-ajax', 'gaeajs-common-utils-validate', 'gaeajs-ui-grid', 'gaeajs-ui-dialog', 'gaeajs-ui-workflow',
        "gaeajs-ui-form", "gaeajs-data", "gaeajs-common-utils-string", "gaeajs-uploader", "gaeajs-ui-definition",
        "gaeajs-ui-events", "gaeajs-common-actions", "gaea-system-url", "gaeajs-ui-notify", "gaeajs-common-utils",
        "gaeajs-ui-view", "gaea-system-url", "gaeajs-ui-button", "gaeajs-ui-crud-grid", "gaeajs-context", "gaeajs-ui-commons"],
    function ($, _, gaeaAjax, gaeaValid, gaeaGrid, gaeaDialog, gaeaWF,
              gaeaForm, gaeaData, gaeaString, gaeaUploader, GAEA_UI_DEFINE,
              GAEA_EVENTS, gaeaActions, URL, gaeaNotify, gaeaUtils,
              gaeaView, SYS_URL, gaeaButton, gaeaCrudGrid, gaeaContext, gaeaUI) {

        /**
         * 初始化Button后缓存在button.data中的options。
         *
         * @typedef {object} ButtonGaeaOptions
         * @property {string} id                            button id
         * @property {string} name                          button name, 一般和id一样
         * @property {string} htmlName                      html的button name，一般和id一样
         * @property {string} htmlId                        html的button id，一般和id一样
         * @property {string} action
         * @property {string} htmlValue                     按钮的文本
         * @property {string} text                          按钮的文本
         * @property {string} linkViewId                    链接对象的id
         * @property {object} linkViewObj                   链接对象（一般是dialog）的options
         * @property {string} submitType                    ajax|...
         * @property {string} submitUrl                     点确定提交的url
         * @property {string} msg                           提交后的提示信息的base部分
         * @property {array} validators                     按钮绑定的相关校验器。
         */

        /**
         * Gaea UI（按钮）的action
         *
         * @typedef {object} GaeaUIAction
         * @property {string} name                  唯一key。定义action。
         * @property {string} [gridId]              目标grid容器id。action=crudGridExcelImport 有用
         */

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
                //this.options = options;
                //var that = this;
                var containerId = options.renderTo;
                var $container = $("#" + options.renderTo);
                var gaeaButton = require("gaeajs-ui-button");
                //var gaeaDialog = require("gaeajs-ui-dialog");
                //var gaeaView = require("gaeajs-ui-view");
                $container.addClass("finder-action-items");
                // 遍历按钮配置(views.actions.buttons)
                $.each(options.buttons, function (key, val) {
                    /**
                     * @type {ServerButton}
                     */
                    var thisButton = this;
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
                            views: inViews,
                            containerId: containerId
                        }));
                    } else if (gaeaString.equalsIgnoreCase(GAEA_UI_DEFINE.UI.COMPONENT.BUTTON.DEFAULT, thisButton.componentName)) {
                        /**
                         * 普通按钮
                         */
                        var refObj;
                        if (gaeaValid.isNotNull(thisButton.linkViewId)) {
                            // 在view定义对象中，找id关联的定义
                            refObj = _.clone(gaeaUI.utils.findComponent(inViews, thisButton.linkViewId));
                        }
                        thisButton.text = thisButton.htmlValue;     // 按钮的名称，即htmlValue属性。
                        // create button container
                        var $buttonCt = $("<span></span>");
                        //$container.append(that.button._create(thisButton));
                        $container.append($buttonCt);
                        // create and append button
                        gaeaButton.create({
                            jqContainer: $buttonCt,
                            htmlId: thisButton.htmlId,
                            text: thisButton.text,
                            size: thisButton.size,
                            action: thisButton.action,
                            refObject: refObj
                        });
                        // cache options
                        $("#" + this.htmlId).data("gaeaOptions", thisButton);
                    } else {
                        throw "不可识别的toolbar component类型: " + thisButton.componentName;
                    }

                    var $button = $("#" + this.htmlId);
                    /**
                     * [2] 处理button的关联组件
                     * 【 生成各种组件 】 根据action的linkId找到对应的组件并构造它
                     * 例如：
                     * “审批”按钮对应的是工作流的审批弹出框，则根据返回的json数据(views.dialogs[x].componentName:wf-dialog)，
                     * 找到关于工作流弹出框的描述信息，然后构造。
                     */
                    //var refObj;
                    if (gaeaValid.isNotNull(thisButton.linkViewId)) {
                        // 在view定义对象中，找id关联的定义
                        //refObj = _.clone(gaeaUI.utils.findComponent(inViews, thisButton.linkViewId));
                        if (gaeaValid.isNull(refObj)) {
                            console.warn("根据linkViewId找不到对应的组件！linkViewId: %s", thisButton.linkViewId);
                            return;
                        }
                        //if (gaeaValid.isNotNull(refObj)) {
                        $button.data("gaeaOptions").linkViewObj = refObj;
                        //}
                        // dialog id
                        refObj.id = refObj.htmlId;

                        // 初始化相关组件
                        _private.initRefComponent(thisButton, inViews, refObj);
                    }

                    //if (gaeaValid.isNotNull(this.linkViewId)) {
                    //    //var linkObj = gaeaDialog.findDialog(inViews, this.linkViewId);
                    //    var linkObj = gaeaUI.utils.findComponent(inViews, this.linkViewId);
                    //    if (gaeaValid.isNull(linkObj)) {
                    //        console.warn("根据linkViewId找不到对应的组件！linkViewId: %s", this.linkViewId);
                    //        return;
                    //    }
                    //    // linkObj = dialog options
                    //    var dialogOpts = _.clone(linkObj);
                    //    // cache link object
                    //    if (gaeaValid.isNotNull(linkObj)) {
                    //        $button.data("gaeaOptions").linkViewObj = dialogOpts;
                    //    }
                    //    // dialog id
                    //    dialogOpts.id = linkObj.htmlId;
                    //
                    //    if ("wf-dialog" == linkObj.componentName) {
                    //        //dialogDef = linkObj;
                    //        gaeaWF.dialog.create(linkObj, this);
                    //        //var dialogOption = linkObj;
                    //        //dialogOption.id = linkObj.htmlId;   // 用htmlId作为创建dialog的DIV ID。
                    //        //ur.macula.biz.workflow.dialog.createNormalApprovalDialogAndBinding(dialogOption, val);
                    //        ////$("#"+this.htmlId).click(function(){
                    //        //$("#" + this.htmlId).click(function () {
                    //        //    var row = ur.component.grid.getSelected();
                    //        //    if (ur.utils.validate.isNotNull(row.wfProcInstId)) {
                    //        //        $("#wfProcInstId").val(row.wfProcInstId);
                    //        //        //var dialogOption = linkObj;
                    //        //        // 用htmlId作为创建dialog的DIV ID。
                    //        //        //dialogOption.id = linkObj.htmlId;
                    //        //        //ur.macula.biz.workflow.dialog.createNormalApprovalDialogAndBinding(dialogOption, val, row.wfProcInstId);
                    //        //        ur.macula.biz.workflow.dialog.open(row);
                    //        //    } else {
                    //        //        alert("该记录还未启动流程，无法进行流程操作。");
                    //        //    }
                    //        //});
                    //    }
                    //    /**
                    //     * 如果有上传组件的dialog，则初始化上传组件。
                    //     */
                    //    else if (gaeaString.equalsIgnoreCase("uploader-dialog", linkObj.componentName)) {
                    //        gaeaUploader.init({
                    //            dialog: dialogOpts,
                    //            button: this
                    //        });
                    //    }
                    //    /**
                    //     * 处理增删改dialog。
                    //     */
                    //    else if ("crud-dialog" == linkObj.componentName) {
                    //        // toolbar button id
                    //        dialogOpts.buttonId = thisButton.htmlId;
                    //        dialogOpts.action = thisButton.action;
                    //        gaeaDialog.initCrudDialog(dialogOpts);
                    //    }
                    //    /**
                    //     * 最后，处理普通dialog。
                    //     */
                    //    else if ("dialog" == linkObj.componentName) {
                    //        if (gaeaValid.isNull(linkObj.htmlId)) {
                    //            throw "没有htmlId(对于页面DIV ID)，无法创建Dialog。";
                    //        }
                    //        var dialogOption = linkObj;
                    //        // 用htmlId作为创建dialog的DIV ID。
                    //        dialogOption.id = linkObj.htmlId;
                    //
                    //        if (gaeaValid.isNotNull(dialogOption.htmlWidth)) {
                    //            dialogOption.width = dialogOption.htmlWidth;
                    //        }
                    //        if (gaeaValid.isNotNull(dialogOption.htmlHeight)) {
                    //            dialogOption.height = dialogOption.htmlHeight;
                    //        }
                    //        // 为按钮添加事件（加载内容）
                    //        $("#" + this.htmlId).click(function () {
                    //            // 打开dialog
                    //            gaeaDialog.open({
                    //                    id: dialogOption.id
                    //                }
                    //            );
                    //        });
                    //        // 创建弹出框
                    //        gaeaDialog.init(dialogOption);
                    //    }
                    //    /**
                    //     *  ------------------->>> view组件
                    //     */
                    //    else if (gaeaString.equalsIgnoreCase("view", linkObj.componentName)) {
                    //        var viewDefine = _.clone(linkObj);
                    //        // 关联父的view
                    //        viewDefine.parentId = inViews.id;
                    //        //viewDefine.button = this;
                    //        // 绑定点击事件触发打开
                    //        viewDefine.triggers = {
                    //            click: {
                    //                trgSelector: "#" + thisButton.id
                    //            }
                    //        };
                    //        gaeaView.init(viewDefine);
                    //    }
                    //}

                    //// 如果有action，需要加上通用检查
                    //if(gaeaValid.isNotNull(thisButton.action)){
                    //    $button.click(function (event) {
                    //        // validate
                    //        // 如果有绑定校验器，需要校验通过才能继续。
                    //        if (gaeaValid.isNotNull(thisButton.validators) && !$button.gaeaValidate("valid")) {
                    //            // （验证不通过）立刻中止在本元素上绑定的所有同名事件的触发！
                    //            event.stopImmediatePropagation();
                    //            return;
                    //        }
                    //    });
                    //}


                    /**
                     * [3] 处理页面自定义的接口
                     *
                     * 这个应该重构没有了 by Iverson 2017-4-18 15:48:17
                     */
                    //if (gaeaValid.isNotNull(this.interfaceAction)) {
                    //    that._createInterfaceActions(thisButton);
                    //}
                    /**
                     * [3] 触发事件框架，去寻找有没有对应的系统功能要处理之类的。
                     */
                        //toolbar.button._initAction({
                        //    button: thisButton,
                        //    dialog: refObj
                        //});
                    gaeaActions.init({
                        button: thisButton,
                        dialog: refObj
                    });

                    //// 绑定事件
                    //if (_.isFunction(thisButton.onClick)) {
                    //    $button.on("click", thisButton.onClick);
                    //}

                    // 最后初始化submitUrl
                    if (gaeaString.equalsIgnoreCase(GAEA_UI_DEFINE.UI.COMPONENT.BUTTON.DEFAULT, thisButton.componentName)) {
                        // 普通按钮
                        // 理论上，一个button不应该同时有linkViewId、submitUrl
                        _private.button.initSubmit({
                            id: thisButton.htmlId
                        });
                    }
                });
            },
            /**
             * 添加一个按钮
             * TODO 未完成。待view的返回做好一起完成。
             * @param {ServerButton} opts
             * @param {string} opts.id          toolbar的id
             * @param {string} opts.size        按钮的大小
             */
            add: function (opts) {
                gaeaValid.isNull({check: opts.id, exception: "toolbar id不允许为空！"});
                var $container = $("#" + opts.id);
                var $buttonCt = $("<span></span>");
                $container.append($buttonCt);
                // create and append button
                gaeaButton.create({
                    jqContainer: $buttonCt,
                    htmlId: opts.htmlId,
                    text: opts.text,
                    size: opts.size
                });
                // cache options
                $("#" + this.htmlId).data("gaeaOptions", opts);
            },
            button: {
                //_create: function (btnOptions) {
                //    //var html = "<span><a id='" + btnOptions.htmlId + "'" +
                //    //    " class=\"medium darkslategrey button\"" +
                //    //    "><span>" +
                //    //    btnOptions.text +
                //    //    "</span>" +
                //    //    "</a></span>";
                //    var html = '<span>' +
                //        gaeaButton.create({
                //            "htmlId": btnOptions.htmlId,
                //            "text": btnOptions.text,
                //            "size": btnOptions.size
                //        }) +
                //        '</span>';
                //    return html;
                //},
                /**
                 * 创建按钮组。
                 * TODO BUG. 这个按钮组，应该在之前重构的时候，导致不支持弹出框类的。需要修复。
                 * @param {object} opts
                 * @param {object} opts.buttonDef       按钮组定义
                 * @param {object} opts.views           views组件的定义对象
                 * @param {string} containerId          整个按钮组的容器id
                 */
                createButtonGroup: function (opts) {
                    var gaeaButton = require("gaeajs-ui-button");
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
                        var $button = $("#" + this.htmlId);

                        // cache options
                        $button.data("gaeaOptions", button);

                        /**
                         * [2] 处理button的关联组件
                         * 【 生成各种组件 】 根据action的linkId找到对应的组件并构造它
                         * 例如：
                         * “审批”按钮对应的是工作流的审批弹出框，则根据返回的json数据(views.dialogs[x].componentName:wf-dialog)，
                         * 找到关于工作流弹出框的描述信息，然后构造。
                         */
                        var refObj;
                        if (gaeaValid.isNotNull(button.linkViewId)) {
                            // 在view定义对象中，找id关联的定义
                            refObj = _.clone(gaeaUI.utils.findComponent(opts.views, button.linkViewId));
                            if (gaeaValid.isNull(refObj)) {
                                console.warn("根据linkViewId找不到对应的组件！linkViewId: %s", button.linkViewId);
                                return;
                            }
                            $button.data("gaeaOptions").linkViewObj = refObj;
                            // dialog id
                            refObj.id = refObj.htmlId;
                            // init gaea-ui-button attr
                            gaeaButton.init({
                                id: button.id,
                                //htmlId: button.htmlId,
                                //text: button.text,
                                //size: button.size,
                                //action: button.action,
                                refObject: refObj
                            });

                            // 初始化相关组件
                            _private.initRefComponent(button, opts.views, refObj);
                        }

                        //// 如果有action，需要加上通用检查
                        //if(gaeaValid.isNotNull(button.action)){
                        //    $button.click(function (event) {
                        //        // validate
                        //        // 如果有绑定校验器，需要校验通过才能继续。
                        //        if (gaeaValid.isNotNull(thisButton.validators) && !$button.gaeaValidate("valid")) {
                        //            // （验证不通过）立刻中止在本元素上绑定的所有同名事件的触发！
                        //            event.stopImmediatePropagation();
                        //            return;
                        //        }
                        //    });
                        //}
                        /**
                         * [3] 点击事件，和触发事件等。
                         * isBindOnClick为false。因为这里
                         * 这里，主要是delete等方法，初始化一些监听全局事件。
                         * 还有，添加点击事件。
                         */
                            //toolbar.button._initAction({
                            //    button: button,
                            //    //jqButton: $li,
                            //    isBindOnClick: true // 是否绑定onclick
                            //});

                        gaeaActions.init({
                            button: button,
                            dialog: refObj
                        });

                        // 最后初始化submitUrl
                        // 理论上，一个button不应该同时有linkViewId、submitUrl
                        _private.button.initSubmit({
                            id: button.htmlId
                        });
                    });
                },
                /**
                 * 删除了，重构到gaeaAction.init了 by Iverson 2017年7月28日16:59:42
                 * 初始化action操作。其实主要就是绑定按钮点击的事件。
                 * 当然，有些按钮需要多初始化一些功能，例如监听一些事件等。
                 * @param {object} opts
                 * @param {object} opts.button
                 * @param {object} opts.dialog
                 * @param {boolean} isBindOnClick 是否绑定click事件。如果是按钮的，可以为空。默认绑定。对于按钮组，这个应该为false，不绑定。
                 * @private
                 */
                //_initAction: function (opts) {
                //    var buttonDef = opts.button;
                //    var $button = $("#" + buttonDef.htmlId);
                //    /**
                //     * 对于删除按钮，需要通过监听事件进行。
                //     */
                //    if (gaeaString.equalsIgnoreCase(buttonDef.action, GAEA_UI_DEFINE.ACTION.CRUD.DELETE_SELECTED)) {
                //        // 请求真删除
                //        opts.url = URL.CRUD.DELETE;
                //        // 初始化通用删除功能（绑定点击事件等）
                //        gaeaActions.deleteSelected.init(opts);
                //    } else if (gaeaString.equalsIgnoreCase(buttonDef.action, GAEA_UI_DEFINE.ACTION.CRUD.PSEUDO_DELETE_SELECTED)) {// 和上面的DELETE_SELECTED基本一样，就是请求的接口不一样
                //        // 初始化通用删除功能（绑定点击事件等）
                //        gaeaActions.deleteSelected.init(opts);// options默认伪删除
                //    }
                //    // 由于历史是用buttonDef.action, 而新的是用buttonDef.action.name
                //    // TODO 整合buttonDef.action.name和buttonDef.action. 整合下面的if和上面的if
                //    if (_.isObject(buttonDef.action)) {
                //        if (gaeaString.equalsIgnoreCase(buttonDef.action.name, GAEA_UI_DEFINE.ACTION.CRUD_GRID.EXCEL_IMPORT)) {
                //            /**
                //             * 可编辑表格的导入
                //             */
                //            gaeaCrudGrid.action.excelImport.init({
                //                sourceId: buttonDef.id,
                //                action: buttonDef.action
                //            });
                //        } else if (gaeaString.equalsIgnoreCase(buttonDef.action.name, GAEA_UI_DEFINE.ACTION.CRUD_GRID.EXCEL_EXPORT)) {
                //            /**
                //             * 可编辑表格的导出
                //             */
                //            gaeaCrudGrid.action.excelExport.init({
                //                sourceId: buttonDef.id,
                //                action: buttonDef.action
                //            });
                //        }
                //    }
                //    /**
                //     * 按钮点击的事件
                //     * 老的方式，是通过isBindOnClick配置项控制，但会比较繁琐。
                //     * 新的都是通过直接检查回调函数即可。
                //     * TODO 这个后面全部重构为基于onClick
                //     */
                //    if ((gaeaValid.isNull(opts.isBindOnClick) || opts.isBindOnClick) && !_.isFunction(buttonDef.onClick)) {
                //        $button.click(function () {
                //            // validate
                //            // 如果有绑定校验器，需要校验通过才能继续。
                //            if (gaeaValid.isNotNull(opts.button.validators) && !$button.gaeaValidate("valid")) {
                //                return;
                //            }
                //            /**
                //             * 创建按钮点击的对应处理。并执行。
                //             */
                //            opts.id = buttonDef.htmlId;
                //            opts.action = buttonDef.action;
                //
                //            //var buttonDef = opts.button;
                //            //var $button = $("#" + buttonDef.htmlId);
                //            if (gaeaString.equalsIgnoreCase(buttonDef.action, GAEA_UI_DEFINE.ACTION.CRUD.UPDATE)) {
                //                // 定义grid id，方便获取selected row的数据（编辑）。
                //                opts.gridId = GAEA_UI_DEFINE.UI.GRID.GAEA_GRID_DEFAULT_ID;
                //                gaeaActions.crudDialog.update.do(opts);
                //
                //            } else if (gaeaString.equalsIgnoreCase(buttonDef.action, GAEA_UI_DEFINE.ACTION.CRUD.ADD)) {
                //                // 定义grid id，方便获取selected row的数据（编辑）。
                //                opts.gridId = GAEA_UI_DEFINE.UI.GRID.GAEA_GRID_DEFAULT_ID;
                //                gaeaActions.crudDialog.add.do(opts);
                //
                //            } else if (gaeaString.equalsIgnoreCase(buttonDef.action, GAEA_UI_DEFINE.ACTION.CRUD.DELETE_SELECTED)) {
                //                gaeaActions.deleteSelected.doRealDelete(opts);
                //            } else if (gaeaString.equalsIgnoreCase(buttonDef.action, GAEA_UI_DEFINE.ACTION.CRUD.PSEUDO_DELETE_SELECTED)) {// 和上面的DELETE_SELECTED基本一样，就是请求的接口不一样
                //                gaeaActions.deleteSelected.doPseudoDelete(opts);
                //            }
                //            /**
                //             * action和actions应该两者只有一个。
                //             * actions是更深入的action的定义。并且，设计上希望一个button能执行多个action（未实现）
                //             */
                //            if (gaeaValid.isNotNull(buttonDef.actions)) {
                //                var data = _private.getSubmitData();
                //                data.buttonId = buttonDef.id;
                //                data.actionName = buttonDef.action;
                //                if (buttonDef.actions.length > 1) {
                //                    gaeaNotify.error("当前不支持一个按钮绑定多个action！请联系系统管理员检查。");
                //                    return;
                //                }
                //                /**
                //                 * 暂时只支持绑定一个action。
                //                 */
                //                gaeaActions.doAction({
                //                    button: buttonDef,
                //                    data: data
                //                });
                //            }
                //
                //            /**
                //             * 通用action的处理。即action有值。
                //             * （TODO 上面的DELETE、ADD DIALOG等应该都放在这里，但历史遗留问题，后面慢慢重构吧）
                //             */
                //            if (gaeaValid.isNotNull(buttonDef.action) && gaeaString.equalsIgnoreCase(buttonDef.action, GAEA_UI_DEFINE.ACTION.EXPORT_EXCEL)) {
                //                var data = _private.getSubmitData();
                //                data.buttonId = buttonDef.id;
                //                data.actionName = buttonDef.action;
                //                /**
                //                 * 普通action的处理（没有button-action子项）
                //                 * 【重要】
                //                 * TODO 暂时限定export excel走这个方法。因为其他的还没改过来。
                //                 */
                //                gaeaActions.doSimpleAction({
                //                    button: buttonDef,
                //                    data: data
                //                });
                //            }
                //        });
                //    }
                //}
            }
        };

        var _private = {
            button: {
                /**
                 * 初始化按钮本身的提交功能。（submitUrl和msg等）
                 * 【重要】要求button已经初始化，并且已经缓存在data了！
                 * @param {object} opts
                 * @param {object} opts.id          button id
                 */
                initSubmit: function (opts) {
                    if (gaeaValid.isNull(opts.id)) {
                        throw "id为空，无法初始化按钮submit功能！";
                    }
                    var $button = $("#" + opts.id);
                    /**
                     * @type ButtonGaeaOptions
                     */
                    var gaeaOptions = $button.data("gaeaOptions");
                    var submitUrl = gaeaOptions.submitUrl;
                    var msg = gaeaValid.isNull(gaeaOptions.msg) ? "" : gaeaOptions.msg;
                    if (gaeaValid.isNotNull(submitUrl)) {
                        /**
                         * 添加点击事件
                         */
                        GAEA_EVENTS.registerListener("click", "#" + opts.id, function (event, ui) {
                            // validate
                            // 如果有绑定校验器，需要校验通过才能继续。
                            //if (gaeaValid.isNotNull(gaeaOptions.validators) && !$button.gaeaValidate("valid")) {
                            //    return;
                            //}

                            $.when($button.gaeaValidate("valid")).done(function () {

                                // 校验通过再执行

                                var selectedRows = gaeaContext.getValue(GAEA_UI_DEFINE.UI.GAEA_CONTEXT.CACHE_KEY.SELECTED_ROWS, GAEA_UI_DEFINE.UI.GRID.GAEA_GRID_DEFAULT_ID);
                                // 把数据处理一下。否则以Spring MVC接受jQuery的请求格式，对不上会抛异常。特别是数组、对象类的（带了[id]）。
                                var newRow = gaeaUtils.data.flattenData({
                                    selectedRows: selectedRows
                                });
                                // 提交
                                gaeaAjax.post({
                                    url: submitUrl,
                                    data: newRow,
                                    success: function (data) {
                                        //var respObj = {};
                                        //if (gaeaValid.isNotNull(data.responseText)) {
                                        //    respObj = JSON.parse(data.responseText);
                                        //} else if(_.isObject(data)){
                                        //    respObj = data;
                                        //}
                                        // 处理请求返回结果, 包括成功和失败
                                        gaeaUtils.processResponse(data, {
                                            success: {
                                                baseMsg: "操作成功！"
                                            }
                                        });
                                        // 刷新grid数据
                                        $("#" + GAEA_UI_DEFINE.UI.GRID.GAEA_GRID_DEFAULT_ID).trigger(GAEA_EVENTS.DEFINE.UI.GRID.RELOAD);
                                    },
                                    fail: function (data) {
                                        // 处理请求返回结果, 包括成功和失败
                                        gaeaUtils.processResponse(data);
                                    }
                                });
                            });
                        });
                    }
                }
                /**
                 *
                 * @param opts
                 *                  button schema的button定义。其中应该也包含了buttonAction，但还是单独吧。
                 *                  buttonAction 某个button的某个action
                 *                  data 要POST到后台的数据. 应该必须有schemaId。
                 */
                //doAction: function (opts) {
                //    var button = opts.button;
                //    var buttonAction = button.actions[0];// 暂时只支持绑定一个action
                //    var data = opts.data;
                //    data.method = buttonAction.method; // 赋予"method"属性和值. Action必须!
                //    /**
                //     * 如果是获取文件的action，例如导出，不能用ajax。必须用submit才行。
                //     */
                //    //$("<form action='" + SYS_URL.ACTION.DO_ACTION + "' method='post'><input type='hidden' name='method' value='" + data.method + "'><input type='hidden' name='schemaId' value='" + data.schemaId + "'><input type='hidden' name='buttonId' value='" + button.id + "'></form>").submit();
                //    if (gaeaString.equalsIgnoreCase(button.submitType, GAEA_UI_DEFINE.ACTION.SUBMIT_TYPE.FORM_SUBMIT)) {
                //        var submitFormHtml = '' +
                //            '<form action="<%= ACTION %>" method="post">' +
                //            '<input type="hidden" name="method" value="<%= METHOD %>">' +
                //            '<input type="hidden" name="schemaId" value="<%= SCHEMA_ID %>">' +
                //            '<input type="hidden" name="buttonId" value="<%= BUTTON_ID %>">' +
                //            '</form>';
                //        var formHtmlTemplate = _.template(submitFormHtml);
                //        var jqHtmlSelector = formHtmlTemplate({
                //            ACTION: SYS_URL.ACTION.DO_ACTION,
                //            METHOD: data.method,
                //            SCHEMA_ID: data.schemaId,
                //            BUTTON_ID: button.id
                //        });
                //        $(jqHtmlSelector).submit();
                //    } else {
                //        gaeaAjax.post({
                //            url: SYS_URL.ACTION.DO_ACTION,
                //            data: data,
                //            success: function (data) {
                //                gaeaNotify.message(button.msg + "操作成功。");
                //                // 刷新grid数据
                //                $("#" + GAEA_UI_DEFINE.UI.GRID.GAEA_GRID_DEFAULT_ID).trigger(GAEA_EVENTS.DEFINE.UI.GRID.RELOAD);
                //            },
                //            fail: function (data) {
                //                gaeaNotify.error(button.msg + "操作失败！");
                //            }
                //        });
                //    }
                //
                //
                //    // 提交
                //    //gaeaAjax.post({
                //    //    url: SYS_URL.ACTION.DO_ACTION,
                //    //    data: data,
                //    //    success: function (data) {
                //    //        gaeaNotify.message(button.msg + "操作成功。");
                //    //        // 刷新grid数据
                //    //        $("#" + GAEA_UI_DEFINE.UI.GRID.GAEA_GRID_DEFAULT_ID).trigger(GAEA_EVENTS.DEFINE.UI.GRID.RELOAD);
                //    //    },
                //    //    fail: function (data) {
                //    //        gaeaNotify.error(button.msg + "操作失败！");
                //    //    }
                //    //});
                //},
                /**
                 * 和doAction大同小异。但这个，一方面提交处理的url不是同一个。另外，一些细节的东西，例如method，是没有的。
                 * @param opts
                 */
                //doSimpleAction: function (opts) {
                //    var button = opts.button;
                //    var data = opts.data;
                //    //data.method = buttonAction.method; // 赋予"method"属性和值. Action必须!
                //    /**
                //     * 如果是获取文件的action，例如导出，不能用ajax。必须用submit才行。
                //     */
                //    if (gaeaString.equalsIgnoreCase(button.submitType, GAEA_UI_DEFINE.ACTION.SUBMIT_TYPE.FORM_SUBMIT)) {
                //        // 构建一个临时的form，来用于提交。
                //        var submitFormHtml = '' +
                //            '<form action="<%= ACTION %>" method="post">' +
                //            '<input type="hidden" name="actionName" value="<%= ACTION_NAME %>">' +
                //            '<input type="hidden" name="schemaId" value="<%= SCHEMA_ID %>">' +
                //            '<input type="hidden" name="buttonId" value="<%= BUTTON_ID %>">' +
                //            '</form>';
                //        var formHtmlTemplate = _.template(submitFormHtml);
                //        var jqHtmlSelector = formHtmlTemplate({
                //            ACTION: SYS_URL.ACTION.DO_SIMPLE_ACTION,
                //            ACTION_NAME: data.actionName,
                //            SCHEMA_ID: data.schemaId,
                //            BUTTON_ID: button.id
                //        });
                //        // 提交form
                //        $(jqHtmlSelector).submit();
                //    } else {
                //        /**
                //         * 走ajax提交路线。
                //         */
                //        gaeaAjax.post({
                //            url: SYS_URL.ACTION.DO_SIMPLE_ACTION,
                //            data: data,
                //            success: function (data) {
                //                gaeaNotify.message(button.msg + "操作成功。");
                //                // 刷新grid数据
                //                $("#" + GAEA_UI_DEFINE.UI.GRID.GAEA_GRID_DEFAULT_ID).trigger(GAEA_EVENTS.DEFINE.UI.GRID.RELOAD);
                //            },
                //            fail: function (data) {
                //                gaeaNotify.error(button.msg + "操作失败！");
                //            }
                //        });
                //    }
                //    //$("<form action='" + SYS_URL.ACTION.DO_ACTION + "' method='post'><input type='hidden' name='method' value='" + data.method + "'><input type='hidden' name='schemaId' value='" + data.schemaId + "'><input type='hidden' name='buttonId' value='" + button.id + "'></form>").submit();
                //}
            },
            /**
             * refactor to gaeaAction.getSubmitData by Iverson 2017年7月28日17:21:28
             * @param opts
             *              rowParamName row作为data的属性的名。即 data.paramName=row. 空即data=row.
             * @returns data
             */
            //getSubmitData: function (opts) {
            //    var data = {};
            //    var row = gaeaGrid.getSelected();
            //    // 获取页面的SCHEMA ID
            //    //var schemaId = gaeaView.list.getSchemaId();
            //    var schemaId = $("#urSchemaId").val();
            //    data.schemaId = schemaId;
            //    // 获取页面快捷查询的条件
            //    var queryConditions = gaeaGrid.query.getQueryConditions({
            //        id: GAEA_UI_DEFINE.UI.GRID.GAEA_GRID_DEFAULT_ID
            //    });
            //    // 把数据处理一下。否则以Spring MVC接受jQuery的请求格式，对不上会抛异常。特别是数组、对象类的（带了[id]）。
            //    var newRow = gaeaUtils.data.flattenData(row);
            //    if (gaeaValid.isNotNull(opts) && gaeaValid.isNotNull(opts.rowParamName)) {
            //        /**
            //         * row的数据作为data的一个属性值
            //         */
            //        var rowParamName = opts.rowParamName;
            //        data[rowParamName] = newRow;
            //    } else {
            //        /**
            //         * 需要把row值合并到data
            //         */
            //        data = _.extend(data, newRow);
            //        data = _.extend(data, queryConditions);
            //    }
            //    return data;
            //},
            /**
             * 初始化按钮关联的对象。
             * 这个主要针对按钮的linkViewId不为空的情况。可能关联了各种弹出框、view视图。
             * @param buttonDef
             * @param viewDef
             * @param refObj
             */
            initRefComponent: function (buttonDef, viewDef, refObj) {
                var gaeaDialog = require("gaeajs-ui-dialog");
                var gaeaView = require("gaeajs-ui-view");
                var $button = $("#" + buttonDef.htmlId);
                //if (gaeaValid.isNotNull(buttonDef.linkViewId)) {
                //    //var linkObj = gaeaDialog.findDialog(inViews, this.linkViewId);
                //    var refObj = gaeaUI.utils.findComponent(viewDef, buttonDef.linkViewId);
                //    if (gaeaValid.isNull(refObj)) {
                //        console.warn("根据linkViewId找不到对应的组件！linkViewId: %s", buttonDef.linkViewId);
                //        return;
                //    }
                // refObj = dialog options
                //var dialogOpts = _.clone(refObj);
                //// cache link object
                //if (gaeaValid.isNotNull(refObj)) {
                //    $button.data("gaeaOptions").linkViewObj = dialogOpts;
                //}
                //// dialog id
                //dialogOpts.id = refObj.htmlId;

                if ("wf-dialog" == refObj.componentName) {
                    //dialogDef = linkObj;
                    gaeaWF.dialog.create(refObj, buttonDef);
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
                else if (gaeaString.equalsIgnoreCase("uploader-dialog", refObj.componentName)) {
                    // 不要直接初始化组件。通过gaeaButton初始化（前提需要初始化好html）
                    var gaeaButton = require("gaeajs-ui-button");
                    gaeaButton.initGaeaButton({
                        id: buttonDef.id
                    });
                }
                /**
                 * 处理增删改dialog。
                 */
                else if ("crud-dialog" == refObj.componentName) {
                    // toolbar button id
                    refObj.buttonId = buttonDef.htmlId;
                    refObj.action = buttonDef.action;
                    // 对于只查看的弹出框，没有action，但需要数据加载
                    if (gaeaValid.isNotNull(refObj.loadDataUrl)) {
                        refObj.initComponentData = true;
                    }
                    gaeaDialog.initCrudDialog(refObj);
                }
                /**
                 * 最后，处理普通dialog。
                 */
                else if ("dialog" == refObj.componentName) {
                    if (gaeaValid.isNull(refObj.htmlId)) {
                        throw "没有htmlId(对于页面DIV ID)，无法创建Dialog。";
                    }
                    var dialogOption = refObj;
                    // 用htmlId作为创建dialog的DIV ID。
                    dialogOption.id = refObj.htmlId;

                    if (gaeaValid.isNotNull(dialogOption.htmlWidth)) {
                        dialogOption.width = dialogOption.htmlWidth;
                    }
                    if (gaeaValid.isNotNull(dialogOption.htmlHeight)) {
                        dialogOption.height = dialogOption.htmlHeight;
                    }
                    // 为按钮添加事件（加载内容）
                    $("#" + buttonDef.htmlId).click(function () {
                        // 打开dialog
                        gaeaDialog.open({
                                id: dialogOption.id
                            }
                        );
                    });
                    // 创建弹出框
                    gaeaDialog.init(dialogOption);
                }
                /**
                 *  ------------------->>> view组件
                 */
                else if (gaeaString.equalsIgnoreCase("view", refObj.componentName)) {
                    var viewDefine = _.clone(refObj);
                    // 关联父的view
                    viewDefine.parentId = viewDef.id;
                    //viewDefine.button = this;
                    // 绑定点击事件触发打开
                    viewDefine.triggers = {
                        click: {
                            trgSelector: "#" + buttonDef.id
                        }
                    };
                    gaeaView.init(viewDefine);
                }
                //}
            }
            /**
             * 创建按钮点击时的处理方法。
             * 因为这个方法，普通按钮和按钮组要共用。所以重构，从_initAction中重构过来，整合了按钮组的功能和原来按钮的功能于一体。
             * @param opts
             * @returns {*}
             */
            //createOnClickFunc: function (opts) {
            //    var clickFunction;
            //    var buttonDef = opts.button;
            //    var $button = $("#" + buttonDef.htmlId);
            //    //var opts = {
            //    //    button: buttonDef,
            //    //    dialog: dialogDef,
            //    //    selectedRow: row
            //    //};
            //    // TODO 下面这个应该移到gaeajs-action会更好吧？
            //    if (gaeaString.equalsIgnoreCase(buttonDef.action, GAEA_UI_DEFINE.ACTION.CRUD.UPDATE)) {
            //        // 初始化绑定事件
            //        //gaeaCommonCRUD.init(options);
            //        // 点击触发事件
            //        clickFunction = function () {
            //            var row = gaeaGrid.getSelected();
            //            opts.selectedRow = row;
            //            $button.trigger(GAEA_EVENTS.DEFINE.UI.DIALOG.CRUD_UPDATE_OPEN, opts);
            //        };
            //    } else if (gaeaString.equalsIgnoreCase(buttonDef.action, GAEA_UI_DEFINE.ACTION.CRUD.ADD)) {
            //        // 点击触发事件
            //        clickFunction = function () {
            //            $button.trigger(GAEA_EVENTS.DEFINE.UI.DIALOG.CRUD_ADD_OPEN, opts);
            //        };
            //    } else if (gaeaString.equalsIgnoreCase(buttonDef.action, GAEA_UI_DEFINE.ACTION.CRUD.DELETE_SELECTED)) {
            //        //// 请求真删除
            //        //opts.url = URL.CRUD.DELETE;
            //        //// 初始化通用删除功能（绑定点击事件等）
            //        //gaeaActions.deleteSelected.init(opts);
            //        // 点击触发事件
            //        clickFunction = function () {
            //            // 弹框。确认删除？
            //            gaeaDialog.confirmDialog({
            //                title: GAEA_UI_DEFINE.TEXT.UI.DIALOG.DELETE_CONFIRM_TITLE,
            //                content: GAEA_UI_DEFINE.TEXT.UI.DIALOG.DELETE_CONFIRM_CONTENT
            //            }, function () {
            //                var row = gaeaGrid.getSelected();
            //                $button.trigger(GAEA_EVENTS.DEFINE.ACTION.DELETE_SELECTED, {
            //                    selectedRow: row
            //                });
            //            });
            //        };
            //    } else if (gaeaString.equalsIgnoreCase(buttonDef.action, GAEA_UI_DEFINE.ACTION.CRUD.PSEUDO_DELETE_SELECTED)) {// 和上面的DELETE_SELECTED基本一样，就是请求的接口不一样
            //        //// 初始化通用删除功能（绑定点击事件等）
            //        //gaeaActions.deleteSelected.init(opts);// options默认伪删除
            //        // 点击触发事件
            //        clickFunction = function () {
            //            // 弹框。确认删除？
            //            gaeaDialog.confirmDialog({
            //                title: GAEA_UI_DEFINE.TEXT.UI.DIALOG.DELETE_CONFIRM_TITLE,
            //                content: GAEA_UI_DEFINE.TEXT.UI.DIALOG.DELETE_CONFIRM_CONTENT
            //            }, function () {
            //                var row = gaeaGrid.getSelected();
            //                $button.trigger(GAEA_EVENTS.DEFINE.ACTION.DELETE_SELECTED, {
            //                    selectedRow: row
            //                });
            //            });
            //        };
            //    } else if (gaeaValid.isNotNull(buttonDef.actions)) {
            //        var data = _private.getSubmitData();
            //        data.buttonId = buttonDef.id;
            //        data.actionName = buttonDef.action;
            //        if (buttonDef.actions.length > 1) {
            //            gaeaNotify.error("当前不支持一个按钮绑定多个action！请联系系统管理员检查。");
            //            return;
            //        }
            //        /**
            //         * 暂时只支持绑定一个action。
            //         */
            //        _private.button.doAction({
            //            button: buttonDef,
            //            //buttonAction: buttonDef.actions[0],
            //            data: data
            //        });
            //        //});
            //    } else if (gaeaValid.isNotNull(buttonDef.action) && gaeaString.equalsIgnoreCase(buttonDef.action, GAEA_UI_DEFINE.ACTION.EXPORT_EXCEL)) {
            //        var data = _private.getSubmitData();
            //        data.buttonId = buttonDef.id;
            //        data.actionName = buttonDef.action;
            //        /**
            //         * 普通action的处理（没有button-action子项）
            //         * 【重要】
            //         * TODO 暂时限定export excel走这个方法。因为其他的还没改过来。
            //         */
            //        _private.button.doSimpleAction({
            //            button: buttonDef,
            //            data: data
            //        });
            //    }
            //    return clickFunction;
            //}
        };
        /**
         * 返回（暴露）的接口
         */
        return toolbar;
    });