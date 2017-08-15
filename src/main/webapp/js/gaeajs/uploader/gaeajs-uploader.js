/**
 * Created by iverson on 2016/2/14.
 * 今天起，开始重构UR创建的一套前端js框架。重新以gaea命名。另外基于RequireJS的模块化。
 * 2016-6-11 11:44:04 Iverson
 * 上传的封装组件。
 * DEPENDENCE:
 * RequireJS,JQuery,重写的Date.format
 */

/**
 * 百度的上传组件的uploader对象。
 * @typedef {object} BaiduWebUploader
 */
define(["jquery", "underscore", 'webuploader', 'underscore-string', "gaeajs-ui-dialog"
        , 'gaeajs-common-utils-validate', 'gaeajs-common', "gaeajs-ui-notify", "gaeajs-ui-events"],
    function ($, _, baiduUploader, _s, gaeaDialog,
              gaeaValid, gaeaCommon, gaeaNotify, gaeaEvents) {
        // default options
        var _options = {
            // swf文件路径
            swf: '/js/thirdparty/upload/Uploader.swf',
            // 文件接收服务端。like this: /gaea/security/resource/upload
            server: '',
            // 选择文件的按钮。可选。
            // 内部根据当前运行是创建，可能是input元素，也可能是flash.
            pick: '#filePicker',
            // 不压缩image, 默认如果是jpeg，文件上传前会压缩一把再上传！
            resize: false,
            // 并发线程
            threads: 1,
            // 限制大小.2M
            fileSingleSizeLimit: 2 * 1024 * 1024,
            // 是否允许选择多文件
            multiple: false,
            // 默认上传的文件的param name
            fileVal: "file"
        };
        //var _uploader;

        var uploader = {
            /**
             * 构造方法。初始化和uploader相关的一切。
             * @param {object} opts
             * @param {object} opts.dialog
             * @param {string} opts.dialog.id           dialog的id
             * @param {object} opts.button
             * @param {string} opts.button.id           选择文件按钮（触发上传控件打开的按钮的）id
             * @param {object} opts.data                要随文件一并提交的相关form data。例如：schemaId之类的
             * @param {string} opts.submitUrl           提交的目标url.
             * @param {function} [opts.callback]        提交后回来的回调函数
             */
            init: function (opts) {
                gaeaValid.isNull({
                    check: opts.submitUrl,
                    exception: "submitUrl为空，无法初始化gaea uploader组件！Button id: " + opts.button.id
                });
                gaeaValid.isNull({
                    check: opts.dialog.id,
                    exception: "dialog id为空，无法初始化gaea uploader组件！Button id: " + opts.button.id
                });
                var _uploader;
                var dialogOptions = opts.dialog;
                var buttonOptions = opts.button;
                var filePickerId = dialogOptions.id + "-filePicker";
                // 构造上传组件的配置项
                var uploaderOpts = _.defaults({
                    // 文件选择页面的div
                    pick: "#" + filePickerId,
                    // 文件上传提交的url位置
                    server: opts.submitUrl,
                    // 一并上传的form data
                    formData: opts.data
                }, _options);
                /* 初始化上传组件的dialog */
                uploader._initDialog(dialogOptions);
                // get dialog container
                var $dialog = $("#" + dialogOptions.id);
                // init uploader HTML
                var $list = $('<div id="thelist" class="uploader-list"></div>');
                $dialog.append($list);
                $dialog.append('<div id="' + filePickerId + '"></div>');

                // 注册点击处理
                _private.registerOpenUploader(buttonOptions, dialogOptions);

                //_uploader = new webuploader.Uploader({
                //    // swf文件路径
                //    swf: '/js/thirdparty/upload/Uploader.swf',
                //    // 文件接收服务端。
                //    server: '/gaea/security/resource/upload',
                //    // 选择文件的按钮。可选。
                //    // 内部根据当前运行是创建，可能是input元素，也可能是flash.
                //    pick: '#filePicker',
                //    // 不压缩image, 默认如果是jpeg，文件上传前会压缩一把再上传！
                //    resize: false,
                //    // 并发线程
                //    threads:1,
                //    // 限制大小.2M
                //    fileSingleSizeLimit: 2*1024*1024,
                //    // 是否允许选择多文件
                //    multiple: false
                //});
                _uploader = new baiduUploader.Uploader(uploaderOpts);
                // 当有文件被添加进队列的时候
                // 并且在有加入的时候，才初始化删除按钮
                _private.registerOnAddFile(_uploader, $list);
                /**
                 * 监听上传完成.进行上传完成后的处理.
                 */
                _private.registerUploadSuccess(_uploader, opts.callback);

                _private.registerUploadError(_uploader);

                // 单个文件上传完成（无论成功与否）
                _private.registerUploadComplete(_uploader);

                // 全部上传完成
                _private.registerUploadFinished(_uploader, dialogOptions);

                // “上传”按钮触发
                _private.registerUpload(_uploader, dialogOptions);
            },
            /**
             * 初始化uploader的dialog。
             * @param dialogOptions
             * @private
             */
            _initDialog: function (dialogOptions) {
                var gaeaDialog = require("gaeajs-ui-dialog");

                dialogOptions.isDataUnbind = false; // 不需要数据解绑。主要是数据解绑的时候，还会清空dialog，会导致再打不开
                if (gaeaValid.isNotNull(dialogOptions.htmlWidth)) {
                    dialogOptions.width = dialogOptions.htmlWidth;
                }
                if (gaeaValid.isNotNull(dialogOptions.htmlHeight)) {
                    dialogOptions.height = dialogOptions.htmlHeight;
                }

                // 设定按钮
                dialogOptions.buttons = {
                    "chooseFile": {
                        text: "选择文件",
                        id: dialogOptions.id + "-chooseFile",
                        click: function () {
                            var $dialog = $("#" + dialogOptions.id);
                            $dialog.find(":file").trigger('click');
                        }
                    },
                    "upload": {
                        text: "上传",
                        id: dialogOptions.id + "-upload",
                        click: function () {
                            // 打开遮罩层
                            gaeaCommon.loading.on();
                            // 开始上传
                            //_uploader.upload();
                            $("#" + dialogOptions.id).trigger(gaeaEvents.DEFINE.UI.UPLOADER_DIALOG.UPLOAD);
                        }
                    },
                    "cancel": {
                        text: "取消",
                        id: dialogOptions.id + "-cancel",
                        click: function () {
                            $(this).gaeaDialog("close");
                        }
                    }
                };
                // 外面嵌入form
                //var dlgContent = "<form id=\"" + dlgFormId + "\" action=\"" + dialogOptions.submitUrl + "\">" + $(dlgSelector).html() + "</form>";
                //$(dlgSelector).html(dlgContent);
                // 初始化DIALOG
                //var dialog = gaeaDialog.create(dialogOptions);
                gaeaDialog.init(dialogOptions);
                //return dialog;
            },
            _initUploader: function () {

            }
        };

        var _private = {
            /**
             *
             * @param {BaiduWebUploader} webUploader
             */
            registerOnAddFile: function (webUploader, $list) {
                // 当有文件被添加进队列的时候
                webUploader.on('fileQueued', function (file) {
                    console.debug("file queued.file id: " + file.id + " file name: " + file.name + " has been added into WebUploader fileQueued.");
                    var $fileCt = $('<div id="' + file.id + '" class="uploader-item">' +
                        '<img>' +
                        '<span class="cmd-ct"><i class="fa fa-trash-o delete-icon"></i></span>' +
                        '<span class="file-name">' + file.name + '</span>' +
                        '<span class="upload-state">等待上传...</span>' +
                        '</div>'); // （选择文件页面）单个文件的div容器（例如：一张图）
                    $list.append($fileCt);

                    var $img = $fileCt.children("img");

                    // 创建缩略图
                    // 如果为非图片文件，可以不用调用此方法。
                    // thumbnailWidth x thumbnailHeight 为 100 x 100
                    var thumbnailWidth = 100;
                    var thumbnailHeight = 100;
                    webUploader.makeThumb(file, function (error, src) {
                        if (error) {
                            $img.replaceWith('<span>不能预览</span>');
                            return;
                        }

                        $img.attr('src', src);
                    }, thumbnailWidth, thumbnailHeight);

                    // 绑定删除按钮
                    _private.bindDeleteEvent($fileCt, webUploader);
                });
            },
            /**
             * 即刻上传。点击“上传”按钮触发。
             * @param {BaiduWebUploader} webUploader
             * @param {object} dialogOptions
             */
            registerUpload: function (webUploader, dialogOptions) {
                // “上传”按钮触发
                gaeaEvents.registerListener(gaeaEvents.DEFINE.UI.UPLOADER_DIALOG.UPLOAD, "#" + dialogOptions.id, function (event, ui) {
                    webUploader.upload();
                });
            },
            /**
             * 监听上传完成.进行上传完成后的处理.
             * @param {BaiduWebUploader} webUploader
             * @param callback
             */
            registerUploadSuccess: function (webUploader, callback) {
                webUploader.on('uploadSuccess', function (file, response) {
                    $('#' + file.id).find('.upload-state').text('已上传');
                    // callback
                    if (_.isFunction(callback)) {
                        callback(file, response);
                    }
                    // 关闭遮罩层
                    gaeaCommon.loading.off();
                });
            },
            /**
             *
             * @param {BaiduWebUploader} webUploader
             */
            registerUploadError: function (webUploader) {
                webUploader.on('uploadError', function (file) {
                    $('#' + file.id).find('.upload-state').text('上传出错');
                    gaeaNotify.error("上传处理失败！");
                    // 关闭遮罩层
                    gaeaCommon.loading.off();
                });
            },
            /**
             * （单个文件）上传完成
             * @param {BaiduWebUploader} webUploader
             */
            registerUploadComplete: function (webUploader) {
                webUploader.on('uploadComplete', function (file) {
                    $('#' + file.id).find('.progress').fadeOut();

                });
            },
            /**
             * 全部上传完成
             * @param {BaiduWebUploader} webUploader
             * @param {object} dialogOptions
             */
            registerUploadFinished: function (webUploader, dialogOptions) {
                var gaeaDialog = require("gaeajs-ui-dialog");
                webUploader.on('uploadFinished', function () {
                    gaeaNotify.success("全部文件上传完成！");
                    // 关闭弹出框
                    gaeaDialog.close("#" + dialogOptions.id);
                    // 清空已上传的图片div
                    _private.cleanUploaderList(dialogOptions.id);
                });
            },
            /**
             * 注册点击就打开：选择文件弹出框。
             * @param buttonOptions
             * @param dialogOptions
             */
            registerOpenUploader: function (buttonOptions, dialogOptions) {
                // 注册点击处理
                gaeaEvents.registerListener("click", "#" + buttonOptions.id, function (event, ui) {
                    var gaeaDialog = require("gaeajs-ui-dialog");
                    //$("#" + buttonOptions.id).click(function () {
                    //console.log("Go. Open dialog.");
                    // 打开dialog
                    gaeaDialog.open({
                            id: dialogOptions.id
                        }
                        //"#" + dialogOptions.htmlId
                    );
                });
            },
            /**
             * 绑定单个文件/图片的删除操作。点击就删除图片，并且从上传队列中移出。
             * @param $fileCt
             * @param {BaiduWebUploader} webUploader
             */
            bindDeleteEvent: function ($fileCt, webUploader) {
                gaeaEvents.registerListener("click", $fileCt.find("i.delete-icon"), function (event, ui) {
                    var $delButton = $(this);
                    var $uploaderItem = $delButton.parents(".uploader-item").filter(":first");
                    var id = $uploaderItem.attr("id");
                    var file = webUploader.getFile(id);
                    webUploader.removeFile(file, true);
                    $uploaderItem.remove();
                });
            },
            /**
             * 清空上传列表的内容
             * @param dialogId
             */
            cleanUploaderList: function (dialogId) {
                $("#" + dialogId).find(".uploader-list").html("");
            }
        };
        /**
         * 返回（暴露）的接口
         */
        return {
            init: uploader.init
        };
    });