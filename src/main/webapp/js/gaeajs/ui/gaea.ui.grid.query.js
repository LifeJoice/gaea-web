/**
 * 基于RequireJS的模块化重构。让依赖更清晰，更简单。
 *
 * Gaea Grid Query组件。
 * 主要是把grid里面的查询部分，分离出来。因为查询这块的逻辑还是蛮复杂的。功能也挺多的。
 * Created by iverson on 2017年3月23日17:04:19
 */
define([
        "jquery", "underscore", "underscore-string", "gaeajs-common-utils-validate", "gaeajs-common-utils-string",
        "gaeajs-ui-events", "gaeajs-common-utils", "gaea-system-url", "gaeajs-common-utils-ajax", "gaeajs-ui-notify",
        "gaeajs-ui-definition", "gaeajs-ui-input", "gaeajs-ui-plugins"
    ],
    function ($, _, _s, gaeaValid, gaeaString,
              gaeaEvents, gaeaUtils, SYS_URL, gaeaAjax, gaeaNotify,
              GAEA_UI_DEFINE, gaeaInput, gaeaPlugins) {
        /**
         * @type {object} QueryCondition
         * @property {string} QueryCondition.propName       属性名
         * @property {string} QueryCondition.op             比较关系
         * @property {string} QueryCondition.propValue      值
         */

        var query = {
            /**
             * 所有快捷查询的入口。
             * @param {object} opts                             如果为空，则全部清空按基本的查询。
             * @param {string} opts.id                          一般是grid id。会去触发它的刷新事件。
             */
            doQuery: function (opts) {
                var gridOptions = $("#" + opts.id).data().options;
                if (gaeaString.equalsIgnoreCase(gridOptions.component, GAEA_UI_DEFINE.UI.COMPONENT.CRUD_GRID)) {
                    /**
                     * crud grid
                     * 是对当前缓存数据的筛选，不需要跟服务端数据库等交互
                     */
                    query.filter.doFilter(opts);
                } else {
                    /**
                     * 普通grid
                     * 需要查询，数据库交互等
                     */
                    query.doServerQuery(opts);
                }
            },
            /**
             * 和服务端有交互的查询。
             * 执行查询，然后刷新grid数据区域。
             * @param {object} opts                             如果为空，则全部清空按基本的查询。
             * @param {string} opts.id                          一般是grid id。会去触发它的刷新事件。
             * @param {object[]} opts.queryConditions           查询条件。一般是快捷查询区的条件数组。
             * @param {object} [opts.pageCondition]             分页条件，可以为空。
             */
            doServerQuery: function (opts) {
                gaeaValid.isNull({
                    check: opts.id,
                    exception: "调用查询组件，(grid)id不允许为空！否则无法刷新数据。"
                });
                var $grid = $("#" + opts.id);
                //var that = this;
                // 拼凑最终的查询对象
                var queryData = {
                    urSchemaId: $("#urSchemaId").val(),
                    filters: opts.queryConditions,
                    page: opts.pageCondition
                };
                // 获取SchemaId。对于Grid查询必须。
                //queryConditions.urSchemaId = $("#urSchemaId").val();

                // 请求查询
                gaeaAjax.post({
                    url: SYS_URL.QUERY.COMMON,
                    data: gaeaUtils.data.flattenData(queryData),
                    success: function (data) {
                        // 刷新当前的分页信息，和服务端一致
                        var page = {
                            rowCount: data.totalElements,
                            page: data.page, // 当前第几页
                            size: data.size, // 每页多少条
                            pageCount: data.totalPages // 共多少页
                        };
                        // 获取表格data中缓存的分页设置
                        $grid.data("options").page = page;
                        // 触发数据刷新
                        $grid.trigger(gaeaEvents.DEFINE.UI.GRID.REFRESH_DATA, {
                            data: data.content,
                            page: page
                        });


                        //// 用查询结果，刷新数据列表
                        //_grid._refreshData(data.content);
                        //// 刷新当前的分页信息，和服务端一致
                        //_grid.options.page.rowCount = data.totalElements;
                        //_grid.options.page.page = data.page; // 当前第几页
                        //_grid.options.page.size = data.size; // 每页多少条
                        //_grid.options.page.pageCount = data.totalPages; // 共多少页
                        //// 更新UI的footer（含分页）
                        //_grid._createFooter();
                    },
                    fail: function (data) {
                        var result = JSON.parse(data.responseText);
                        gaeaNotify.error("查询失败！\n" + result.message);
                    }
                });
            },
            /**
             * 最普通、标准模式查询。可以不需要参数。
             * 会默认获取当前快捷查询的条件+分页参数，进行查询。
             * @param {object} opts
             * @param {string} opts.id          grid id
             */
            doSimpleQuery: function (opts) {
                // 获取快捷查询条件
                var queryConditions = query.parser.getQueryConditions(opts);
                // 获取分页相关的信息
                var pageCondition = query.parser.getPageCondition(opts);
                query.doQuery({
                    id: opts.id,
                    queryConditions: queryConditions,
                    pageCondition: pageCondition
                });
            }
        };

        /**
         * 和html相关的，包括构建快捷查询栏，输入框，确定查询按钮和相关事件等。
         */
        query.view = {
            /**
             * 这个是从gaea.ui.grid的_query.view.init重构而来. 但目前主要只是迁移了事件相关的部分. HTML构造部分的, 还是留在之前的方法.
             * @param {object} opts
             * @param {string} opts.id                          一般是grid id。会去触发它的刷新事件。
             * @param {string} opts.component                   组件名称
             */
            init: function (opts) {

                if (gaeaString.equalsIgnoreCase(opts.component, GAEA_UI_DEFINE.UI.COMPONENT.CRUD_GRID)) {
                    // crud grid的事件绑定。比较简单，不需要什么分页、每页多少条等等事件
                    crudQuery.event.bindEvents(opts);
                } else {
                    query.event.bindEvents(opts);
                }

                //query.view.event.bindSubmitQuery(opts);
                ////$gridCt.find("#headqueryOK").click(function () {
                ////    // 收起查询区
                ////    query.view.hide(opts);
                ////    //_query.hide(opts);
                ////    var queryConditions = query.parser.getQueryConditions(opts);
                ////    //var queryConditions = gridQuery.parser.getQueryConditions(opts);
                ////    query.doQuery({
                ////        id: opts.id,
                ////        queryConditions: queryConditions
                ////    });
                ////    //gridQuery.doQuery({
                ////    //    id: opts.id,
                ////    //    queryConditions: queryConditions
                ////    //});
                ////});
                //// 【3】 点击列头，展示查询区。但忽略“选择全部”按钮区。
                //query.event.bindShowSimpleQuery(opts);
                //// 设定查询区的比较符按钮点击操作，和相关的触发事件。
                //query.event.setQueryCompareButtonTrigger(opts);
                ////_query.view.event.setQueryCompareButtonTrigger(opts);
                //query.event.bindQueryCompareButtonEvent(opts);
                ////_query.view.event.bindQueryCompareButtonEvent(opts);
                //// 【4】 初始化快捷查询区的gaea UI组件（例如：select2等）
                //query.view.initGaeaUI(opts);
                ////_query.view.initGaeaUI(opts);
            },
            /**
             * 把快速查询区的所有查询条件清空！
             * @param opts
             */
            resetUI: function (opts) {
                var $gridCt = $("#" + opts.id);
                var gridOptions = $gridCt.data("options");
                // 清空所有输入查询条件
                $gridCt.find(".mars-headquery-inputs").find("input").val("");
            },
            event: {
                /**
                 *
                 * @param {object} opts
                 * @param {string} opts.id                          grid容器id。
                 */
                bindSubmitQuery: function (opts) {
                    var $gridCt = $("#" + opts.id);

                    $gridCt.find("#headqueryOK").click(function () {
                        // 收起查询区
                        query.view.hide(opts);
                        var queryConditions = query.parser.getQueryConditions(opts);
                        //var queryConditions = gridQuery.parser.getQueryConditions(opts);
                        query.doQuery({
                            id: opts.id,
                            queryConditions: queryConditions
                        });
                        //gridQuery.doQuery({
                        //    id: opts.id,
                        //    queryConditions: queryConditions
                        //});
                    });
                }
            },
            hide: function (opts) {
                // 收起查询区
                $("#" + opts.id + " #mars-tb-head-query").slideUp("fast");    // cool一点的方式
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
                        if (gaeaString.equalsIgnoreCase(column.dataType, GAEA_UI_DEFINE.UI.DATA.DATA_TYPE_DATE)) {
                            // 初始化日期控件
                            gaeaPlugins.datePicker.init({
                                target: "#" + inputId
                            });
                        } else if (gaeaString.equalsIgnoreCase(column.dataType, GAEA_UI_DEFINE.UI.DATA.DATA_TYPE_TIME)) {
                            // TODO
                        } else if (gaeaString.equalsIgnoreCase(column.dataType, GAEA_UI_DEFINE.UI.DATA.DATA_TYPE_DATETIME)) {
                            // 初始化日期时间控件
                            gaeaPlugins.datetimePicker.init({
                                target: "#" + inputId
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
            }
        };

        /**
         * 查询的转换器。
         * @type {{getQueryConditions: _query.parser.getQueryConditions}}
         */
        query.parser = {
            /**
             * 把快速查询的所有条件，组成查询对象组。
             * 这里有个要注意的：
             * 查询对象不是 key = value这种。而是类似
             * query[0].column=A
             * query[0].op=eq
             * query[0].value=1
             * 这表示包括 query[0].column 和 A 等都得动态拼凑。
             *
             * @param {object} opts
             * @param {string} opts.id                  grid id
             * @returns {QueryCondition} 查询对象列表
             */
            getQueryConditions: function (opts) {
                var queryConditions = [];         // 查询请求数据
                var $gridCt = $("#" + opts.id);
                // 利用underscore的模板功能。查询参数的变量名的名，和值的名（有点绕……）的拼凑模板。
                //var paramNameTemplate = _.template(TEMPLATE.QUERY.PARAM_NAME);
                //var paramValueTemplate = _.template(TEMPLATE.QUERY.PARAM_VALUE);
                //var paramOpTemplate = _.template(TEMPLATE.QUERY.PARAM_OP);
                // 收起查询区
                //$("#mars-tb-head-query").slideUp("fast");    // cool一点的方式
                //var i = 0;      // 查询条件数组的下标
                //queryConditions.urSchemaId = $("#urSchemaId").val();
                $gridCt.find("#mars-headquery-inputs").find("." + GAEA_UI_DEFINE.UI.INPUT.CLASS).each(function (index) {
                    var queryCondition = {};
                    var $gaeaInput = $(this);
                    var $input = $gaeaInput.find("input,select").first();
                    var inputValue = query.parser.getValue($gaeaInput);
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
                        (gaeaValid.isNull(inputVal) && (query.utils.isNull(inputValue.op) || query.utils.isNotNull(inputValue.op)))) {
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
             * @param {object} opts
             * @param {string} opts.id                  grid id
             */
            getPageCondition: function (opts) {
                var $gridCt = $("#" + opts.id);
                var pageCondition = {};
                pageCondition.size = $gridCt.find("#pageSizeListCt #selected").text();
                //pageCondition.page = _grid.options.page.page;
                pageCondition.page = $gridCt.data().options.page.page;
                return pageCondition;
            },
            /**
             *
             * @param $oneQueryCt jq对象。整个gaeaInput的容器. 例如：class= 'gaea-query-field head-query-column'
             * @returns gaeaInput里面的input的值
             */
            getValue: function ($oneQueryCt) {
                var result = null;
                //var $oneQueryCt = $("#" + containerId);// gaeaInput的容器。包含按钮组、输入框等
                if (gaeaValid.isNotNull($oneQueryCt)) {
                    // 找到gaeaInput的输入框,获取其中的值
                    var $input = $oneQueryCt.find("input,select");
                    if (gaeaValid.isNotNull($input)) {
                        //result = $input.val();
                        // 获取gaeaInput的按钮值
                        var dataConfigStr = $oneQueryCt.find(".gaea-query-buttons i:first").data("gaea-data");
                        var dataConfig = gaeaString.parseJSON(dataConfigStr);
                        /**
                         * @type {object}
                         * @property {(string|string[])} value  查询条件的值
                         * @property {string} op                关系操作符的值
                         */
                        result = {
                            value: $input.val(),
                            op: dataConfig.value
                        };
                    }
                }
                return result;
            }
        };

        // 和query的事件相关的，但不包括部分视图方面的按钮
        query.event = {
            /**
             *
             * @param {object} opts
             * @param {string} opts.id                          grid容器id。
             */
            bindEvents: function (opts) {
                query.view.event.bindSubmitQuery(opts);
                //$gridCt.find("#headqueryOK").click(function () {
                //    // 收起查询区
                //    query.view.hide(opts);
                //    //_query.hide(opts);
                //    var queryConditions = query.parser.getQueryConditions(opts);
                //    //var queryConditions = gridQuery.parser.getQueryConditions(opts);
                //    query.doQuery({
                //        id: opts.id,
                //        queryConditions: queryConditions
                //    });
                //    //gridQuery.doQuery({
                //    //    id: opts.id,
                //    //    queryConditions: queryConditions
                //    //});
                //});
                // 【3】 点击列头，展示查询区。但忽略“选择全部”按钮区。
                query.event.bindShowSimpleQuery(opts);
                // 设定查询区的比较符按钮点击操作，和相关的触发事件。
                query.event.setQueryCompareButtonTrigger(opts);
                //_query.view.event.setQueryCompareButtonTrigger(opts);
                query.event.registerQueryOnCondChange(opts);
                //_query.view.event.bindQueryCompareButtonEvent(opts);
                // 【4】 初始化快捷查询区的gaea UI组件（例如：select2等）
                query.view.initGaeaUI(opts);
                //_query.view.initGaeaUI(opts);
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
            registerQueryOnCondChange: function (opts) {
                var queryCtSelector = "#" + opts.id + " .mars-tb-head-query";
                if (!gaeaString.equalsIgnoreCase(opts.component, GAEA_UI_DEFINE.UI.COMPONENT.CRUD_GRID)) {
                    /**
                     * 一般的查询
                     */
                    gaeaEvents.registerListener(gaeaEvents.DEFINE.UI.INPUT.CHANGE, queryCtSelector, function (event, data) {
                        //var value = _gaeaInput.getValue(data.containerId);
                        // 回调函数
                        //if (_.isFunction(opts.change)) {
                        //    opts.change();
                        //}
                        var queryConditions = query.parser.getQueryConditions(opts);
                        query.doQuery({
                            id: opts.id,
                            queryConditions: queryConditions
                        });
                        // 收起快捷查询
                        query.view.hide(opts);
                    });
                }
            }
        };

        /**
         * crud grid使用的query。
         * 和普通query的区别：
         * 首先，它不需要查询服务端的数据，也没有什么分页之类的。它是针对一个在内存中的数据数组进行过滤查询。
         */
        var crudQuery = {
            event: {
                /**
                 * 绑定query事件的入口。
                 * @param {object} opts
                 * @param {string} opts.id                          grid容器id。
                 */
                bindEvents: function (opts) {
                    // 绑定快捷查询区“确定”按钮的操作
                    crudQuery.event.bindSubmitQuery(opts);
                    // 重置操作
                    crudQuery.event.bindResetQuery(opts);
                    // 点击列头，展示查询区。但忽略“选择全部”按钮区。
                    query.event.bindShowSimpleQuery(opts);
                    // 设定查询区的比较符按钮点击操作，和相关的触发事件。
                    query.event.setQueryCompareButtonTrigger(opts);
                    // 暂未实现，选择了关系符就立刻查询过滤
                    //query.event.registerQueryOnCondChange(opts);
                    // 初始化快捷查询区的gaea UI组件（例如：select2等）
                    query.view.initGaeaUI(opts);
                },
                /**
                 * 点击快捷查询的"确定"，执行查询。
                 * @param opts
                 */
                bindSubmitQuery: function (opts) {
                    var $gridCt = $("#" + opts.id);

                    gaeaEvents.registerListener("click", $gridCt.find("#headqueryOK"), function (event, data) {
                        //$gridCt.find("#headqueryOK").click(function () {
                        // 收起查询区
                        query.view.hide(opts);
                        var queryConditions = query.parser.getQueryConditions(opts);
                        //var queryConditions = gridQuery.parser.getQueryConditions(opts);
                        query.doQuery({
                            id: opts.id,
                            queryConditions: queryConditions
                        });
                        //gridQuery.doQuery({
                        //    id: opts.id,
                        //    queryConditions: queryConditions
                        //});
                    });
                },
                /**
                 * 重置查询
                 * @param {object} opts
                 * @param {string} opts.id                      grid容器id
                 */
                bindResetQuery: function (opts) {
                    var $gridCt = $("#" + opts.id);

                    gaeaEvents.registerListener("click", $gridCt.find("#query-reset"), function (event, data) {
                        var gridOptions = $gridCt.data("options");
                        var allData = gridOptions.data;
                        // 清空查询条件
                        query.view.resetUI(opts);
                        // 收起查询区
                        query.view.hide(opts);
                        // 触发刷新
                        $gridCt.trigger(gaeaEvents.DEFINE.UI.GRID.REFRESH_DATA, {
                            data: allData,
                            isNewData: false
                        });
                    });
                }
            }
        };

        /**
         * filter, 就是对当前缓存中数据的query。
         * 和query的区别：query会和后台互动，filter是在当前数据中做过滤。
         */
        query.filter = {
            /**
             * 针对当前grid执行过滤操作。
             * @param opts
             */
            doFilter: function (opts) {
                var $gridCt = $("#" + opts.id);
                var gridOptions = $gridCt.data("options");
                var allData = gridOptions.data;
                // 根据当前的grid数据，结合查询条件，过滤出符合的数据
                var filterData = gaeaUtils.data.filterData({
                    data: allData,
                    conditions: query.parser.getQueryConditions(opts)
                });
                // 缓存过滤后的数据到grid中
                //gridOptions.filterData = filterData;
                // 触发刷新
                $gridCt.trigger(gaeaEvents.DEFINE.UI.GRID.REFRESH_DATA, {
                    filterData: filterData,
                    queryAction: "query-action-filter"
                });
            }
        };

        /**
         * 常用工具
         */
        query.utils = {
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

        // 私有方法
        var _private = {};

        return {
            doQuery: query.doQuery,
            doSimpleQuery: query.doSimpleQuery,
            parser: {
                getQueryConditions: query.parser.getQueryConditions
                //getPageCondition: query.parser.getPageCondition
            },
            view: {
                init: query.view.init
                //resetUI:query.view.resetUI
            }
        };
    });