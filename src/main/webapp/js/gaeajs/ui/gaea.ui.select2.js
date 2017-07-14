/**
 * 今天起，开始重构UR创建的一套前端js框架。重新以gaea命名。另外基于RequireJS的模块化。
 *
 * 这个是下拉的组件，支持下拉多选、分组等。暂时对接的是jquery select2插件。
 * Created by iverson on 2017年3月18日16:33:04
 *
 */
define([
        "jquery", "underscore", 'underscore-string',
        'gaeajs-common-utils-validate', "gaeajs-common-utils-string", 'gaeajs-ui-definition', "gaeajs-ui-notify",
        "gaeajs-data", "gaeajs-common-utils",
        "jquery-select2"
    ],
    function ($, _, _s,
              gaeaValid, gaeaString, GAEA_UI_DEFINE, gaeaNotify,
              gaeaData, gaeaCommonUtils) {

        // 默认的opts参数值的统一定义
        var defaultOpts = {
            init: {
                multiple: false
            }
        };

        var select2 = {
            /**
             * 这个只是初始化某个<select>为select2，不包含构造select元素和数据。
             * 构造select元素和数据，用preInitHtmlAndData方法。
             * @param {object} opts
             * @param {string} opts.jqSelector              组件jq选择器。一般是个select。
             * @param {boolean} opts.initDataSet=false      是否要同时同步组件定义的数据集。对于在表单中的，就不需要，因为还要KO绑定。只有相对独立的使用才需要。
             * @param {boolean} opts.multiple=false         是否多选
             * @param {string} opts.placeholder             未选中的提示语
             */
            init: function (opts) {
                if (gaeaValid.isNull(opts.jqSelector)) {
                    throw "初始化select2，不允许对象的选择器selector为空！";
                }
                var $select2 = $(opts.jqSelector);
                var initOpts = {};

                var gaeaDefStr = $select2.data("gaea-ui-select2");
                // 把元素的gaea-data配置转成对象，并和默认配置合并。
                var select2Define = gaeaString.parseJSON(gaeaDefStr);
                // 覆盖定义。定义优先级：代码调用的设定 > html data-xxx的定义
                select2Define = _.extend(select2Define, opts);
                // 初始化默认显示提示文字（请选择……）
                if (gaeaValid.isNotNull(select2Define.placeholder)) {
                    /**
                     * 如果下拉框的第一个值，不是空的。是无法生成默认提示文字的。这个是select2插件的恶心约定……
                     * if select元素还没有内容 or
                     *    有内容但第一个不是空的（select2需要第一个空做placeholder）
                     * then
                     *    加一个空的项
                     */
                    if ($select2.children("option").length == 0 ||
                        ($select2.children("option").length > 0 && gaeaValid.isNotNull($select2.children("option:first").text()))
                    ) {
                        $select2.prepend('<option></option>');
                    }
                    initOpts.placeholder = select2Define.placeholder;
                }

                // 如果组件的配置，设定了默认值，则为组件设定默认值。
                if (gaeaValid.isNotNull(select2Define.default)) {
                    var checkTemplate = _.template("option[value='<%= VALUE %>']");
                    var checkSelector = checkTemplate({
                        VALUE: select2Define.default.value
                    });
                    if ($select2.children(checkSelector).length <= 0) {
                        gaeaNotify.warn(gaeaString.builder.simpleBuild("初始化下拉多选组件(id=%s)失败！", $select2.attr("id")));
                        return;
                    }
                    $select2.val(select2Define.default.value);
                }

                $select2.select2(initOpts);
            },
            /**
             * 这个是init前的准备，包括生成html和查询数据集（如果有）并构造数据。
             * @param {object} opts
             * @param {string} opts.jqSelector          container selector. 这个细化到某个grid的某个.gaea-query-input-div
             * @param {string} opts.htmlId
             * @param {string} opts.htmlName
             * @param {string} opts.fieldId             input的data-field-id. 服务端查询需要。
             * @param {string} opts.dataSetId           数据集id
             * @param {object} [opts.condition]         condition的配置。例如：{id:'byId',values:[{ type:'pageContext',value:'id' }]}
             */
            preInitHtmlAndData: function (opts) {
                gaeaValid.isNull({
                    check: opts.jqSelector,
                    exception: "容器id为空，无法生成select2的html。"
                });
                // 初始化<select>元素（不包含内容<option>）
                _private.initHtmlCt(opts);
                // 填充数据和<option>
                gaeaValid.isNull({
                    check: opts.dataSetId,
                    exception: "数据集id为空，无法生成select2的数据内容。"
                });
                _private.initData({
                    id: opts.htmlId,
                    dataSetId: opts.dataSetId,
                    condition: opts.condition,
                    success: function (data) {
                        // 找到某个.gaea-query-input-div的select
                        var $select = $(opts.jqSelector).children("#" + gaeaString.format.getValidName(opts.htmlId));
                        if (_.isArray(data)) {
                            $.each(data, function (i, iValue) {
                                var optionTemplate = _.template('<option value="<%= VALUE %>"><%= TEXT %></option>');
                                $select.append(optionTemplate({
                                    TEXT: gaeaCommonUtils.object.getValue("text", iValue),
                                    VALUE: gaeaCommonUtils.object.getValue("value", iValue)
                                }));
                            });
                        }
                    }
                });
            }
        };

        var _private = {
            /**
             *
             * @param {object} opts
             * @param {string} opts.jqSelector                  container selector. 这个细化到某个grid的某个.gaea-query-input-div
             * @param {string} opts.htmlId
             * @param {string} opts.htmlName
             * @param {string} opts.fieldId                     input的data-field-id. 服务端查询需要。
             */
            initHtmlCt: function (opts) {
                var selectTemplate = _.template('<select id="<%=ID%>" name="<%=NAME%>" data-field-id="<%= FIELD_ID %>"></select>');
                var $select = $(selectTemplate({
                    ID: opts.htmlId,
                    NAME: opts.htmlName,
                    FIELD_ID: opts.fieldId
                }));
                $(opts.jqSelector).append($select);
            },
            /**
             *
             * @param {object} opts
             * @param {string} opts.id                  select id
             * @param {string} opts.dataSetId           数据集id
             * @param {object} [opts.condition]         condition的配置。例如：{id:'byId',values:[{ type:'pageContext',value:'id' }]}
             * @param {function} opts.success           成功的callback
             *
             * @returns {*|jqXHR}
             */
            initData: function (opts) {
                return gaeaData.dataSet.getData({
                    dsId: opts.dataSetId,
                    isAsync: true, // 异步
                    condition: opts.condition,
                    success: opts.success
                });
            }
        };

        /**
         * 返回接口定义。
         */
        return {
            init: select2.init,
            preInitHtmlAndData: select2.preInitHtmlAndData
        };
    });