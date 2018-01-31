/**
 * 基于RequireJS的模块化重构。让依赖更清晰，更简单。
 * Created by iverson on 2016/2/17.
 */
/**
 * crud grid的列定义.
 * @type {object} GaeaColumn
 * @property {string} GaeaColumn.name                   列名。
 * @property {string} GaeaColumn.text                   列头文本
 * @property {boolean} GaeaColumn.editable              是否可编辑
 * @property {int} GaeaColumn.width                     宽度
 * @property {string} GaeaColumn.dataSetId              数据集id
 * @property {GaeaColumnComponent} GaeaColumn.component
 //* @property {object} GaeaColumn.default                默认项（值等）
 //* @property {string} GaeaColumn.default.value
 * @property {string} GaeaColumn.dataType               数据类型。string|date|datetime|img|...
 * @property {string} GaeaColumn.imgSrcPrefix           图片列，自动为<img>标签的src加上的前缀
 * @property {string} GaeaColumn.imgSrcSuffix           图片列，自动为<img>标签的src加上的后缀
 * @property {string} GaeaColumn.imgThumbnailSuffix     缩略图的后缀。图片列，自动为<img>标签的src加上的后缀
 * @property {GaeaColumnValidator} GaeaColumn.validator 列可编辑字段的校验定义. 适配jQuery.validate
 */
/**
 * 列的校验定义.
 * @type {object} GaeaColumnValidator
 * @property {GaeaColumnValidatorHtml} GaeaColumnValidator.html         映射html的对象。key对应的就是html里面的属性名.
 */
/**
 * 列校验的html的映射对象.
 * 这里的key是不固定的，是HTML 5标准和jQuery validate支持的，都是可以的。相反，如果不支持了，就是不可以。
 * 下面的几个属性，仅供参考。
 * @type {object} GaeaColumnValidatorHtml
 * @property {string} GaeaColumnValidatorHtml.type              对应input type
 * @property {string} GaeaColumnValidatorHtml.required          对应input required
 * @property {string} GaeaColumnValidatorHtml.data-msg          对应input data-msg
 * @property {string} GaeaColumnValidatorHtml.xxx               其他jQuery.validate和HTML5支持的属性
 */
/**
 * 对应列的组件。例如：列是可编辑的，里面的是下拉选择框……这样的。
 * @type {object} GaeaColumnComponent
 * @property {string} GaeaColumnComponent.type              组件的类型。决定了初始化的组件。value=select2|...
 * @property {string} GaeaColumnComponent.multiple          是否多选。下拉框专属属性。
 * @property {object} GaeaColumnComponent.default           默认项（值等）
 * @property {string} GaeaColumnComponent.default.value
 */
define([
        "jquery", "underscore", 'underscore-string', 'gaeajs-common-utils-ajax', 'gaeajs-common-utils-validate', 'gaeajs-common-utils-datetime',
        'gaeajs-ui-button', 'gaea-system-url', "gaeajs-ui-events", 'gaeajs-common-utils-string', "gaeajs-ui-plugins", "gaeajs-ui-input",
        "gaeajs-ui-definition", "gaeajs-context", "gaeajs-ui-notify", "gaeajs-common-utils", "gaeajs-data",
        "gaeajs-ui-grid-query", "gaeajs-ui-selectTree", "gaeajs-ui-commons",
        "jquery-mCustomScrollbar", "jquery-lightGallery"],
    function ($, _, _s, gaeaAjax, gaeaValid, gaeaDT,
              gaeaButton, SYS_URL, gaeaEvents, gaeaString, gaeaPlugins, gaeaInput,
              GAEA_UI_DEFINE, gaeaContext, gaeaNotify, gaeaUtils, gaeaData,
              gridQuery, gaeaSelectTree, gaeaUI, mod1, mod2) {

        // 默认的opts参数值的统一定义
        var defaultOpts = {
            // grid init default options
            init: {
                // 默认的组件是grid。但也可能是其他，例如：可编辑grid等。
                component: GAEA_UI_DEFINE.UI.COMPONENT.GRID,
                /**
                 * 生成grid高度的算法。value: page|dialog
                 * page：根据document.body.scrollHeight去计算，一般用于整个页面的，列表页。
                 * dialog：dialog中打开的，一般根据往上找到.ui-dialog-content的高度为基础。
                 */
                heightType: "page"
            },
            // grid的column的默认定义值
            column: {
                editable: true, // 默认可编辑
                dataType: "string",
                primaryKey: false,
                hidden: false
            },
            crudGrid: {
                addNewOne: {
                    isNewData: true
                }
            }
        };

        /**
         * 一些静态的常量定义
         */
        var GRID_DEFINE = {
            HEIGHT_TYPE: {
                PAGE: "page",
                DIALOG: "dialog"
            },
            QUERY: {
                FILTER_CONTAINER_ID: "mars-tb-head-query" // 列表页的快捷查询块的id
            },
            PAGINATION: {
                // 默认的分页，显示多少页码（1~7页）
                DEFAULT_PAGE_LIST_LENGTH: 7,
                // 每页显示多少条选项，单项高度
                PAGE_SIZE_ITEM_HEIGHT: 25,
                // （每页多少条）选择列表
                PAGE_SIZE_LIST: [25, 50, 100, 1000]
            }
        };
        /**
         * 定义模板
         */
        var TEMPLATE = {
            QUERY: {
                DIV_FIELD: '<div id="<%= ID %>" class="<%= CLASS %>">' +
                '</div>' // 查询字段块（包括下拉按钮）
            },
            GRID: {
                // 这个是头部“选择全部”按钮区
                HEAD_CHECK_ALL_DIV: '' +
                '<div id="selectAll" class="select-all column-header"><div class="row-check">' +
                '<input type="checkbox" id="<%=ID %>" style="display: none;" >' +
                '<label id="checkAllLabel" for="<%=ID %>"></label>' +
                '</div></div>'
            },
            PAGINATION: {
                CT: '<div class="page-desc"><%=FIRST%> - <%=LAST%> 共 <%=ROW_COUNT%> 条数据. 每页</div>'
            }
        };
        /**
         * 查询相关的定义。高级查询的处理器。
         */
        var _query = {};
        /**
         * 查询的视图（页面元素、构造等） 2016-6-19 18:38:26
         * @type {{}}
         */
        _query.view = {
            /**
             * 高级查询 2016-6-19 18:42:01
             * 即点击列头，出现在列头下的查询行。
             *
             * @param {object} opts
             * @param {string} opts.id                  grid id
             */
            init: function (opts) {
                //var that = this;
                var $gridCt = $("#" + opts.id);
                var $headQueryInputs = $gridCt.find("#mars-headquery-inputs:first");
                var gridOptions = $gridCt.data().options;
                //var fields = _grid.options.model.fields;
                //var columns = _grid.options.columns;
                var fields = gridOptions.model.fields;
                var columns = gridOptions.columns;
                //var optionData = null;
                for (var i = 0; i < fields.length; i++) {
                    var field = fields[i];
                    var column = _.extend(_.clone(defaultOpts.column), columns[i]);
                    //var column = columns[i];
                    var defaultClass = "head-query-column";
                    var columnHtmId = "mars-hq-column-" + (i + 1); // column的序列化从1开始吧
                    var inputId = "mars-hq-" + field.id;
                    // 拼凑各个字段的查询输入框
                    if (gaeaValid.isNotNull(column.hidden) && !column.hidden) {
                        // 非日期类的，一般一个div是一个查询条件
                        if (!gaeaString.equalsIgnoreCase(column.dataType, GAEA_UI_DEFINE.UI.DATA.DATA_TYPE_DATE)) {
                            defaultClass += " gaea-query-field"; // gaea-query-field决定了提取查询条件的单元容器
                        }

                        /**
                         * 添加快捷查询区的列（容器）
                         */
                        var queryFieldTemplate = _.template(TEMPLATE.QUERY.DIV_FIELD);
                        $headQueryInputs.append(queryFieldTemplate({
                            ID: columnHtmId,
                            CLASS: defaultClass,
                            INPUT_ID: inputId,
                            FIELD_ID: field.id
                        }));
                        var $oneQueryCt = $headQueryInputs.children("#" + columnHtmId);
                        // 添加两个子容器（条件按钮区，和输入区）
                        var oneQuerySubCtTemplate = _.template(
                            '<div class="gaea-query-buttons">' +
                            '<i class="iconfont icon-eq gaea-icon" data-gaea-data="value:\'eq\'"/>' +
                            '<i class="iconfont icon-gt gaea-icon" data-gaea-data="value:\'gt\'" />' +
                            '<i class="iconfont icon-ge gaea-icon" data-gaea-data="value:\'ge\'" />' +
                            '<i class="iconfont icon-lt gaea-icon" data-gaea-data="value:\'lt\'" />' +
                            '<i class="iconfont icon-le gaea-icon" data-gaea-data="value:\'le\'" />' +
                            '<i class="iconfont icon-lk gaea-icon" data-gaea-data="value:\'lk\'" />' +
                            '<i class="iconfont icon-ne gaea-icon" data-gaea-data="value:\'ne\'" />' +
                            '<i class="gaea-icon" style="font-size: 12px;" data-gaea-data="value:\'na\'" >N/A</i>' + // style是临时的
                            '<i class="gaea-icon" style="font-size: 12px;" data-gaea-data="value:\'nna\'" >nNA</i>' + // style是临时的
                            '</div>' +
                            '<div class="gaea-query-input-ct"></div>' // 查询字段块（包括下拉按钮）
                        );
                        // 日期类的，不需要比较操作
                        if (gaeaString.equalsIgnoreCase(column.dataType, GAEA_UI_DEFINE.UI.DATA.DATA_TYPE_DATE)) {
                            oneQuerySubCtTemplate = _.template(
                                '<div class="gaea-query-one-button">' +
                                '<i class="fa fa-plus"/>' +
                                '</div>' +
                                '<div class="gaea-query-input-ct"></div>' // 查询字段块（包括下拉按钮）
                            );
                        }
                        $oneQueryCt.append(oneQuerySubCtTemplate());
                        var oneQueryInputCtSelector = "#" + opts.id + " #" + columnHtmId + " .gaea-query-input-ct";
                        //var $oneQueryInputCt = $oneQueryCt.children(".gaea-query-input-div");

                        if (gaeaValid.isNotNull(column.queryCondition)) {
                            if (gaeaString.equalsIgnoreCase(GAEA_UI_DEFINE.UI.COMPONENT.SELECT, column.queryCondition.component)) {
                                var gaeaSelect2 = require("gaeajs-ui-select2");
                                gaeaSelect2.preInitHtmlAndData({
                                    jqSelector: oneQueryInputCtSelector,
                                    htmlId: inputId,
                                    htmlName: inputId,
                                    dataSetId: column.dataSetId,
                                    fieldId: field.id
                                });
                            } else if (gaeaString.equalsIgnoreCase(GAEA_UI_DEFINE.UI.COMPONENT.SELECT_TREE, column.queryCondition.component)) {
                                var selectTreeOpts = {
                                    target: oneQueryInputCtSelector,
                                    htmlId: inputId,
                                    htmlName: inputId,
                                    dataSetId: column.dataSetId,
                                    fieldId: field.id,
                                    multiple: column.queryCondition.multiple
                                };
                                //require(["gaeajs-ui-selectTree"], function (gaeaSelectTree) {
                                //    gaeaSelectTree.initHtml(selectTreeOpts);
                                gaeaSelectTree.preInit(selectTreeOpts);
                                //});
                            }
                        } else if (gaeaString.equalsIgnoreCase(column.dataType, GAEA_UI_DEFINE.UI.DATA.DATA_TYPE_DATE) ||
                                // 日期类的，可以切换区间查询or单个查询
                            gaeaString.equalsIgnoreCase(column.dataType, GAEA_UI_DEFINE.UI.DATA.DATA_TYPE_DATETIME) ||
                            gaeaString.equalsIgnoreCase(column.dataType, GAEA_UI_DEFINE.UI.DATA.DATA_TYPE_TIME)) {
                            gridQuery.dateTimeFieldInit({
                                target: $oneQueryCt,
                                inputId: inputId,
                                fieldId: field.id,
                                dataType: column.dataType
                            });
                        } else {
                            /**
                             * 初始化gaeaInput输入框（带按钮）
                             */
                            gaeaInput.init({
                                jqSelector: oneQueryInputCtSelector,
                                //defaultClass: defaultClass,
                                inputId: inputId,
                                fieldId: field.id
                                //change: function (data) {
                                //    //alert("test\nop='"+data.op+"' value= "+data.value);
                                //    var queryConditions = gridQuery.parser.getQueryConditions();
                                //    gridQuery.doQuery({
                                //        id: opts.id,
                                //        queryConditions: queryConditions
                                //    });
                                //}
                            });
                        }
                        //$("#mars-headquery-inputs").append("<div id='" + columnHtmId + "' class='" + defaultClass + "'><span><input id='" + inputId + "' data-field-id='" + field.id + "' ></span></div>");
                        // +1是列头的列间边框宽度。
                        $gridCt.find("#" + columnHtmId).css("width", (parseInt(column.width)));
                        //$("#" + inputId).css("width", (column.width - 10));        // 输入框的默认宽度为列宽-10.
                    }
                }
                // 组装按钮
                //$gridCt.find("#query-actions").children("div:first").append(gaeaButton.create({
                //    "htmlId": "headqueryOK",
                //    "text": "确定",
                //    "size": "small"
                //}));
                gaeaButton.create({
                    "htmlId": "headqueryOK",
                    "text": "确定",
                    "size": "small",
                    jqContainer: $gridCt.find("#query-actions").children("div:first")
                });
                //$gridCt.find("#query-actions").children("div:first").append(gaeaButton.create({
                //    "htmlId": "query-reset",
                //    "text": "重置",
                //    "size": "small"
                //}));
                gaeaButton.create({
                    "htmlId": "query-reset",
                    "text": "重置",
                    "size": "small",
                    jqContainer: $gridCt.find("#query-actions").children("div:first")
                });

                /**
                 * 初始化一个gaea小插件：保证查询区的按钮自动居中（随滚动条左右滑动的时候）
                 */
                var target = window;
                var extraMinus = 0;
                if (gaeaString.equalsIgnoreCase(GRID_DEFINE.HEIGHT_TYPE.DIALOG, opts.heightType)) {
                    // 如果grid在dialog中，定位的不是window的滚动，而是dialog容器的滚动。
                    target = $gridCt.parents(".ui-dialog-content:first");
                } else {
                    // 如果grid在列表页，则按钮的定位得减去左边的菜单栏
                    extraMinus = $(".main-left").width();
                }
                $gridCt.find("#query-actions").children("div").gaeaScrollCenter({
                    // 监控的目标滚动对象
                    target: target,
                    extraMinus: extraMinus
                });
                // 触发初始化一下
                $(target).trigger("scroll");

                // 【2】 点击确定，开始查询。
                gridQuery.view.init(opts);
            }
        };

        var _grid = {
            // _gird.options not use anymore from 2017年3月26日17:12:37 by Iverson
            //options: {
            //    title: null,
            //    width: null,
            //    height: null,
            //    hidden: null,
            //    resizable: null,
            //    autoLoad: null,
            //    renderTo: null,
            //    data: null,             // json数据。直接初始化表格。
            //    model: {
            //        fields: {
            //            id: null,
            //            name: null
            //        },
            //        idProperty: null
            //    },
            //    columns: [
            //        {
            //            text: null, // 表头的文字
            //            name: null, // 预留字段
            //            id: null,
            //            width: null,
            //            hidden: false,
            //            resizable: false,
            //            renderType: null, // 渲染的类型。例如如果字段是日期的，需要转变成日期格式显示。可选：date,time（未实现），datetime（未实现）
            //            // callback
            //            renderer: null          // 数据转换的拦截器
            //        }
            //    ],
            //    proxy: {
            //        url: null,
            //        headers: null,
            //        params: null
            //    },
            //    // 监听事件。例如：单击、双击、单击单元格等……
            //    listeners: {
            //        cellclick: null,
            //        select: null
            //    },
            //    page: {
            //        page: 1,
            //        size: 20,
            //        rowCount: 0,
            //        pageCount: 0
            //    }
            //},
            cache: {
                selectedRow: null,
                hasCreatedRowHeadActions: false,     // 是否已经为grid列头创建了行前操作区列
                hasRowHeadActions: false,
                rows: [
                    //{
                    //    index: null,                 // 行下标。第几行。
                    //    /**
                    //     * headActions和endActions格式：
                    //     * {
                    //     *      type（必选）: 按钮（action）的类型。根据类型去生成对应的组件。例如：wf-diagram(查看定义的流程图），wf-active-diagram(当前记录对应的流程图）
                    //     *      #其他属性#： 这个是可选的。由具体功能动态生成，然后丢给具体生成组件的方法去获取，去调用。
                    //     * }
                    //     */
                    //    headActions: [],             // 每一行前面（一般是第二列）的操作区，或者按钮区。例如：查看工作流流程按钮等
                    //    endActions: []               // 每一行最后面（一般是最后一列）的操作区，或者按钮区。例如：查看工作流流程按钮等
                    //}
                ]
            },
            default: {
                css: {
                    columnHeadWidthPadding: 5,
                    gridTdPadding: 2
                }
            },
            /**
             *
             * @param {object} options
             * @param {string} options.id                       grid的容器id，非grid本身id
             * @param {string} options.component                组件name。默认是grid，但也有其他，例如：可编辑grid等。
             * @param {object} options.heightType               高度计算方式。value = page|dialog
             *                                                  page：根据document.body.scrollHeight去计算，一般用于整个页面的，列表页。
             *                                                  dialog：dialog中打开的，一般根据往上找到.ui-dialog-content的高度为基础。
             * @param {object} [options.model.fields]           列字段的定义,这个是为了匹配data的field key。 如果为空，会根据column自动生成。
             * @param {object} options.columns                  grid的列定义
             */
            create: function (options) {
                // 先合并默认值
                options = _.extend(_.clone(defaultOpts.init), options);
                gaeaValid.isNull({
                    check: options.id,
                    exception: "grid的容器id为空，无法构建容器！"
                });
                // 如果没有，创建fields
                if (!gaeaValid.isNotNullMultiple(options, ["model", "fields"])) {
                    var fields = _private.grid.getFields(options);
                    if (gaeaValid.isNull(options.model)) {
                        options.model = {};
                    }
                    options.model.fields = fields;
                }
                var $gridCt = $("#" + options.id);
                // 添加gaea grid标识
                if (!$gridCt.hasClass("gaea-grid-ct")) {
                    $gridCt.addClass("gaea-grid-ct");
                }
                // 缓存options
                $gridCt.data("options", options);

                if (!$.isArray(options.model.fields) || !$.isArray(options.columns)) {
                    throw "fields与columns必须是数组！";
                }
                if (options.model.fields.length !== options.columns.length) {
                    throw gaeaString.builder.simpleBuild("fields与columns长度必须一致！\nfields:\n%s \ncolumns:\n%s", JSON.stringify(options.model.fields), JSON.stringify(options.columns));
                }

                /* --------------------------------------------------------------------------------------------------------- 华丽的分割线 -------------------------- */
                $gridCt.append(
                    '<div class="gaea-grid">' +
                    '<div class="gaea-grid-header">' +
                    '<div id="tb-head" class="tb-head"></div>' +
                    '<div id="mars-tb-head-query" class="mars-tb-head-query">' +
                    '<div id="mars-headquery-inputs" class="mars-headquery-inputs">' +
                    '<div class="head-query-column select-all"></div>' +                            // 占位块。为了和列头对上。
                    '<div class="head-query-column row-headactions"></div>' +
                    '</div>' +                 // 占位块。为了和列头对上。
                    '<div id="query-actions" class="query-actions"><div></div></div>' +
                    '</div>' +
                    '</div>' +
                    '<div class="gaea-grid-body"><table class="tb-body"><tbody></tbody></table></div>' +
                    '<div class="gaea-grid-footer"><div id="pagination" class="pagination"></div></div>' +
                    '<input type="hidden" id="gridId" name="gridId" value="' + options.id + '">' +
                    '</div>');
                /* 创建列表的表头 */
                _grid._createTableHead(options);
                /* 创建列表的数据部分 */
                _private.grid.createData(options);
                /* 创建Grid的脚部分页部分 */
                _private.grid.createFooter(options);
                // 绑定各种事件
                _private.grid.bindingEvents(options);
                /**
                 * 初始化各种grid相关插件。放在全部数据初始化完成后，不需要每行都调用一次初始化。
                 * 例如：lightGallery图片浏览插件等
                 */
                _private.grid.initGridPlugins(options);
                /**
                 * 高级查询
                 */
                _query.view.init(options);
                /**
                 * 行操作区
                 */
                _private.grid.row.createActions(options);
                /* 设置Grid样式 */
                _private.grid.css.apply(options);
                /* 应用相关的效果，如复选框选中等 */
                _grid._applyJsStyle();
            },
            data: {
                /**
                 * 触发grid刷新。原有的数据将会被抛弃。
                 * @param {string} gridId       grid容器id
                 * @param {object} data         要刷新的数据
                 * @param {string} isNewData 数据回填的方式：替换or增量
                 */
                reset: function (gridId, data, isNewData) {
                    if (gaeaValid.isNull(isNewData)) {
                        isNewData = false;
                    }
                    if (gaeaValid.isNull(gridId)) {
                        throw "grid id为空，无法重置grid的数据！";
                    }
                    var $gridCt = $("#" + gridId);
                    // 触发刷新
                    $gridCt.trigger(gaeaEvents.DEFINE.UI.GRID.REFRESH_DATA, {
                        data: data,
                        // 是否额外的新增数据。这个不是指替换，指添加。
                        isNewData: isNewData
                    });
                }
            },
            /**
             * 获取grid中选中的行的数据对象。
             * @param argId
             * @returns {jsonData}
             */
            getSelected: function (argId) {
                //console.log("这里缺一个grid id");// TODO
                return _grid.cache.selectedRow;
            },
            _setSelectRow: function (row) {
                _grid.cache.selectedRow = row;
            },
            /**
             *
             * @param {object} opts
             * @param {string} opts.id                  grid id
             //* @param {object} opts.data  没用了
             * @private
             */
            _refreshData: function (opts) {
                var $gridCt = $("#" + opts.id);
                // 清空当前数据
                _private.grid.cleanData(opts);
                // 创建数据
                _private.grid.createData(opts);
                // 设置Grid样式
                _private.grid.css.apply(opts);
                // 绑定事件，例如：行前复选框
                _private.grid.bindingEvents(opts);
                // 创建行操作区
                _private.grid.row.createActions(opts);
                /**
                 * 初始化各种grid相关插件。放在全部数据初始化完成后，不需要每行都调用一次初始化。
                 * 例如：lightGallery图片浏览插件等
                 */
                _private.grid.initGridPlugins(opts);
            },
            /**
             * 生成列头的HTML，包括'选择全部'按钮。
             * @param {object} opts
             * @param {string} opts.id                  grid容器id
             * @param {string} opts.model.fields
             * @param {string} opts.columns
             * @private
             */
            _createTableHead: function (opts) {
                var $gridCt = $("#" + opts.id);
                var gridOptions = $gridCt.data().options;
                var $headCt = $gridCt.find(".tb-head").first();
                var fields = gridOptions.model.fields;
                var columns = gridOptions.columns;
                // 遍历每一列。遍历column等效于遍历field
                for (var j = 0; j < columns.length; j++) {
                    var tmpCol = columns[j];
                    var field = fields[j];
                    //var genClsName = autoGenClassNamePrefix + field.id;
                    var defaultClass = "column-header";
                    var columnHtmId = "gridcolumn-" + (j + 1); // column的序列化从1开始吧
                    // 如果是第一行，即第一次，生成列头
                    //if (i == 0) {
                    // 第一列，生成复选框。
                    if (j == 0) {
                        // checkAll html create
                        var checkAllTemplate = _.template(TEMPLATE.GRID.HEAD_CHECK_ALL_DIV);
                        $headCt.append(checkAllTemplate({
                            ID: opts.id + "-checkAll"
                        }));
                    }
                    $headCt.append("<div id='" + columnHtmId + "' class='" + defaultClass + "' data-field-id='" + field.id + "'>" + tmpCol.text + "</div>");
                }
                // 最后一个列头单元格。只是用于填充宽度。
                $headCt.append("<div class='" + defaultClass + " last' />");
                $headCt.append("</tr>");
            },
            /**
             * 创建列表页（grid）的数据部分（table row)，包括行前的复选框，
             *
             * @param {object} opts
             * @param {string} opts.id              grid容器id
             * @private
             */
            //_createTableData: function (opts) {
            //    var $gridCt = $("#" + opts.id);
            //    var $tbBody = $gridCt.find(".tb-body:first");
            //    var gridOptions = $("#" + opts.id).data().options;
            //    var data = gridOptions.data;
            //    var fields = gridOptions.model.fields;
            //    var columns = gridOptions.columns;
            //    // 清空一下。如果是刷新数据的时候需要。
            //    $tbBody.html("");
            //    // 先清空缓存
            //    _grid.cache.rows = [];
            //    // 遍历每一行数据
            //    for (var i = 0; i < data.length; i++) {
            //        var row = data[i];
            //        var checkBoxId = opts.id + "-cbx-" + i;
            //        $tbBody.append("<tr data-rowindex='" + (i + 1) + "'>");
            //        // 遍历每一列定义。遍历column等效于遍历field
            //        for (var j = 0; j < columns.length; j++) {
            //            var field = fields[j];
            //            var column = columns[j];
            //            var columnHtmId = "gridcolumn-" + (j + 1); // column的序列化从1开始吧
            //            var hasNotMatchedField = true;  // 有定义、没数据的字段。必须用空单元格填充。
            //            // 遍历数据（一行）中每一列的值，如果id和当前列id一致就填充进去。
            //            $.each(row, function (key, cell) {
            //                var cellText = cell;
            //                if (_.isObject(cell)) {
            //                    if (gaeaValid.isNull(cell.text)) {
            //                        console.warn("grid单元格是对象，但text却为空( text为系统默认的显示文本 )。 cell: %s", JSON.stringify(cell));
            //                    }
            //                    cellText = cell.text;
            //                }
            //                // 如果数据中的key和field（grid数据结构定义）中的设置一致（即类似data.columnname = grid.columnname），则把值复制到表格中。
            //                if (gaeaStringUtils.equalsIgnoreCase(field.id, key)) {
            //                    hasNotMatchedField = false; // 找到对应的列单元格数据
            //                    // 第一列，生成复选框。
            //                    if (j == 0) {
            //                        $tbBody.find("tr:last").append("<td class='checkbox'>" +
            //                            "<div class=\"row-check\">" +
            //                            "<input type='checkbox' id='" + checkBoxId + "' class='dark'>" +
            //                                // Label里面的都是复选框的效果元素。
            //                            "<label id='gaea-cb-label-" + i + "' for='" + checkBoxId + "'>" +       // label的for和checkbox的id绑定
            //                            "</label>" +
            //                            "</div>" +
            //                            "</td>");
            //                    }
            //                    // 转换日期格式
            //                    if (gaeaValid.isNotNull(cellText) && gaeaValid.isNotNull(column.datetimeFormat)) {
            //                        cellText = gaeaDT.getDate(cellText, {format: column.datetimeFormat});
            //                    }
            //                    $tbBody.find("tr:last").append("<td class='grid-td' data-columnid='" + columnHtmId + "'>" +
            //                        "<div class=\"grid-td-div\">" + cellText + "</div></td>");
            //                }
            //            });
            //            // 有定义列、没数据的（连数据项也没有，不是指空数据），也需要有个空列占位
            //            if (hasNotMatchedField) {
            //                $tbBody.find("tr:last").append("<td class='grid-td' data-columnid='" + columnHtmId + "'>" +
            //                    "<div class=\"grid-td-div\"></div></td>");
            //            }
            //        }
            //        // 给行末尾添加一个单元格，负责撑开剩余空间，让表格可以width 100%
            //        $tbBody.find("tr:last").append("<td></td>");
            //        // 生成行前操作区。判断是否有工作流。有的话生成'查看工作流'的按钮
            //        if (gridOptions.withWorkflow == true) {
            //            //if (_grid.options.withWorkflow == true) {
            //            if (gaeaValid.isNotNull(row.wfProcInstId)) {
            //                _grid.cache.rows.push({
            //                    index: i,                       // 从0开始的
            //                    headActions: [{
            //                        type: "wf-active-diagram",   // 这个是规范定义的，不能乱起。
            //                        wfProcInstId: row.wfProcInstId
            //                    }]
            //                });
            //                // 设置有行前操作区。关系到列头的排版。
            //                //if(!this.cache.hasRowHeadActions) {
            //                //    this.cache.hasRowHeadActions = true;
            //                //}
            //            } else {
            //                _grid.cache.rows.push(null);
            //            }
            //        }
            //        //if (i == 0) {
            //        //    $("#mars-tb-head").append("</tr>");
            //        //}
            //        $tbBody.append("</tr>");
            //    }
            //},
            /**
             * 设置Grid的样式。
             * 包括列头的宽度，行数据单元格的宽度，隐藏不要显示的列、计算整个列头的宽度（js）等。
             *
             * @param {object} opts
             * @param {string} opts.id              grid id
             * @param {string} opts.heightType
             * @private
             */
            //_applyCSS: function (opts) {
            //    var that = this;
            //    var $grid = $("#" + opts.id);
            //    var gridOptions = $grid.data().options;
            //    //var grid = $("#" + _grid.options.renderTo);
            //    //var gridHead = $(".gaea-grid-header .tb-head");
            //    var totalWidth = 0;
            //
            //    // 遍历column数组，设置显示样式（CSS等）
            //    $.each(gridOptions.columns, function (idx, obj) {
            //        var col = this;
            //        var gridColumnId = "gridcolumn-" + (idx + 1);
            //        if (gaeaValid.isNotNull(col.width) && $.isNumeric(col.width)) {
            //            // 设置单元格宽度
            //            that.column._setWidth(gridColumnId, col, opts);
            //            // 汇总宽度
            //            if (gaeaValid.isNotNull(col.hidden)) {
            //                totalWidth += parseInt(col.width);
            //            }
            //        }
            //        // 隐藏列（没宽度也可以）
            //        if (gaeaValid.isNotNull(col.hidden)) {
            //            that.column._hidden(gridColumnId, col, opts);
            //        }
            //    });
            //
            //    /* 设定data body高度 */
            //    _private.grid.css.setDataBodyHeight(opts);
            //
            //    /* 设置头部的宽度 */
            //    // 宽度没有页面宽，就100%吧
            //    //if (totalWidth < document.body.offsetWidth) {
            //    //    totalWidth = "100%";
            //    //}
            //    //GAEA_UI_DEFINE.UI.MAIN.getUIPageJQ().css("width", totalWidth);
            //
            //    _private.grid.css.setWidth({
            //        id: opts.id,
            //        totalWidth: totalWidth
            //    });
            //
            //    /* 根据行数据，确定列头是否需要行前操作区留白 */
            //    if (!_grid.cache.hasRowHeadActions) {
            //        $(".head-query-column.row-headactions").css("display", "none");
            //    }
            //},
            _applyJsStyle: function () {
                /**
                 * 复选框效果
                 */
                $('label').click(function () {

                    // find the first span which is our circle/bubble
                    var el = $(this).children('span:first-child');

                    // add the bubble class (we do this so it doesnt show on page load)
                    el.addClass('circle');

                    // clone it
                    var newone = el.clone(true);

                    // add the cloned version before our original
                    el.before(newone);

                    // remove the original so that it is ready to run on next click
                    $("." + el.attr("class") + ":last").remove();
                });
            },
            /**
             * 各种grid相关事件的绑定。例如：重新加载、按数据刷新（翻页等）、行选择等等。
             * 这个是通用的grid的各种事件的绑定，crud grid不是用这个方法。
             * @param {object} opts
             * @param {string} opts.id                  grid id
             * @private
             */
            _bindingEvents: function (opts) {
                //var that = this;
                var gridId = opts.id;
                //var gridId = options.renderTo;
                var $grid = $("#" + gridId);
                /**
                 * 注册行选择事件
                 */
                    //_grid.row.initSelectEvent();
                _private.event.bindSelectRow(opts);
                /**
                 * 注册重新刷新grid数据事件
                 */
                gaeaEvents.registerListener(gaeaEvents.DEFINE.UI.GRID.RELOAD, "#" + gridId, function (event, data) {
                    gridQuery.doQuery({
                        id: gridId
                    });
                });
                /**
                 * 注册根据数据（一般是查询结果）刷新grid事件
                 * 1. 根据传来的data数组刷新缓存的数据。
                 * 2. 根据传来的data数组，重建grid的数据区，包括重建CSS、分页、各种事件等。
                 */
                _private.event.bindRefreshData(opts);
                /**
                 * 注册行选择缓存所选行数据事件
                 */
                _private.event.registerCacheSelectRowData(opts);
                /**
                 * 注册选择全部事件
                 */
                _private.event.bindCheckAll(opts);

                /**
                 * 监听重置事件。例如在提交某个action后，ajax回来需要重置grid。
                 */
                _private.event.bindGridReset();

                // 初始化上下文插件（可以重复初始化，所以不怕）
                gaeaContext.init({
                    id: GAEA_UI_DEFINE.UI.GAEA_CONTEXT.ID
                });
            },
            /**
             * 构造Grid的脚部元素。即Pagination分页部分。
             * 本方法即用于创建，也用于刷新。
             *
             * @param {object} opts
             * @param {string} opts.id                  grid id
             * @private
             */
            _createFooter: function (opts) {
                var $gridCt = $("#" + opts.id);
                var $pageDiv = $gridCt.find(".gaea-grid-footer .pagination").first();
                var that = this;
                var page = parseInt($gridCt.data().options.page.page);
                var size = parseInt($gridCt.data().options.page.size);
                var rowCount = parseInt($gridCt.data().options.page.rowCount);
                //var page = parseInt(_grid.options.page.page);
                //var size = parseInt(_grid.options.page.size);
                //var rowCount = parseInt(_grid.options.page.rowCount);
                // 清空内容
                $pageDiv.html("");
                // 第一页
                $pageDiv.append("<div class='button'><span class=\"icon first\"><input type='hidden' value='" + 1 + "'></span></div>");
                // 上一页
                $pageDiv.append("<div class='button'><span class=\"icon previous\"><input type='hidden' value='" + (page - 1) + "'></span></div>");
                // 页码部分: 1 2 3 4 ...
                $pageDiv.append("<div class='page-numbers'></div>");
                // 生成页码
                var pageList = _private.pagination.getPageNoList({
                    page: page,
                    pageCount: $gridCt.data().options.page.pageCount,
                    listSize: GRID_DEFINE.PAGINATION.DEFAULT_PAGE_LIST_LENGTH
                });
                $.each(pageList, function (idx, val) {
                    var tempPage = parseInt(val);
                    if (tempPage != page) {
                        $pageDiv.find(".page-numbers").append('<span class="gaea-float-icon size-m">' + tempPage + "<input type='hidden' value='" + tempPage + "'></span>");
                        //}
                    } else {
                        $pageDiv.find(".page-numbers").append("<span class=\"gaea-float-icon selected size-m\">" + tempPage + "</span>");
                    }
                });

                // 下一页
                $pageDiv.append("<div class='button'><span class=\"icon next\"><input type='hidden' value='" + (page + 1) + "'></span></div>");     // p在循环最后自加了，这里就不用加了。

                // 最后一页
                $pageDiv.append("<div class='button'><span class=\"icon last\"><input type='hidden' value='" + (Math.ceil(rowCount / size)) + "'></span></div>");

                // 页显示数量
                $pageDiv.append(_private.pagination.getHowManyRecordsHtml(opts));

                // 生成：显示第1条至第20条 当前第几页
                var first = 1;
                if (page > 1) {
                    first += (page - 1) * size;
                }
                var last = page * size;
                //pageDiv.append("<span class=\"page-desc\">" + first + " - " + last + " 共 " + rowCount + "条数据</span>");
                // 生成html：1 - 20 共 2条数据
                var pageDescTemplate = _.template(TEMPLATE.PAGINATION.CT);
                $pageDiv.append(pageDescTemplate({
                    FIRST: first,
                    LAST: last,
                    ROW_COUNT: rowCount
                }));

                /* 【2】绑定事件 */
                // 点击页码事件
                $pageDiv.find("span:has(input)").click(function () {
                    var pageVal = $(this).children("input").val();
                    $gridCt.data().options.page.page = pageVal;     // 先赋值。待会查询完成后可用于刷新页码。
                    // 查询（下一页 etc……）
                    gridQuery.doSimpleQuery(opts);
                });
                // 点击展示每页多少条区域
                _private.event.pagination.bindPageSizeListClick(opts);
                // 点击每页多少条（某一项），触发后台查询。
                _private.event.pagination.bindPageSizeListItemClick();
            },
            /**
             * 创建行操作区，包括行前操作区（按钮区），行尾操作区（按钮区）
             *
             * @param {object} opts
             * @param {object} opts.id                  grid容器id，非grid id
             * @private
             */
            //_createRowActions: function (opts) {
            //    var $gridCt = $("#" + opts.id);
            //    var $gridHead = $gridCt.find(".tb-head").first();
            //    var that = this;
            //    if (gaeaValid.isNotNull(_grid.cache.rows)) {
            //        var hasShowDiagramDialog = false;
            //        var hasHeadActionAtAll = false;         // 如果true，即任意一行有行前操作区。作为增加操作区列头的标志。
            //        // 遍历每一行
            //        $.each(_grid.cache.rows, function (key, rowCache) {
            //            var actionsHtml = "";
            //            var hasHeadActions = false;     // 行前操作区开关
            //            // 遍历每行的行前操作区
            //            if (gaeaValid.isNull(rowCache)) {
            //                return;
            //            }
            //            $.each(rowCache.headActions, function (k, actionConfig) {
            //                if (gaeaValid.isNotNull(actionConfig)) {
            //                    // 是否有行前操作区
            //                    if (!hasHeadActions) {
            //                        hasHeadActions = true;
            //                        // 全局的，只赋值一次。
            //                        if (!hasHeadActionAtAll) {
            //                            hasHeadActionAtAll = true;
            //                            that.cache.hasRowHeadActions = true;
            //                        }
            //                    }
            //                    // 根据headActions的配置项，处理不同的类型
            //                    if (actionConfig.type == "wf-active-diagram") {    // 查看工作流流程图
            //                        // 是否创建全局的流程查看弹框
            //                        if (!hasShowDiagramDialog) {
            //                            hasShowDiagramDialog = true;
            //                        }
            //                        actionsHtml += "<a href='/admin/workflow/showdiagram/" + actionConfig.wfProcInstId + "'>查看流程</a>";
            //                    }
            //                } else {
            //                    return;
            //                }
            //            });
            //            // 生成行前操作区
            //            if (hasHeadActions) {
            //                $gridCt.find(".tb-body tr").eq(rowCache.index).children("td").eq(0).after("<td class=\"grid-td row-headactions\" data-columnid=\"headactions\">" + actionsHtml + "</td>");
            //            }
            //            // 遍历处理行尾操作区。未完成。。。
            //        });
            //        // 如果任意一行有行前操作区，增加列头。
            //        if (hasHeadActionAtAll && !that.cache.hasCreatedRowHeadActions) {
            //            that.cache.hasCreatedRowHeadActions = true;
            //            $gridHead.children(".select-all").after("<div id='row-headactions' class='row-headactions column-header'><p>操作</p></div>");
            //        }
            //        // TODO 如果有查看流程图的按钮，生成弹框DIV。未完成。。。
            //        //if (hasShowDiagramDialog) {
            //        //    $("body").append("<div id='wf-active-diagram-viewer'></div>");
            //        //    var dialog = ur.component.bridge.dialog.create({
            //        //        id: "wf-active-diagram-viewer",
            //        //        autoOpen: false,
            //        //        width: 500,
            //        //        height: 500,
            //        //        buttons: [{
            //        //            "确定": function () {
            //        //                $(this).gaeaDialog("close");
            //        //            }
            //        //        }]
            //        //    });
            //        //}
            //    }
            //},
            /**
             * 和列相关的操作
             */
            column: {
                root: this,
                /**
                 * 隐藏列
                 * @param {string} gridColumnId         table的td的data-columnid属性，标识第几列
                 * @param {string} columnConfig         列定义。在Schema中的定义。
                 * @param {object} opts
                 * @param {string} opts.id              grid id
                 * @private
                 */
                _hidden: function (gridColumnId, columnConfig, opts) {
                    var $grid = $("#" + opts.id);
                    var columnTDs = "td[data-columnid=" + gridColumnId + "]";
                    if (columnConfig.hidden) {
                        $grid.find(columnTDs).css("display", "none");
                        $grid.find("#" + gridColumnId).css("display", "none");
                    }
                },
                /**
                 * 设置列宽度
                 * @param gridColumnId table的td的data-columnid属性，标识第几列
                 * @param columnConfig 列定义。在Schema中的定义。
                 * @param {object} opts
                 * @param {string} opts.id              grid id
                 * @private
                 */
                _setWidth: function (gridColumnId, columnConfig, opts) {
                    var $gridCt = $("#" + opts.id);
                    var gridHead = $gridCt.find(".gaea-grid-header .tb-head").first();
                    var columnTDs = "td[data-columnid=" + gridColumnId + "]";
                    // 设置数据table的单元格的样式
                    // 单元格宽度，等于Schema设置的宽度 + 列头的左右padding - 单元格td自带的左右padding + 列头的列间边框（白缝）。因为左右一样，所以都是x2
                    var gridCellWidth = parseInt(columnConfig.width);
                    // 宽度设置。只设置第一行单元格td。
                    $gridCt.find(columnTDs + ":first").css("width", gridCellWidth);
                    // 设置列头的样式
                    gridHead.children("#" + gridColumnId).css("width", columnConfig.width);
                }
            }
        };
        /**
         * 和grid的行相关的一切
         */
        _grid.html = {
            /**
             * 初始化单元格是图片类型的。
             * 会做类型判断。
             * @param {jqObject} $td
             * @param {string} columnDataType
             * @param {string} columnImgSrcPrefix
             * @param {string} columnImgSrcSuffix
             * @param {string} columnImgThumbnailSuffix
             * @param {string} [cellValue]
             */
            //initImgTd: function ($td, columnDataType, columnImgSrcPrefix, columnImgSrcSuffix, columnImgThumbnailSuffix, cellValue) {
            //    //createTdContent: function ($td, opts) {
            //    // 非图片列的，略过
            //    if (!gaeaString.equalsIgnoreCase(columnDataType, GAEA_UI_DEFINE.UI.DATA.DATA_TYPE_IMG)) {
            //        return;
            //    }
            //    // init img column
            //    var $cellCt = $td.children(".grid-td-div");
            //    var formattedImgValue = tools.imgTextFormat(cellValue);
            //    $cellCt.html(formattedImgValue); // 必须先把值填充进去！
            //
            //    // add img tag class
            //    $cellCt.addClass("img-cell");
            //
            //    $cellCt.find("img").each(function (i, element) {
            //        var $img = $(this);
            //        // 原图链接
            //        var src = $img.attr("src");
            //        var thumbnailSrc = src; // 缩略图src
            //        // 加前缀
            //        if (gaeaValid.isNotNull(columnImgSrcPrefix)) {
            //            src = columnImgSrcPrefix + src;
            //        }
            //        // 加后缀
            //        if (gaeaValid.isNotNull(columnImgSrcSuffix)) {
            //            src = src + columnImgSrcSuffix;
            //        }
            //        // 缩略图, 叠加一般性后缀
            //        if (gaeaValid.isNotNull(columnImgThumbnailSuffix)) {
            //            thumbnailSrc = src + columnImgThumbnailSuffix;
            //        }
            //        // 修改src为缩略图
            //        $img.attr("src", thumbnailSrc);
            //        // 包上<a>标签, lightGallery控件需要
            //        $img.wrap('<a href="' + src + '">');
            //    });
            //    //}
            //}
        };

        // 可编辑表格功能
        var _crudGrid = {
            data: {
                /**
                 * crud grid的数据初始化的入口.这里前提是数据已经进入了grid的dom对象的缓存了。
                 * @param {object} opts
                 * @param {string} opts.id                      grid容器id
                 * @param {string} opts.queryAction             查询的操作类型。是过滤数据，还是重置。value= query-action-filter|...
                 */
                init: function (opts) {
                    var $gridCt = $("#" + opts.id);
                    var gridOptions = $gridCt.data("options");
                    var allData = gridOptions.data;
                    var filterData = gridOptions.filterData;
                    /**
                     * if 有过滤的数据
                     *      按过滤后的数据填充
                     * else
                     *      填充普通的数据（可能是编辑，从服务端带过来的）
                     */
                    if (gaeaString.equalsIgnoreCase(opts.queryAction, "query-action-filter")) {
                        // 复制一个，否则一些配置项会进缓存
                        opts = _.clone(opts);
                        // 过滤的，不需要把数据放入data中。否则重置后数据会不准确。
                        //opts.isNewData = false;
                        _crudGrid.data._initData(opts, filterData);
                    } else {
                        _crudGrid.data._initData(opts, allData);
                    }
                    // 尾部添加一个空的
                    // create an empty object
                    //opts.rowIndex = 0;
                    //opts.rowData = _private.crudGrid.data.createEmpty(opts);
                    //_private.crudGrid.data.addOne(opts);
                },
                /**
                 * 构造crud grid里的数据。注意这是纯粹的数据构造，不会再做其他检查。所以不建议对外调用。
                 * @param {object} opts
                 * @param {string} opts.queryAction             查询的操作类型。是过滤数据，还是重置。value= query-action-filter|...
                 * @param {object[]} data                       grid的数据。
                 * @private
                 */
                _initData: function (opts, data) {
                    var $gridCt = $("#" + opts.id);
                    var gridOptions = $gridCt.data("options");
                    // 刚创建crud grid的时候，可能没有数据，所以就忽略
                    // 还有一种，就是过滤查询后的结果就是空。
                    if (gaeaValid.isNull(data)) {
                        // 清除数据
                        _private.grid.cleanData(opts);
                        return;
                    }
                    if (!_.isArray(data)) {
                        throw "输入data非数组，无法初始化grid的数据部分。";
                    }
                    $.each(data, function (rowIndex, rowObj) {
                        var options = {
                            id: gridOptions.id,
                            name: gridOptions.name,
                            rowIndex: rowIndex,
                            rowData: rowObj,
                            model: gridOptions.model,
                            columns: gridOptions.columns,
                            queryAction: opts.queryAction
                        };
                        if (gaeaValid.isNotNull(opts.isNewData)) {
                            options.isNewData = opts.isNewData;
                        }
                        // 添加行
                        _crudGrid.html.addTr(options);
                    });
                },
                /**
                 * 刷新某个字段的值到缓存中。
                 * @param {object} opts
                 * @param {string} opts.id                      grid容器id
                 * @param {string} opts.target                  包含值的目标对象。例如：一个input。
                 */
                refreshOneField: function (opts) {
                    if (gaeaValid.isNull(opts.target)) {
                        throw "目标对象为空，无法刷新crud grid缓存的数据。";
                    }
                    var $gridCt = $("#" + opts.id);
                    var gridOptions = $gridCt.data().options;
                    // 列定义
                    var columns = gridOptions.columns;
                    //var $tbBody = $gridCt.find(".tb-body:first");
                    var $target = $(opts.target);
                    var $td = $target.parents("td:first");
                    var $tr = $td.parent();// 提取当前单元格是第几列
                    // 第几列
                    var columnIndex = parseInt(_s.replaceAll($td.data("columnid"), "gridcolumn-", "")) - 1;
                    // 第几行
                    var rowIndex = parseInt($tr.data("rowindex")) - 1;
                    // 获取定义的列的字段名, 和值
                    var fieldName = columns[columnIndex].name;
                    var fieldValue = $target.val();
                    // set data
                    var rowObj = gridOptions.data[rowIndex];
                    rowObj[fieldName] = fieldValue;
                },
                /**
                 * 创建一个空对象。这个主要是为了往crud grid插入一个空行。
                 * @param {object} opts
                 * @param {string} opts.id                      grid容器id
                 * @param {object} opts.model.fields            列字段的定义,这个是为了匹配data的field key。
                 */
                createEmpty: function (opts) {
                    var result = {};
                    $.each(opts.model.fields, function (i, iValue) {
                        var field = this;
                        result[field.id] = "";
                    });
                    return result;
                }
                /**
                 * 获取grid数据区的数据。
                 * @param {object} opts
                 * @param {string} opts.id                          grid容器id。
                 */
                //getData: function (opts) {
                //    var $gridCt = $("#" + opts.id);
                //    var columns = $gridCt.data("options").columns;
                //    var $tbBody = $gridCt.find(".tb-body:first");
                //    var result = [];
                //    $tbBody.find("tr").each(function (i, trObj) {
                //        var $tr = $(trObj);
                //        var dataItem = {};
                //        $tr.children("td").each(function (j, tdObj) {
                //            var $td = $(tdObj);
                //            // 提取当前单元格是第几列
                //            var columnIndex = parseInt(_s.replaceAll($td.data("columnid"), "gridcolumn-", "")) - 1;
                //            // 获取column定义。不直接用td里面的input定义的name
                //            var column = columns[columnIndex];
                //            if ($td.find("input").length > 0) {
                //                dataItem[column.name] = $td.find("input").val();
                //            } else {
                //                dataItem[column.name] = $td.find(".grid-td-div").text();
                //            }
                //        });
                //        result.push(dataItem);
                //    });
                //    return result;
                //}
            },
            /**
             * 一般用于crud-grid的“添加”按钮。每次添加都是append。
             * 这个是对外的接口。和data.addOne的区别是，这个整合了创建空对象和添加两个动作。
             * 这个会把新创建的对象，插入数据数组的尾部。
             * @param {object} opts
             * @param {string} opts.id                          grid容器id
             * @param {string} [opts.isNewData=true]            如果true，会添加到缓存的data中。如果是filter方式，应该为false。
             */
            addNewOne: function (opts) {
                // 基于原来的配置缓存（列定义等）来创建一个新记录。不会根据新传入的来创建。
                var gridOptions = $("#" + opts.id).data("options");
                // 复制一个。不然会把数据带到缓存中去。
                opts = _.clone(gridOptions);
                // create an empty object
                opts.rowData = _crudGrid.data.createEmpty(opts);
                // add one
                _crudGrid.html.addTr(opts);
                // 是否新的行。会加入到grid的总数据集中。
                //if(opts.isNewData) {
                gridOptions.data.push(opts.rowData);
                //}
                // 给整个grid增加第一条记录的时候，才需要初始化
                if (gaeaValid.isNotNull(gridOptions.data) && gridOptions.data.length == 1) {
                    // 设置Grid样式
                    _private.grid.css.apply(opts);
                }
                // 绑定事件，例如：行前复选框
                _crudGrid.event.bindRowEvents(opts);
            },
            /**
             * 删除指定的行数据。
             * @param {string} opts.id                      grid容器id
             * @param {string} opts.
             */
            deleteSelected: function (opts) {
                var selectedRows = gaeaContext.getValue(GAEA_UI_DEFINE.UI.GAEA_CONTEXT.CACHE_KEY.SELECTED_ROWS, opts.id);
                if (_.isArray(selectedRows)) {
                    var $gridCt = $("#" + opts.id);
                    var allData = $gridCt.data("options").data;
                    // 倒序。排序并颠倒。
                    var sortRows = _.sortBy(selectedRows, "origIndex").reverse();
                    // 【重要】按倒序删除，否则删了1，整个列表的长度就缩短了，后面的按index删除就不对了。
                    $.each(sortRows, function (i, row) {
                        var origIndex = row.origIndex;
                        if (_.isNumber(origIndex)) {
                            // 从缓存的总数据中，删除指定的行
                            allData.splice(origIndex, 1);
                        }
                    });
                    // 触发刷新
                    $gridCt.trigger(gaeaEvents.DEFINE.UI.GRID.REFRESH_DATA, {
                        data: allData,
                        isNewData: false
                    });
                }

            },
            /**
             * 绑定crud grid的相关事件。
             * @param {object} opts
             */
            bindingEvents: function (opts) {

                var gridId = opts.id;
                var $grid = $("#" + gridId);
                /**
                 * 注册行选择事件
                 */
                    //_grid.row.initSelectEvent();
                _private.event.bindSelectRow(opts);
                /**
                 * 注册重置grid数据事件
                 * TODO 这个可以保留，但得进一步处理
                 */
                //gaeaEvents.registerListener(gaeaEvents.DEFINE.UI.GRID.RELOAD, "#" + gridId, function (event, data) {
                //    gridQuery.doQuery({
                //        id: gridId
                //    });
                //});


                /**
                 * 注册根据数据（一般是查询结果）刷新grid事件
                 */
                _private.event.bindRefreshData(opts);

                /**
                 * 注册行选择缓存所选行数据事件
                 */
                _private.event.registerCacheSelectRowData(opts);

                /**
                 * 注册选择全部事件
                 */
                _private.event.bindCheckAll(opts);

                // 初始化上下文插件（可以重复初始化，所以不怕）
                gaeaContext.init({
                    id: GAEA_UI_DEFINE.UI.GAEA_CONTEXT.ID
                });
            },
            event: {
                bindRowEvents: function (opts) {
                    /**
                     * 注册行选择事件
                     */
                    _private.event.bindSelectRow(opts);
                }
                /**
                 *
                 * @param {object} opts
                 * @param {string} opts.id                          grid容器id。
                 */
                //bindRefreshCacheData: function (opts) {
                //    /**
                //     * 这个比较简单，就是读取整个grid数据区的数据，重建cache的data。
                //     * 这个一般用在crud grid，因为数据区可能被编辑过。
                //     */
                //    gaeaEvents.registerListener(gaeaEvents.DEFINE.UI.GRID.SYNC_GRID_DATA, "#" + opts.id, function (event, data) {
                //        var data = _private.crudGrid.data.getData(opts);
                //        var $gridCt = $("#"+opts.id);
                //        $gridCt.data("options").filterData = data;
                //    });
                //}
            },
            html: {
                /**
                 * 添加行HTML！注意，这里只处理HTML！
                 * 把一行数据添加到grid的数据区中，用于包括：
                 * - 刚开始初始化数据区的时候
                 * - 过滤后重新填充数据区数据
                 * - 新增一行空白数据的时候
                 * @param {object} opts
                 * @param {string} opts.id                          crud grid容器。这个是最外层的容器，里面应该还有toolbar和真正grid的容器。
                 * @param {string} opts.name                        crud grid的编辑的所有数据的根name
                 * @param {int} opts.rowIndex                       第几行。从0开始。有输入就以输入为主。否则根据当前缓存数据数组+1.
                 * @param {object} opts.rowData                     一行的数据。
                 * @param {int} [opts.rowData.origIndex]            如果是检索过的数据，会有原数组中位置的index。这个会覆盖rowIndex。
                 * @param {string} [opts.isNewData=true]            如果true，会添加到缓存的data中。如果是filter方式，应该为false。
                 * @param {string} opts.queryAction                 查询的操作类型。是过滤数据，还是重置。value= query-action-filter|...
                 */
                addTr: function (opts) {
                    opts = _.extend(_.clone(defaultOpts.crudGrid.addNewOne), opts);
                    var $gridCt = $("#" + opts.id);
                    var gridOptions = $gridCt.data().options;
                    var $tbBody = $gridCt.find(".tb-body:first");
                    // 获取row index
                    // 优先级：原始序号(必须是filter查询) > 指定序号(批量插入指定) > 当前最后一条(如果可以确定) > 第0条
                    var rowIndex = 0;
                    if (gaeaValid.isNotNull(opts.rowData.origIndex) && gaeaString.equalsIgnoreCase(opts.queryAction, "query-action-filter")) {
                        rowIndex = opts.rowData.origIndex;
                    } else if (gaeaValid.isNotNull(opts.rowIndex)) {
                        rowIndex = opts.rowIndex;
                    } else if (gaeaValid.isNotNull(gridOptions.data)) {
                        rowIndex = gridOptions.data.length;
                    }
                    // 生成tr
                    $tbBody.append("<tr data-rowindex='" + (rowIndex + 1) + "'>");
                    var $lastTr = $tbBody.find("tr:last");

                    // 添加到缓存的data中
                    if (gaeaValid.isNull(gridOptions.data)) {
                        gridOptions.data = [];
                    }

                    /**
                     * 遍历字段定义（这个基本都是要展示的，如果遍历column有些不需要展示就得跳过，比较麻烦），生成行的每个单元格。
                     */
                    $.each(gridOptions.model.fields, function (i, iValue) {
                        /**
                         * @type {GaeaColumn}
                         */
                        var column = _.extend(_.clone(defaultOpts.column), gridOptions.columns[i]);
                        var field = this;
                        // create a td
                        _crudGrid.html.addTd($lastTr, column, field, rowIndex, i, opts.rowData, opts);
                    });

                    // 给行末尾添加一个单元格，负责撑开剩余空间，让表格可以width 100%
                    $tbBody.find("tr:last").append("<td></td>");
                    // 生成行前操作区。判断是否有工作流。有的话生成'查看工作流'的按钮
                    _wf.html.addTrButtons(rowIndex, opts);

                    $tbBody.append("</tr>");
                },
                /**
                 * 添加可编辑表格（crud-grid）的一个单元格. copy from addTr.
                 * @param {jqObject} $tr            jQuery对象。行。新增的td就会加在这里面。
                 * @param {GaeaColumn} column       服务端返回的列定义对象。
                 * @param {object} field            服务端返回的字段定义。
                 * @param {string} rowIndex         第几行。关系到行前复选框的name里面的序号，和行input的name里面的序号等
                 * @param {string} columnIndex      第几列。
                 * @param {object} rowData          行数据。
                 * @param {object} opts             其他的配置
                 * @param {string} opts.id          grid的容器id。对于crud-grid，是gaea-ui-crud-grid定义位置id。
                 */
                addTd: function ($tr, column, field, rowIndex, columnIndex, rowData, opts) {

                    var columnHtmId = "gridcolumn-" + (columnIndex + 1); // column的序列化从1开始吧
                    // 生成CheckBox id
                    var checkBoxId = opts.id + "-cbx-" + rowIndex;
                    // 第一列，生成复选框。
                    if (columnIndex == 0) {
                        $tr.append("<td class='checkbox'>" +
                            "<div class=\"row-check\">" +
                            "<input type='checkbox' id='" + checkBoxId + "' class='dark'>" +
                                // Label里面的都是复选框的效果元素。
                            "<label id='gaea-cb-label-" + columnIndex + "' for='" + checkBoxId + "'>" +       // label的for和checkbox的id绑定
                            "</label>" +
                            "</div>" +
                            "</td>");
                    }

                    //var hasNotMatchedField = true;  // 有定义、没数据的字段。必须用空单元格填充。
                    // create input 'name'
                    var inputName = gaeaString.builder.simpleBuild("%s[%s].%s", opts.name, rowIndex, field.id);
                    var value;

                    // 初始单元格的容器
                    var $td = $(gaeaString.builder.simpleBuild('<td class="grid-td" data-columnid="%s"><div class="grid-td-div"></div></td>', columnHtmId));
                    $tr.append($td);

                    // 获取当前要填充的值
                    // 遍历数据（一行）中每一列的值，如果id和当前列id一致就是。
                    $.each(rowData, function (key, val) {
                        //var cellText = cell;
                        //if (_.isObject(cell)) {
                        //    if (gaeaValid.isNull(cell.text)) {
                        //        console.warn("grid单元格是对象，但text却为空( text为系统默认的显示文本 )。 cell: %s", JSON.stringify(cell));
                        //    }
                        //    cellText = cell.text;
                        //}
                        // 如果数据中的key和field（grid数据结构定义）中的设置一致（即类似data.columnname = grid.columnname），则把值复制到表格中。
                        if (gaeaString.equalsIgnoreCase(field.id, key)) {
                            value = val;
                        }
                    });
                    // 有定义列、没数据的（连数据项也没有，不是指空数据），也需要有个空列占位

                    // 填充TD里面的内容。包括是否可编辑（创建input输入框）、是否初始化日期控件、是否引用了上下文的值等。
                    _crudGrid.html.createTdContent($td, {
                        id: opts.id,
                        inputId: inputName,
                        column: column,
                        field: field,
                        inputValue: value
                    });

                },
                /**
                 * 填充TD里面的内容。包括是否可编辑（创建input输入框）、是否初始化日期控件、是否引用了上下文的值等。
                 * @param {jqObject} $td
                 * @param {object} opts
                 * @param {string} opts.id                  grid容器id
                 * @param {string} opts.inputId             生成的input框的id和name（共用）
                 * @param {string} opts.inputValue
                 * @param {GaeaColumn} opts.column
                 * @param {object} field                    服务端返回的字段定义。
                 * @private
                 */
                createTdContent: function ($td, opts) {
                    var $cellCt = $td.children(".grid-td-div");
                    var value = opts.inputValue;
                    var column = opts.column;

                    // 通过工具方法，获取真正的值。因为gaea的值还有可能是表达式等……
                    value = gaeaData.utils.getRealValue(value, opts.column.value);

                    /**
                     * 初始化 数据集下拉框/输入框/...
                     */
                    if (gaeaValid.isNotNull(opts.column.dataSetId)) {
                        if (gaeaValid.isNull(opts.column.component)) {
                            // 初始化，非空就好了
                            opts.column.component = {};
                        }
                        require(["gaeajs-ui-select2"], function (gaeaSelect2) {
                            gaeaSelect2.createAndInit({
                                jqSelector: $cellCt,
                                htmlId: opts.inputId,
                                htmlName: opts.inputId,
                                dataSetId: opts.column.dataSetId,
                                fieldId: opts.field.id,
                                // --------->>>> 下面是init方法需要配置项
                                // 这个是创建了<select>元素后，元素的选择器
                                selectJqSelector: "#" + gaeaString.format.getValidName(opts.inputId),
                                default: opts.column.component.default,
                                multiple: opts.column.component.multiple,
                                //component: opts.column.component,
                                value: value
                            });
                        });
                    } else if (gaeaString.equalsIgnoreCase(opts.column.dataType, GAEA_UI_DEFINE.UI.DATA.DATA_TYPE_IMG)) {
                        /**
                         * 初始化图片列
                         */
                            //$cellCt.html(value); // 必须先把值填充进去！
                        gaeaUI.img.init($td.children(".grid-td-div"), {
                            dataType: column.dataType,
                            imgSrcPrefix: column.imgSrcPrefix,
                            imgSrcSuffix: column.imgSrcSuffix,
                            imgThumbnailSuffix: column.imgThumbnailSuffix,
                            value: value
                        });
                        //_grid.html.initImgTd($td, column.dataType, column.imgSrcPrefix, column.imgSrcSuffix, column.imgThumbnailSuffix, value);
                    } else {
                        // 其他的，统统输入框
                        // 无论是否编辑都需要用input添放数据。这样提交的时候才会带上数据。
                        $cellCt.append(gaeaInput.create({
                            id: opts.inputId,
                            name: opts.inputId,
                            class: "crud-grid-input",
                            dataType: opts.column.dataType,
                            value: value,
                            editable: opts.column.editable,
                            validator: opts.column.validator,// 校验定义
                            onChange: function (event) {
                                // 刷新缓存的值
                                _crudGrid.data.refreshOneField({
                                    id: opts.id,
                                    target: this // 当前change的对象
                                });
                            }
                        }));
                    }

                    //var $tdInput = $("#" + gaeaString.format.getValidName(opts.inputId));

                    // 如果不可编辑
                    if (!opts.column.editable) {
                        $td.addClass("non-editable");
                        /**
                         * if 是图片的话，处理图片。
                         * 初始化lightGallery图片查看插件放到整个table初始化完成后。
                         */
                        //if (gaeaString.equalsIgnoreCase(opts.column.dataType, GAEA_UI_DEFINE.UI.DATA.DATA_TYPE_IMG)) {
                        //    //$td.addClass("");
                        //
                        //    $cellCt.find("img").each(function (i, element) {
                        //        var $img = $(this);
                        //        // 原图链接
                        //        var src = $img.attr("src");
                        //        var thumbnailSrc = src; // 缩略图src
                        //        // 加前缀
                        //        if (gaeaValid.isNotNull(opts.column.imgSrcPrefix)) {
                        //            src = opts.column.imgSrcPrefix + src;
                        //        }
                        //        // 加后缀
                        //        if (gaeaValid.isNotNull(opts.column.imgSrcSuffix)) {
                        //            src = src + opts.column.imgSrcSuffix;
                        //        }
                        //        // 缩略图, 叠加一般性后缀
                        //        if (gaeaValid.isNotNull(opts.column.imgThumbnailSuffix)) {
                        //            thumbnailSrc = src + opts.column.imgSrcSuffix;
                        //        }
                        //        // 修改src为缩略图
                        //        $img.attr("src", thumbnailSrc);
                        //        // 包上<a>标签, lightGallery控件需要
                        //        $img.wrap('<a href="' + src + '">');
                        //    });
                        //}
                    }
                }
            }
        };

        /**
         * 私有方法
         */
        var _private = {
            grid: {
                /**
                 * 获取grid缓存中行数据（的一部分）。
                 * grid在初始化后，会把所有行数据的json保留。然后，你可以通过index等方式去获取完整的行数据。
                 * @param {object} opts                     为空即获取全部。
                 * @param {string} opts.id                  grid id
                 * @param {number} opts.index               第几行数据。以数组下标的方式，从0开始。
                 * @param {number[]} opts.indexes           某些行数据。以数组下标的方式，从0开始。
                 */
                getRowDatas: function (opts) {
                    var gridOptions = $("#" + opts.id).data().options;
                    var result = gridOptions.data;
                    if (gaeaValid.isNull(opts)) {
                        return result;
                    }
                    if (gaeaValid.isNotNull(opts.index)) {
                        if (_.isNumber(opts.index)) {
                            return result[opts.index];
                        }
                    }
                    if (gaeaValid.isNotNull(opts.indexes)) {
                        if (_.isArray(opts.indexes)) {
                            var someRows = new Array();
                            $.each(opts.indexes, function (i, iValue) {
                                if (_.isNumber(iValue)) {
                                    var rowObj = result[iValue];
                                    // 设定在缓存数据中的真正index
                                    rowObj.origIndex = iValue;
                                    someRows.push(rowObj);
                                }
                            });
                            return someRows;
                        }
                    }
                },
                /**
                 * 获取某grid选中的所有行的index。index可以用于获取对应的行json数据。
                 * @param {object} opts
                 * @param {string} opts.id              grid id
                 * @returns {int[]} indexes
                 */
                getSelectedIndexes: function (opts) {
                    var rowIndexes = new Array();
                    $("#" + opts.id).find(".row-check").children("input:checkbox").each(function (i, iValue) {
                        // 忽略第一个。第一个是check all
                        if (i > 0) {
                            var $checkbox = $(this);
                            if ($checkbox.is(":checked")) {
                                var $tr = $checkbox.parents("tr").first();
                                var rowIndex = $tr.data("rowindex");
                                // grid缓存的row index是从1开始，要去获取row data需要从0开始
                                rowIndexes.push(parseInt(rowIndex) - 1);
                                //console.debug(rowIndex);
                            }
                        }
                    });
                    return rowIndexes;
                },
                /**
                 * 把整个grid恢复到新打开的样子。这个，暂时只需要重置UI。后面再慢慢加即可。
                 * @param {object} [opts]           配置项
                 */
                reset: function (opts) {
                    // 重置UI
                    _private.grid.resetUI(opts);
                    // 重置数据
                    _private.grid.resetData();
                },
                /**
                 * 数据的重置。
                 * @param {object} [opts]           暂时没用。
                 */
                resetData: function (opts) {
                    // 清空缓存上下文的数据。例如：选中的行数据等
                    gaeaContext.clear();
                },
                /**
                 * 把UI恢复原状。一般是在提交某操作后，回来需要重新刷新页面。
                 * @param {object} opts
                 * @param {string} opts.id              grid容器id
                 */
                resetUI: function (opts) {
                    var $grid = $("#" + opts.id);
                    // 如果已经选中，改为未选中
                    $grid.find(".row-check").children(":checkbox").prop("checked", false);
                },
                /**
                 * 根据columns获取fields定义。
                 * 主要针对例如crud grid的，服务端没有给出fields，简单来说，就从columns生成得了。
                 * @param {object} opts
                 * @param {object[]} opts.columns
                 * @returns {Array}
                 */
                getFields: function (opts) {
                    var fields = [];
                    if (_.isArray(opts.columns)) {
                        $.each(opts.columns, function (i, iValue) {
                            var column = this;
                            fields.push({
                                id: column.name
                            });
                        });
                    }
                    return fields;
                },
                /**
                 * 初始化grid的数据部分（包括html、各种操作按钮等）
                 * @param {object} opts
                 * @param {string} opts.id                      grid容器id
                 * @param {string} opts.queryAction             查询的操作类型。是过滤数据，还是重置。value= query-action-filter|...
                 */
                createData: function (opts) {
                    var $gridCt = $("#" + opts.id);
                    // 当前grid组件类型
                    var componentName = $gridCt.data("options").component;
                    // 清除数据
                    _private.grid.cleanData(opts);
                    // 初始化数据
                    if (gaeaString.equalsIgnoreCase(componentName, GAEA_UI_DEFINE.UI.COMPONENT.CRUD_GRID)) {
                        /**
                         * crud grid
                         */
                        _crudGrid.data.init(opts);
                    } else {
                        _private.grid.createTableData(opts);
                    }
                },
                /**
                 * 清除grid数据。
                 * @param opts
                 */
                cleanData: function (opts) {
                    var $gridCt = $("#" + opts.id);
                    var $tbBody = $gridCt.find(".tb-body:first");
                    // 清空一下。如果是刷新数据的时候需要。
                    $tbBody.html("");
                },
                /**
                 * 创建列表页（grid）的数据部分（table row)，包括行前的复选框，
                 *
                 * @param {object} opts
                 * @param {string} opts.id              grid容器id
                 * @private
                 */
                createTableData: function (opts) {
                    var $gridCt = $("#" + opts.id);
                    var $tbBody = $gridCt.find(".tb-body:first");
                    var gridOptions = $("#" + opts.id).data().options;
                    var data = gridOptions.data;
                    var fields = gridOptions.model.fields;
                    var columns = gridOptions.columns;
                    //// 清空一下。如果是刷新数据的时候需要。
                    //$tbBody.html("");
                    // 先清空缓存
                    _grid.cache.rows = [];
                    // 遍历每一行数据
                    for (var i = 0; i < data.length; i++) {
                        var row = data[i];
                        var checkBoxId = opts.id + "-cbx-" + i;
                        $tbBody.append("<tr data-rowindex='" + (i + 1) + "'>");
                        // 遍历每一列定义。遍历column等效于遍历field
                        for (var j = 0; j < columns.length; j++) {
                            var field = fields[j];
                            var column = columns[j];
                            var columnHtmId = "gridcolumn-" + (j + 1); // column的序列化从1开始吧
                            var hasNotMatchedField = true;  // 有定义、没数据的字段。必须用空单元格填充。
                            // 遍历数据（一行）中每一列的值，如果id和当前列id一致就填充进去。
                            $.each(row, function (key, cell) {
                                var cellText = cell;
                                if (_.isObject(cell)) {
                                    if (gaeaValid.isNull(cell.text)) {
                                        console.warn("grid单元格是对象，但text却为空( text为系统默认的显示文本 )。 cell: %s", JSON.stringify(cell));
                                    }
                                    cellText = cell.text;
                                }
                                // 如果数据中的key和field（grid数据结构定义）中的设置一致（即类似data.columnname = grid.columnname），则把值复制到表格中。
                                if (gaeaString.equalsIgnoreCase(field.id, key)) {
                                    hasNotMatchedField = false; // 找到对应的列单元格数据
                                    // 第一列，生成复选框。
                                    if (j == 0) {
                                        $tbBody.find("tr:last").append("<td class='checkbox'>" +
                                            "<div class=\"row-check\">" +
                                            "<input type='checkbox' id='" + checkBoxId + "' class='dark'>" +
                                                // Label里面的都是复选框的效果元素。
                                            "<label id='gaea-cb-label-" + i + "' for='" + checkBoxId + "'>" +       // label的for和checkbox的id绑定
                                            "</label>" +
                                            "</div>" +
                                            "</td>");
                                    }
                                    // 转换日期格式
                                    if (gaeaValid.isNotNull(cellText) && gaeaValid.isNotNull(column.datetimeFormat)) {
                                        cellText = gaeaDT.getDate(cellText, {format: column.datetimeFormat});
                                    }
                                    // create td
                                    var $td = $("<td class='grid-td' data-columnid='" + columnHtmId + "'><div class=\"grid-td-div\">" + cellText + "</div></td>");
                                    // append td
                                    $tbBody.find("tr:last").append($td);
                                    // create td content
                                    if (gaeaString.equalsIgnoreCase(column.dataType, GAEA_UI_DEFINE.UI.DATA.DATA_TYPE_IMG)) {
                                        //_grid.html.initImgTd($td, column.dataType, column.imgSrcPrefix, column.imgSrcSuffix, column.imgThumbnailSuffix, cellText);
                                        gaeaUI.img.init($td.children(".grid-td-div"), {
                                            dataType: column.dataType,
                                            imgSrcPrefix: column.imgSrcPrefix,
                                            imgSrcSuffix: column.imgSrcSuffix,
                                            imgThumbnailSuffix: column.imgThumbnailSuffix,
                                            value: cellText
                                        });
                                    }
                                }
                            });
                            // 有定义列、没数据的（连数据项也没有，不是指空数据），也需要有个空列占位
                            if (hasNotMatchedField) {
                                $tbBody.find("tr:last").append("<td class='grid-td' data-columnid='" + columnHtmId + "'>" +
                                    "<div class=\"grid-td-div\"></div></td>");
                            }
                        }
                        // 给行末尾添加一个单元格，负责撑开剩余空间，让表格可以width 100%
                        $tbBody.find("tr:last").append("<td></td>");
                        // 生成行前操作区。判断是否有工作流。有的话生成'查看工作流'的按钮
                        if (gridOptions.withWorkflow == true) {
                            //if (_grid.options.withWorkflow == true) {
                            if (gaeaValid.isNotNull(row.wfProcInstId)) {
                                _grid.cache.rows.push({
                                    index: i,                       // 从0开始的
                                    headActions: [{
                                        type: "wf-active-diagram",   // 这个是规范定义的，不能乱起。
                                        wfProcInstId: row.wfProcInstId
                                    }]
                                });
                                // 设置有行前操作区。关系到列头的排版。
                                //if(!this.cache.hasRowHeadActions) {
                                //    this.cache.hasRowHeadActions = true;
                                //}
                            } else {
                                _grid.cache.rows.push(null);
                            }
                        }
                        //if (i == 0) {
                        //    $("#mars-tb-head").append("</tr>");
                        //}
                        $tbBody.append("</tr>");
                    }
                },
                /**
                 * 创建grid的脚部内容（页码、分页、每页多少条等）
                 * @param {object} opts
                 */
                createFooter: function (opts) {
                    var $gridCt = $("#" + opts.id);
                    // 当前grid组件类型
                    var componentName = $gridCt.data("options").component;
                    if (gaeaString.equalsIgnoreCase(componentName, GAEA_UI_DEFINE.UI.COMPONENT.CRUD_GRID)) {
                        // do nothing. crud grid不需要footer
                    } else {
                        _grid._createFooter(opts);
                    }
                },
                /**
                 * 所有grid的绑定事件入口
                 * @param {object} opts
                 * @param {string} opts.id                      grid容器id
                 */
                bindingEvents: function (opts) {
                    var $gridCt = $("#" + opts.id);
                    // 当前grid组件类型
                    var componentName = $gridCt.data("options").component;
                    if (gaeaString.equalsIgnoreCase(componentName, GAEA_UI_DEFINE.UI.COMPONENT.CRUD_GRID)) {
                        // crud grid的事件绑定。比较简单，不需要什么分页、每页多少条等等事件
                        _crudGrid.bindingEvents(opts);
                    } else {
                        _grid._bindingEvents(opts);
                    }
                },
                /**
                 * 初始化各种grid相关插件。放在全部数据初始化完成后，不需要每行都调用一次初始化。
                 * 例如：lightGallery图片浏览插件等
                 *
                 * @param {object} opts
                 * @param {string} opts.id          grid 容器id
                 */
                initGridPlugins: function (opts) {
                    var $gridCt = $("#" + opts.id);
                    // When you use AMD make sure that lightgallery.js is loaded before lightgallery modules.
                    require(["jquery-lightGallery-zoom", "jquery-lightGallery-thumbnail"], function () {
                        $gridCt.find(".img-cell").lightGallery();
                    });
                },
                /**
                 * 获取一个grid中，有定义primaryKey的列。取name组成数组返回。
                 * @param $gridCt
                 * @returns {Array} name的数组
                 */
                getPrimaryKeys: function ($gridCt) {
                    var keys = [];
                    $.each($gridCt.data("options").columns, function (i, column) {
                        if (column.primaryKey) {
                            keys.push(column.name);
                        }
                    });
                    return keys;
                },
                row: {
                    /**
                     * 创建行操作区，包括行前操作区（按钮区），行尾操作区（按钮区）
                     *
                     * copy from _grid._createRowActions
                     * @param {object} opts
                     * @param {object} opts.id                  grid容器id，非grid id
                     * @private
                     */
                    createActions: function (opts) {
                        var $gridCt = $("#" + opts.id);
                        var $gridHead = $gridCt.find(".tb-head").first();
                        var that = this;
                        if (gaeaValid.isNotNull(_grid.cache.rows)) {
                            var hasShowDiagramDialog = false;
                            var hasHeadActionAtAll = false;         // 如果true，即任意一行有行前操作区。作为增加操作区列头的标志。
                            // 遍历每一行
                            $.each(_grid.cache.rows, function (key, rowCache) {
                                var actionsHtml = "";
                                var hasHeadActions = false;     // 行前操作区开关
                                // 遍历每行的行前操作区
                                if (gaeaValid.isNull(rowCache)) {
                                    return;
                                }
                                $.each(rowCache.headActions, function (k, actionConfig) {
                                    if (gaeaValid.isNotNull(actionConfig)) {
                                        // 是否有行前操作区
                                        if (!hasHeadActions) {
                                            hasHeadActions = true;
                                            // 全局的，只赋值一次。
                                            if (!hasHeadActionAtAll) {
                                                hasHeadActionAtAll = true;
                                                that.cache.hasRowHeadActions = true;
                                            }
                                        }
                                        // 根据headActions的配置项，处理不同的类型
                                        if (actionConfig.type == "wf-active-diagram") {    // 查看工作流流程图
                                            // 是否创建全局的流程查看弹框
                                            if (!hasShowDiagramDialog) {
                                                hasShowDiagramDialog = true;
                                            }
                                            actionsHtml += "<a href='/admin/workflow/showdiagram/" + actionConfig.wfProcInstId + "'>查看流程</a>";
                                        }
                                    } else {
                                        return;
                                    }
                                });
                                // 生成行前操作区
                                if (hasHeadActions) {
                                    $gridCt.find(".tb-body tr").eq(rowCache.index).children("td").eq(0).after("<td class=\"grid-td row-headactions\" data-columnid=\"headactions\">" + actionsHtml + "</td>");
                                }
                                // 遍历处理行尾操作区。未完成。。。
                            });
                            // 如果任意一行有行前操作区，增加列头。
                            if (hasHeadActionAtAll && !that.cache.hasCreatedRowHeadActions) {
                                that.cache.hasCreatedRowHeadActions = true;
                                $gridHead.children(".select-all").after("<div id='row-headactions' class='row-headactions column-header'><p>操作</p></div>");
                            }
                            // TODO 如果有查看流程图的按钮，生成弹框DIV。未完成。。。
                            //if (hasShowDiagramDialog) {
                            //    $("body").append("<div id='wf-active-diagram-viewer'></div>");
                            //    var dialog = ur.component.bridge.dialog.create({
                            //        id: "wf-active-diagram-viewer",
                            //        autoOpen: false,
                            //        width: 500,
                            //        height: 500,
                            //        buttons: [{
                            //            "确定": function () {
                            //                $(this).gaeaDialog("close");
                            //            }
                            //        }]
                            //    });
                            //}
                        }
                    }
                },
                head: {
                    getHeadJQ: function () {
                        return $("#tb-head");
                    }
                },
                data: {
                    getTableJQ: function () {
                        return $(".tb-body");
                    }
                },
                css: {
                    /**
                     * 应用表格的CSS
                     * @param {object} opts
                     */
                    apply: function (opts) {
                        var $gridCt = $("#" + opts.id);
                        // 当前grid组件类型
                        var componentName = $gridCt.data("options").component;
                        _private.grid.css.applyCSS(opts);
                        if (gaeaString.equalsIgnoreCase(componentName, GAEA_UI_DEFINE.UI.COMPONENT.CRUD_GRID)) {
                            var $gridCt = $("#" + opts.id);
                            $gridCt.children(".gaea-grid").addClass("crud-grid");
                            //} else {
                        }
                    },
                    /**
                     * 设置Grid的样式。
                     * 包括列头的宽度，行数据单元格的宽度，隐藏不要显示的列、计算整个列头的宽度（js）等。
                     *
                     * @param {object} opts
                     * @param {string} opts.id              grid id
                     * @param {string} opts.heightType
                     * @private
                     */
                    applyCSS: function (opts) {
                        //var that = this;
                        var $grid = $("#" + opts.id);
                        var gridOptions = $grid.data().options;
                        //var grid = $("#" + _grid.options.renderTo);
                        //var gridHead = $(".gaea-grid-header .tb-head");
                        var totalWidth = 0;

                        // 遍历column数组，设置显示样式（CSS等）
                        $.each(gridOptions.columns, function (idx, obj) {
                            var col = this;
                            _.defaults(col, defaultOpts.column);
                            var gridColumnId = "gridcolumn-" + (idx + 1);
                            if (gaeaValid.isNotNull(col.width) && $.isNumeric(col.width)) {
                                // 设置单元格宽度
                                _grid.column._setWidth(gridColumnId, col, opts);
                                // 汇总宽度
                                if (gaeaValid.isNotNull(col.hidden)) {
                                    totalWidth += parseInt(col.width);
                                }
                            }
                            // 隐藏列（没宽度也可以）
                            if (gaeaValid.isNotNull(col.hidden)) {
                                _grid.column._hidden(gridColumnId, col, opts);
                            }
                        });

                        /* 设定data body高度 */
                        _private.grid.css.setDataBodyHeight(opts);

                        /* 设置头部的宽度 */
                        // 宽度没有页面宽，就100%吧
                        //if (totalWidth < document.body.offsetWidth) {
                        //    totalWidth = "100%";
                        //}
                        //GAEA_UI_DEFINE.UI.MAIN.getUIPageJQ().css("width", totalWidth);

                        _private.grid.css.setWidth({
                            id: opts.id,
                            totalWidth: totalWidth
                        });

                        /* 根据行数据，确定列头是否需要行前操作区留白 */
                        if (!_grid.cache.hasRowHeadActions) {
                            $(".head-query-column.row-headactions").css("display", "none");
                        }
                    },
                    /**
                     * 设定grid的宽度。需要根据提供的所有列的总宽度，加上前面复选框的宽度，然后再结合页面宽度，看是设定width=100%，还是固定的width。
                     * @param {object} opts
                     * @param {string} opts.id              grid容器id
                     * @param {int} opts.totalWidth         grid总宽度
                     */
                    setWidth: function (opts) {
                        var $gridCt = $("#" + opts.id);
                        var selectAllWidth = $gridCt.find(".select-all").width();
                        // 列的总宽度 + 选择全部的复选框宽度
                        var totalWidth = opts.totalWidth + selectAllWidth;
                        /* 设置头部的宽度 */
                        // 宽度没有页面宽，就100%吧
                        if (totalWidth < $gridCt.width()) {
                            totalWidth = "100%";
                        }
                        //GAEA_UI_DEFINE.UI.MAIN.getUIPageJQ().css("width", totalWidth);
                        // 不是可编辑表格，才设定宽度。可编辑表格让它自适应好了
                        if ($gridCt.parents(".crud-grid-ct").length < 1) {
                            $gridCt.css("width", totalWidth);
                            console.debug("设定表格id= %s 的宽度为 %s", opts.id, totalWidth);
                        }
                    },
                    /**
                     * 这个方法基本作废了。改为使用百分比控制grid高度，和absolute定位控制footbar位置。 by Iverson 2017年7月21日09:17:08
                     * @param {object} opts
                     * @param {string} opts.id              grid容器id
                     * @param {int} opts.heightType         高度计算方式。value = page|dialog
                     *                                      page：根据document.body.scrollHeight去计算，一般用于整个页面的，列表页。
                     *                                      dialog：dialog中打开的，一般根据往上找到.ui-dialog-content的高度为基础。
                     */
                    setDataBodyHeight: function (opts) {
                        var $gridCt = $("#" + opts.id);
                        var heightType = $gridCt.data("options").heightType;
                        var finalHeight = 0;
                        var $gridDataBody = $gridCt.find(".gaea-grid-body:first");

                        /* 高度是根据整个页面 */
                        //if (gaeaString.equalsIgnoreCase(GRID_DEFINE.HEIGHT_TYPE.PAGE, heightType)) {
                        //    var pageHeight = document.body.scrollHeight;
                        //    var toTop = $gridDataBody.offset().top;
                        //    // 页面高度 - 距离页面顶部距离 - footer高度( 废弃：页面高度 - footer高度 - grid标题栏高度 - toolbar高度 - title高度-padding高度）
                        //    finalHeight = pageHeight - toTop - 30;
                        //
                        //    $gridDataBody.height(finalHeight);
                        //}
                        /* 高度是根据dialog */
                        //if (gaeaString.equalsIgnoreCase(GRID_DEFINE.HEIGHT_TYPE.DIALOG, heightType)) {
                        //    // 向上找到dialog的内容容器
                        //    finalHeight = $gridCt.parents(".ui-dialog-content:first").height();
                        //    // 页面高度 - footer高度 - grid标题栏高度 - toolbar高度 - title高度-padding高度
                        //    finalHeight = finalHeight - 30 - 40;
                        //}
                        //$gridDataBody.height(finalHeight);
                        // 初始化滚动条，利用第三方插件 malihu-custom-scrollbar-plugin
                        $gridDataBody.mCustomScrollbar({
                            axis: "y",
                            theme: "dark-3"
                        });
                    }
                }
            },
            pagination: {
                /**
                 * 根据当前页、共多少页，和要显示多少页，得出一个数组，这个数组就算页码的数组。
                 * @param {object} opts
                 * @param {string} opts.page                当前页
                 * @param {string} opts.pageCount           总共多少页
                 * @param {string} opts.listSize            分页初始化列表长度. 要显示多少（页）.
                 * @return {array} 例如：[3,4,5,6]
                 */
                getPageNoList: function (opts) {
                    if (gaeaValid.isNull(opts) || gaeaValid.isNull(opts.page) || gaeaValid.isNull(opts.pageCount) || gaeaValid.isNull(opts.listSize)) {
                        throw "当前页|共多少页|分页初始化列表长度某配置项为空，无法计算页码列表。";
                    }
                    var page = parseInt(opts.page);
                    var pageCount = parseInt(opts.pageCount);
                    var listSize = parseInt(opts.listSize);
                    var halfListSize = Math.floor(listSize / 2);  // 整个list的一半（向下取整）
                    var pagePlusHalf = page + halfListSize;
                    var resultArray = new Array();
                    /**
                     * 获得最大页码
                     * 通过当前页码+list的一半，和总共多少页比较。
                     * 例如：要是总共6页，当前第5页，共显示5页，则最大可以显示到第7页。然而，总共就6页，所以，maxPageNo = 6
                     */

                    // 计算最大页码和显示页码哪个大。针对第1页，本来要显示7页，实际算法最大只到第4页
                    var maxPageNo = pagePlusHalf > listSize ? pagePlusHalf : listSize;
                    // 然后比较总页码。如果总共9页，当前第8页，计算显示是12页，则最大应该第9页
                    maxPageNo = maxPageNo >= pageCount ? pageCount : maxPageNo;
                    // 最小页码，从1开始，还是从算法计算所得
                    var minPageNo = (maxPageNo - listSize) <= 0 ? 1 : (maxPageNo - listSize + 1);
                    // 生成页码数组
                    while (minPageNo <= maxPageNo) {
                        resultArray.push(minPageNo);
                        minPageNo++;
                    }
                    return resultArray;
                },
                /**
                 * 获取每页多少条记录的区域的html。
                 * @param {object} opts
                 * @param {object} opts.id              grid id
                 */
                getHowManyRecordsHtml: function (opts) {
                    var $grid = $("#" + opts.id);
                    var $howManyRecordsCt = $('<div id="pageSizeListCt" class="how-many-records"><span id="selected"></span></div>');
                    // 默认值。由服务端定义。
                    var defaultSize = parseInt($grid.data().options.page.size);
                    // 找到当前默认页码，在整个（显示多少条）列表中的位置。（类似排序的意思）
                    var index = _.sortedIndex(GRID_DEFINE.PAGINATION.PAGE_SIZE_LIST, defaultSize);

                    // 遍历并构造可选的页显示数量列表
                    $.each(GRID_DEFINE.PAGINATION.PAGE_SIZE_LIST, function (i, iValue) {
                        // 如果遇到需要插入的默认值，且和当前遍历到的值不同（免得插两个一样）
                        if (i == index && defaultSize != iValue) {
                            $howManyRecordsCt.append('<span>' + defaultSize + '</span>');
                        }
                        $howManyRecordsCt.append('<span>' + iValue + '</span>');
                    });
                    $howManyRecordsCt.find("#selected").text(defaultSize);
                    return $howManyRecordsCt;
                }
            },
            event: {
                /**
                 * 绑定点击grid头部，"选择全部"按钮的事件。
                 * @param {object} opts
                 * @param {string} opts.id
                 */
                bindCheckAll: function (opts) {
                    var $gridCt = $("#" + opts.id);
                    var $gridBody = $gridCt.find(".gaea-grid-body:first");
                    gaeaEvents.registerListener("click", gaeaString.builder.simpleBuild("#%s #checkAllLabel", opts.id), function () {
                        // 这个是label，不是checkbox
                        var $checkAll = $(this);
                        // 这个是点击前的状态
                        var isCheckAll = $checkAll.parent().children("input:checkbox").first().is(":checked");
                        //var $gridBody = $checkAll.parents(".gaea-grid").children(".gaea-grid-body");
                        // 设为反状态
                        $gridBody.find(".row-check input:checkbox").prop("checked", !isCheckAll);

                        _private.event.triggerCacheSelect({
                            id: opts.id
                        });
                    });
                },
                /**
                 * 注册选择完行后的，行数据的缓存。
                 * @param {object} opts
                 * @param {string} opts.id                      grid容器id
                 */
                registerCacheSelectRowData: function (opts) {
                    var gridId = opts.id;
                    var $gridCt = $("#" + opts.id);

                    gaeaEvents.registerListener(gaeaEvents.DEFINE.UI.GRID.CACHE_SELECTED_ROW_DATA, "#" + opts.id, function (event, data) {
                        // 【1】刷新selectedRows（每次覆盖）
                        var rowIndexes = _private.grid.getSelectedIndexes({
                            id: gridId
                        });
                        // 通过选择的index，获得行数据
                        var selectedRows = _private.grid.getRowDatas({
                            id: opts.id,
                            indexes: rowIndexes
                        });
                        // 刷新上下文（缓存行数据）
                        gaeaContext.setValue(GAEA_UI_DEFINE.UI.GAEA_CONTEXT.CACHE_KEY.SELECTED_ROWS, gridId, selectedRows);

                        // 【2】刷新selectedRow上下文
                        if (gaeaValid.isNotNull(data.selectedRow)) {
                            gaeaContext.setValue("selectedRow", gridId, data.selectedRow);
                            gaeaContext.setValue("id", gridId, data.selectedRow.id);
                        }

                        // 【3】触发选中处理完成事件
                        // 这个是全局的，广播最新选中行数据。且无关哪个grid
                        gaeaContext.setValue("lastSelectedRow", data.selectedRow);
                        gaeaContext.setValue("lastSelectedRows", selectedRows);
                        gaeaEvents.publish(gaeaEvents.DEFINE.UI.GRID.GLOBAL_LAST_SELECT_FINISHED, {
                            gridId: gridId,
                            selectedRow: data.selectedRow,
                            selectedRows: selectedRows
                        });
                    });
                },
                /**
                 * 注册表格重置事件。全局事件。会把表格和数据都恢复到刚进入页面的状态。
                 * @param {object} [opts]           暂时没用。
                 */
                bindGridReset: function (opts) {
                    // 在处理完submit action后，把grid恢复（例如，全选的按钮得恢复到可点状态）
                    gaeaEvents.registerListener(gaeaEvents.DEFINE.ACTION.SUBMIT_FINISHED, null, function () {
                        // 重置grid
                        _private.grid.reset();
                    });
                },
                /**
                 * 绑定点击grid行的事件。
                 * @param {object} opts
                 * @param {string} opts.id              grid id
                 */
                bindSelectRow: function (opts) {
                    var $gridCt = $("#" + opts.id);
                    // 绑定事件。点击行选中复选框。
                    gaeaEvents.registerListener("click", gaeaString.builder.simpleBuild("#%s .tb-body tr", opts.id), function (event) {
                        var gridOptions = $gridCt.data("options");
                        var $tr = $(this);
                        var $firstTd = $tr.children("td:first");
                        var selectedRow;
                        /**
                         * if 选择的对象，不是行第一个td（的下级）
                         *      当做行单选，则会把所有已选取消，只选择当前行
                         * else 表示点击行第一个td（即直接点击复选按钮）
                         *      当成行多选。可以随意选择任意多行。
                         */
                        if ($firstTd.has(event.target).length === 0) {
                            //if(!$firstTd.is(event.target)) {

                            var index = $(this).data("rowindex");
                            var i = index - 1;
                            // 去掉全部已选状态
                            $gridCt.find("tbody tr .row-check").children(":checkbox").prop("checked", false);
                            // 选中当前行复选框
                            $tr.find(".row-check").children(":checkbox").prop("checked", "true");
                            //// "行"选中
                            // 移除所有的"行"选中样式
                            $(".tb-body tr").removeClass("selected");
                            // ----------------------------------------------->>>> 这些不能放这里，否则直接勾选checkbox的时候会丢失selectedRow的数据
                            //$tr.addClass("selected");
                            //// 获取选中行数据（selectedRow）
                            //$tr.find(".row-check").children(":checkbox").val($tr.data("rowindex") - 1);
                            //selectedRow = gridOptions.data[($tr.data("rowindex") - 1)];
                            //selectedRow.index = $tr.data("rowindex");
                            // 这个只是为了兼容老代码
                            //_grid._setSelectRow(selectedRow);
                            //_grid.options.listeners.select(selectedRow);
                            // <<<< -----------------------------------------------
                        }
                        // "行"选中
                        $tr.addClass("selected");
                        // 获取选中行数据（selectedRow）
                        $tr.find(".row-check").children(":checkbox").val($tr.data("rowindex") - 1);
                        selectedRow = gridOptions.data[($tr.data("rowindex") - 1)];
                        selectedRow.index = $tr.data("rowindex");
                        /**
                         * 触发选中事件。基于事件去影响相关的其他组件或元素。
                         * 例如：
                         * 选中后，也许删除按钮需要知道选中的是哪行，之类的……
                         */
                        $gridCt.trigger(gaeaEvents.DEFINE.UI.GRID.CACHE_SELECTED_ROW_DATA, {
                            selectedRow: selectedRow
                        });
                    });
                },
                /**
                 *
                 * @param {object} opts
                 * @param {string} opts.id                      grid容器id
                 */
                bindRefreshData: function (opts) {

                    /**
                     * 注册根据数据（一般是查询结果）刷新grid事件
                     * 1. 根据传来的data数组刷新缓存的数据。
                     * 2. 根据传来的data数组，重建grid的数据区，包括重建CSS、分页、各种事件等。
                     */
                    gaeaEvents.registerListener(gaeaEvents.DEFINE.UI.GRID.REFRESH_DATA, "#" + opts.id, function (event, data) {
                        //if (gaeaValid.isNull(data) || (gaeaValid.isNull(data.data) && gaeaValid.isNull(data.filterData))) {
                        //    throw "触发gaeaUI_event_grid_refresh_data事件,但data为空!无法刷新!";
                        //}
                        var $gridCt = $(this);
                        var options = {
                            id: opts.id,
                            queryAction: data.queryAction
                        };
                        // 当前grid组件类型
                        var componentName = $gridCt.data("options").component;
                        // 是否新的数据。会添加到现在的总数据中。
                        if (gaeaValid.isNotNull(data.isNewData)) {
                            options.isNewData = data.isNewData;
                        }
                        // 刷新缓存数据
                        // 如果是刷空（清空），则以空数组判断。如果是undefined/null，还是不能触发清空！
                        if (gaeaValid.isNotNull(data.data) || _.isArray(data.data)) {
                            // 如果是额外的数据，增量，则要做增量合并
                            if (gaeaValid.isNotNull($gridCt.data("options").data) && gaeaValid.isNotNull(data.isNewData) && data.isNewData) {
                                //data.data = $gridCt.data("options").data.concat(data.data);
                                var keys = _private.grid.getPrimaryKeys($gridCt);
                                // 合并当前数据，和新数据
                                data.data = gaeaUtils.array.combine($gridCt.data("options").data, data.data, {
                                    keys: keys,
                                    removeDuplicate: true
                                });
                            }
                            $gridCt.data("options").data = data.data;
                        }
                        // 缓存过滤后的数据到grid中
                        //if (gaeaValid.isNotNull(data.filterData)) {
                        $gridCt.data("options").filterData = data.filterData;
                        //}
                        // 用查询结果，刷新数据列表
                        _grid._refreshData(options);
                        /**
                         * 非crud grid的操作
                         */
                        if (!gaeaString.equalsIgnoreCase(componentName, GAEA_UI_DEFINE.UI.COMPONENT.CRUD_GRID)) {
                            // 刷新当前的分页信息，和服务端一致: 当前第几页, 每页多少条, 共多少页
                            $gridCt.data().options.page = _.extend($gridCt.data().options.page, data.page);
                            // 更新UI的footer（含分页）
                            _grid._createFooter(options);
                        }
                    });
                },
                /**
                 * 触发检查当前选中的记录，并把记录对应的数据缓存的功能。
                 * @param {object} opts
                 * @param {string} opts.id                  grid id
                 */
                triggerCacheSelect: function (opts) {
                    gaeaValid.isNull({
                        check: opts.id,
                        exception: "缺少opts.id（grid id）参数，无法获知哪些行被选中。"
                    });
                    var rowIndexes = _private.grid.getSelectedIndexes({
                        id: opts.id
                    });

                    // 通过选择的index，获得行数据
                    var selectedRows = _private.grid.getRowDatas({
                        id: opts.id,
                        indexes: rowIndexes
                    });

                    // 缓存行数据 context['selectedRows'][<grid_id>]=value
                    gaeaContext.setValue(GAEA_UI_DEFINE.UI.GAEA_CONTEXT.CACHE_KEY.SELECTED_ROWS, opts.id, selectedRows);
                },
                // 分页
                pagination: {
                    /**
                     * 绑定点击了当前页显示多少条后的事件。
                     * @param {object} opts
                     * @param {string} opts.id                  grid id
                     */
                    bindPageSizeListClick: function (opts) {
                        var $howManyCt = $("#pageSizeListCt");
                        var $selected = $howManyCt.children("#selected");
                        var closeFunction = function () {
                            // 如果当前是展开，则要回缩
                            $howManyCt.css("height", GRID_DEFINE.PAGINATION.PAGE_SIZE_ITEM_HEIGHT);
                            // 显示选中的项的值
                            $selected.css("display", "block");
                        };

                        gaeaEvents.registerListener("click", "#pageSizeListCt", function () {
                            var currentHeight = $howManyCt.height();
                            // 是否已展开：当前高度>单项高度（表示展开状态）
                            var isExpanded = currentHeight > GRID_DEFINE.PAGINATION.PAGE_SIZE_ITEM_HEIGHT;
                            // 切换展示每页显示多少条的列表
                            //$howManyCt.toggleClass("selected");

                            if (isExpanded) {
                                // 收缩（关闭）。
                                closeFunction();
                                // （在选好显示数量后）执行查询. 不能放到单个span点击处理因为那样还没搜索列表就提交了查询。
                                gridQuery.doSimpleQuery(opts);
                            } else {
                                // 展开。
                                // 一个item高度25
                                // 高度需要计算。因为非固定高度无法使用css动画。
                                // -1 是因为有一个id=selected，是特殊的
                                var height = ($howManyCt.children("span").length - 1) * GRID_DEFINE.PAGINATION.PAGE_SIZE_ITEM_HEIGHT;
                                $howManyCt.css("height", height);
                                // 隐藏选中项
                                $selected.hide();
                                // 设定自动关闭时，最近的操作
                                gaeaEvents.autoClose.setMe({
                                    jqSelector: "#pageSizeListCt"
                                });
                            }
                        });
                        // 注册自动关闭
                        gaeaEvents.autoClose.registerAutoClose("#pageSizeListCt", closeFunction);
                    },
                    /**
                     * 绑定点击每页多少条列表里面的某项，例如：点击20，还是50，还是100等。
                     * @param {object} [opts]           暂时没用
                     */
                    bindPageSizeListItemClick: function (opts) {
                        var $howManyCt = $("#pageSizeListCt");
                        var $selected = $howManyCt.children("#selected");

                        gaeaEvents.registerListener("click", "#pageSizeListCt span", function () {
                            var $howManyItem = $(this);
                            $selected.text($howManyItem.text());
                        });
                    }
                }
            }
        };

        // 工作流相关的
        var _wf = {
            html: {
                /**
                 * 生成行前操作区。判断是否有工作流。有的话生成'查看工作流'的按钮.
                 * copy from addTr。
                 * @param {object} opts
                 * @param {string} opts.id                          crud grid容器。这个是最外层的容器，里面应该还有toolbar和真正grid的容器。
                 * @param {object} opts.rowData                     一行的数据。
                 * @param {object} opts.rowData.wfProcInstId        行数据是否带对应工作流的id
                 */
                addTrButtons: function (rowIndex, opts) {
                    var $gridCt = $("#" + opts.id);
                    var gridOptions = $gridCt.data().options;
                    if (gridOptions.withWorkflow == true) {
                        //if (_grid.options.withWorkflow == true) {
                        if (gaeaValid.isNotNull(opts.rowData.wfProcInstId)) {
                            _grid.cache.rows.push({
                                index: rowIndex,                       // 从0开始的
                                headActions: [{
                                    type: "wf-active-diagram",   // 这个是规范定义的，不能乱起。
                                    wfProcInstId: opts.rowData.wfProcInstId
                                }]
                            });
                            // 设置有行前操作区。关系到列头的排版。
                            //if(!this.cache.hasRowHeadActions) {
                            //    this.cache.hasRowHeadActions = true;
                            //}
                        } else {
                            _grid.cache.rows.push(null);
                        }
                    }
                }
            }
        };
        /**
         * 返回（暴露）的接口
         */
        return {
            create: _grid.create,
            getSelected: _grid.getSelected,
            data: {
                reset: _grid.data.reset
            },
            //tableGrid: _grid.tableGrid, // 没用过
            query: {
                getQueryConditions: gridQuery.parser.getQueryConditions
            },
            crudGrid: {
                addNewOne: _crudGrid.addNewOne,
                deleteSelected: _crudGrid.deleteSelected
                //setValues: _private.crudGrid.setValues // 就没实现过！
            }
        };
    });