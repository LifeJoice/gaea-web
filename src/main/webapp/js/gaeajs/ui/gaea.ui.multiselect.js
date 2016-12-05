/**
 * 基于RequireJS的模块化重构。让依赖更清晰，更简单。
 *
 * Multi Select组件。
 * 不含KO binding功能。因为分析了，觉得没必要，不可能在点击某选项的时候去刷新页面其他项。
 * Created by iverson on 2016-7-25 09:58:41
 */
define([
        "jquery", "underscore",
        'gaeajs-common-utils-ajax', 'gaeajs-common-utils-validate', "gaeajs-common-utils-string", "gaeajs-data",
        "gaeajs-ui-events", "gaeajs-common-utils"
    ],
    function ($, _,
              gaeaAjax, gaeaValid, gaeaString, gaeaData,
              GAEA_EVENT, gaeaCommonUtils) {

        var TEMPLATE = {
            HTML: {
                MULTI_SELECT: '' +
                '<div id="selectable" class="select-list"></div>' +
                '<div class="choose-cmd">' +
                '<span id="selectAll" class="fa fa-angle-double-right fa-2x"></span>' +
                '<span id="select" class="fa fa-angle-right fa-2x"></span>' +
                '<span id="disSelect" class="fa fa-angle-left fa-2x"></span>' +
                '<span id="disSelectAll" class="fa fa-angle-double-left fa-2x"></span>' +
                '</div>' +
                '<div id="selected" class="select-list"></div>',
                LI_WITH_DATA: '<li data-gaea-data="value:\'<%=VALUE%>\'"><%=TEXT%></li>',
                HIDDEN_INPUT: '<input type="hidden" id="<%=ID%>" name="<%=NAME%>" value="<%=VALUE%>">'
            }
        };

        var cache = {
            // 下面结构供参考
            //someDivId: {
            //    selectable: null,
            //    selected: null,
            //    all: null
            //}
        };


        var multiSelect = {};
        var _private = {};
        /**
         * 初始化(创建)gaea multiSelect.
         * @param containerId
         * @param options
         */
        multiSelect.init = function (containerId, options) {
            var dfd = $.Deferred();// JQuery同步对象
            var that = this;
            // 没有想过的组件，也是需要resolve的
            if (gaeaValid.isNull($("#" + containerId).find(".gaea-multi-select"))) {
                dfd.resolve();
            }
            $("#" + containerId).find(".gaea-multi-select").each(function (idx, multiSelect) {
                var $this = $(multiSelect);
                var dataStr = $this.data("gaea-data");
                var dataConfig = gaeaString.parseJSON(dataStr);
                var id = $this.attr("id");// div的id，也是这个multi-select的所有相关临时变量的根对象
                if (gaeaValid.isNull(dataConfig.name)) {
                    throw "gaea multi-select组件的name配置项不允许为空！";
                }
                if (gaeaValid.isNull(id)) {
                    throw "gaea multi-select组件的div id属性不允许为空！";
                }
                // 创建当前这个multi-select的缓存对象
                cache[id] = {
                    //selectJqList : new Array()
                };
                var name = dataConfig.name;
                /**
                 * 初始化DOM元素框架
                 */
                $this.html(TEMPLATE.HTML.MULTI_SELECT);
                /**
                 * 初始化可选框的内容和样式
                 */
                var initSelectOptions = {
                    id: id,
                    dataConfig: dataConfig
                };
                // 初始化两个列表框的数据
                $.when(that.initSelectableList(initSelectOptions), that.initSelectedList(initSelectOptions)).done(function () {
                    dfd.resolve();
                }).fail(function () {
                    console.warn("初始化复选框数据失败！");
                    dfd.resolve();
                });
                //that.initSelectableList(initSelectOptions);
                //that.initSelectedList(initSelectOptions);
                /**
                 * 初始化选中某个。因为绑定是的具体项的点击事件，必须等数据加载后才能。
                 */
                that.initChoose(id);
                // 初始化"选择"按钮
                var initCmdOptions = {
                    name: name,
                    id: id
                };
                // 初始化各种选择事件和处理
                that.initSelect(initCmdOptions);
                that.initSelectAll(initCmdOptions);
                that.initUnSelect(initCmdOptions);
                that.initUnSelectAll(initCmdOptions);
            });
            return dfd.promise();
        };
        /**
         * 初始化可选的列表框.
         *
         * @param options
         * @returns jqXHR 同步对象
         */
        multiSelect.initSelectableList = function (options) {
            var id = options.id;// multi-select的div id
            var dataConfig = options.dataConfig;
            if (gaeaValid.isNull(dataConfig.selectable)) {
                throw "gaea-data selectable配置项不允许为空！";
            }
            dataConfig.selectable.isAsync = true;// 异步调用。因为不需要KO binding，异步影响不大。
            return gaeaData.dataSet.getData({
                dsId: dataConfig.selectable.dataset,
                isAsync: dataConfig.selectable.isAsync,
                condition: dataConfig.selectable.condition,
                success: function (data) {
                    // 初始化可选框里的选项
                    multiSelect.initUIWithData(data, {
                        id: id,// multi-select的div id
                        containerId: "selectable"
                    });
                    // 缓存
                    cache[id].selectable = _.isArray(data) ? data : [data];
                    cache[id].all = gaeaCommonUtils.array.combine(cache[id].selectable, cache[id].selected);
                }
            });
        };

        /**
         * 初始化已选列表。
         * 包括：
         * 查询数据，初始化列表元素，添加<input hidden>值，缓存（但暂时没用）
         *
         * @param options
         * @returns jqXHR
         *              gaeaData ajax返回的data放在这个属性中
         */
        multiSelect.initSelectedList = function (options) {
            var id = options.id;// multi-select的div id
            var dataConfig = options.dataConfig;
            if (gaeaValid.isNull(dataConfig.selected)) {
                throw "gaea-data selected配置项不允许为空！";
            }
            var name = dataConfig.name;
            dataConfig.selected.isAsync = true;// 异步调用。因为不需要KO binding，异步影响不大。
            return gaeaData.dataSet.getData({
                dsId: dataConfig.selected.dataset,
                isAsync: dataConfig.selected.isAsync,
                condition: dataConfig.selected.condition,
                success: function (data) {
                    if (gaeaValid.isNull(data)) {
                        return;
                    }
                    // 初始化可选框里的选项
                    multiSelect.initUIWithData(data, {
                        id: id,
                        containerId: "selected"
                    });
                    /**
                     * 把已选列表的值转换为隐藏的input值。
                     */
                    var inputTemplate = _.template(TEMPLATE.HTML.HIDDEN_INPUT);
                    var $multiSelect = $(".gaea-multi-select#" + id);
                    if (_.isArray(data)) {
                        $.each(data, function (idx, obj) {
                            $multiSelect.append(inputTemplate({
                                ID: name,
                                NAME: name,
                                VALUE: obj.value
                            }));
                        });
                    } else {
                        $multiSelect.append(inputTemplate({
                            ID: name,
                            NAME: name,
                            VALUE: data.value
                        }));
                    }
                    // 缓存，暂时没用
                    cache[id].selected = _.isArray(data) ? data : [data];
                    cache[id].all = gaeaCommonUtils.array.combine(cache[id].selectable, cache[id].selected);
                }
            });
        };
        /**
         * 初始化列表框和数据.尝试可选和已选都用本方法初始化.
         * @param data
         */
        multiSelect.initUIWithData = function (data, options) {
            var id = options.id;// multi-select的div id
            var $multiSelect = $(".gaea-multi-select#" + id);
            if (gaeaValid.isNotNull(data)) {
                var $selectBox = $multiSelect.find("#" + options.containerId);// 这个一般就是$(".gaea-multi-select .selectable")
                // 每次都清空内容
                $selectBox.html("<ul></ul>");
                // 准备单个数据选项的模板
                var liTemplate = _.template(TEMPLATE.HTML.LI_WITH_DATA);
                /**
                 * 如果传入的data是数组，则遍历填充；否则就填充一个得了。
                 */
                if (_.isArray(data)) {
                    $.each(data, function (idx, obj) {
                        $selectBox.children("ul").append(
                            liTemplate({
                                TEXT: obj.text,
                                VALUE: obj.value
                            })
                        );
                    });
                } else {
                    $selectBox.children("ul").append(
                        liTemplate({
                            TEXT: data.text,
                            VALUE: data.value
                        })
                    );
                }
                /**
                 * 点击某一个的时候，触发选中的事件。
                 * 把选中的JQuery对象扔给事件去处理。
                 */
                _private.addItemClick(options);
            }
        };
        /**
         * 初始化选中(非选择)操作。选中操作, 只是点击中了某项.
         * ( 选择操作: 指点中了某项然后, 加入已选(或未选)列表 )
         * 监听gaea multiSelect的选择的事件，在选中的时候，把选中的(JQuery)对象缓存.并且添加相关的css.
         */
        multiSelect.initChoose = function (msId) {
            var $multiSelect = $(".gaea-multi-select#" + msId);
            $multiSelect.on(GAEA_EVENT.DEFINE.UI.MULTI_SELECT.SELECT, function (event, data) {
                var $choose = data.chooseJQueryObj;
                // 给当前项加上选中效果
                $choose.toggleClass("select");
                //if(!$choose.hasClass("select")) {
                //    cache[msId].selectJqList.push(data.chooseJQueryObj);// 选择的<li>的JQuery对象的列表
                //}
            });
        };
        /**
         * 选择的处理。
         * 把（可选列表）选中的，移到已选列表。增加对应的隐藏input值。
         * @param name
         */
        multiSelect.initSelect = function (options) {
            var id = options.id;// multi-select的div id
            var name = options.name;
            var $multiSelect = $(".gaea-multi-select#" + id);
            var $selectOneCmd = $(".gaea-multi-select#" + id).find("#select");// 选择一个的按钮
            $selectOneCmd.click(function () {
                options.fromContainerId = "selectable";// 从什么容器（如可选列表）
                options.toContainerId = "selected";// 到什么容器（如已选列表）
                // 添加<input>元素
                _private.addInput(options);
                // 移动选项
                _private.select(options);
                /**
                 * 点击某一个的时候，触发选中的事件。
                 * 把选中的JQuery对象扔给事件去处理。
                 */
                options.containerId = options.toContainerId;
                _private.addItemClick(options);
            });
        };
        /**
         * 选择全部。真正逻辑还是在initSelect。
         * @param options
         */
        multiSelect.initSelectAll = function (options) {
            var id = options.id;// multi-select的div id
            var name = options.name;
            var $multiSelect = $(".gaea-multi-select#" + id);
            var $selectOneCmd = $(".gaea-multi-select#" + id).find("#select");// 选择一个的按钮
            var $selectAllCmd = $(".gaea-multi-select#" + id).find("#selectAll");// 选择全部的按钮
            $selectAllCmd.click(function () {
                $multiSelect.find("#selectable li").addClass("select");
                // 手动触发选择按钮，让选择按钮逻辑去处理。
                $selectOneCmd.trigger("click");
            });
        };
        /**
         * 取消选中。移到未选。
         * @param name
         */
        multiSelect.initUnSelect = function (options) {
            var id = options.id;// multi-select的div id
            var name = options.name;
            var $multiSelect = $(".gaea-multi-select#" + id);
            var $unselectCmd = $multiSelect.find("#disSelect");// 取消选择的按钮
            $unselectCmd.click(function () {
                options.fromContainerId = "selected";// 从什么容器（如可选列表）
                options.toContainerId = "selectable";// 到什么容器（如已选列表）
                // 删除对应的<input hidden>
                _private.removeInput(options);
                // 移动选中的
                _private.select(options);
                /**
                 * 点击某一个的时候，触发选中的事件。
                 * 把选中的JQuery对象扔给事件去处理。
                 */
                options.containerId = options.toContainerId;
                _private.addItemClick(options);
            });
        };
        /**
         * 全部不选。具体逻辑还是在initUnSelect.
         * @param options
         */
        multiSelect.initUnSelectAll = function (options) {
            var id = options.id;// multi-select的div id
            var name = options.name;
            var $multiSelect = $(".gaea-multi-select#" + id);
            var $unselectCmd = $multiSelect.find("#disSelect");// 取消选择的按钮
            var $disSelectAllCmd = $(".gaea-multi-select#" + id).find("#disSelectAll");// 取消全部的按钮
            $disSelectAllCmd.click(function () {
                $multiSelect.find("#selected li").addClass("select");
                // 手动触发选择按钮，让选择按钮逻辑去处理。
                $unselectCmd.trigger("click");
            });
        };
        /**
         * *-*-*-*-*-*-*-*-*-*-*-*-*-*   私有方法，不对外！   *-*-*-*-*-*-*-*-*-*-*-*-*-*
         */

        /**
         * 移动元素.
         * @param options
         */
        _private.select = function (options) {
            var id = options.id;// multi-select的div id
            var name = options.name;
            var $multiSelect = $(".gaea-multi-select#" + id);
            var $selectBox = $multiSelect.find("#" + options.fromContainerId);
            var $selectedBox = $multiSelect.find("#" + options.toContainerId);
            /**
             * 遍历所有选中的项
             */
            $selectBox.find("li.select").each(function (idx, liObj) {
                var $choose = $(this);
                var dataStr = $choose.data("gaea-data");
                var dataConfig = gaeaString.parseJSON(dataStr);
                var text = $choose.text();
                var value = dataConfig.value;
                /**
                 * 加到目标列表
                 */
                var liTemplate = _.template(TEMPLATE.HTML.LI_WITH_DATA);
                if (gaeaValid.isNull($selectedBox.children("ul"))) {
                    $selectedBox.append("<ul></ul>");
                }
                $selectedBox.children("ul").append(
                    liTemplate({
                        TEXT: text,
                        VALUE: value
                    })
                );
            });
            // 删除可选列表的选中的项
            $selectBox.find("li.select").remove();
        };
        /**
         * 根据选择的元素,移除对应的<input hidden>.
         * 通常发生在:
         * 从"已选列表"移到"可选列表"中.
         * @param options
         */
        _private.removeInput = function (options) {
            var id = options.id;// multi-select的div id
            var name = options.name;
            var $multiSelect = $(".gaea-multi-select#" + id);
            var $selectedList = $multiSelect.find("#selected");
            $selectedList.find("li.select").each(function (i, liObj) {
                var $choose = $(this);
                var dataStr = $choose.data("gaea-data");
                var dataConfig = gaeaString.parseJSON(dataStr);
                var text = $choose.text();
                var value = dataConfig.value;
                $(".gaea-multi-select#" + id).children("input[type='hidden']").each(function (j, inputObj) {
                    var $input = $(this);
                    var inputValue = $input.val();
                    if (gaeaString.equalsIgnoreCase(inputValue, value)) {
                        $input.remove();
                        return false;
                    }
                });
            });
        };
        /**
         * 根据选择的元素，添加对应的<input hidden>元素。
         * 通常发生在:
         * 从"可选列表"移到"已选列表"中.
         * @param options
         */
        _private.addInput = function (options) {
            var id = options.id;// multi-select的div id
            var name = options.name;
            var $multiSelect = $(".gaea-multi-select#" + id);
            var $selectedList = $multiSelect.find("#selectable");
            $selectedList.find("li.select").each(function (i, liObj) {
                var $choose = $(this);
                var dataStr = $choose.data("gaea-data");
                var dataConfig = gaeaString.parseJSON(dataStr);
                var text = $choose.text();
                var value = dataConfig.value;
                /**
                 * 添加<input hidden>隐藏值(对应所选元素).
                 */
                var inputTemplate = _.template(TEMPLATE.HTML.HIDDEN_INPUT);
                $multiSelect.append(inputTemplate({
                    ID: name,
                    NAME: name,
                    VALUE: value
                }));
            });
        };
        /**
         * 为某个容器下面的所有项添加点击事件。
         * @param options
         */
        _private.addItemClick = function (options) {
            var id = options.id;// multi-select的div id
            var $multiSelect = $(".gaea-multi-select#" + id);
            var $container = $multiSelect.find("#" + options.containerId);// 这个一般就是$(".gaea-multi-select .selectable")
            /**
             * 点击某一个的时候，触发选中的事件。
             * 把选中的JQuery对象扔给事件去处理。
             */
                // 先取消绑定，不然在来回选择间，会重复绑定很多click事件
            $container.find("li").unbind("click");
            $container.find("li").click(function () {
                $multiSelect.trigger(GAEA_EVENT.DEFINE.UI.MULTI_SELECT.SELECT, {
                    chooseJQueryObj: $(this)
                });
            });
        };

        return multiSelect;
    });