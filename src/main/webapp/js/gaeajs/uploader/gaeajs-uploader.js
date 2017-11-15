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
        , 'gaeajs-common-utils-validate', 'gaeajs-common', "gaeajs-ui-notify", "gaeajs-ui-events", "gaeajs-common-utils", "gaeajs-ui-chain"],
    function ($, _, baiduUploader, _s, gaeaDialog,
              gaeaValid, gaeaCommon, gaeaNotify, gaeaEvents, gaeaUtils, gaeaChain) {
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
            fileVal: "file",
            // 是否缓存上传失败的文件。true：则重复打开上传组件都会看到之前的图片
            keepFailed: false
        };
        //var _uploader;

        var uploader = {
            /**
             * 构造方法。初始化和uploader相关的一切。
             * @param {object} opts
             * @param {object} opts.dialog
             * @param {string} opts.dialog.id               dialog的id
             * @param {object} opts.button
             * @param {string} opts.button.id               选择文件按钮（触发上传控件打开的按钮的）id
             * @param {object} opts.data                    要随文件一并提交的相关form data。例如：schemaId之类的
             * @param {string} opts.submitUrl               提交的目标url.
             * @param {boolean} opts.multiple=false         是否多选。
             * @param {boolean} opts.keepFailed          是否缓存已选过的。
             * @param {function} [opts.getUploadDataFunc]     获取要一并提交的数据的回调函数
             * @param {function} [opts.callback]            提交后回来的回调函数
             * @param {function} [opts.onComplete]          complete的时候触发的callback
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
                var gaeaDialog = require("gaeajs-ui-dialog");
                var dialogOptions = opts.dialog;
                var buttonOptions = opts.button;
                var filePickerId = dialogOptions.id + "-filePicker";
                // 获取按钮所在弹出框（因为文件上传弹出框是独立的，加入不了前面的弹出框链的话获取不到pageId）
                var $parentDialog = gaeaDialog.utils.findRootDialog("#" + buttonOptions.id);
                if ($parentDialog.length > 0) {
                    dialogOptions.parentId = $parentDialog.attr("id");
                }
                // 构造上传组件的配置项
                var uploaderOpts = _.defaults({
                    // 文件选择页面的div
                    pick: {
                        id: "#" + filePickerId,
                        // 是否多选
                        multiple: opts.multiple
                    },
                    // 文件上传提交的url位置
                    server: opts.submitUrl,
                    // 一并上传的form data
                    formData: opts.data,
                    // 是否多选
                    //multiple: opts.multiple,
                    // 是否缓存选中的
                    keepFailed: opts.keepFailed
                }, _options);
                // 放在dialog options里面，才能一起缓存
                _.defaults(opts, uploaderOpts);
                /* 初始化上传组件的dialog */
                uploader._initDialog(dialogOptions);
                // get dialog container
                var $dialog = $("#" + dialogOptions.id);
                _.extend($dialog.data("gaea-options"), opts); // 经dialog组件初始化后，dialog.data有opts没有的信息，例如formId
                // init uploader HTML
                var $list = $('<div id="thelist" class="uploader-list"></div>');
                $dialog.append($list);
                $dialog.append('<div id="' + filePickerId + '"></div>');

                _uploader = new baiduUploader.Uploader(uploaderOpts);
                // 注册点击处理
                // 如果需要keepFailed，并且WebUploader的错误队列里面有文件，则添加回文件列表页面
                _private.registerOpenUploader(buttonOptions, $dialog.data("gaeaOptions"), _uploader, opts.keepFailed);
                // 注册关闭弹出框处理
                _private.registerCloseUploader($dialog.data("gaeaOptions"), _uploader, opts.keepFailed);

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
                // 当有文件被添加进队列的时候
                // 并且在有加入的时候，才初始化删除按钮
                _private.registerOnAddFile(_uploader, $list);
                /**
                 * 监听上传完成.进行上传完成后的处理.
                 */
                _private.registerUploadSuccess(_uploader, opts.callback);

                // 处理失败情况
                _private.registerUploadError(_uploader, $dialog);

                // 单个文件上传完成（无论成功与否）
                // 如果不需要keepFailed，则在完成时把文件移除队列
                _private.registerUploadComplete(_uploader, opts.onComplete, opts.keepFailed);

                // 全部上传完成
                _private.registerUploadFinished(_uploader, dialogOptions);

                // “上传”按钮触发
                _private.registerUpload(_uploader, dialogOptions, opts.getUploadDataFunc);
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
                            //_private.cleanUploaderList(dialogOptions.id); // 清空文件列表页面
                            //var files = webUploader.getFiles();
                            // 触发事件处理关闭逻辑，例如清空文件列表等。因为在这里还拿不到webUploader的对象，无法做一些清空文件列表等的操作
                            $("#" + dialogOptions.id).trigger(gaeaEvents.DEFINE.UI.UPLOADER_DIALOG.CLOSE_DIALOG);
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
            }
        };

        var _private = {
            /**
             * 绑定当有文件加入队列的事件。
             * 这个在webUploader.addFile也会触发。
             * @param {BaiduWebUploader} webUploader
             * @param $list
             */
            registerOnAddFile: function (webUploader, $list) {
                // 当有文件被添加进队列的时候
                webUploader.on('fileQueued', function (file) {
                    console.debug("file queued.file id: " + file.id + " file name: " + file.name + " has been added into WebUploader fileQueued.");
                    // 添加HTML的"file", 即文件/图片列表页面的一个文件
                    _private.html.addFile(file, $list, webUploader);
                    //var $fileCt = $('<div id="' + file.id + '" class="uploader-item">' +
                    //    '<img>' +
                    //    '<span class="cmd-ct"><i class="fa fa-trash-o delete-icon"></i></span>' +
                    //    '<span class="file-name">' + file.name + '</span>' +
                    //    '<span class="upload-state">等待上传...</span>' +
                    //    '</div>'); // （选择文件页面）单个文件的div容器（例如：一张图）
                    //$list.append($fileCt);
                    //
                    //var $img = $fileCt.children("img");
                    //
                    //// 创建缩略图
                    //// 如果为非图片文件，可以不用调用此方法。
                    //// thumbnailWidth x thumbnailHeight 为 100 x 100
                    //var thumbnailWidth = 100;
                    //var thumbnailHeight = 100;
                    //webUploader.makeThumb(file, function (error, src) {
                    //    if (error) {
                    //        $img.replaceWith('<span>不能预览</span>');
                    //        return;
                    //    }
                    //
                    //    $img.attr('src', src);
                    //}, thumbnailWidth, thumbnailHeight);
                    //
                    //// 绑定删除按钮
                    //_private.bindDeleteEvent($fileCt, webUploader);
                });
            },
            /**
             * 即刻上传。点击“上传”按钮触发。
             * @param {BaiduWebUploader} webUploader
             * @param {object} dialogOptions
             * @param {function} [getUploadDataFunc]     获取要一并提交的数据的回调函数
             */
            registerUpload: function (webUploader, dialogOptions, getUploadDataFunc) {
                // “上传”按钮触发
                gaeaEvents.registerListener(gaeaEvents.DEFINE.UI.UPLOADER_DIALOG.UPLOAD, "#" + dialogOptions.id, function (event, ui) {
                    var failQueue = webUploader.getFiles("error"); // 截止到目前为止，上传失败的
                    // 上传前，获取一次最新的、需要额外提交的数据
                    if (_.isFunction(getUploadDataFunc)) {
                        var latestPostData = getUploadDataFunc(); // 例如：获取当前dialog所在form的数据
                        //_.extend(webUploader.option("formData"), latestPostData);
                        _.extend(webUploader.option("formData"), _private.getPostData(latestPostData, dialogOptions)); // getPostData，额外的数据，例如：pageId
                    }
                    // 如果有上次上传失败的，就重试
                    if (failQueue.length > 0) {
                        // retry, 会把新添加的（非失败）也一并上传
                        webUploader.retry();
                    } else {
                        webUploader.upload();
                    }
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
                    // 从queue中移出上传成功的，否则下次无法选中！
                    webUploader.removeFile(file, true);
                    // 关闭遮罩层
                    gaeaCommon.loading.off();
                });
            },
            /**
             * uploadError几乎无法处理错误，reason并非服务端给回来的json信息，所以是否错误只能在uploadAccept处理.
             * uploadAccept会获得服务端的返回json。
             * @param {BaiduWebUploader} webUploader
             * @param {jqObject} $dialog                文件上传dialog的jQuery对象
             */
            registerUploadError: function (webUploader, $dialog) {
                // ret就是服务端返回的json
                // uploadAccept才是错误处理的核心
                webUploader.on('uploadAccept', function (obj, ret) {
                    // 处理请求返回结果, 包括成功和失败
                    gaeaUtils.processResponse(ret, {
                        fail: {
                            baseMsg: "上传处理失败！"
                        },
                        success: {
                            baseMsg: "上传处理成功！"
                        }
                    });
                });
                // 这个只负责刷新具体文件的错误信息
                webUploader.on('uploadError', function (file, reason) {
                    // 这里的错误几乎无法处理，reason并非服务端给回来的json信息，所以是否错误只能在uploadAccept处理
                    $('#' + file.id).find('.upload-state').text('上传出错');
                    // 关闭遮罩层
                    gaeaCommon.loading.off();
                });
            },
            /**
             * （单个文件）上传完成
             * @param {BaiduWebUploader} webUploader
             * @param {function} onComplete             complete的时候触发的callback
             */
            registerUploadComplete: function (webUploader, onComplete, keepFailed) {
                webUploader.on('uploadComplete', function (file) {
                    $('#' + file.id).find('.progress').fadeOut();
                    // 执行回调方法（如果有的话）
                    if (_.isFunction(onComplete)) {
                        onComplete();
                    }
                    // 如果不需要保留失败的，就彻底把它移除。
                    // 否则WebUploader会留在队列里面，下次选不中
                    if (!keepFailed) {
                        webUploader.removeFile(file, true); // 后面的true表示彻底删除
                    }
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
                    // 处理请求返回结果, 包括成功和失败
                    gaeaUtils.processResponse(null, {
                        default: {
                            baseMsg: "全部文件完成处理！"
                        }
                    });
                    //gaeaNotify.success("全部文件上传完成！");
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
            registerOpenUploader: function (buttonOptions, dialogOptions, webUploader, keepFailed) {
                // 注册点击处理
                gaeaEvents.registerListener("click", "#" + buttonOptions.id, function (event, ui) {
                    var $dialog = $("#" + dialogOptions.id);
                    var failQueue = webUploader.getFiles("error"); // 截止到目前为止，上传失败的
                    var gaeaDialog = require("gaeajs-ui-dialog");
                    //$("#" + buttonOptions.id).click(function () {
                    //console.log("Go. Open dialog.");
                    // 打开dialog
                    gaeaDialog.open({
                            id: dialogOptions.id,
                            formId: dialogOptions.formId
                        }
                        //"#" + dialogOptions.htmlId
                    );
                    // 把缓存的上次上传失败的，再显示出来！
                    if (keepFailed && failQueue.length > 0) {
                        $.each(failQueue, function (i, file) {
                            _private.html.addFile(file, $dialog.children(".uploader-list"), webUploader);
                        });
                    }
                });
            },
            /**
             * 关闭弹出框的处理, 例如清空文件列表等。
             * @param dialogOptions
             * @param webUploader
             * @param keepFailed
             */
            registerCloseUploader: function (dialogOptions, webUploader, keepFailed) {
                // 注册关闭弹出框处理
                gaeaEvents.registerListener(gaeaEvents.DEFINE.UI.UPLOADER_DIALOG.CLOSE_DIALOG, "#" + dialogOptions.id, function (event, ui) {
                    // 清空文件列表页面(Html)
                    _private.cleanUploaderList(dialogOptions.id);
                    var files = webUploader.getFiles();
                    // 如果不需要保留失败的，就彻底把它移除。
                    // 否则WebUploader会留在队列里面，下次选不中
                    if (!keepFailed) {
                        // 清空WebUploader组件里面的文件（缓存）
                        if (gaeaValid.isNotNull(files) && _.isArray(files)) {
                            $.each(files, function (i, file) {
                                webUploader.removeFile(file, true);
                            });
                        }
                    }
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
            },
            /**
             * 获取webUploader组件要一并提交的form data。
             * @param data
             * @param dialogOptions
             * @returns {*}
             */
            getPostData: function (data, dialogOptions) {
                if (gaeaValid.isNull(data)) {
                    data = {};
                }
                //var $dialog = $("#" + dialogOptions.id);
                // 从操作链获取根dialog id（因为文件上传dialog是独立的另一个弹出框）
                var rootDialogId = gaeaChain.getRootId(dialogOptions.id);
                //var $rootDialog = $dialog.filter("[data-gaea-ui-dialog]").length > 0 ? $dialog : $dialog.parents("[data-gaea-ui-dialog]").filter(":last"); // 找根的dialog，可能是自己，也可能包了另外一层
                var $rootDialog;

                // 带上pageId
                if (gaeaValid.isNotNull(rootDialogId)) {
                    $rootDialog = $("#" + rootDialogId);
                    var dialogGaeaOpts = $rootDialog.data("gaeaOptions");
                    data.pageId = dialogGaeaOpts["pageId"];
                }

                return data;
            },
            html: {
                /**
                 * 添加HTML的"file", 即文件/图片列表页面的一个文件.
                 * @param file
                 * @param $fileListCt
                 * @param webUploader
                 */
                addFile: function (file, $fileListCt, webUploader) {
                    var $fileCt = $('<div id="' + file.id + '" class="uploader-item">' +
                        '<img>' +
                        '<span class="cmd-ct"><i class="fa fa-trash-o delete-icon"></i></span>' +
                        '<span class="file-name">' + file.name + '</span>' +
                        '<span class="upload-state">等待上传...</span>' +
                        '</div>'); // （选择文件页面）单个文件的div容器（例如：一张图）
                    $fileListCt.append($fileCt);

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
                }
            }
        };
        /**
         * 返回（暴露）的接口
         */
        return {
            init: uploader.init
        };
    });