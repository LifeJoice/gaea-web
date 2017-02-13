/**
 * Created by iverson on 2016/2/14.
 * 今天起，开始重构UR创建的一套前端js框架。重新以gaea命名。另外基于RequireJS的模块化。
 * 2016-6-11 11:44:04 Iverson
 * 上传的封装组件。
 * DEPENDENCE:
 * RequireJS,JQuery,重写的Date.format
 */
define(["jquery", "underscore", 'webuploader', 'underscore-string', "gaeajs-ui-dialog"
        , 'gaeajs-common-utils-validate','gaeajs-common'],
    function ($, _, webuploader, _s, gaeaDialog,
              gaeaValid,gaeaCommon) {
        var options = {
            url: null,
            data: null,
            success: null,
            fail: null
        };
        var _uploader;
        var uploader = {
            /**
             * 构造方法。初始化和uploader相关的一切。
             * @param options
             * @param dialogOptions
             * @param buttonOptions
             */
            uploader: function (options, dialogOptions, buttonOptions) {
                var that = this;
                var $list = $("#thelist");// test
                /* 初始化上传组件的dialog */
                var dialog = that._initDialog(dialogOptions);

                $("#" + buttonOptions.htmlId).click(function () {
                    //console.log("Go. Open dialog.");
                    // 打开dialog
                    gaeaDialog.open({
                        id:dialogOptions.htmlId
                    }
                    //"#" + dialogOptions.htmlId
                    );
                });


                this.options = _.extend(this.options, options);
                //this.options = options;
                _uploader = new webuploader.Uploader({
                    // swf文件路径
                    swf: '/js/thirdparty/upload/Uploader.swf',
                    // 文件接收服务端。
                    server: '/gaea/security/resource/upload',
                    // 选择文件的按钮。可选。
                    // 内部根据当前运行是创建，可能是input元素，也可能是flash.
                    pick: '#filePicker',
                    // 不压缩image, 默认如果是jpeg，文件上传前会压缩一把再上传！
                    resize: false,
                    // 并发线程
                    threads:1,
                    // 限制大小.2M
                    fileSingleSizeLimit: 2*1024*1024,
                    // 是否允许选择多文件
                    multiple: false
                });
                // 当有文件被添加进队列的时候
                _uploader.on('fileQueued', function (file) {
                    console.log("file queued.file id: " + file.id + " file name: " + file.name);
                    $list.append('<div id="' + file.id + '" class="item">' +
                        '<h4 class="info">' + file.name + '</h4>' +
                        '<p class="state">等待上传...</p>' +
                        '</div>');
                });
                /**
                 * 监听上传完成.进行上传完成后的处理.
                 */
                _uploader.on('uploadSuccess', function (file) {
                    $('#' + file.id).find('p.state').text('已上传');
                    // 关闭遮罩层
                    gaeaCommon.loading.off();
                });

                _uploader.on('uploadError', function (file) {
                    $('#' + file.id).find('p.state').text('上传出错');
                });

                _uploader.on('uploadComplete', function (file) {
                    $('#' + file.id).find('.progress').fadeOut();
                });
            },
            /**
             * 初始化uploader的dialog。
             * @param dialogOptions
             * @private
             */
            _initDialog: function (dialogOptions) {
                var that = this;
                dialogOptions.id = dialogOptions.htmlId;   // 用htmlId作为创建dialog的DIV ID。


                //this.cache.options = inOptions;
                dialogOptions.autoOpen = false;
                var dlgSelector = null;
                // 指定工作流审批dialog要注入的DIV
                if (gaeaValid.isNull(dialogOptions.renderTo)) {
                    dialogOptions.renderTo = "uploaderDialog";
                }
                dialogOptions.id = dialogOptions.renderTo;
                dlgSelector = "#" + dialogOptions.id;
                var $dialog = $(dlgSelector);
                var dlgFormId = dialogOptions.id + "-form";
                //this.cache.options.formId = dlgFormId;
                if (gaeaValid.isNotNull(dialogOptions.htmlWidth)) {
                    dialogOptions.width = dialogOptions.htmlWidth;
                }
                if (gaeaValid.isNotNull(dialogOptions.htmlHeight)) {
                    dialogOptions.height = dialogOptions.htmlHeight;
                }
                //if(ur.utils.validate.isNotNull(inOptions.htmlId)){
                //    inOptions.htmlId = "workflow-approval-dialog";
                //}

                // 设定按钮
                //var buttons = this._createButtons();
                dialogOptions.buttons = {
                    "chooseFile": {
                        text: "选择文件",
                        id: "chooseFile",
                        click: function () {
                            $(":file").trigger('click');
                        }
                    },
                    "upload": {
                        text: "上传",
                        id: "upload",
                        click: function () {
                            // 打开遮罩层
                            gaeaCommon.loading.on();
                            // 开始上传
                            _uploader.upload();
                        }
                    },
                    "cancel": {
                        text: "取消",
                        id: "cancel",
                        click: function () {
                            $(this).gaeaDialog("close");
                        }
                    }
                };
                // 外面嵌入form
                //var dlgContent = "<form id=\"" + dlgFormId + "\" action=\"" + dialogOptions.submitUrl + "\">" + $(dlgSelector).html() + "</form>";
                //$(dlgSelector).html(dlgContent);
                // 初始化DIALOG
                var dialog = gaeaDialog.create(dialogOptions);
                return dialog;
            },
            _initUploader: function () {

            }
        };
        /**
         * 返回（暴露）的接口
         */
        return uploader;
    })