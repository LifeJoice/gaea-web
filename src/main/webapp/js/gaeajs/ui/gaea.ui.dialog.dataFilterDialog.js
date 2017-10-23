/**
 * 基于RequireJS的模块化重构。让依赖更清晰，更简单。
 *
 * Gaea Dialog data filter dialog组件。
 * 是一个弹出式包含gaea grid的弹出框组件。用户通过弹出框过滤了数据后（例如，过滤一批产品），就可以批量回填到某个地方。
 * Created by iverson on 2017年4月1日14:58:17
 */
define([
        "jquery", "underscore", "underscore-string", "gaeajs-common-utils-validate", "gaeajs-common-utils-string",
        "gaeajs-ui-events", "gaeajs-common-utils", "gaea-system-url", "gaeajs-common-utils-ajax", "gaeajs-ui-notify",
        "gaeajs-ui-definition", "gaeajs-context", "gaeajs-data", "gaeajs-ui-form"
    ],
    function ($, _, _s, gaeaValid, gaeaString,
              gaeaEvent, gaeaUtils, SYS_URL, gaeaAjax, gaeaNotify,
              GAEA_UI_DEFINE, gaeaContext, gaeaData, gaeaForm) {


        var dataFilterDialog = {
            /**
             * 加载data filter dialog内容，其实主要就是构建其中的gaea grid。
             * @param {object} opts
             * @param {string} opts.id                              dialog id
             * @param {string} opts.newId                           看action的配置。如果是新弹出框，则这个值就是新弹出框的id。
             * @param {string} opts.parentDialogId
             * @param {string} opts.openStyle
             * @param {string} opts.submitAction                    新的弹出框的提交方式。是直接提交到后台，还是只是回写到parent dialog的某个值中
             * @param {string} opts.submitUrl
             * @param {string} opts.writeBack                       按字段名回写的具体配置项. writeback_by_field需要。
             * @param {string} opts.contentUrl
             * @param {string} opts.refInputId                      关联的父级dialog的输入框id
             * @param {string} opts.schemaId                        xml schema id
             * @param {object} opts.condition                       条件
             * @returns {*}
             */
            loadContent: function (opts) {
                gaeaValid.isNull({
                    check: opts.schemaId,
                    exception: "schema id为空，无法初始化data-filter-dialog！"
                });
                var $dialog = $("#" + opts.id);
                // clean content
                $dialog.html("");

                var dfd = $.Deferred();// JQuery同步对象
                // 发送服务端的请求数据
                var queryCondition = {};
                if (gaeaValid.isNotNull(opts.condition)) {
                    // 获取本dialog关联的顶级dialog的form的数据，作为上下文（方便查询框架获取form的值作为查询条件的值）
                    var extraFormData = gaeaForm.getRelateFormData(opts.id);
                    // 写入上下文环境变量，让下面的查询条件可以获取
                    gaeaContext.setValue(extraFormData);
                    // 构造查询条件对象。利用上面的form的值。
                    queryCondition = gaeaData.parseCondition(opts.condition);
                }
                var queryData = {
                    schemaId: opts.schemaId,
                    conditions: JSON.stringify(queryCondition)
                };

                // 数据加载要求同步
                return gaeaAjax.ajax({
                    url: SYS_URL.SCHEMA.GET,
                    async: true, // 异步调用
                    data: queryData,
                    success: function (data, textStatus, jqXHR) {
                        dfd.resolve();
                        var gaeaGrid = require("gaeajs-ui-grid");
                        if (gaeaValid.isNull(data) || gaeaValid.isNull(data.grid)) {
                            gaeaNotify.error("加载Schema grid定义失败！返回定义为空，无法创建grid！");
                        }
                        var gridOptions = data.grid;
                        gridOptions.schemaId = data.id; // schema id, 定义了grid。通用查询的时候、dataFilterDialog等都需要
                        gridOptions.preConditions = data.views.preConditions; // 前置条件，如果有的话。一般链式view（下级页面）/data-filter-dialog等会有前置条件。前置条件过滤数据，一般也就会在grid中体现。
                        /**
                         * 高度计算方式。value = page|dialog
                         * page：根据document.body.scrollHeight去计算，一般用于整个页面的，列表页。
                         * dialog：dialog中打开的，一般根据往上找到.ui-dialog-content的高度为基础。
                         */
                        gridOptions.heightType = "dialog";
                        // 创建grid的div（dialog中）
                        $dialog.append('<div id="' + gridOptions.id + '"></div>');
                        gaeaGrid.create(gridOptions);
                        //jqXHR.gaeaData = result;
                    },
                    fail: function (data) {
                        var result = JSON.parse(data.responseText);
                        gaeaNotify.error("加载Schema失败！\n" + result.message);
                        dfd.resolve();
                    }
                });


                return dfd.promise();
            },
            /**
             * 获取数据。因为这个是包含了grid的dialog，获取数据的方式是不一样的。
             * @param opts
             */
            getData: function (opts) {
                var $dialog = $("#" + opts.id);
                if ($dialog.length < 1) {
                    throw gaeaString.builder.simpleBuild("找不到对应的DataFilterDialog，无法获取其中的数据！dialog opts: %s", JSON.stringify(opts));
                }
                // 找到其中的gaea grid
                var $gridCt = $dialog.find(".gaea-grid-ct:first");
                if ($gridCt.length < 1) {
                    throw gaeaString.builder.simpleBuild("找不到DataFilterDialog中的grid，无法获取其中的数据！dialog opts: %s", JSON.stringify(opts));
                }
                var gridId = $gridCt.attr("id");
                var data = gaeaContext.getValue(GAEA_UI_DEFINE.UI.GAEA_CONTEXT.CACHE_KEY.SELECTED_ROWS, gridId);
                return data;
            }
        };
        // 私有方法
        var _private = {};

        return {
            loadContent: dataFilterDialog.loadContent,
            getData: dataFilterDialog.getData
        };
    });