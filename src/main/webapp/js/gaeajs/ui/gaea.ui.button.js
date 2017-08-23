/**
 * 基于RequireJS的模块化重构。让依赖更清晰，更简单。
 * Created by iverson on 2016-2-17 11:48:52.
 */

/**
 * 这个是HTML页面直接定义的Button类。
 * 即data-gaea-ui-button的定义。
 * @typedef {object} UiButton
 * @property {string} id                        button id
 * @property {string} newId                     看action的配置。如果是新弹出框，则这个值就是新弹出框的id。
 * @property {string} action                    按钮的操作code。
 * @property {string} submitAction              按钮如果是新开一个弹框，新弹框点击确认的操作code。
 * @property {string} writeBack                 按字段名回写的具体配置项. writeback_by_field需要。
 * @property {string} contentUrl                按钮如果是新开一个弹框，新弹框内容的加载地址。
 * @property {string} submitUrl                 按钮如果是新开一个弹框，新弹框的提交地址
 * @property {string} openStyle                 打开方式。new：新弹出一个 inOne：在当前parentId内打开（不弹出）
 * @property {boolean} multiple                 uploader有用。是否多选。默认false。
 * @property {boolean} keepFailed            uploader有用。是否缓存已选过的。
 * @property {string} refInputId                关联的父级dialog的输入框id
 * @property {string} schemaId                  xml schema id
 * @property {object} onComplete
 * @property {object} onComplete.trigger        触发的定义
 * @property {string} onComplete.trigger.target 触发对象
 * @property {string} onComplete.trigger.event  触发对象的事件
 */
define([
        "jquery", "underscore", 'gaeajs-common-utils-ajax', 'gaeajs-common-utils-validate',
        'gaeajs-ui-definition', "gaeajs-common-utils-string", "gaeajs-ui-events", 'gaeajs-ui-dialog',
        'gaeajs-common-utils'],
    function ($, _, gaeaAjax, gaeaValid,
              GAEA_UI_DEFINE, gaeaString, GAEA_EVENTS, gaeaDialog,
              gaeaCommonUtils) {
        var button = {
            /**
             * 创建个按钮的html。简单的HTML拼凑而已。
             * @param {object} btnOptions
             * @param {object} btnOptions.jqContainer       容器jq对象。可以为空。非空时，生成的按钮html append在这个容器最后。
             * @param {object} btnOptions.htmlId            html id
             * @param {object} btnOptions.text              按钮的文本
             * @param {object} btnOptions.size              要生成大按钮，还是小按钮。默认medium. value: small |
             */
            create: function (btnOptions) {
                var buttonHtml = "";
                if (gaeaValid.isNotNull(btnOptions.size) && "small" == btnOptions.size) {
                    html = "<a id='" + btnOptions.htmlId + "'" +
                        " class=\"small darkslategrey gaea-ui-button\">" +
                        "<span>" +
                        btnOptions.text +
                        "</span>" +
                        "</a>";
                } else {
                    html = "<a id='" + btnOptions.htmlId + "'" +
                        " class=\"medium darkslategrey gaea-ui-button\">" +
                        "<span>" +
                        btnOptions.text +
                        "</span>" +
                        "</a>";
                }
                // 放入容器
                if (gaeaValid.isNotNull(btnOptions.jqContainer)) {
                    btnOptions.jqContainer.append(html);
                }
                return html;
            },
            /**
             * 参考html配置：
             * <p>
             *      data-gaea-ui-button="newId:'classCrudDialog3', action:'new_dialog', openStyle:'inOne', submitAction:'writeback_in_one',refInputId:'test', contentUrl:'/gaea/demo/class-crud-form-3' "
             * </p>
             * @param {object} opts
             * @param {string} opts.id                      button id
             * @param {string} opts.parentCtSelector        父级容器的jq选择器
             */
            initGaeaButton: function (opts) {
                if (gaeaValid.isNull(opts.id)) {
                    throw "缺少id配置，无法初始化gaea的按钮。";
                }
                var $button = $("#" + opts.id);
                var strButtonDef = $button.data(GAEA_UI_DEFINE.UI.BUTTON.DEFINE);
                var $parentContainer = $(opts.parentCtSelector);
                var parentDialogId;
                if ($parentContainer.length > 0) {
                    parentDialogId = $parentContainer.attr("id");
                }
                /**
                 * 把HTML元素配置，转换成对象. 参考：
                 * data-gaea-ui-button="action:'new_dialog', submit-action='writeback_in_one', content-url='/gaea/demo/class-crud-form' "
                 * 配置项：
                 * @type {UiButton}
                 */
                var buttonDef = gaeaString.parseJSON(strButtonDef);
                buttonDef.id = opts.id;
                buttonDef.parentDialogId = parentDialogId;
                if (gaeaString.equalsIgnoreCase(GAEA_UI_DEFINE.UI.BUTTON.ACTION.NEW_DIALOG, buttonDef.action)) {
                    /**
                     * 弹出新窗口的按钮初始化
                     */
                    if (gaeaValid.isNull(buttonDef.contentUrl)) {
                        throw "action=new_dialog, 内容加载的url的配置项（contentUrl）不允许为空！";
                    }
                    if (gaeaValid.isNull(buttonDef.submitAction)) {
                        throw "action=new_dialog, 新弹出框提交方式的配置项（submitAction）不允许为空！";
                    }
                    newDialogButton.init(buttonDef);
                } else if (gaeaString.equalsIgnoreCase(GAEA_UI_DEFINE.UI.BUTTON.ACTION.DATA_FILTER_DIALOG, buttonDef.action)) {
                    /**
                     * 弹出数据查询选择窗口的按钮初始化
                     */
                    dataFilterDialogButton.init(buttonDef);
                } else if (gaeaString.equalsIgnoreCase(GAEA_UI_DEFINE.UI.BUTTON.ACTION.UPLOADER_DIALOG, buttonDef.action)) {
                    /**
                     * 文件上传
                     */
                    uploaderButton.init(buttonDef);
                }
            }
        };

        /**
         * 点击后是弹出框的按钮。针对action=new_dialog
         */
        var newDialogButton = {
            /**
             *
             * @param {object} opts
             * @param {string} opts.id                              button id
             * @param {string} opts.newId                           看action的配置。如果是新弹出框，则这个值就是新弹出框的id。
             * @param {string} opts.parentDialogId
             * @param {string} opts.openStyle
             * @param {string} opts.submitAction                    新的弹出框的提交方式。是直接提交到后台，还是只是回写到parent dialog的某个值中
             * @param {string} opts.submitUrl
             * @param {string} opts.writeBack                       按字段名回写的具体配置项. writeback_by_field需要。
             * @param {string} opts.contentUrl
             * @param {string} opts.refInputId                      关联的父级dialog的输入框id
             */
            init: function (opts) {
                //var buttonId = opts.id;
                ////var $button = $("#" + opts.id);
                //// 如果是dialog，用的是parentId
                //opts.parentId = opts.parentDialogId;
                //// 设定新弹出框的id和name
                //var autoGenId = opts.id + "_dialog";
                //var newDialogId = gaeaValid.isNull(opts.newId) ? autoGenId : opts.newId;
                //
                //// 初始化html。为了动画，先构造内容框架。
                //// 这里初始化的，是按钮对应的新弹出框的容器。所以，opts.id得改为新弹出框的id才行哦。
                //var newOpts = _.extend(opts, {id: newDialogId});
                //gaeaDialog.preInitHtml(newOpts);
                //// 则在最终调用gaeaDialog.init的时候，就不需要再初始化一次了
                //opts.initHtml = false;
                //
                //GAEA_EVENTS.registerListener("click", "#" + buttonId, function () {
                //    //gaeaDialog.initCrudDialog();
                //    gaeaDialog.init(opts);
                //});


                _private.newDialog.commonInit(opts);
            }
        };

        var dataFilterDialogButton = {
            /**
             *
             * @param {object} opts
             * @param {string} opts.id                              button id
             * @param {string} opts.schemaId                        xml schema id
             * @param {string} opts.newId                           看action的配置。如果是新弹出框，则这个值就是新弹出框的id。
             * @param {string} opts.parentDialogId
             * @param {string} opts.openStyle
             * @param {string} opts.submitAction                    新的弹出框的提交方式。是直接提交到后台，还是只是回写到parent dialog的某个值中
             * @param {string} opts.submitUrl
             * @param {string} opts.writeBack                       按字段名回写的具体配置项. writeback_by_field需要。
             * @param {string} opts.contentUrl
             * @param {string} opts.refInputId                      关联的父级dialog的输入框id
             */
            init: function (opts) {
                if (gaeaValid.isNull(opts.schemaId)) {
                    throw "action=data_filter_dialog, schema id的配置项不允许为空！";
                }
                opts.component = GAEA_UI_DEFINE.UI.COMPONENT.DIALOG.DATA_FILTER_DIALOG;
                // 不需要初始化dialog里面的form（这不是增删改dialog）
                opts.initHtml = false;
                _private.newDialog.commonInit(opts);
            }
        };

        // 打开文件上传的按钮
        var uploaderButton = {
            /**
             * 初始化按钮，点击打开上传组件。
             * @param {UiButton} opts
             */
            init: function (opts) {
                var gaeaUploader = require("gaeajs-uploader");
                gaeaValid.isNull({check: opts.newId, exception: "如果需要配置打开上传文件弹出框，newId不允许为空！"});
                // 找当前按钮所在弹框的最外层dialog（避免是嵌套式的dialog）
                var $thisButton = $("#" + opts.id);
                var $rootDialog = $("#" + opts.id).parents("[data-gaea-ui-dialog]").filter(":last");
                var $myForm = $("#" + opts.id).parents("form").filter(":first");
                var pageId = "";
                var postData = {};
                // 带上pageId
                if (gaeaValid.isNotNull($rootDialog)) {
                    var dialogGaeaOpts = $rootDialog.data("gaeaOptions");
                    postData.pageId = dialogGaeaOpts["pageId"];
                }

                // 初始化按钮上的事件, 例如什么onComplete等
                GAEA_EVENTS.initGaeaEvent(opts);

                // 初始化uploader的onComplete事件（如果有的话）
                // 在upload完成时，触发按钮的onComplete事件，按钮再触发onComplete里面的target的event
                var onComplete;
                if (gaeaValid.isNotNull(opts.onComplete)) {
                    onComplete = function () {
                        $thisButton.trigger(GAEA_EVENTS.DEFINE.CALLBACK.ON_COMPLETE);
                    };
                }

                gaeaUploader.init({
                    dialog: {
                        id: opts.newId
                    },
                    button: {
                        id: opts.id
                    },
                    submitUrl: opts.submitUrl,
                    multiple: opts.multiple,
                    keepFailed: opts.keepFailed,
                    data: gaeaCommonUtils.data.flattenData(postData),
                    /* 获取数据的回调。在点击上传的时候。 */
                    getUploadDataFunc: function () {
                        var $myForm = $("#" + opts.id).parents("form").filter(":first");
                        // 带上最近一个form的数据
                        if ($myForm.length > 0) {
                            postData = $myForm.serializeObject();
                            return postData;
                        }
                        return {};
                    },
                    onComplete: onComplete
                });
            }
        };

        var _private = {
            newDialog: {
                /**
                 * copy from newDialogButton.
                 * 一般关联dialog的button，都有一些通用的行为，例如：如果嵌入式dialog，都需要先做容器初始化，都是点击按钮触发，都是调用dialog组件的init等。
                 * 所以把通用的部分放在一起。
                 * @param {object} opts
                 * @param {string} opts.id                              button id
                 * @param {string} opts.newId                           看action的配置。如果是新弹出框，则这个值就是新弹出框的id。
                 * @param {string} opts.parentDialogId
                 * @param {string} opts.openStyle
                 * @param {string} opts.submitAction                    新的弹出框的提交方式。是直接提交到后台，还是只是回写到parent dialog的某个值中
                 * @param {string} opts.submitUrl
                 * @param {string} opts.writeBack                       按字段名回写的具体配置项. writeback_by_field需要。
                 * @param {string} opts.contentUrl
                 * @param {string} opts.refInputId                      关联的父级dialog的输入框id
                 * @param {string} opts.schemaId                        xml schema id
                 */
                commonInit: function (opts) {
                    var buttonId = opts.id;
                    //var $button = $("#" + opts.id);
                    // 如果是dialog，用的是parentId
                    opts.parentId = opts.parentDialogId;
                    // 设定新弹出框的id和name
                    var autoGenId = opts.id + "_dialog";
                    var newDialogId = gaeaValid.isNull(opts.newId) ? autoGenId : opts.newId;

                    // 初始化html。为了动画，先构造内容框架。
                    // 这里初始化的，是按钮对应的新弹出框的容器。所以，opts.id得改为新弹出框的id才行哦。
                    var newOpts = _.extend(opts, {id: newDialogId});
                    gaeaDialog.preInitHtml(newOpts);
                    // 则在最终调用gaeaDialog.init的时候，就不需要再初始化一次了
                    opts.initHtml = false;

                    GAEA_EVENTS.registerListener("click", "#" + buttonId, function () {
                        //opts.component = GAEA_UI_DEFINE.UI.COMPONENT.DIALOG.DATA_FILTER_DIALOG;
                        gaeaDialog.init(opts);
                    });
                }
            }
        };
        /**
         * 返回（暴露）的接口
         */
        return button;
    });