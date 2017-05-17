/**
 * Created by iverson on 2016/2/14.
 * 今天起，开始重构UR创建的一套前端js框架。重新以gaea命名。另外基于RequireJS的模块化。
 * 2016-6-11 11:44:04 Iverson
 * 上传的封装组件。
 * DEPENDENCE:
 * RequireJS,JQuery,重写的Date.format
 */
define(["jquery", "underscore", 'webuploader', 'underscore-string', "gaeajs-ui-dialog"
        , 'gaeajs-common-utils-validate', 'gaeajs-common', "gaeajs-ui-notify", "gaeajs-ui-events"],
    function ($, _, webuploader, _s, gaeaDialog,
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
            multiple: false
        };
        var _uploader;

        var uploader = {
            /**
             * 构造方法。初始化和uploader相关的一切。
             * @param {object} opts
             * @param {object} opts.dialog
             * @param {string} opts.dialog.id           dialog的id
             * @param {object} opts.button
             * @param {string} opts.button.id           触发上传控件打开的按钮的id
             * @param {object} opts.data                要随文件一并提交的相关form data。例如：schemaId之类的
             * @param {string} [opts.submitUrl]         目标url. 为空就默认都丢到同一个地方去了。
             * @param {function} [opts.callback]        提交后回来的回调函数
             */
            init: function (opts) {
                var dialogOptions = opts.dialog;
                var buttonOptions = opts.button;
                var filePickerId = dialogOptions.id + "-filePicker";
                var uploaderOpts = _.defaults({
                    pick: "#" + filePickerId,
                    server: opts.submitUrl,
                    formData: opts.data
                }, _options);
                //var that = this;
                //var $list = $("#thelist");// test
                /* 初始化上传组件的dialog */
                uploader._initDialog(dialogOptions);
                // get dialog container
                var $dialog = $("#" + dialogOptions.id);
                // init uploader HTML
                var $list = $('<div id="thelist" class="uploader-list"></div>');
                $dialog.append($list);
                $dialog.append('<div id="' + filePickerId + '"></div>');

                // 注册点击处理
                gaeaEvents.registerListener("click", "#" + buttonOptions.id, function (event, ui) {
                    //$("#" + buttonOptions.id).click(function () {
                    //console.log("Go. Open dialog.");
                    // 打开dialog
                    gaeaDialog.open({
                            id: dialogOptions.id
                    }
                    //"#" + dialogOptions.htmlId
                    );
                });

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
                _uploader = new webuploader.Uploader(uploaderOpts);
                // 当有文件被添加进队列的时候
                _uploader.on('fileQueued', function (file) {
                    console.debug("file queued.file id: " + file.id + " file name: " + file.name);
                    $list.append('<div id="' + file.id + '" class="item">' +
                        '<h4 class="info">' + file.name + '</h4>' +
                        '<p class="state">等待上传...</p>' +
                        '</div>');
                });
                /**
                 * 监听上传完成.进行上传完成后的处理.
                 */
                _uploader.on('uploadSuccess', function (file, response) {
                    $('#' + file.id).find('p.state').text('已上传');
                    // callback
                    if (_.isFunction(opts.callback)) {
                        opts.callback(file, response);
                    }
                    // 关闭遮罩层
                    gaeaCommon.loading.off();
                });

                _uploader.on('uploadError', function (file) {
                    $('#' + file.id).find('p.state').text('上传出错');
                    gaeaNotify.error("上传处理失败！");
                    // 关闭遮罩层
                    gaeaCommon.loading.off();
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
                        id: dialogOptions + "-chooseFile",
                        click: function () {
                            var $dialog = $("#" + dialogOptions.id);
                            $dialog.find(":file").trigger('click');
                        }
                    },
                    "upload": {
                        text: "上传",
                        id: dialogOptions + "-upload",
                        click: function () {
                            // 打开遮罩层
                            gaeaCommon.loading.on();
                            // 开始上传
                            _uploader.upload();
                        }
                    },
                    "cancel": {
                        text: "取消",
                        id: dialogOptions + "-cancel",
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
        /**
         * 返回（暴露）的接口
         */
        return {
            init: uploader.init
        };
    })