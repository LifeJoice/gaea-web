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
                multiple: false,
                placeholder: "请选择..."
            }
        };

        var select2 = {
            /**
             * 从零创建一个select2组件。
             * 这个主要包含两步：1 创建select2所需的html等 2 调用select2组件初始化
             * @param {object} opts
             * init 所需 ------------------------------------------------------------------------------------>>>>
             * @param {string} opts.jqSelector              组件jq选择器。一般是个select。
             * @param {boolean} opts.initDataSet=false      是否要同时同步组件定义的数据集。对于在表单中的，就不需要，因为还要KO绑定。只有相对独立的使用才需要。
             * @param {boolean} opts.multiple=false         是否多选
             * @param {string} opts.placeholder             未选中的提示语
             * @param {string} opts.value                   当前的值
             * @param {object} opts.default                 默认的配置项，包括默认值等
             * preInitHtmlAndData 所需 ------------------------------------------------------------------------------------>>>>
             * @param {string} opts.selectJqSelector        (jqSelector) container selector. 这个细化到某个grid的某个.gaea-query-input-div
             * @param {string} opts.htmlId
             * @param {string} opts.htmlName
             * @param {string} opts.fieldId             input的data-field-id. 服务端查询需要。
             * @param {string} opts.dataSetId           数据集id
             * @param {object} [opts.condition]         condition的配置。例如：{id:'byId',values:[{ type:'pageContext',value:'id' }]}
             */
            createAndInit: function (opts) {
                // 需要做一个小同步处理，否则数据集加载是异步请求的，可能init的时候数据集还没初始化完
                $.when(
                    select2.preInitHtmlAndData(opts)
                ).done(function () {
                    select2.init({
                        jqSelector: opts.selectJqSelector,
                        default: opts.default,
                        value: opts.value
                    });
                });
            },
            /**
             * 这个只是初始化某个<select>为select2，不包含构造select元素和数据。
             * 构造select元素和数据，用preInitHtmlAndData方法。
             * @param {object} opts
             * @param {string} opts.jqSelector              组件jq选择器。一般是个select。
             * @param {boolean} opts.initDataSet=false      是否要同时同步组件定义的数据集。对于在表单中的，就不需要，因为还要KO绑定。只有相对独立的使用才需要。
             * @param {boolean} opts.multiple=false         是否多选
             * @param {string} opts.placeholder             未选中的提示语
             * @param {string} opts.value                   当前的值
             * @param {object} opts.default                 默认的配置项，包括默认值等
             */
            init: function (opts) {
                if (gaeaValid.isNull(opts.jqSelector)) {
                    throw "初始化select2，不允许对象的选择器selector为空！";
                }
                var $select2 = $(opts.jqSelector);
                var select2Opts = {}; // 这个是传递给jQuery select2组件的初始化选项

                var gaeaDefStr = $select2.data("gaea-ui-select2");
                // 把元素的gaea-data配置转成对象，并和默认配置合并。
                var select2Define = gaeaString.parseJSON(gaeaDefStr);
                // 覆盖定义。定义优先级：代码调用的设定 > html data-xxx的定义
                _.defaults(opts, defaultOpts.init);
                opts = _.extend(opts, select2Define);
                // 初始化默认显示提示文字（请选择……）
                if (gaeaValid.isNotNull(opts.placeholder)) {
                    /**
                     * 如果下拉框的第一个值，不是空的。是无法生成默认提示文字的。这个是select2插件的恶心约定……
                     * 判断是否有需要？加一个空的项。
                     */
                    _private.addBlankOption($select2);
                    //if ($select2.children("option").length == 0 ||
                    //    ($select2.children("option").length > 0 && gaeaValid.isNotNull($select2.children("option:first").text()))
                    //) {
                    //    $select2.prepend('<option></option>');
                    //}
                    select2Opts.placeholder = opts.placeholder;
                }

                // 如果组件的配置，设定了默认值，则为组件设定默认值。
                if (gaeaValid.isNotNull(opts.default)) {
                    var checkTemplate = _.template("option[value='<%= VALUE %>']");
                    var checkSelector = checkTemplate({
                        VALUE: opts.default.value
                    });
                    if ($select2.children(checkSelector).length <= 0) {
                        gaeaNotify.warn(gaeaString.builder.simpleBuild("初始化下拉多选组件(id=%s)失败！下拉选项找不到对应的值 '%s'，无法设定默认值！", $select2.attr("id"), opts.default.value));
                        return;
                    }
                    $select2.val(opts.default.value);
                }

                // 设定值。如果default.value和value同时有值，value就会覆盖default.
                if (gaeaValid.isNotNull(opts.value)) {
                    $select2.val(opts.value);
                }

                $select2.select2(select2Opts);
            },
            /**
             * 这个是init前的准备，包括生成html和查询数据集（如果有）并构造数据。
             * 但不包含调用select2组件初始化。所以，本方法处理完后，可能只有一个普通的下拉框！
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
                var dfd = $.Deferred();// JQuery同步对象
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
                        dfd.resolve();
                    }
                });
                return dfd.promise();
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
                    submitData: {
                        dsId: opts.dataSetId,
                        condition: opts.condition
                    },
                    isAsync: true, // 异步
                    success: opts.success
                });
            },
            /**
             * 下拉框添加一个空的选项值。
             * 因为：
             * 如果下拉框的第一个值，不是空的。是无法生成默认提示文字的。这个是select2插件的恶心约定……
             * @param $select2
             */
            addBlankOption: function ($select2) {
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
            }
        };

        /**
         * 返回接口定义。
         */
        return {
            createAndInit: select2.createAndInit,
            init: select2.init,
            preInitHtmlAndData: select2.preInitHtmlAndData
        };
    });