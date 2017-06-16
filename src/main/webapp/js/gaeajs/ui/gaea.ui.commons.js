/**
 * 今天起，开始重构UR创建的一套前端js框架。重新以gaea命名。另外基于RequireJS的模块化。
 *
 * 通用的UI组件的公用包。因为有些组件，只是做一个接口层的封装，本身并不会很复杂。例如：日期时间控件等。
 * Created by iverson on 2016-6-19 18:17:59.
 *
 * 重构：
 * 把datatimepicker移到新包gaea.ui.plugins里面去。因为发现datetimepicker插件会和自己写的require模块冲突，导致导不入模块而undefined。
 * 以后插件都放到plugins去。
 */
define([
        "jquery", "underscore", 'underscore-string',
        'gaeajs-common-utils-validate', "gaeajs-common-utils-string", 'gaeajs-ui-definition',
        "gaeajs-ui-multiselect", "gaeajs-ui-button", "gaeajs-common-utils", "gaeajs-ui-select2", 'gaeajs-ui-grid',
        "gaeajs-data", "gaeajs-ui-tabs"
    ],
    function ($, _, _s,
              gaeaValid, gaeaString, GAEA_UI_DEFINE,
              gaeaMultiSelect, gaeaButton, gaeaUtils, gaeaSelect2, gaeaGrid,
              gaeaData, gaeaTabs) {

        var gaeaCommons = {
            /**
             *
             * @param {string} ctSelector               容器的JQ选择器
             * @returns {*}
             */
            initGaeaUI: function (ctSelector) {
                var dfd = $.Deferred();// JQuery同步对象
                // 没有相关的组件，也是需要resolve的
                if (gaeaValid.isNull(ctSelector)) {
                    dfd.resolve();
                }
                // 初始化按钮(在html中通过data-gaea-ui-button配置的)
                _private.initGaeaButton(ctSelector);
                // 初始化select2插件
                _private.initSelect2(ctSelector);
                // 初始化tabs插件
                _private.initGaeaTabs(ctSelector);
                // 初始化crud grid
                _private.crudGrid.init({
                    target: ctSelector
                });

                return gaeaMultiSelect.init(ctSelector);
            },
            /**
             * UI控件在数据完成后的一些初始化。
             * 这只是对部分组件有用。不代表全部组件都需要。
             * 例如：
             * jQuery select2插件，就需要在数据、DOM都准备好后，然后初始化后，trigger change去使初始化数据正常显示。就需要在这里二次初始化。
             * @param {object} opts
             * @param {string} opts.containerId
             */
            initGaeaUIAfterData: function (opts) {
                // 填充完数据后, 某些组件得触发事件才生效（例如select2需要触发change...）
                $("#" + opts.containerId).find("select").trigger("change");
            },
            /**
             * 负责所有数据的填充，包括Gaea框架的UI组件的数据填充。
             * @param {object} opts
             * @param {object} opts.id              container id
             * @param {object} opts.data            要填充的数据
             */
            fillData: function (opts) {
                if (gaeaValid.isNull(opts.id) || gaeaValid.isNull(opts.data)) {
                    return;
                }

                // 填充字段（input、textarea、select等）的值
                gaeaData.fieldData.init(opts.id, opts.data);

                /**
                 * Gaea框架的组件数据填充！
                 * 当前只查找crud-grid组件，但后续如有其它组件，还是得加进来。并且针对的可能是特定的组件的数据填充。
                 */

                    // 可编辑表格crud-grid的数据填充
                $("#" + opts.id).find("[data-gaea-ui-crud-grid]").each(function (key, target) {
                    // $(this)是crud-grid的容器，里面有toolbar和grid两个组件。
                    var $gridCt = $(this).children(".gaea-grid-ct");
                    var gridId = $gridCt.attr("id");
                    var name = $(this).data("gaea-ui-name"); // name需要从最底层容器获取
                    if (gaeaValid.isNull(name)) {
                        throw "组件data-gaea-ui-name为空，无法填充数据！";
                    }
                    // 如果data中，有部分数据和grid的name一致，才填充！
                    if (gaeaValid.isNotNull(opts.data[name])) {
                        gaeaGrid.data.reset(gridId, opts.data[name]);
                    }
                });
            }
        };

        var _private = {
            /**
             * 初始化按钮。
             * 当前只初始化弹出框中页面的按钮，不负责初始化toolbar中的按钮。
             */
            initGaeaButton: function (ctSelector) {
                var dfd = $.Deferred();// JQuery同步对象
                // 没有相关的组件，也是需要resolve的
                if (gaeaValid.isNull(ctSelector)) {
                    dfd.resolve();
                    return dfd.promise();
                }
                // data-gaea-ui-button（这个是gaeaUI的按钮的特殊定义属性）
                var attrName = "data-" + GAEA_UI_DEFINE.UI.BUTTON.DEFINE;
                // 找gaeaUI按钮的jq选择器条件( <a data-gaea-ui-button=*** ...> )
                var buttonFilterTemplate = _.template("a[<%= ATTR_NAME %>]");
                // 查找所有按钮，遍历并初始化
                $(ctSelector).find(buttonFilterTemplate({
                    ATTR_NAME: attrName
                })).each(function (idx, obj) {
                    var id = $(obj).attr("id");
                    /**
                     * debug
                     * 检查是否有重复元素！
                     * 这个很重要。否则会有一些莫名其妙的问题。
                     */
                    if (!gaeaUtils.dom.checkUnique(id)) {
                        console.debug("某元素根据id查找不唯一。很可能会导致系统功能异常，请检查相关页面定义。id：%s", id);
                    }

                    var gaeaButton = require("gaeajs-ui-button");
                    gaeaButton.initGaeaButton({
                        id: id,
                        parentCtSelector: ctSelector
                    });
                });
                dfd.resolve();
                return dfd.promise();
            },
            /**
             * 初始化jQuery select2插件。
             * @param ctSelector
             * @returns {*}
             */
            initSelect2: function (ctSelector) {
                var dfd = $.Deferred();// JQuery同步对象
                // 没有相关的组件，也是需要resolve的
                if (gaeaValid.isNull(ctSelector)) {
                    dfd.resolve();
                    return dfd.promise();
                }
                // data-gaea-ui-button（这个是gaeaUI的按钮的特殊定义属性）
                var attrName = "data-" + GAEA_UI_DEFINE.UI.SELECT2.DEFINE;
                // 找gaeaUI按钮的jq选择器条件( <select data-gaea-ui-select2=*** ...> )
                var buttonFilterTemplate = _.template("select[<%= ATTR_NAME %>]");
                // 查找所有按钮，遍历并初始化
                $(ctSelector).find(buttonFilterTemplate({
                    ATTR_NAME: attrName
                })).each(function (i, eachSelectObj) {
                    var $select2 = $(eachSelectObj);
                    var id = $select2.attr("id");
                    /**
                     * debug
                     * 检查是否有重复元素！
                     * 这个很重要。否则会有一些莫名其妙的问题。
                     */
                    if (!gaeaUtils.dom.checkUnique(id)) {
                        console.debug("select2组件根据id查找不唯一。很可能会导致系统功能异常，请检查相关页面定义。id：%s", id);
                    }

                    // 请求gaea select2模块进行初始化
                    gaeaSelect2.init({
                        jqSelector: "#" + id
                    });
                });
                dfd.resolve();
                return dfd.promise();
            },
            /**
             * 初始化所有的gaea.ui.tabs组件。
             *
             * @param {string} ctSelector
             */
            initGaeaTabs: function (ctSelector) {
                var dfd = $.Deferred();// JQuery同步对象
                // 没有相关的组件，也是需要resolve的
                if (gaeaValid.isNull(ctSelector)) {
                    dfd.resolve();
                    return dfd.promise();
                }
                // data-gaea-ui-button（这个是gaeaUI的按钮的特殊定义属性）
                var componentName = "data-" + GAEA_UI_DEFINE.UI.TABS.DEFINE;
                // 找gaeaUI按钮的jq选择器条件( <select data-gaea-ui-select2=*** ...> )
                // 查找所有按钮，遍历并初始化
                $(ctSelector).find("[" + componentName + "]").each(function (i, eachTabObj) {
                    var $tabs = $(eachTabObj);
                    var id = $tabs.attr("id");
                    if (gaeaValid.isNull(id)) {
                        throw "gaea tabs组件的id不允许为空！";
                    }
                    /**
                     * debug
                     * 检查是否有重复元素！
                     * 这个很重要。否则会有一些莫名其妙的问题。
                     */
                    if (!gaeaUtils.dom.checkUnique(id)) {
                        console.warn("gaea tabs组件根据id查找不唯一。很可能会导致系统功能异常，请检查相关页面定义。id：%s", id);
                    }

                    // 请求gaea.ui.tabs模块进行初始化
                    gaeaTabs.init({
                        containerId: id
                    });
                });
                dfd.resolve();
                return dfd.promise();
            }
        };

        /**
         * 初始化crud grid.
         * @param {object} opts
         * @param {jqObject|jqSelector} opts.target
         */
        _private.crudGrid = {
            init: function (opts) {
                var dfd = $.Deferred();// JQuery同步对象
                // 没有相关的组件，也是需要resolve的
                if (gaeaValid.isNull(opts.target)) {
                    dfd.resolve();
                    return dfd.promise();
                }

                // data-gaea-ui-button（这个是gaeaUI的按钮的特殊定义属性）
                var attrName = "data-" + GAEA_UI_DEFINE.UI.GRID.CRUD_GRID_DEFINE;
                // 找gaeaUI按钮的jq选择器条件( <a data-gaea-ui-button=*** ...> )
                var gridPluginTemplate = _.template("div[<%= ATTR_NAME %>]");
                // 查找所有按钮，遍历并初始化
                $(opts.target).find(gridPluginTemplate({
                    ATTR_NAME: attrName
                })).each(function (idx, obj) {
                    var id = $(obj).attr("id");
                    var $this = $(this);
                    gaeaValid.isNull({
                        check: id,
                        exception: "创建crud grid的div id不允许为空！"
                    });
                    /**
                     * debug
                     * 检查是否有重复元素！
                     * 这个很重要。否则会有一些莫名其妙的问题。
                     */
                    if (!gaeaUtils.dom.checkUnique(id)) {
                        console.debug("某元素根据id查找不唯一。很可能会导致系统功能异常，请检查相关页面定义。id：%s", id);
                    }

                    //var gaeaButton = require("gaeajs-ui-button");
                    _private.crudGrid.initOne({
                        id: id,
                        target: this
                    });
                });
                dfd.resolve();
                return dfd.promise();
            },
            /**
             * 这个是初始化一个grid的方法。
             * @param {object} opts
             * @param {string} opts.id                          crud grid容器。这个是最外层的容器，里面应该还有toolbar和真正grid的容器。
             * @param {jqSelector|jqObject} opts.target
             */
            initOne: function (opts) {
                var $rootCrudGridCt = $(opts.target);
                var rootCrudGridCtId = $rootCrudGridCt.attr("id");
                var crudGridToolbarId = rootCrudGridCtId + "-toolbar";
                var crudGridCtId = rootCrudGridCtId + "-grid-ct";
                // create HTML
                $rootCrudGridCt.append('<div id="' + crudGridToolbarId + '"></div><div id="' + crudGridCtId + '"></div>');
                //var $crudGridCt = $("#" + crudGridCtId);
                //var $toolbarCt = $("#" + crudGridToolbarId);

                var configStr = $rootCrudGridCt.data(GAEA_UI_DEFINE.UI.GRID.CRUD_GRID_DEFINE); // = data-gaea-ui-crud-grid
                var name = $rootCrudGridCt.data("gaea-ui-name"); // UI组件名，一般也就是组件需要的数据名（例如crud-grid，里面的input的base name就是它）
                var gridOptions = gaeaString.parseJSON(configStr);
                // set name
                gridOptions.name = name;

                // ******************* create grid *******************
                gaeaGrid = require("gaeajs-ui-grid"); // 经常拿不到模块，为什么
                // set grid id
                gridOptions.id = crudGridCtId;
                // set component
                gridOptions.component = GAEA_UI_DEFINE.UI.COMPONENT.CRUD_GRID;
                gaeaGrid.create(gridOptions);

                // ******************* create toolbar *******************
                _private.crudGrid.initToolbar({
                    id: crudGridToolbarId,
                    gridOptions: gridOptions
                });
            },
            /**
             * 初始化一个grid对应的toolbar。
             * @param {object} opts
             * @param {string} opts.id              toolbar containerId
             * @param {object} opts.gridOptions     grid options
             */
            initToolbar: function (opts) {

                var btnAddOneId = opts.id + "-btnAddOne";
                var btnDelId = opts.id + "-btnDel";
                var btnExcelImportId = opts.id + "-btnExcelImport"; // 通用导入
                var btnExcelExportId = opts.id + "-btnExcelExport"; // 通用导出
                gaeaGrid = require("gaeajs-ui-grid"); // 经常拿不到模块，为什么

                // 初始化 TOOLBAR
                var gaeaToolbar = require("gaeajs-ui-toolbar");
                gaeaToolbar.create({
                    renderTo: opts.id,
                    buttons: [{
                        "id": btnAddOneId,
                        "name": btnAddOneId,
                        "htmlName": btnAddOneId,
                        "htmlId": btnAddOneId,
                        "htmlValue": "添加",
                        "type": null,
                        "href": null,
                        "linkViewId": null,
                        "linkComponent": null,
                        "componentName": "button", // 定义组件
                        "action": null,
                        "size": "small",
                        onClick: function () {
                            gaeaGrid.crudGrid.addNewOne(opts.gridOptions)
                        }
                    }, {
                        "id": btnDelId,
                        "name": btnDelId,
                        "htmlName": btnDelId,
                        "htmlId": btnDelId,
                        "htmlValue": "删除",
                        "type": null,
                        "href": null,
                        "linkViewId": null,
                        "linkComponent": null,
                        "componentName": "button", // 定义组件
                        "action": null,
                        "size": "small",
                        onClick: function () {
                            gaeaGrid.crudGrid.deleteSelected(opts.gridOptions)
                        }
                    },
                        {
                            "id": btnExcelImportId,
                            "name": btnExcelImportId,
                            "htmlName": btnExcelImportId,
                            "htmlId": btnExcelImportId,
                            "htmlValue": "导入数据",
                            "type": null,
                            "href": null,
                            "linkViewId": null,
                            "linkComponent": null,
                            "componentName": "button", // 定义组件
                            "action": {
                                // 定义了这是一个通用的Excel导入按钮
                                name: GAEA_UI_DEFINE.ACTION.CRUD_GRID.EXCEL_IMPORT,
                                // 设定这个导入对应哪个grid
                                gridId: opts.gridOptions.id
                            },
                            "size": "small"
                        },
                        {
                            "id": btnExcelExportId,
                            "name": btnExcelExportId,
                            "htmlName": btnExcelExportId,
                            "htmlId": btnExcelExportId,
                            "htmlValue": "导出数据",
                            "type": null,
                            "href": null,
                            "linkViewId": null,
                            "linkComponent": null,
                            "componentName": "button", // 定义组件
                            "action": {
                                // 定义了这是一个通用的Excel导入按钮
                                name: GAEA_UI_DEFINE.ACTION.CRUD_GRID.EXCEL_EXPORT,
                                // 设定这个导出对应哪个grid
                                gridId: opts.gridOptions.id
                            },
                            "size": "small"
                        }]
                });
            }
        };

        /**
         * 返回接口定义。
         */
        return gaeaCommons;
    });