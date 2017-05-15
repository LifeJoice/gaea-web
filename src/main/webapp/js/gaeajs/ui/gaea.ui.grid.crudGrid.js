/**
 * 基于RequireJS的模块化重构。让依赖更清晰，更简单。
 *
 * Gaea Grid Crud Grid组件。行编辑表格组件。
 *
 * Created by iverson on 2017年5月6日17:14:23
 */
define([
        "jquery", "underscore", "underscore-string", "gaeajs-common-utils-validate", "gaeajs-common-utils-string",
        "gaeajs-ui-events", "gaeajs-common-utils", "gaea-system-url", "gaeajs-common-utils-ajax", "gaeajs-ui-notify",
        "gaeajs-ui-definition", "gaeajs-ui-input", "gaeajs-ui-plugins", "gaeajs-uploader"
    ],
    function ($, _, _s, gaeaValid, gaeaString,
              gaeaEvents, gaeaUtils, SYS_URL, gaeaAjax, gaeaNotify,
              GAEA_UI_DEFINE, gaeaInput, gaeaPlugins, gaeaUploader) {
        /**
         * @type {object} QueryCondition
         * @property {string} QueryCondition.propName       属性名
         * @property {string} QueryCondition.op             比较关系
         * @property {string} QueryCondition.propValue      值
         */

        var grid = {};

        grid.action = {
            /**
             * 可编辑列表的导入按钮操作。
             */
            excelImport: {
                /**
                 * 初始化通用导入功能。
                 * @param {object} opts
                 * @param {string} opts.sourceId
                 //* @param {string} opts.id
                 * @param {GaeaUIAction} opts.action
                 */
                init: function (opts) {
                    //var importBtnId = opts.id;
                    var uploaderDialogId = opts.sourceId + "-excelImportUploaderDialog";
                    if (gaeaValid.isNull(opts.id) && gaeaValid.isNull(opts.sourceId)) {
                        // 自动命名导入按钮id
                        //    importBtnId = opts.sourceId + "-excelImportBtn";
                        //}else{
                        throw "id/sourceId为空，无法初始化crud grid的导入功能！";
                    }
                    // 要找到对应grid才能更新
                    if ($("#" + opts.sourceId).parents("[data-gaea-ui-crud-grid]").length < 1) {
                        throw "找不到对应的crud-grid (data-gaea-ui-crud-grid)容器，无法构建可编辑表格！";
                    }
                    // get grid ct
                    var $gridCt = $("#" + opts.sourceId).parents("[data-gaea-ui-crud-grid]").children(".gaea-grid-ct");
                    // 获取要一并提交的数据，例如：grid定义等
                    var data = grid.action.excelImport._getData(opts);
                    /**
                     * 初始化文件上传组件（弹出框）
                     */
                    gaeaUploader.init({
                        dialog: {
                            id: uploaderDialogId
                        },
                        button: {
                            id: opts.sourceId
                        },
                        data: data,
                        submitUrl: SYS_URL.CRUD_GRID.EXCEL_IMPORT,
                        callback: function (file, response) {
                            gaeaNotify.success("导入成功。");
                            // 触发刷新
                            $gridCt.trigger(gaeaEvents.DEFINE.UI.GRID.REFRESH_DATA, {
                                data: response,
                                isNewData: false
                            });
                        }
                    });
                },
                /**
                 * 获取导入操作时，要一并提交给服务端的相关数据。
                 * 例如：
                 * grid的列定义（用于匹配和提取Excel数据）等。
                 * @param {object} opts
                 * @param {GaeaUIAction} opts.action
                 * @private
                 */
                _getData: function (opts) {
                    var result = {};
                    if (gaeaValid.isNull(opts.action) || gaeaValid.isNull(opts.action.gridId)) {
                        throw "crud grid的excel导入，没有对应的gridId定义，无法获取grid定义数据！";
                    }
                    var $gridCt = $("#" + opts.action.gridId);
                    var $rootCrudGridCt = $gridCt.parent();
                    var configStr = $rootCrudGridCt.data(GAEA_UI_DEFINE.UI.GRID.CRUD_GRID_DEFINE); // = data-gaea-ui-crud-grid
                    var gridConfig = gaeaString.parseJSON(configStr);
                    result.columns = JSON.stringify(gridConfig.columns);
                    return result;
                }
            },
            /**
             * 可编辑列表的导出按钮操作。
             */
            excelExport: {
                init: function (opts) {

                }
            }
        };

        // 私有方法
        var _private = {};

        return {
            action: {
                excelImport: {
                    init: grid.action.excelImport.init
                }
            }
        };
    });