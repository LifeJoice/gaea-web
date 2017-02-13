/**
 * 基于RequireJS的模块化重构。让依赖更清晰，更简单。
 * Created by iverson on 2016-2-17 11:48:52.
 */
define([
        "jquery", "underscore", 'gaeajs-common-utils-ajax', 'gaeajs-common-utils-validate',
        'gaeajs-ui-definition', "gaeajs-common-utils-string", "gaeajs-ui-events", 'gaeajs-ui-dialog'],
    function ($, _, gaeaAjax, gaeaValid,
              GAEA_UI_DEFINE, gaeaString, GAEA_EVENTS, gaeaDialog) {
        var button = {
            /**
             * 创建个按钮的html。简单的HTML拼凑而已。
             * btnOptions
             * @param btnOptions
             *              size    要生成大按钮，还是小按钮。默认medium. value: small |
             */
            create: function (btnOptions) {
                var buttonHtml = "";
                if (gaeaValid.isNotNull(btnOptions.size) && "small" == btnOptions.size) {
                    html = "<a id='" + btnOptions.htmlId + "'" +
                        " class=\"small darkslategrey button\">" +
                        "<span>" +
                        btnOptions.text +
                        "</span>" +
                        "</a>";
                } else {
                    html = "<a id='" + btnOptions.htmlId + "'" +
                        " class=\"medium darkslategrey button\">" +
                        "<span>" +
                        btnOptions.text +
                        "</span>" +
                        "</a>";
                }
                return html;
            },
            /**
             * 参考html配置：
             * <p>
             *      data-gaea-ui-button="newId:'classCrudDialog3', action:'new_dialog', openStyle:'inOne', submitAction:'writeback_in_one',refInputId:'test', contentUrl:'/gaea/demo/class-crud-form-3' "
             * </p>
             * @param {object} opts
             * @param {string} opts.id
             * @param {string} opts.parentDialogId
             */
            initGaeaButton: function (opts) {
                if (gaeaValid.isNull(opts.id)) {
                    throw "缺少id配置，无法初始化gaea的按钮。";
                }
                var $button = $("#" + opts.id);
                var strButtonDef = $button.data(GAEA_UI_DEFINE.UI.BUTTON.DEFINE);
                /**
                 * 把HTML元素配置，转换成对象. 参考：
                 * data-gaea-ui-button="action:'new_dialog', submit-action='writeback_in_one', content-url='/gaea/demo/class-crud-form' "
                 * 配置项：
                 * newId                    看action的配置。如果是新弹出框，则这个值就是新弹出框的id。
                 * action                   按钮的操作code。
                 * submitAction             按钮如果是新开一个弹框，新弹框点击确认的操作code。
                 * writeBack                按字段名回写的具体配置项. writeback_by_field需要。
                 * contentUrl               按钮如果是新开一个弹框，新弹框内容的加载地址。
                 * openStyle                打开方式。new：新弹出一个 inOne：在当前parentId内打开（不弹出）
                 * refInputId               关联的父级dialog的输入框id
                 */
                var buttonDef = gaeaString.parseJSON(strButtonDef);
                buttonDef.id = opts.id;
                buttonDef.parentDialogId = opts.parentDialogId;
                if (gaeaString.equalsIgnoreCase(GAEA_UI_DEFINE.UI.BUTTON.ACTION.NEW_DIALOG, buttonDef.action)) {
                    if (gaeaValid.isNull(buttonDef.contentUrl)) {
                        throw "action=new_dialog, 内容加载的url的配置项（contentUrl）不允许为空！";
                    }
                    if (gaeaValid.isNull(buttonDef.submitAction)) {
                        throw "action=new_dialog, 新弹出框提交方式的配置项（submitAction）不允许为空！";
                    }
                    newDialogButton.init(buttonDef);
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
                var $button = $("#" + opts.id);
                // 如果是dialog，用的是parentId
                opts.parentId = opts.parentDialogId;
                // 设定新弹出框的id和name
                var autoGenId = opts.id + "_dialog";
                opts.id = gaeaValid.isNull(opts.newId) ? autoGenId : opts.newId;

                // 初始化html
                gaeaDialog.preInitHtml(opts);
                // 则在最终调用gaeaDialog.init的时候，就不需要再初始化一次了
                opts.initHtml = false;

                $button.on("click", function () {
                    //gaeaDialog.initCrudDialog();
                    gaeaDialog.init(opts);
                });
            }
        };

        var _private = {
            newDialog: {
                init: function (opts) {

                }
            }
        };
        /**
         * 返回（暴露）的接口
         */
        return button;
    });