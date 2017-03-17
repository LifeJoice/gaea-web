/**
 * 基于RequireJS的模块化重构。让依赖更清晰，更简单。
 * Created by iverson on 2016/2/17.
 */
define([
        "jquery", "underscore", 'underscore-string', 'gaeajs-common-utils-ajax', 'gaeajs-common-utils-validate', 'gaeajs-common-utils-datetime',
        'gaeajs-common-utils-string', 'gaeajs-ui-button', 'gaea-system-url',
        "gaeajs-ui-events", 'gaeajs-common-utils-string', "gaeajs-ui-plugins", "gaeajs-ui-input",
        "gaeajs-ui-definition", "gaeajs-context", "gaeajs-ui-notify", "gaeajs-common-utils"],
    function ($, _, _s, gaeaAjax, gaeaValid, gaeaDT,
              gaeaStringUtils, gaeaButton, SYS_URL,
              gaeaEvents, gaeaString, gaeaPlugins, gaeaInput,
              GAEA_UI_DEFINE, gaeaContext, gaeaNotify, gaeaUtils) {
        /**
         * 一些静态的常量定义
         */
        var GRID_DEFINE = {
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
                '</div>', // 查询字段块（包括下拉按钮）
                PARAM_NAME: "filters[<%= P_SEQ %>].propName", // 请求查询的属性名
                PARAM_VALUE: "filters[<%= P_SEQ %>].propValue", // 请求查询的属性名
                PARAM_OP: "filters[<%= P_SEQ %>].op" // 查询的比较符
            },
            GRID: {
                // 这个是头部“选择全部”按钮区
                HEAD_CHECK_ALL_DIV: '' +
                '<div id="selectAll" class="select-all column-header"><div class="row-check">' +
                '<input type="checkbox" id="checkAll" style="display: none;" >' +
                '<label id="checkAllLabel" for="checkAll"></label>' +
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
             * 执行查询，然后刷新grid数据区域。
             * @param {object[]} queryConditions            查询条件。一般是快捷查询区的条件数组。
             * @param {object} [pageCondition]              分页条件，可以为空。
             */
            doQuery: function (queryConditions, pageCondition) {
                //var that = this;
                // 拼凑最终的查询对象
                var queryData = {
                    urSchemaId: $("#urSchemaId").val(),
                    filters: queryConditions,
                    page: pageCondition
                };
                // 获取SchemaId。对于Grid查询必须。
                //queryConditions.urSchemaId = $("#urSchemaId").val();

                // 请求查询
                gaeaAjax.post({
                    url: SYS_URL.QUERY.COMMON,
                    data: gaeaUtils.data.flattenData(queryData),
                    success: function (data) {
                        // 用查询结果，刷新数据列表
                        _grid._refreshData(data.content);
                        // 刷新当前的分页信息，和服务端一致
                        _grid.options.page.rowCount = data.totalElements;
                        _grid.options.page.page = data.page; // 当前第几页
                        _grid.options.page.size = data.size; // 每页多少条
                        _grid.options.page.pageCount = data.totalPages; // 共多少页
                        // 更新UI的footer（含分页）
                        _grid._createFooter();
                    },
                    fail: function (data) {
                        gaeaNotify.error("查询失败！\n" + JSON.stringify(data));
                    }
                });
            },
            /**
             * 最普通、标准模式查询。可以不需要参数。
             * 会默认获取当前快捷查询的条件+分页参数，进行查询。
             * @param {object} [opts]       暂时没用。
             */
            doSimpleQuery: function (opts) {
                // 获取快捷查询条件
                var queryConditions = _query.parser.getQueryConditions();
                // 获取分页相关的信息
                var pageCondition = _query.parser.getPageCondition();
                _query.doQuery(queryConditions, pageCondition);
            },
            hide: function () {
                // 收起查询区
                $("#" + GRID_DEFINE.QUERY.FILTER_CONTAINER_ID).slideUp("fast");    // cool一点的方式
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
             */
            init: function () {
                //var that = this;
                var fields = _grid.options.model.fields;
                var columns = _grid.options.columns;
                var optionData = null;
                for (var i = 0; i < fields.length; i++) {
                    var field = fields[i];
                    var column = columns[i];
                    var defaultClass = "head-query-column";
                    var columnHtmId = "mars-hq-column-" + (i + 1); // column的序列化从1开始吧
                    var inputId = "mars-hq-" + field.id;
                    // 拼凑各个字段的查询输入框
                    if (gaeaValid.isNotNull(column.hidden) && !column.hidden) {

                        /**
                         * 添加gaeaInput的容器
                         */
                        var queryFieldTemplate = _.template(TEMPLATE.QUERY.DIV_FIELD);
                        $("#mars-headquery-inputs").append(queryFieldTemplate({
                            ID: columnHtmId,
                            CLASS: defaultClass,
                            INPUT_ID: inputId,
                            FIELD_ID: field.id
                        }));
                        /**
                         * 初始化gaeaInput输入框（带按钮）
                         */
                        gaeaInput.init({
                            containerId: columnHtmId,
                            defaultClass: defaultClass,
                            inputId: inputId,
                            fieldId: field.id,
                            change: function (data) {
                                //alert("test\nop='"+data.op+"' value= "+data.value);
                                var queryConditions = _query.parser.getQueryConditions();
                                _query.doQuery(queryConditions);
                            }
                        });
                        //$("#mars-headquery-inputs").append("<div id='" + columnHtmId + "' class='" + defaultClass + "'><span><input id='" + inputId + "' data-field-id='" + field.id + "' ></span></div>");
                        // +1是列头的列间边框宽度。
                        $("#" + columnHtmId).css("width", (parseInt(column.width)));
                        //$("#" + inputId).css("width", (column.width - 10));        // 输入框的默认宽度为列宽-10.
                    }
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
                }
                // 组装按钮
                $("#mars-headquery-actions").append(gaeaButton.create({
                    "htmlId": "headqueryOK",
                    "text": "确定",
                    "size": "small"
                }));
                // 【2】 点击确定，开始查询。
                $("#headqueryOK").click(function () {
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
                    _query.hide();
                    var queryConditions = _query.parser.getQueryConditions();
                    _query.doQuery(queryConditions);
                    //that._query(queryConditions);
                    //gaea.utils.ajax.post({
                    //    url: "/admin/common/query.do",
                    //    data: queryConditions,
                    //    success: function (data) {
                    //        //alert("成功。id: " + data[0].id);
                    //        // 用查询结果，刷新数据列表
                    //        gaea.component.bridge.grid.refreshData(data);
                    //    },
                    //    fail: function (data) {
                    //        alert("失败");
                    //    }
                    //})
                });
                // 【3】 点击列头，展示查询区。但忽略“选择全部”按钮区。
                _private.event.bindShowSimpleQuery();
                //$("#tb-head").find(".column-header").not("#selectAll").click(function () {
                //    var $queryDiv = $("#mars-tb-head-query");
                //    //console.log(" 选中的column： " + $(this).data("field-id"));
                //    //$("#mars-tb-head-query").css("display","block");
                //    // cool一点的方式
                //    if ($queryDiv.is(':visible')) {
                //        $queryDiv.slideUp("fast");
                //    } else {
                //        $queryDiv.slideDown("fast");
                //    }
                //})
            }
        };
        /**
         * 查询的转换器。
         * @type {{getQueryConditions: _query.parser.getQueryConditions}}
         */
        _query.parser = {
            /**
             * 把快速查询的所有条件，组成查询对象组。
             * 这里有个要注意的：
             * 查询对象不是 key = value这种。而是类似
             * query[0].column=A
             * query[0].op=eq
             * query[0].value=1
             * 这表示包括 query[0].column 和 A 等都得动态拼凑。
             * @returns Object 查询对象列表
             */
            getQueryConditions: function () {
                var queryConditions = new Array();         // 查询请求数据
                // 利用underscore的模板功能。查询参数的变量名的名，和值的名（有点绕……）的拼凑模板。
                var paramNameTemplate = _.template(TEMPLATE.QUERY.PARAM_NAME);
                var paramValueTemplate = _.template(TEMPLATE.QUERY.PARAM_VALUE);
                var paramOpTemplate = _.template(TEMPLATE.QUERY.PARAM_OP);
                // 收起查询区
                //$("#mars-tb-head-query").slideUp("fast");    // cool一点的方式
                var i = 0;      // 查询条件数组的下标
                //queryConditions.urSchemaId = $("#urSchemaId").val();
                $("#mars-headquery-inputs").find("." + GAEA_UI_DEFINE.UI.INPUT.CLASS).each(function (index) {
                    var queryCondition = {};
                    var $gaeaInput = $(this);
                    var $input = $gaeaInput.find("input:first");
                    var inputValue = gaeaInput.getValue($gaeaInput.attr("id"));
                    var inputVal = inputValue.value; // 值
                    /**
                     * if
                     *      value不为空 or
                     *      value是空，但比较符是 等于|不等于，可能就是 is null之类的
                     * then
                     * 转换成查询对象
                     */
                    //console.log(gaeaValid.isNull(inputVal) + "\n" + _query.utils.isNull(inputValue.op));
                    if (gaeaValid.isNotNull(inputVal) ||
                        (gaeaValid.isNull(inputVal) && (_query.utils.isNull(inputValue.op) || _query.utils.isNotNull(inputValue.op)))) {
                        //var fieldKey = paramNameTemplate({P_SEQ: i});        // 不能用index。输入框为空的时候index也会递增。
                        //var fieldOpKey = paramOpTemplate({P_SEQ: i});           // 不能用index。输入框为空的时候index也会递增。
                        var fieldNameValue = $input.data("field-id"); // 哪个字段
                        //var fieldValueKey = paramValueTemplate({P_SEQ: i}); // 哪个值
                        //queryConditions[fieldKey] = fieldNameValue; // 字段
                        //queryConditions[fieldOpKey] = inputValue.op; // 比较符
                        //queryConditions[fieldValueKey] = inputValue.value; // 值
                        queryCondition.propName = fieldNameValue; // 字段
                        queryCondition.op = inputValue.op; // 比较符
                        queryCondition.propValue = inputValue.value; // 值
                        queryConditions.push(queryCondition);
                        //i += 1;
                    }
                });
                return queryConditions;
            },
            /**
             * 获取当前grid的分页查询条件。
             * @param {object} [opts]       暂时没用
             */
            getPageCondition: function (opts) {
                var pageCondition = {};
                pageCondition.size = $("#pageSizeListCt #selected").text();
                pageCondition.page = _grid.options.page.page;
                return pageCondition;
            }
        };
        /**
         * 常用工具
         */
        _query.utils = {
            /**
             * 是否等于查询
             * @param op 查询符
             * @returns {*|boolean}
             */
            isNull: function (op) {
                if (gaeaValid.isNull(op)) {
                    return false;
                }
                return gaeaString.equalsIgnoreCase(op, "na");
            },
            isNotNull: function (op) {
                if (gaeaValid.isNull(op)) {
                    return false;
                }
                return gaeaString.equalsIgnoreCase(op, "nna");
            }
        };

        var _grid = {
            options: {
                title: null,
                width: null,
                height: null,
                hidden: null,
                resizable: null,
                autoLoad: null,
                renderTo: null,
                data: null,             // json数据。直接初始化表格。
                model: {
                    fields: {
                        id: null,
                        name: null
                    },
                    idProperty: null
                },
                columns: [
                    {
                        text: null, // 表头的文字
                        name: null, // 预留字段
                        id: null,
                        width: null,
                        hidden: false,
                        resizable: false,
                        renderType: null, // 渲染的类型。例如如果字段是日期的，需要转变成日期格式显示。可选：date,time（未实现），datetime（未实现）
                        // callback
                        renderer: null          // 数据转换的拦截器
                    }
                ],
                proxy: {
                    url: null,
                    headers: null,
                    params: null
                },
                // 监听事件。例如：单击、双击、单击单元格等……
                listeners: {
                    cellclick: null,
                    select: null
                },
                page: {
                    page: 1,
                    size: 20,
                    rowCount: 0,
                    pageCount: 0
                }
            },
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
            create: function (options) {
                var that = this;
                _grid.options = options;
                if (!$.isArray(options.model.fields) || !$.isArray(options.columns)) {
                    console.log("fields与columns必须是数组！");
                    return;
                }
                if (options.model.fields.length !== options.columns.length) {
                    console.log("fields与columns长度必须一致！");
                    return;
                }
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
                var grid = $("#" + options.renderTo);
                grid.append("<div class='gaea-grid'>" +
                    "<div class='gaea-grid-header'><div id=\"tb-head\" class=\"tb-head\"></div></div>" +
                    "<div class='gaea-grid-body'><table class='tb-body'></table></div>" +
                    "<div class='gaea-grid-footer'><div id=\"pagination\" class=\"pagination\"></div></div>" +
                    "<input type='hidden' id='gridId' name='gridId' value='" + options.id + "'>" +
                    "</div>");
                var tableHeadCT = $(".gaea-grid-header");
                //var tableHead = $("#tb-head");
                //var tableBody = $(".tb-body");
                //var autoGenClassNamePrefix = "autogen-col-";
                //var tdDefaultClasses = "grid-td";
                //var colCssArray = new Array();
                //var selectedRow;                                    // 如果点击了数据表中某行，记录该行
                /* 创建列表的表头 */
                _grid._createTableHead();
                /* 创建列表的数据部分 */
                _grid._createTableData();
                /* 创建Grid的脚部分页部分 */
                _grid._createFooter();
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
                    "<div id=\"mars-headquery-actions\" class='mars-headquery-actions'></div>" +
                    "</div>");
                _query.view.init();
                /**
                 * 行操作区
                 */
                _grid._createRowActions();
                /* 设置Grid样式 */
                _grid._applyCSS();
                /* 应用相关的效果，如复选框选中等 */
                _grid._applyJsStyle();
                /* --------------------------------------------------------------------------------------------------------- WEB_FRAMEWORK的extJS代码 -------------------------- */
//            /* Model */
//            var colModel = new Ext.grid.ColumnModel({
//                columns: myColumns
//            });
//            /* Store */
//            var store = new Ext.data.JsonStore({
//                idProperty: options.model.idProperty, // 没有这个，就不能通过record.id获取行数据的id。
//                fields: myFields,
//                autoLoad: options.autoLoad,
//                baseParams: this.options.proxy.params,
//                proxy: new Ext.data.HttpProxy({
//                    type: "ajax",
//                    url: options.proxy.url,
//                    headers: options.proxy.headers,
//                    reader: {
//                        type: 'json'
//                    }
//                })
//            });
//            /* Grid */
//            grid = new Ext.grid.GridPanel({
//                id: "mygrid",
//                store: store,
//                colModel: colModel,
//                renderTo: options.renderTo,
//                sm: new Ext.grid.RowSelectionModel({singleSelect: true}),
//                width: 600,
//                height: 300,
//                frame: true,
//                title: '产品管理',
//                iconCls: 'icon-grid'
//            });
//            /* 添加事件相应 */
//            if (ur.utils.validate.isNotNull(this.options.listeners)
//                && ur.utils.validate.isNotNull(this.options.listeners.cellclick)) {
//                grid.on({
//                    cellclick: function(grd, rowIndex, columnIndex, e) {
//                        if (ur.utils.validate.isNotNull(that.options.listeners.cellclick)) {
////                        console.log(" grid on click ---->>> rowIndex=" + rowIndex + ",columnIndex=" + columnIndex);
//                            var record = grd.getStore().getAt(rowIndex);  // Get the Record
//                            var colModel = grd.getColumnModel();
//                            var colId = colModel.getColumnId(columnIndex);
//                            // 通过id获取点击的单元格的值。
//                            var value = record.get(colId);
//                            that.options.listeners.cellclick(value,record);
////                        console.log(" grid on click ---->>> value=" + value);
//                        }
//                    }
//                });
//            }
//            return grid;
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
            _refreshData: function (data) {
                _grid.options.data = data;
                $(".tb-body").html("");
                _grid._createTableData();
                // 设置Grid样式
                _grid._applyCSS();
                // 绑定事件，例如：行前复选框
                _grid._bindingEvents(_grid.options);
                // 创建行操作区
                _grid._createRowActions();
            },
            _createTableHead: function () {
                var data = _grid.options.data;
                //var tableBody = $(".ur-gridtable");
                //var tableHead = $("#mars-tb-head");
                var autoGenClassNamePrefix = "autogen-col-";
                var fields = _grid.options.model.fields;
                var columns = _grid.options.columns;
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
                        //$("#tb-head").append("<div id='selectAll' class='select-all column-header'><input type='checkbox' id='checkAll' class='checkAll' ></div>");
                        $("#tb-head").append(TEMPLATE.GRID.HEAD_CHECK_ALL_DIV);
                    }
                    $("#tb-head").append("<div id='" + columnHtmId + "' class='" + defaultClass + "' data-field-id='" + field.id + "'>" + tmpCol.text + "</div>");
                    //}
                }
                // 最后一个列头单元格。只是用于填充宽度。
                $("#tb-head").append("<div class='" + defaultClass + " last' />");
                //if (i == 0) {
                $("#tb-head").append("</tr>");
                //}
                //}
            },
            /**
             * 创建列表页（grid）的数据部分（table row)，包括行前的复选框，
             * param need:
             * data
             * @private
             */
            _createTableData: function () {
                var that = this;
                var data = _grid.options.data;
                //var tableBody = $(".ur-gridtable");
                //var tableHead = $("#mars-tb-head");
                var autoGenClassNamePrefix = "autogen-col-";
                var fields = _grid.options.model.fields;
                var columns = _grid.options.columns;
                var lastTRselector = ".gaea-grid-body table tr:last";
                var arrRowHeadActions = new Array();
                //var tdDefaultClasses = "grid-td";
                // 清空一下。如果是刷新数据的时候需要。
                $(".tb-body").html("");
                // 先清空缓存
                _grid.cache.rows = [];
                // 遍历每一行数据
                for (var i = 0; i < data.length; i++) {
                    var row = data[i];
                    //console.log("name= "+row.name);
                    $(".tb-body").append("<tr data-rowindex='" + (i + 1) + "'>");
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
                                    $(lastTRselector).append("<td class='checkbox'>" +
                                        "<div class=\"row-check\">" +
                                        "<input type='checkbox' id='gaea-grid-cbx-" + i + "' class='dark'>" +
                                            // Label里面的都是复选框的效果元素。
                                        "<label id='gaea-cb-label-" + i + "' for='gaea-grid-cbx-" + i + "'>" +       // label的for和checkbox的id绑定
                                        "</label>" +
                                        "</div>" +
                                        "</td>");
                                }
                                // 转换日期格式
                                if (gaeaValid.isNotNull(cellText) && gaeaValid.isNotNull(column.datetimeFormat)) {
                                    cellText = gaeaDT.getDate(cellText, {format: column.datetimeFormat});
                                }
                                $(lastTRselector).append("<td class='grid-td' data-columnid='" + columnHtmId + "'>" +
                                    "<div class=\"grid-td-div\">" + cellText + "</div></td>");
                            }
                        });
                        // 有定义列、没数据的（连数据项也没有，不是指空数据），也需要有个空列占位
                        if (hasNotMatchedField) {
                            $(lastTRselector).append("<td class='grid-td' data-columnid='" + columnHtmId + "'>" +
                                "<div class=\"grid-td-div\"></div></td>");
                        }
                    }
                    // 给行末尾添加一个单元格，负责撑开剩余空间，让表格可以width 100%
                    $(lastTRselector).append("<td></td>");
                    // 生成行前操作区。判断是否有工作流。有的话生成'查看工作流'的按钮
                    if (_grid.options.withWorkflow == true) {
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
                    $(".tb-body").append("</tr>");
                }
            },
            /**
             * 设置Grid的样式。
             * 包括列头的宽度，行数据单元格的宽度，隐藏不要显示的列、计算整个列头的宽度（js）等。
             * @private
             */
            _applyCSS: function () {
                var that = this;
                var grid = $("#" + _grid.options.renderTo);
                //var gridHead = $(".gaea-grid-header .tb-head");
                var totalWidth = 0;

                // 遍历column数组，设置显示样式（CSS等）
                $.each(_grid.options.columns, function (idx, obj) {
                    var col = this;
                    var gridColumnId = "gridcolumn-" + (idx + 1);
                    if (gaeaValid.isNotNull(col.width) && $.isNumeric(col.width)) {
                        // 设置单元格宽度
                        that.column._setWidth(gridColumnId, col);
                        // 汇总宽度
                        if (gaeaValid.isNotNull(col.hidden)) {
                            totalWidth += parseInt(col.width);
                        }
                    }
                    // 隐藏列（没宽度也可以）
                    if (gaeaValid.isNotNull(col.hidden)) {
                        that.column._hidden(gridColumnId, col);
                    }
                });

                /* 设置头部的宽度 */
                // 宽度没有页面宽，就100%吧
                if (totalWidth < document.body.offsetWidth) {
                    totalWidth = "100%";
                }
                GAEA_UI_DEFINE.UI.MAIN.getUIPageJQ().css("width", totalWidth);

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
            _bindingEvents: function (options) {
                //var that = this;
                var gridId = options.renderTo;
                var $grid = $("#" + gridId);
                /**
                 * 注册行选择事件
                 */
                    //_grid.row.initSelectEvent();
                _private.event.bindSelectRow();
                /**
                 * 注册刷新grid数据事件
                 */
                gaeaEvents.registerListener(gaeaEvents.DEFINE.UI.GRID.RELOAD, "#" + gridId, function (event, data) {
                    _query.doQuery({});
                });
                /**
                 * 注册行选择缓存所选行数据事件
                 */
                gaeaEvents.registerListener(gaeaEvents.DEFINE.UI.GRID.SELECT, "#" + gridId, function (event, data) {
                    // 【1】刷新selectedRows（每次覆盖）
                    var rowIndexes = _private.grid.getSelectedIndexes({
                        id: GAEA_UI_DEFINE.UI.GRID.GAEA_GRID_DEFAULT_ID
                    });
                    // 通过选择的index，获得行数据
                    var selectedRows = _private.grid.getRowDatas({
                        indexes: rowIndexes
                    });
                    // 刷新上下文（缓存行数据）
                    gaeaContext.setValue(GAEA_UI_DEFINE.UI.GAEA_CONTEXT.CACHE_KEY.SELECTED_ROWS, selectedRows);

                    // 【2】刷新selectedRow上下文
                    if (gaeaValid.isNotNull(data.selectedRow)) {
                        gaeaContext.setValue("selectedRow", data.selectedRow);
                        gaeaContext.setValue("id", data.selectedRow.id);
                    }
                });
                /**
                 * 注册选择全部事件
                 */
                _private.event.bindCheckAll();
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
             * @private
             */
            _createFooter: function () {
                var pageDiv = $(".gaea-grid-footer .pagination");
                var that = this;
                var page = parseInt(_grid.options.page.page);
                var size = parseInt(_grid.options.page.size);
                var rowCount = parseInt(_grid.options.page.rowCount);
                // 清空内容
                pageDiv.html("");
                // 第一页
                pageDiv.append("<div class='button'><span class=\"icon first\"><input type='hidden' value='" + 1 + "'></span></div>");
                // 上一页
                pageDiv.append("<div class='button'><span class=\"icon previous\"><input type='hidden' value='" + (page - 1) + "'></span></div>");
                // 页码部分: 1 2 3 4 ...
                pageDiv.append("<div class='page-numbers'></div>");
                // 生成页码
                var pageList = _private.pagination.getPageNoList({
                    page: page,
                    pageCount: _grid.options.page.pageCount,
                    listSize: GRID_DEFINE.PAGINATION.DEFAULT_PAGE_LIST_LENGTH
                });
                $.each(pageList, function (idx, val) {
                    var tempPage = parseInt(val);
                    if (tempPage != page) {
                        pageDiv.find(".page-numbers").append('<span class="gaea-float-icon size-m">' + tempPage + "<input type='hidden' value='" + tempPage + "'></span>");
                        //}
                    } else {
                        pageDiv.find(".page-numbers").append("<span class=\"gaea-float-icon selected size-m\">" + tempPage + "</span>");
                    }
                });

                // 下一页
                pageDiv.append("<div class='button'><span class=\"icon next\"><input type='hidden' value='" + (page + 1) + "'></span></div>");     // p在循环最后自加了，这里就不用加了。

                // 最后一页
                pageDiv.append("<div class='button'><span class=\"icon last\"><input type='hidden' value='" + (Math.ceil(rowCount / size)) + "'></span></div>");

                // 页显示数量
                pageDiv.append(_private.pagination.getHowManyRecordsHtml());

                // 生成：显示第1条至第20条 当前第几页
                var first = 1;
                if (page > 1) {
                    first += (page - 1) * size;
                }
                var last = page * size;
                //pageDiv.append("<span class=\"page-desc\">" + first + " - " + last + " 共 " + rowCount + "条数据</span>");
                // 生成html：1 - 20 共 2条数据
                var pageDescTemplate = _.template(TEMPLATE.PAGINATION.CT);
                pageDiv.append(pageDescTemplate({
                    FIRST: first,
                    LAST: last,
                    ROW_COUNT: rowCount
                }));

                /* 【2】绑定事件 */
                // 点击页码事件
                pageDiv.find("span:has(input)").click(function () {
                    var pageVal = $(this).children("input").val();
                    that.options.page.page = pageVal;     // 先赋值。待会查询完成后可用于刷新页码。
                    // 查询（下一页 etc……）
                    _query.doSimpleQuery();
                });
                // 点击展示每页多少条区域
                _private.event.pagination.bindPageSizeListClick();
                // 点击每页多少条（某一项），触发后台查询。
                _private.event.pagination.bindPageSizeListItemClick();
            },
            /**
             * 高级查询
             * 即点击列头，出现在列头下的查询行。
             * @private
             */
            // ------------------>>>> _initAdvancedQuery重构到_query.view.init方法 2016-6-19 18:41:34
            //_initAdvancedQuery: function () {
            //    var that = this;
            //    var fields = this.options.model.fields;
            //    var columns = this.options.columns;
            //    var optionData = null;
            //    for (var i = 0; i < fields.length; i++) {
            //        var field = fields[i];
            //        var column = columns[i];
            //        var defaultClass = "head-query-column";
            //        var columnHtmId = "mars-hq-column-" + (i + 1); // column的序列化从1开始吧
            //        var inputId = "mars-hq-" + field.id;
            //        // 拼凑各个字段的查询输入框
            //        if (gaeaValid.isNotNull(column.hidden) && !column.hidden) {
            //            $("#mars-headquery-inputs").append("<div id='" + columnHtmId + "' class='" + defaultClass + "'><span><input id='" + inputId + "' data-field-id='" + field.id + "' ></span></div>");
            //            // +1是列头的列间边框宽度。
            //            $("#" + columnHtmId).css("width", (parseInt(column.width)));
            //            //$("#" + inputId).css("width", (column.width - 10));        // 输入框的默认宽度为列宽-10.
            //        }
            //    }
            //    // 组装按钮
            //    $("#mars-headquery-actions").append(gaeaButton.create({
            //        "htmlId": "headqueryOK",
            //        "text": "确定",
            //        "size": "small"
            //    }));
            //    // 【2】 点击确定，开始查询。
            //    $("#headqueryOK").click(function () {
            //        //// 利用underscore的模板功能。查询参数的变量名的名，和值的名（有点绕……）的拼凑模板。
            //        //var paramNameTemplate = _.template(TEMPLATE.QUERY.PARAM_NAME);
            //        //var paramValueTemplate = _.template(TEMPLATE.QUERY.PARAM_VALUE);
            //        //// 收起查询区
            //        //$("#mars-tb-head-query").slideUp("fast");    // cool一点的方式
            //        //var queryConditions = new Object();         // 查询请求数据
            //        //var i = 0;      // 查询条件数组的下标
            //        ////queryConditions.urSchemaId = $("#urSchemaId").val();
            //        //$("#mars-headquery-inputs").find("input").each(function (index) {
            //        //    console.log("input value: " + $(this).val() + " , " + $(this).prop("value"));
            //        //    var inputVal = $(this).val();
            //        //    console.log("empty length: " + inputVal.length + " 0 length: " + "0".length);
            //        //    if (gaeaValid.isNotNull(inputVal)) {
            //        //        //var nameKey = "filters[" + i + "].name";        // 不能用index。输入框为空的时候index也会递增。
            //        //        var nameKey = paramNameTemplate({P_SEQ:i});        // 不能用index。输入框为空的时候index也会递增。
            //        //        var nameValue = $(this).data("field-id");
            //        //        //var valKey = "filters[" + i + "].value";
            //        //        var valKey = paramValueTemplate({P_SEQ:i});
            //        //        var valValue = $(this).val();
            //        //        queryConditions[nameKey] = nameValue;
            //        //        queryConditions[valKey] = valValue;
            //        //        i += 1;
            //        //    }
            //        //});
            //        // ------------------>>>> 上面的都重构到getQueryConditions方法
            //        var queryConditions = _query.parser.getQueryConditions();
            //        _query.doQuery(queryConditions);
            //        //that._query(queryConditions);
            //        //gaea.utils.ajax.post({
            //        //    url: "/admin/common/query.do",
            //        //    data: queryConditions,
            //        //    success: function (data) {
            //        //        //alert("成功。id: " + data[0].id);
            //        //        // 用查询结果，刷新数据列表
            //        //        gaea.component.bridge.grid.refreshData(data);
            //        //    },
            //        //    fail: function (data) {
            //        //        alert("失败");
            //        //    }
            //        //})
            //    });
            //    // 【3】 点击列头，展示查询区。
            //    $("#tb-head").find(".column-header").click(function () {
            //        //console.log(" 选中的column： " + $(this).data("field-id"));
            //        //$("#mars-tb-head-query").css("display","block");
            //        $("#mars-tb-head-query").slideDown("fast");    // cool一点的方式
            //    })
            //},


            // ------------------>>>> _query重构到_query.doQuery方法
            //_query: function (queryConditions) {
            //    var that = this;
            //    // 获取SchemaId。对于Grid查询必须。
            //    queryConditions.urSchemaId = $("#urSchemaId").val();
            //    gaeaAjax.post({
            //        url: SYS_URL.QUERY.COMMON,
            //        data: queryConditions,
            //        success: function (data) {
            //            //var result = $.parseJSON(jqXHR.responseText);
            //            // 用查询结果，刷新数据列表
            //            that.refreshData(data.content);
            //            that.options.page.rowCount = data.totalElements;
            //            that._createFooter();
            //        },
            //        fail: function (data) {
            //            alert("失败");
            //        }
            //    });
            //},
            /**
             * 创建行操作区，包括行前操作区（按钮区），行尾操作区（按钮区）
             * @private
             */
            _createRowActions: function () {
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
                            $(".tb-body tr").eq(rowCache.index).children("td").eq(0).after("<td class=\"grid-td row-headactions\" data-columnid=\"headactions\">" + actionsHtml + "</td>");
                        }
                        // 遍历处理行尾操作区。未完成。。。
                    });
                    // 如果任意一行有行前操作区，增加列头。
                    if (hasHeadActionAtAll && !that.cache.hasCreatedRowHeadActions) {
                        that.cache.hasCreatedRowHeadActions = true;
                        $("#tb-head .select-all").after("<div id='row-headactions' class='row-headactions column-header'><p>操作</p></div>");
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
                 * @param gridColumnId table的td的data-columnid属性，标识第几列
                 * @param columnConfig 列定义。在Schema中的定义。
                 * @private
                 */
                _hidden: function (gridColumnId, columnConfig) {
                    var grid = $("#" + _grid.options.renderTo);
                    var columnTDs = "td[data-columnid=" + gridColumnId + "]";
                    if (columnConfig.hidden) {
                        grid.find(columnTDs).css("display", "none");
                        $("#" + gridColumnId).css("display", "none");
                    }
                },
                /**
                 * 设置列宽度
                 * @param gridColumnId table的td的data-columnid属性，标识第几列
                 * @param columnConfig 列定义。在Schema中的定义。
                 * @private
                 */
                _setWidth: function (gridColumnId, columnConfig) {
                    var grid = $("#" + _grid.options.renderTo);
                    var gridHead = $(".gaea-grid-header .tb-head");
                    var columnTDs = "td[data-columnid=" + gridColumnId + "]";
                    // 设置数据table的单元格的样式
                    // 单元格宽度，等于Schema设置的宽度 + 列头的左右padding - 单元格td自带的左右padding + 列头的列间边框（白缝）。因为左右一样，所以都是x2
                    var gridCellWidth = parseInt(columnConfig.width);
                    // 宽度设置。只设置第一行单元格td。
                    grid.find(columnTDs + ":first").css("width", gridCellWidth);
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
                 * @param {number} opts.index               第几行数据。以数组下标的方式，从0开始。
                 * @param {number[]} opts.indexes           某些行数据。以数组下标的方式，从0开始。
                 */
                getRowDatas: function (opts) {
                    var result = _grid.options.data;
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
                    _private.grid.resetUI();
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
                 * @param {object} [opts]           暂时没用
                 */
                resetUI: function (opts) {
                    var $grid = $("#urgrid");
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
                 * @param {object} [opts]
                 */
                getHowManyRecordsHtml: function (opts) {
                    var $howManyRecordsCt = $('<div id="pageSizeListCt" class="how-many-records"><span id="selected"></span></div>');
                    // 默认值。由服务端定义。
                    var defaultSize = parseInt(_grid.options.page.size);
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
                 * @param opts
                 */
                bindCheckAll: function (opts) {
                    gaeaEvents.registerListener("click", "#checkAllLabel", function () {
                        // 这个是label，不是checkbox
                        var $checkAll = $(this);
                        // 这个是点击前的状态
                        var isCheckAll = $checkAll.parent().children("input:checkbox").first().is(":checked");
                        var $gridBody = $checkAll.parents(".gaea-grid").children(".gaea-grid-body");
                        // 设为反状态
                        $gridBody.find(".row-check input:checkbox").prop("checked", !isCheckAll);

                        _private.event.triggerCacheSelect({
                            id: GAEA_UI_DEFINE.UI.GRID.GAEA_GRID_DEFAULT_ID
                        });
                    });
                },
                /**
                 * 绑定点击头部，展示快捷查询区的事件。
                 * @param opts
                 */
                bindShowSimpleQuery: function (opts) {
                    var $queryDiv = $("#mars-tb-head-query");
                    var closeFunction = function () {
                        $queryDiv.slideUp("fast");
                    };

                    // 点击头部，展开快捷查询栏。
                    $("#tb-head").find(".column-header").not("#selectAll").click(function () {
                        // cool一点的方式
                        if ($queryDiv.is(':visible')) {
                            closeFunction();
                        } else {
                            $queryDiv.slideDown("fast");
                            // 设定自动关闭时，最近的操作
                            gaeaEvents.autoClose.setMe({
                                jqSelector: "#tb-head"
                            });
                        }
                    });
                    // 注册点击外部自动关闭。
                    gaeaEvents.autoClose.registerAutoClose("#tb-head", closeFunction);
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
                 * @param {object} [opts]
                 */
                bindSelectRow: function (opts) {
                    // 绑定事件。点击行选中复选框。
                    gaeaEvents.registerListener("click", ".tb-body tr", function (event) {
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
                            $(":checkbox[id^='gaea-grid-cbx']").prop("checked", false);
                            // 选中当前行复选框
                            $(this).find("[id^='gaea-grid-cbx']").prop("checked", "true");
                            // 添加行选中class
                            $(".tb-body tr").removeClass("selected");
                            $(this).addClass("selected");
                            // 获取选中行数据（selectedRow）
                            $(this).find("[id^='gaea-grid-cbx']").val($(this).data("rowindex") - 1);
                            selectedRow = _grid.options.data[($(this).data("rowindex") - 1)];
                            selectedRow.index = $(this).data("rowindex");
                            _grid._setSelectRow(selectedRow);
                            //_grid.options.listeners.select(selectedRow);
                        }
                        /**
                         * 触发选中事件。基于事件去影响相关的其他组件或元素。
                         * 例如：
                         * 选中后，也许删除按钮需要知道选中的是哪行，之类的……
                         */
                        $("#" + _grid.options.renderTo).trigger(gaeaEvents.DEFINE.UI.GRID.SELECT, {
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
                        indexes: rowIndexes
                    });

                    // 缓存行数据
                    gaeaContext.setValue(GAEA_UI_DEFINE.UI.GAEA_CONTEXT.CACHE_KEY.SELECTED_ROWS, selectedRows);
                },
                // 分页
                pagination: {
                    /**
                     * 绑定点击了当前页显示多少条后的事件。
                     * @param {object} [opts]
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
                                _query.doSimpleQuery();
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
                getQueryConditions: _query.parser.getQueryConditions
            }
        };
    });