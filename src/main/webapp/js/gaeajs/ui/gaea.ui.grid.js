/**
 * 基于RequireJS的模块化重构。让依赖更清晰，更简单。
 * Created by iverson on 2016/2/17.
 */
define([
        "jquery", "underscore", 'underscore-string', 'gaeajs-common-utils-ajax', 'gaeajs-common-utils-validate', 'gaeajs-common-utils-datetime',
        'gaeajs-common-utils-string', 'gaeajs-ui-button', 'gaea-system-url',
        "gaeajs-ui-events", 'gaeajs-common-utils-string', "gaeajs-ui-plugins", "gaeajs-ui-input",
        "gaeajs-ui-definition", "gaeajs-context", "gaeajs-ui-notify", "gaeajs-common-utils",
        "gaeajs-ui-grid-query", "gaeajs-ui-commons",
        "jquery-mCustomScrollbar"],
    function ($, _, _s, gaeaAjax, gaeaValid, gaeaDT,
              gaeaStringUtils, gaeaButton, SYS_URL,
              gaeaEvents, gaeaString, gaeaPlugins, gaeaInput,
              GAEA_UI_DEFINE, gaeaContext, gaeaNotify, gaeaUtils,
              gridQuery, gaeaUI) {

        // 默认的opts参数值的统一定义
        var defaultOpts = {
            // grid init default options
            init: {
                /**
                 * 生成grid高度的算法。value: page|dialog
                 * page：根据document.body.scrollHeight去计算，一般用于整个页面的，列表页。
                 * dialog：dialog中打开的，一般根据往上找到.ui-dialog-content的高度为基础。
                 */
                heightType: "page"
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
            COLUMN: {
                DATA_TYPE_DATE: "date",
                DATA_TYPE_TIME: "time",
                DATA_TYPE_DATETIME: "datetime"
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
                DIV_FIELD: '<div id="<%= ID %>" class="gaea-query-field <%= CLASS %>">' +
                '</div>' // 查询字段块（包括下拉按钮）
                //PARAM_NAME: "filters[<%= P_SEQ %>].propName", // 请求查询的属性名
                //PARAM_VALUE: "filters[<%= P_SEQ %>].propValue", // 请求查询的属性名
                //PARAM_OP: "filters[<%= P_SEQ %>].op" // 查询的比较符
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
        var _query = {
            /**
             *
             * @param {object} opts
             * @param {string} opts.id                  grid id
             */
            hide: function (opts) {
                // 收起查询区
                $("#" + opts.id + " #" + GRID_DEFINE.QUERY.FILTER_CONTAINER_ID).slideUp("fast");    // cool一点的方式
            }
        };
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
                    var column = columns[i];
                    var defaultClass = "head-query-column";
                    var columnHtmId = "mars-hq-column-" + (i + 1); // column的序列化从1开始吧
                    var inputId = "mars-hq-" + field.id;
                    // 拼凑各个字段的查询输入框
                    if (gaeaValid.isNotNull(column.hidden) && !column.hidden) {

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
                            '<div class="gaea-query-input-div"></div>' // 查询字段块（包括下拉按钮）
                        );
                        $oneQueryCt.append(oneQuerySubCtTemplate());
                        var oneQueryInputCtSelector = "#" + opts.id + " #" + columnHtmId + " .gaea-query-input-div";
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
                            }
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
                    /**
                     * 根据系统返回的各个字段的类型定义，做相应的转化和初始化。
                     * 例如：
                     * 日期类的字段，需要初始化日期控件。
                     */
                    //if (gaeaValid.isNotNull(column.datetimeFormat)) {
                    //    if (gaeaStringUtils.equalsIgnoreCase(column.dataType, GRID_DEFINE.COLUMN.DATA_TYPE_DATE)) {
                    //        // 初始化日期控件
                    //        gaeaPlugins.datePicker.init({
                    //            renderTo: inputId
                    //        });
                    //    } else if (gaeaStringUtils.equalsIgnoreCase(column.dataType, GRID_DEFINE.COLUMN.DATA_TYPE_TIME)) {
                    //        // TODO
                    //    } else if (gaeaStringUtils.equalsIgnoreCase(column.dataType, GRID_DEFINE.COLUMN.DATA_TYPE_DATETIME)) {
                    //        // 初始化日期时间控件
                    //        gaeaPlugins.datetimePicker.init({
                    //            renderTo: inputId
                    //        });
                    //    }
                    //}
                }
                // 组装按钮
                $gridCt.find("#query-actions").children("div:first").append(gaeaButton.create({
                    "htmlId": "headqueryOK",
                    "text": "确定",
                    "size": "small"
                }));

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
                $gridCt.find("#headqueryOK").click(function () {
                    //// 利用underscore的模板功能。查询参数的变量名的名，和值的名（有点绕……）的拼凑模板。
                    //var paramNameTemplate = _.template(TEMPLATE.QUERY.PARAM_NAME);
                    //var paramValueTemplate = _.template(TEMPLATE.QUERY.PARAM_VALUE);
                    //// 收起查询区
                    //$("#mars-tb-head-query").slideUp("fast");    // cool一点的方式
                    //var queryConditions = new Object();         // 查询请求数据
                    //var i = 0;      // 查询条件数组的下标
                    ////queryConditions.urSchemaId = $("#urSchemaId").val();
                    //$("#mars-headquery-inputs").find("input").each(function (index) {
                    //    console.log("input value: " + $(this).val() + " , " + $(this).prop("value"));
                    //    var inputVal = $(this).val();
                    //    console.log("empty length: " + inputVal.length + " 0 length: " + "0".length);
                    //    if (gaeaValid.isNotNull(inputVal)) {
                    //        //var nameKey = "filters[" + i + "].name";        // 不能用index。输入框为空的时候index也会递增。
                    //        var nameKey = paramNameTemplate({P_SEQ:i});        // 不能用index。输入框为空的时候index也会递增。
                    //        var nameValue = $(this).data("field-id");
                    //        //var valKey = "filters[" + i + "].value";
                    //        var valKey = paramValueTemplate({P_SEQ:i});
                    //        var valValue = $(this).val();
                    //        queryConditions[nameKey] = nameValue;
                    //        queryConditions[valKey] = valValue;
                    //        i += 1;
                    //    }
                    //});
                    // ------------------>>>> 上面的都重构到getQueryConditions方法
                    // 收起查询区
                    _query.hide(opts);
                    var queryConditions = gridQuery.parser.getQueryConditions(opts);
                    gridQuery.doQuery({
                        id: opts.id,
                        queryConditions: queryConditions
                    });
                });
                // 【3】 点击列头，展示查询区。但忽略“选择全部”按钮区。
                _private.event.bindShowSimpleQuery(opts);
                // 设定查询区的比较符按钮点击操作，和相关的触发事件。
                _query.view.event.setQueryCompareButtonTrigger(opts);
                _query.view.event.bindQueryCompareButtonEvent(opts);
                // 【4】 初始化快捷查询区的gaea UI组件（例如：select2等）
                _query.view.initGaeaUI(opts);
            },
            /**
             * 初始化query中的UI 组件（例如select2等）
             * @param {object} opts
             * @param {string} opts.id              grid id
             */
            initGaeaUI: function (opts) {
                gaeaValid.isNull({
                    check: opts.id,
                    exception: "grid id为空，无法初始化查询区的Gaea UI组件！"
                });
                var $grid = $("#" + opts.id);
                var gridOptions = $grid.data().options;
                var fields = gridOptions.model.fields;
                var columns = gridOptions.columns;
                //var $headQueryCt = $("#" + opts.id + " .gaea-grid-header .mars-tb-head-query");


                for (var i = 0; i < fields.length; i++) {
                    var field = fields[i];
                    /**
                     * @type {object}
                     * @property {object} [queryCondition]              列的查询定义对象
                     * @property {string} queryCondition.component      组件名
                     * @property {boolean} queryCondition.multiple      是否支持多选
                     */
                    var column = columns[i];
                    var columnHtmId = "mars-hq-column-" + (i + 1); // column的序列化从1开始吧
                    var inputId = "mars-hq-" + field.id;


                    /**
                     * 根据系统返回的各个字段的类型定义，做相应的转化和初始化。
                     * 例如：
                     * 日期类的字段，需要初始化日期控件。
                     */
                    if (gaeaValid.isNotNull(column.datetimeFormat)) {
                        if (gaeaStringUtils.equalsIgnoreCase(column.dataType, GRID_DEFINE.COLUMN.DATA_TYPE_DATE)) {
                            // 初始化日期控件
                            gaeaPlugins.datePicker.init({
                                renderTo: inputId
                            });
                        } else if (gaeaStringUtils.equalsIgnoreCase(column.dataType, GRID_DEFINE.COLUMN.DATA_TYPE_TIME)) {
                            // TODO
                        } else if (gaeaStringUtils.equalsIgnoreCase(column.dataType, GRID_DEFINE.COLUMN.DATA_TYPE_DATETIME)) {
                            // 初始化日期时间控件
                            gaeaPlugins.datetimePicker.init({
                                renderTo: inputId
                            });
                        }
                    }

                    // 初始化各种插件
                    if (gaeaValid.isNotNull(column.queryCondition)) {
                        if (gaeaString.equalsIgnoreCase(GAEA_UI_DEFINE.UI.COMPONENT.SELECT, column.queryCondition.component)) {
                            // 初始化jQuery select2插件
                            var gaeaSelect2 = require("gaeajs-ui-select2");
                            gaeaSelect2.init({
                                jqSelector: "#" + opts.id + " .gaea-grid-header .mars-tb-head-query " + "#" + inputId,
                                initDataSet: true,
                                multiple: column.queryCondition.multiple,
                                placeholder: "请选择..."
                            });
                        }
                    }
                }
            },
            event: {
                /**
                 * 初始化触发快捷查询区的比较按钮的功能。
                 * @param {object} opts
                 * @param {string} opts.id                  grid id
                 */
                setQueryCompareButtonTrigger: function (opts) {
                    var $gridCt = $("#" + opts.id);
                    var $queryButtons = $gridCt.find(".gaea-query-buttons");
                    var $queryCt = $gridCt.find(".mars-tb-head-query");
                    $queryButtons.children("i").click(function () {
                        //var $columnCt = $(this).parent().parent();
                        var $buttonList = $(this).parent();
                        //var $clickButton = $(this);
                        // 点击了某个按钮，例如'大于', 把按钮移到最前面去
                        $buttonList.prepend(this);
                        // 触发事件
                        //var valueObj = _gaeaInput.getValue(containerId);
                        //if (gaeaValid.isNotNull(valueObj)) {
                        //    options = _.extend(options, valueObj);
                        $queryCt.trigger(gaeaEvents.DEFINE.UI.INPUT.CHANGE);
                        //}
                    });
                },
                /**
                 * 注册快捷查询区的比较操作符按钮的监听。
                 * 监听在整个头部快捷查询区。因为考虑，一旦改变，应该所有的查询条件和值都得遍历、汇总，而不只是当前点击这一个。
                 * @param {object} opts
                 * @param {string} opts.id              grid id
                 */
                bindQueryCompareButtonEvent: function (opts) {
                    var queryCtSelector = "#" + opts.id + " .mars-tb-head-query";
                    gaeaEvents.registerListener(gaeaEvents.DEFINE.UI.INPUT.CHANGE, queryCtSelector, function (event, data) {
                        //var value = _gaeaInput.getValue(data.containerId);
                        // 回调函数
                        //if (_.isFunction(opts.change)) {
                        //    opts.change();
                        //}
                        var queryConditions = gridQuery.parser.getQueryConditions(opts);
                        gridQuery.doQuery({
                            id: opts.id,
                            queryConditions: queryConditions
                        });
                        // 收起快捷查询
                        _query.hide(opts);
                    });
                }
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
             * @param {object} options.heightType               高度计算方式。value = page|dialog
             *                                                  page：根据document.body.scrollHeight去计算，一般用于整个页面的，列表页。
             *                                                  dialog：dialog中打开的，一般根据往上找到.ui-dialog-content的高度为基础。
             */
            create: function (options) {
                // 先合并默认值
                options = _.extend(defaultOpts.init, options);
                //var that = this;
                //_grid.options = options;
                gaeaValid.isNull({
                    check: options.id,
                    exception: "grid的容器id为空，无法构建容器！"
                });
                var $gridCt = $("#" + options.id);
                // 添加gaea grid标识
                if (gaeaValid.isNull($gridCt.attr("class")) || $gridCt.attr("class").indexOf("gaea-grid-ct") < 0) {
                    $gridCt.addClass("gaea-grid-ct");
                }
                // 缓存options
                $gridCt.data("options", options);

                if (!$.isArray(options.model.fields) || !$.isArray(options.columns)) {
                    throw "fields与columns必须是数组！";
                }
                if (options.model.fields.length !== options.columns.length) {
                    throw "fields与columns长度必须一致！";
                }
                // TODO 这个主要是新旧接口转换。因为grid id在options定义是renderTo，这个后面重构再优化
                //var opts = {
                //    id: options.renderTo
                //};
                //var myColumns = new Array();
                //var myFields = new Array();         // 这个是字段id的列表
                //var pkColumnId;
//            for (var i = 0; i < options.columns.length; i++) {
//                var column = options.columns[i];
//                var field = options.model.fields[i];
//                /* 处理日期、时间类型的字段。产生日期类的column renderer方法。 */
//                if (!$.isFunction(column.renderer) && column.renderType === "date") {
//                    // ExtJS 3的列的renderer方式
//                    column.renderer = function(value, row) {
//                        if (ur.utils.validate.isNotNull(value)) {
//                            // 默认日期格式：yyyy-MM-dd
//                            return Ext.util.Format.date(new Date(parseInt(value)), 'Y-m-d')
//                        } else {
//                            return "";
//                        }
//                    }
//                } else if (!$.isFunction(column.renderer) && column.renderType === "link") { // 处理超链接的单元格渲染
//                    column.renderer = function(value, metaData, record, rowIndex, colIndex, store) {
////                        console.log("value=" + value + ",rowIndex=" + rowIndex + ",colIndex=" + colIndex);
//                        // 加上超链接
//                        value = "<a href='#'>" + value + "</a>";
//                        // 把单元格渲染成红色？就在这里……
//                        metaData.css = "ur-grid-cell-link";
//                        return value;
//                    }
//                }
//                // 构建ExtJs的字段id
//                myFields.push(field.id);
//                // 构建ExtJS的column数组。复合ExtJS的数组规范。
//                myColumns.push({
//                    id: column.id,
//                    header: column.text, // 列名。在ExtJS 4就是用text了。
//                    width: column.width, // 列宽
//                    hidden: column.hidden, // 是否显示列
//                    resizable: column.resizable,
//                    renderer: column.renderer
//                });
//            }

                /* --------------------------------------------------------------------------------------------------------- 华丽的分割线 -------------------------- */
                //var urGridId = "#" + options.renderTo;
                $gridCt.append("<div class='gaea-grid'>" +
                    "<div class='gaea-grid-header'><div id=\"tb-head\" class=\"tb-head\"></div></div>" +
                    "<div class='gaea-grid-body'><table class='tb-body'></table></div>" +
                    "<div class='gaea-grid-footer'><div id=\"pagination\" class=\"pagination\"></div></div>" +
                    "<input type='hidden' id='gridId' name='gridId' value='" + options.id + "'>" +
                    "</div>");
                var tableHeadCT = $gridCt.find(".gaea-grid-header");
                //var tableHead = $("#tb-head");
                //var tableBody = $(".tb-body");
                //var autoGenClassNamePrefix = "autogen-col-";
                //var tdDefaultClasses = "grid-td";
                //var colCssArray = new Array();
                //var selectedRow;                                    // 如果点击了数据表中某行，记录该行
                /* 创建列表的表头 */
                _grid._createTableHead(options);
                /* 创建列表的数据部分 */
                _grid._createTableData(options);
                /* 创建Grid的脚部分页部分 */
                _grid._createFooter(options);
                //// 遍历column数组，设置显示样式（CSS等）
                //$.each(options.columns, function (idx, obj) {
                //    var col = this;
                //    var gridColumnId = "gridcolumn-" + (idx + 1);
                //    if (ur.utils.validate.isNotNull(col.width) && $.isNumeric(col.width)) {
                //        var jqSelector = "td[data-columnid=" + gridColumnId + "]";
                //        // 设置数据table的单元格的样式
                //        urGrid.find(jqSelector).children(".grid-td-div").css("width", col.width);
                //        // 设置列头的样式
                //        urGrid.find("#" + gridColumnId).find("p").css("width", col.width);
                //    }
                //    if (ur.utils.validate.isNotNull(col.hidden)) {
                //        if (col.hidden) {
                //            urGrid.find(jqSelector).css("display", "none");
                //            $("#" + gridColumnId).css("display", "none");
                //        }
                //    }
                //})
                _grid._bindingEvents(options);
                //// 绑定事件。点击行选中复选框。
                //tableBody.find("tr").click(function () {
                //    $(":checkbox[id^='urgrid-chb']").prop("checked", false);
                //    $(this).find("[id^='urgrid-chb']").prop("checked", "true");
                //    //console.log("rowindex: "+$(this).data("rowindex"));
                //    $(this).find("[id^='urgrid-chb']").val($(this).data("rowindex") - 1);
                //    selectedRow = options.data[($(this).data("rowindex") - 1)];
                //    selectedRow.index = $(this).data("rowindex");
                //    that._setSelectRow(selectedRow);
                //    options.listeners.select(selectedRow);
                //});
                /**
                 * 高级查询
                 */
                    // TODO 这个应该可以放在上面一起初始化。
                tableHeadCT.append("<div id='mars-tb-head-query' class='mars-tb-head-query'>" +
                    "<div id=\"mars-headquery-inputs\" class=\"mars-headquery-inputs\">" +
                    "<div class='head-query-column select-all'></div>" +                            // 占位块。为了和列头对上。
                    "<div class='head-query-column row-headactions'></div></div>" +                 // 占位块。为了和列头对上。
                    "<div id=\"query-actions\" class='query-actions'><div></div></div>" +
                    "</div>");
                _query.view.init(options);
                /**
                 * 行操作区
                 */
                _grid._createRowActions(options);
                /* 设置Grid样式 */
                _grid._applyCSS(options);
                /* 应用相关的效果，如复选框选中等 */
                _grid._applyJsStyle();
            },
            /**
             * 获取grid中选中的行的数据对象。
             * @param argId
             * @returns {jsonData}
             */
            getSelected: function (argId) {
                console.log("这里缺一个grid id");// TODO
                return _grid.cache.selectedRow;
            },
            _setSelectRow: function (row) {
                _grid.cache.selectedRow = row;
            },
            /**
             *
             * @param {object} opts
             * @param {string} opts.id                  grid id
             * @param {object} opts.data
             * @private
             */
            _refreshData: function (opts) {
                var $gridCt = $("#" + opts.id);
                //_grid.options.data = opts.data;
                $gridCt.data("options").data = opts.data;
                var gridOptions = $gridCt.data().options;
                opts = _.extend(gridOptions, opts);

                $gridCt.find(".tb-body:first").html("");
                _grid._createTableData(opts);
                // 设置Grid样式
                _grid._applyCSS(opts);
                // 绑定事件，例如：行前复选框
                _grid._bindingEvents(opts);
                //_grid._bindingEvents(_grid.options);
                // 创建行操作区
                _grid._createRowActions(opts);
            },
            _createTableHead: function (opts) {
                //var data = _grid.options.data;
                var $gridCt = $("#" + opts.id);
                var gridOptions = $gridCt.data().options;
                var data = gridOptions.data;
                var $headCt = $gridCt.find(".tb-head").first();
                //var tableBody = $(".ur-gridtable");
                //var tableHead = $("#mars-tb-head");
                //var autoGenClassNamePrefix = "autogen-col-";
                //var fields = _grid.options.model.fields;
                //var columns = _grid.options.columns;
                var fields = gridOptions.model.fields;
                var columns = gridOptions.columns;
                //var tdDefaultClasses = "grid-td";
                // 遍历每一行数据
                //for (var i = 0; i < data.length; i++) {
                //    var row = data[i];
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
                    //}
                }
                // 最后一个列头单元格。只是用于填充宽度。
                $headCt.append("<div class='" + defaultClass + " last' />");
                //if (i == 0) {
                $headCt.append("</tr>");
                //}
                //}
            },
            /**
             * 创建列表页（grid）的数据部分（table row)，包括行前的复选框，
             *
             * @param {object} opts
             * @param {string} opts.id              grid容器id
             * @private
             */
            _createTableData: function (opts) {
                //var that = this;
                //var data = _grid.options.data;
                var $gridCt = $("#" + opts.id);
                var $tbBody = $gridCt.find(".tb-body:first");
                var gridOptions = $("#" + opts.id).data().options;
                var data = gridOptions.data;
                var fields = gridOptions.model.fields;
                var columns = gridOptions.columns;

                //var tableBody = $(".ur-gridtable");
                //var tableHead = $("#mars-tb-head");
                //var autoGenClassNamePrefix = "autogen-col-";
                //var fields = _grid.options.model.fields;
                //var columns = _grid.options.columns;
                //var lastTRselector = ".gaea-grid-body table tr:last";
                //var arrRowHeadActions = new Array();
                //var tdDefaultClasses = "grid-td";
                // 清空一下。如果是刷新数据的时候需要。
                $tbBody.html("");
                // 先清空缓存
                _grid.cache.rows = [];
                // 遍历每一行数据
                for (var i = 0; i < data.length; i++) {
                    var row = data[i];
                    var checkBoxId = opts.id + "-cbx-" + i;
                    //console.log("name= "+row.name);
                    $tbBody.append("<tr data-rowindex='" + (i + 1) + "'>");
                    // 遍历每一列定义。遍历column等效于遍历field
                    for (var j = 0; j < columns.length; j++) {
                        //var tmpCol = columns[j];
                        var field = fields[j];
                        var column = columns[j];
                        //var genClsName = autoGenClassNamePrefix + field.id;
                        //var defaultClass = "column-header";
                        var columnHtmId = "gridcolumn-" + (j + 1); // column的序列化从1开始吧
                        var hasNotMatchedField = true;  // 有定义、没数据的字段。必须用空单元格填充。
                        // AI.TODO css列表待处理
                        //colCssArray.push(genClsName);
                        // 如果是第一行，即第一次，生成列头
                        //if (i == 0) {
                        //    // 第一列，生成复选框。
                        //    if (j == 0) {
                        //        $("#mars-tb-head").append("<div id='selectAll' class='selectAll column-header'><input type='checkbox' id='checkAll' class='checkAll' ></div>");
                        //    }
                        //    $("#mars-tb-head").append("<div id='" + columnHtmId + "' class='" + defaultClass + "' data-field-id='" + field.id + "'><p>" + tmpCol.text + "</p></div>");
                        //}
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
                            if (gaeaStringUtils.equalsIgnoreCase(field.id, key)) {
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
                                $tbBody.find("tr:last").append("<td class='grid-td' data-columnid='" + columnHtmId + "'>" +
                                    "<div class=\"grid-td-div\">" + cellText + "</div></td>");
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
             * 设置Grid的样式。
             * 包括列头的宽度，行数据单元格的宽度，隐藏不要显示的列、计算整个列头的宽度（js）等。
             *
             * @param {object} opts
             * @param {string} opts.id              grid id
             * @param {string} opts.heightType
             * @private
             */
            _applyCSS: function (opts) {
                var that = this;
                var $grid = $("#" + opts.id);
                var gridOptions = $grid.data().options;
                //var grid = $("#" + _grid.options.renderTo);
                //var gridHead = $(".gaea-grid-header .tb-head");
                var totalWidth = 0;

                // 遍历column数组，设置显示样式（CSS等）
                $.each(gridOptions.columns, function (idx, obj) {
                    var col = this;
                    var gridColumnId = "gridcolumn-" + (idx + 1);
                    if (gaeaValid.isNotNull(col.width) && $.isNumeric(col.width)) {
                        // 设置单元格宽度
                        that.column._setWidth(gridColumnId, col, opts);
                        // 汇总宽度
                        if (gaeaValid.isNotNull(col.hidden)) {
                            totalWidth += parseInt(col.width);
                        }
                    }
                    // 隐藏列（没宽度也可以）
                    if (gaeaValid.isNotNull(col.hidden)) {
                        that.column._hidden(gridColumnId, col, opts);
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
                 */
                gaeaEvents.registerListener(gaeaEvents.DEFINE.UI.GRID.REFRESH_DATA, "#" + gridId, function (event, data) {
                    if (gaeaValid.isNull(data) || gaeaValid.isNull(data.data)) {
                        throw "触发gaeaUI_event_grid_refresh_data事件,但data为空!无法刷新!";
                    }
                    // 用查询结果，刷新数据列表
                    _grid._refreshData({
                        id: gridId,
                        data: data.data
                    });
                    // 刷新当前的分页信息，和服务端一致: 当前第几页, 每页多少条, 共多少页

                    $grid.data().options.page = _.extend($grid.data().options.page, data.page);


                    //_grid.options.page = _.extend(_grid.options.page, data.page);


                    //_grid.options.page.rowCount = data.page.rowCount;
                    //_grid.options.page.page = data.page.page; // 当前第几页
                    //_grid.options.page.size = data.size; // 每页多少条
                    //_grid.options.page.pageCount = data.totalPages; // 共多少页
                    // 更新UI的footer（含分页）
                    _grid._createFooter({
                        id: gridId
                    });
                });
                /**
                 * 注册行选择缓存所选行数据事件
                 */
                gaeaEvents.registerListener(gaeaEvents.DEFINE.UI.GRID.SELECT, "#" + gridId, function (event, data) {
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
                });
                /**
                 * 注册选择全部事件
                 */
                _private.event.bindCheckAll(opts);
                //$grid.on(GAEA_EVENTS.DEFINE.UI.GRID.SELECT, function (event, data) {
                //    console.log("trigger grid select event in gaeaUI dialog.");
                //    selectedRow = data.selectedRow;
                //    crudDialog.cache.selectedRow = selectedRow;
                //});

                /**
                 * 监听重置事件。例如在提交某个action后，ajax回来需要重置grid。
                 */
                _private.event.bindGridReset();

                // 初始化上下文插件（可以重复初始化，所以不怕）
                gaeaContext.init({
                    id: GAEA_UI_DEFINE.UI.GAEA_CONTEXT.ID
                });

                //// 绑定事件。点击行选中复选框。
                //$(".tb-body").on("click", "tr", function () {
                //    //$(".tb-body").find("tr").click(function () {
                //    var index = $(this).data("rowindex");
                //    var i = index - 1;
                //    // 选中行前复选框
                //    $(":checkbox[id^='urgrid-chb']").prop("checked", false);
                //    $(this).find("[id^='urgrid-chb']").prop("checked", "true");
                //    // 添加选中class
                //    $(".tb-body tr").removeClass("selected");
                //    $(this).addClass("selected");
                //    //console.log("rowindex: "+$(this).data("rowindex"));
                //    $(this).find("[id^='urgrid-chb']").val($(this).data("rowindex") - 1);
                //    selectedRow = that.options.data[($(this).data("rowindex") - 1)];
                //    selectedRow.index = $(this).data("rowindex");
                //    that._setSelectRow(selectedRow);
                //    that.options.listeners.select(selectedRow);
                //    /**
                //     * 触发选中事件。基于事件去影响相关的其他组件或元素。
                //     * 例如：
                //     * 选中后，也许删除按钮需要知道选中的是哪行，之类的……
                //     */
                //        //console.log("grid renderTo: "+_grid.options.renderTo);
                //    $("#" + _grid.options.renderTo).trigger(gaeaEvents.DEFINE.UI.GRID.SELECT, {
                //        selectedRow: selectedRow
                //    });
                //    // 复选框选中的效果
                //    // find the first span which is our circle/bubble
                //    //var jqLabel = $("#urgrid-cb-label-" + i);
                //    ////jqLabel.append("<span class=\"check\"></span>" +
                //    ////    "<span class=\"box\"></span>");
                //    //var el = jqLabel.children('span:first-child');
                //    //
                //    //// add the bubble class (we do this so it doesnt show on page load)
                //    //el.addClass('circle');
                //    //
                //    //// clone it
                //    //var newone = el.clone(true);
                //    //
                //    //// add the cloned version before our original
                //    //el.before(newone);
                //    //
                //    //// remove the original so that it is ready to run on next click
                //    //$("." + el.attr("class") + ":last").remove();
                //});
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
            _createRowActions: function (opts) {
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
            },
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
        _grid.row = {
            //initSelectEvent: function () {
            //    // 绑定事件。点击行选中复选框。
            //    gaeaEvents.registerListener("click", ".tb-body tr", function () {
            //        //$(".tb-body").find("tr").click(function () {
            //        var index = $(this).data("rowindex");
            //        var i = index - 1;
            //        // 选中行前复选框
            //        $(":checkbox[id^='gaea-grid-cbx']").prop("checked", false);
            //        $(this).find("[id^='gaea-grid-cbx']").prop("checked", "true");
            //        // 添加选中class
            //        $(".tb-body tr").removeClass("selected");
            //        $(this).addClass("selected");
            //        //console.log("rowindex: "+$(this).data("rowindex"));
            //        $(this).find("[id^='gaea-grid-cbx']").val($(this).data("rowindex") - 1);
            //        var selectedRow = _grid.options.data[($(this).data("rowindex") - 1)];
            //        selectedRow.index = $(this).data("rowindex");
            //        _grid._setSelectRow(selectedRow);
            //        _grid.options.listeners.select(selectedRow);
            //        /**
            //         * 触发选中事件。基于事件去影响相关的其他组件或元素。
            //         * 例如：
            //         * 选中后，也许删除按钮需要知道选中的是哪行，之类的……
            //         */
            //        $("#" + _grid.options.renderTo).trigger(gaeaEvents.DEFINE.UI.GRID.SELECT, {
            //            selectedRow: selectedRow
            //        });
            //        // 放入系统上下文
            //        gaeaContext.setValue("selectedRows", [selectedRow]);
            //    });
            //}
        };
        /**
         * 以HTML table元素为基础创建的grid。
         * 一般用在新增、编辑页等不需要太复杂grid功能的地方。
         * @constructor
         */
        _grid.tableGrid = {
            /**
             * 从HTML页面获取列定义（例如：宽度，是否隐藏，等）。
             * 一般是js或后台定义的。但现在也可以直接在HTML的元素属性上定义。
             * 方法：
             * 扫描容器下的TH[data-gaea-ui]的定义。
             * @param containerId 要去扫描的容器
             */
            getColumnDefine: function (containerId) {
                var $container = $("#" + containerId);
                var columns = null;
                var result = {};
                $container.find("th[data-gaea-ui]").each(function (index, element) {
                    var $this = $(this);
                    var gaeaUIStr = $this.data("gaea-ui");
                    var thisUI = gaeaString.parseJSON(gaeaUIStr);
                    if (gaeaValid.isNull(columns)) {
                        columns = new Array();
                    }
                    if (gaeaValid.isNotNull(thisUI.column)) {
                        columns.push(thisUI.column);
                    }
                });
                result.columns = columns;
                return result;
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
                                    someRows.push(result[iValue]);
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
                    //if($grid.find(".row-check").children().prop("checked")) {
                    //    $grid.find("#checkAllLabel").trigger("click");
                    //}
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
                        $gridCt.css("width", totalWidth);
                    },
                    /**
                     *
                     * @param {object} opts
                     * @param {string} opts.id              grid容器id
                     * @param {int} opts.heightType         高度计算方式。value = page|dialog
                     *                                      page：根据document.body.scrollHeight去计算，一般用于整个页面的，列表页。
                     *                                      dialog：dialog中打开的，一般根据往上找到.ui-dialog-content的高度为基础。
                     */
                    setDataBodyHeight: function (opts) {
                        var $gridCt = $("#" + opts.id);
                        var finalHeight = 0;
                        var $gridDataBody = $gridCt.find(".gaea-grid-body:first");

                        /* 高度是根据整个页面 */
                        if (gaeaString.equalsIgnoreCase(GRID_DEFINE.HEIGHT_TYPE.PAGE, opts.heightType)) {
                            var pageHeight = document.body.scrollHeight;
                            // 页面高度 - footer高度 - grid标题栏高度 - toolbar高度 - title高度-padding高度
                            finalHeight = pageHeight - 30 - 40 - 48 - 36 - 10;
                        }
                        /* 高度是根据dialog */
                        if (gaeaString.equalsIgnoreCase(GRID_DEFINE.HEIGHT_TYPE.DIALOG, opts.heightType)) {
                            // 向上找到dialog的内容容器
                            finalHeight = $gridCt.parents(".ui-dialog-content:first").height();
                            // 页面高度 - footer高度 - grid标题栏高度 - toolbar高度 - title高度-padding高度
                            finalHeight = finalHeight - 30 - 40;
                        }
                        $gridDataBody.height(finalHeight);
                        // 初始化滚动条，利用第三方插件 malihu-custom-scrollbar-plugin
                        //$gridDataBody.mCustomScrollbar({
                        //    theme: "dark-3"
                        //});
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
                 * 绑定点击头部，展示快捷查询区的事件。
                 * @param opts
                 */
                bindShowSimpleQuery: function (opts) {
                    var $gridCt = $("#" + opts.id);
                    var $head = $gridCt.find(".tb-head").first();
                    var $queryDiv = $gridCt.find("#mars-tb-head-query").first();
                    var closeFunction = function () {
                        $queryDiv.slideUp("fast");
                    };

                    // 点击头部，展开快捷查询栏。
                    $head.find(".column-header").not("#selectAll").click(function () {
                        // cool一点的方式
                        if ($queryDiv.is(':visible')) {
                            closeFunction();
                        } else {
                            $queryDiv.slideDown("fast");
                            // 设定自动关闭时，最近的操作
                            gaeaEvents.autoClose.setMe({
                                jqSelector: ".gaea-grid-header"
                            });
                        }
                    });
                    // 注册点击外部自动关闭。
                    gaeaEvents.autoClose.registerAutoClose(".gaea-grid-header", closeFunction);
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
                            // "行"选中
                            $(".tb-body tr").removeClass("selected");
                            $tr.addClass("selected");
                            // 获取选中行数据（selectedRow）
                            $tr.find(".row-check").children(":checkbox").val($tr.data("rowindex") - 1);
                            selectedRow = gridOptions.data[($tr.data("rowindex") - 1)];
                            selectedRow.index = $tr.data("rowindex");
                            _grid._setSelectRow(selectedRow);
                            //_grid.options.listeners.select(selectedRow);
                        }
                        /**
                         * 触发选中事件。基于事件去影响相关的其他组件或元素。
                         * 例如：
                         * 选中后，也许删除按钮需要知道选中的是哪行，之类的……
                         */
                        $gridCt.trigger(gaeaEvents.DEFINE.UI.GRID.SELECT, {
                            selectedRow: selectedRow
                        });
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
        /**
         * 返回（暴露）的接口
         */
        return {
            create: _grid.create,
            getSelected: _grid.getSelected,
            tableGrid: _grid.tableGrid,
            query: {
                getQueryConditions: gridQuery.parser.getQueryConditions
            }
        };
    });