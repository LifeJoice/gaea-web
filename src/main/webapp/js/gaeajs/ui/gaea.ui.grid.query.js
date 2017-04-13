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
        "gaeajs-ui-definition", "gaeajs-ui-input"
    ],
    function ($, _, _s, gaeaValid, gaeaString,
              gaeaEvent, gaeaUtils, SYS_URL, gaeaAjax, gaeaNotify,
              GAEA_UI_DEFINE, gaeaInput) {

        var query = {
            /**
             * 执行查询，然后刷新grid数据区域。
             * @param {object} opts                             如果为空，则全部清空按基本的查询。
             * @param {string} opts.id                          一般是grid id。会去触发它的刷新事件。
             * @param {object[]} opts.queryConditions           查询条件。一般是快捷查询区的条件数组。
             * @param {object} [opts.pageCondition]             分页条件，可以为空。
             */
            doQuery: function (opts) {
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
                        $grid.trigger(gaeaEvent.DEFINE.UI.GRID.REFRESH_DATA, {
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
             * @returns Object 查询对象列表
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
            }
        };
    });