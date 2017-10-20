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
        "gaeajs-data", "gaeajs-ui-tabs", "gaeajs-ui-selectTree", "gaeajs-ui-events"
    ],
    function ($, _, _s,
              gaeaValid, gaeaString, GAEA_UI_DEFINE,
              gaeaMultiSelect, gaeaButton, gaeaUtils, gaeaSelect2, gaeaGrid,
              gaeaData, gaeaTabs, gaeaSelectTree, gaeaEvents) {

        /**
         * 服务端的View对象的定义。
         *
         * @typedef {object} ServerView
         * @property {string} id                            元素id
         * @property {string} parentId                      父级的view id
         * @property {ServerDialog} dialogs
         * @property {ServerView} views
         * @property {ServerAction} actions
         * @property {string} title                         页面标题。
         * @property {string} contentUrl                    内容加载的url
         * @property {string} componentName                 组件名。value：wf-dialog|crud-dialog|
         * @property {object} preConditions                 可以为空。（前置）条件对象。如果是下钻的页面，例如从一个列表页跳到第二个列表页，则第二个列表页很可能带着某些第一个列表页的前置条件。
         //* @property {ServerDialog.Button[]} buttons        这个弹出框对应的按钮
         */

        /**
         *
         *
         * @typedef {object} ServerAction
         * @property {string} id                            dialog id
         * @property {string} name
         * @property {string} htmlName
         * @property {string} htmlId
         * @property {ServerDialog.Button[]} buttons        这个弹出框对应的按钮
         */

        var gaeaCommons = {
            /**
             *
             * @param {string} ctSelector               容器的JQ选择器
             * @param {boolean} editable                （dialog的）内容是否可编辑
             * @returns {*}
             */
            initGaeaUI: function (ctSelector, editable) {
                var dfd = $.Deferred();// JQuery同步对象
                // 先处理内容是否可编辑
                if (gaeaValid.isNotNull(editable)) {
                    gaeaCommons.utils.setEditable(ctSelector, editable);
                }
                // 没有相关的组件，也是需要resolve的
                if (gaeaValid.isNull(ctSelector)) {
                    dfd.resolve();
                }
                // 初始化按钮(在html中通过data-gaea-ui-button配置的)
                _private.initGaeaButton(ctSelector);
                // 初始化select. 其实select非组件，不需要初始化。这个主要初始化一些绑定在上面的通用gaea event。
                _private.initSelect(ctSelector);
                // 初始化select2插件
                _private.initSelect2(ctSelector);
                // 初始化tabs插件
                _private.initGaeaTabs(ctSelector);
                // 初始化crud grid
                _private.crudGrid.init({
                    target: ctSelector
                });
                // 初始化select tree
                _private.selectTree.init({
                    target: ctSelector
                });
                // 初始化radio。系统默认的太丑了，而且还有样式问题
                _private.radio.init(ctSelector);

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
             * @param {object} opts.id              作废了！用target！！container id
             * @param {jqSelector} opts.target      要填充数据的区域选择器
             * @param {object} opts.data            要填充的数据
             */
            fillData: function (opts) {
                if (gaeaValid.isNull(opts.target) || gaeaValid.isNull(opts.data)) {
                    return;
                }

                // 填充字段（input、textarea、select等）的值
                gaeaData.fieldData.init(opts.target, opts.data);

                /**
                 * Gaea框架的组件数据填充！
                 * 当前只查找crud-grid组件，但后续如有其它组件，还是得加进来。并且针对的可能是特定的组件的数据填充。
                 */

                    // 可编辑表格crud-grid的数据填充
                $(opts.target).find("[data-gaea-ui-crud-grid]").each(function (key, target) {
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

        // 通用工具类
        gaeaCommons.utils = {
            /**
             * 根据id，从服务端返回的元素中，寻找对应的gaea组件。
             * 注意！当前主要找服务端返回的views里面的dialogs和views两个数组！
             * @param {ServerView} inViews
             * @param linkViewId
             * @returns {object}    某个组件定义对象（例如：服务端的dialog定义）。不是和jQuery dialog的配置项对应的（可能某个别会重复）
             */
            findComponent: function (inViews, linkViewId) {
                if (gaeaValid.isNull(inViews) || gaeaValid.isNull(linkViewId)) {
                    throw "输入的views定义 或 关联组件id为空，无法查找组件！";
                }
                var target;
                if (gaeaValid.isNotNull(inViews.dialogs)) {
                    target = _.findWhere(inViews.dialogs, {id: linkViewId});
                }
                if (gaeaValid.isNull(target) && gaeaValid.isNotNull(inViews.dialogs)) {
                    target = _.findWhere(inViews.views, {id: linkViewId});
                }
                return target;
            },
            /**
             * 控制某容器下的input、select等是否可编辑
             * @param ctSelector
             * @param editable
             */
            setEditable: function (ctSelector, editable) {
                var $container = $(ctSelector);
                // 找不到容器，返回
                if ($container.length < 1) {
                    return;
                }

                if (!editable) {
                    // 不可编辑
                    // 当前简单disabled掉。如果是自己的组件，再进一步根据disabled去判断，再进一步禁用。
                    $container.find("input, select").prop("disabled", true);
                }
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
             * 初始化select.
             * select本身不需要通过这个方法初始化，而是通过数据集。但它还有一些额外的，例如绑定一些事件等，通过这个初始化。
             * @param ctSelector
             * @returns {*}
             */
            initSelect: function (ctSelector) {
                var dfd = $.Deferred();// JQuery同步对象
                // 没有相关的组件，也是需要resolve的
                if (gaeaValid.isNull(ctSelector)) {
                    dfd.resolve();
                    return dfd.promise();
                }
                // data-gaea-ui-select
                var attrName = "data-" + GAEA_UI_DEFINE.UI.SELECT.DEFINE;
                // 找gaeaUI按钮的jq选择器条件( <select data-gaea-ui-select2=*** ...> )
                var gaeaSelectTemplate = _.template("select[<%= ATTR_NAME %>]");
                // 查找所有按钮，遍历并初始化
                $(ctSelector).find(gaeaSelectTemplate({
                    ATTR_NAME: attrName
                })).each(function (i, eachSelectObj) {
                    var $select = $(eachSelectObj);
                    var id = $select.attr("id");
                    var configStr = $select.data(GAEA_UI_DEFINE.UI.SELECT.DEFINE); // = data-gaea-ui-select
                    var opts = gaeaString.parseJSON(configStr);
                    opts.id = id;
                    // 检查是否有重复元素！
                    if (!gaeaUtils.dom.checkUnique(id)) {
                        console.debug("select根据id查找不唯一。很可能会导致系统功能异常，请检查相关页面定义。id：%s", id);
                    }

                    // 初始化按钮上的事件, 例如什么onComplete等
                    gaeaEvents.initGaeaEvent(opts);

                    // 请求gaea select2模块进行初始化
                    //gaeaSelect2.init({
                    //    jqSelector: "#" + id
                    //});
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
                // data-gaea-ui-select2
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

        // 下拉树多选组件
        _private.selectTree = {
            /**
             * 初始化gaea select tree（下拉树多选组件）.
             * @param {object} opts
             * @param {jqObject|jqSelector} opts.target
             * @returns {*}
             */
            init: function (opts) {
                var dfd = $.Deferred();// JQuery同步对象
                // 没有相关的组件，也是需要resolve的
                if (gaeaValid.isNull(opts.target)) {
                    dfd.resolve();
                    return dfd.promise();
                }

                // data-gaea-ui-button（这个是gaeaUI的按钮的特殊定义属性）
                var attrName = "data-" + GAEA_UI_DEFINE.UI.SELECT_TREE_DEFINE;
                // 找有gaeaUI select tree定义的元素( <div data-gaea-ui-select-tree=*** ...> )
                var selectTreeTmpl = _.template("[<%= ATTR_NAME %>]");

                // 遍历所有select tree组件
                $(opts.target).find(selectTreeTmpl({
                    ATTR_NAME: attrName
                })).each(function (idx, obj) {
                    var id = $(obj).attr("id"); // 例如：mars-hq-categoryName-ct
                    gaeaValid.isNull({
                        check: id,
                        exception: "创建select tree组件的div id不允许为空！"
                    });
                    /**
                     * debug
                     * 检查是否有重复元素！
                     * 这个很重要。否则会有一些莫名其妙的问题。
                     */
                    if (!gaeaUtils.dom.checkUnique(id)) {
                        console.debug("创建select tree组件，元素根据id查找不唯一。很可能会导致系统功能异常，请检查相关页面定义。id：%s", id);
                    }

                    // 初始化
                    var selectTreeOpts = {
                        target: this
                    };
                    //require(["gaeajs-ui-selectTree"], function (gaeaSelectTree) {
                    gaeaSelectTree.init(selectTreeOpts);
                    //});
                });
                dfd.resolve();
                return dfd.promise();
            }
        };

        // radio单选样式初始化
        _private.radio = {
            /**
             * 初始化gaea自己样子的radio。传统的radio有点丑。
             * <p>
             *     功能的区别不大。主要是gaea radio只支持“选中|不选”两种状态。
             *     因为对于超过2两种，推荐用下拉列表做；对于checkbox的，推荐用下拉多选做。
             * </p>
             * @param ctSelector
             */
            init: function (ctSelector) {
                var $container = $(ctSelector);
                var componentName = "data-" + GAEA_UI_DEFINE.UI.RADIO_DEFINE;
                $container.find("[" + componentName + "]").each(function (i, radioObj) {
                    var $gaeaRadio = $(radioObj);
                    var num = $gaeaRadio.children("input[type='radio']").length;
                    var optsStr = $gaeaRadio.data(GAEA_UI_DEFINE.UI.RADIO_DEFINE); // = data-gaea-ui-radio
                    var opts = gaeaString.parseJSON(optsStr);
                    var defaultValue = gaeaValid.isNull(opts.default) ? undefined : opts.default.value;
                    if (gaeaValid.isNull(opts.checked) || gaeaValid.isNull(opts.checked.value)) {
                        throw "配置gaea-ui-radio组件，checked属性不允许为空！";
                    }
                    // 选中/不选择的html input radio
                    var $checkedE = $gaeaRadio.find("[value='" + opts.checked.value + "']");
                    var $notCheckedE = $gaeaRadio.find("input[value!='" + opts.checked.value + "']");
                    // 只有两个项。那就是：是否启用之类的
                    if (num != 2) {
                        throw "所需的input(radio)数量不对！gaea-ui-radio有且只有两个input(radio)元素！";
                    }
                    // 默认值和选中值是同一个，则默认选中
                    if (gaeaString.equalsIgnoreCase(opts.checked.value, defaultValue)) {
                        $gaeaRadio.addClass("fa fa-check-square-o");
                    } else {
                        $gaeaRadio.addClass("fa fa-square-o");
                    }
                    // 点击，切换选中/没选中状态，和值
                    _private.radio.bindClickEvent($gaeaRadio, $notCheckedE, $checkedE);
                    // 注册form load data时，数据填充时的处理
                    _private.radio.bindOnChange($gaeaRadio, opts.checked.value);
                });
            },
            /**
             * 点击切换状态，和里面input radio的状态。
             * @param $gaeaRadio
             * @param $notCheckedE
             * @param $checkedE
             */
            bindClickEvent: function ($gaeaRadio, $notCheckedE, $checkedE) {
                // 如果是不可编辑（例如查看），则不需要绑定click事件
                if ($gaeaRadio.children("input[type='radio'][disabled='disabled']").length > 0) {
                    return;
                }
                // 点击，切换选中/没选中状态，和值
                gaeaEvents.registerListener("click", $gaeaRadio, function () {
                    if ($gaeaRadio.hasClass("fa-check-square-o")) {
                        // 选中 -> 不选中
                        $notCheckedE.prop("checked", true); // 这里不能触发change啊！切记！
                        $gaeaRadio.removeClass("fa-check-square-o").addClass("fa-square-o");
                    } else {
                        // 没选中 -> 选中
                        $checkedE.prop("checked", true);
                        $gaeaRadio.removeClass("fa-square-o").addClass("fa-check-square-o");
                    }
                });
            },
            bindOnChange: function ($gaeaRadio, checkedItemValue) {
                // 注册form load data时，数据填充时的处理
                gaeaEvents.registerListener("change", $gaeaRadio.find("input[type='radio']"), function () {
                    // 这个只针对表单初始化的fillData, 不能用于gaea radio的click，否则会形成死循环：点了又触发改变、改变又触发点击。。。
                    _private.radio._changeStyle($gaeaRadio, checkedItemValue, $(this).val());
                });
            },
            /**
             * 根据值切换选中/不选中状态
             * @param $gaeaRadio
             * @param checkedItemValue  选中的radio的初始值。
             * @param val               实际的值。
             * @private
             */
            _changeStyle: function ($gaeaRadio, checkedItemValue, val) {
                if (gaeaString.equalsIgnoreCase(checkedItemValue, val)) {
                    // 选中
                    $gaeaRadio.removeClass("fa-square-o").addClass("fa-check-square-o");
                } else {
                    // 不选中
                    $gaeaRadio.addClass("fa-square-o").removeClass("fa-check-square-o");
                }
            }
        };

        /**
         * 返回接口定义。
         */
        return gaeaCommons;
    });