/**
 * 从之前写的demo中，迁移来selectbox，并重命名为select tree。
 * Created by iverson on 2017-9-2.
 */

/**
 * 初始化Gaea select tree组件的options。
 *
 * @typedef {object} SelectTreeGaeaOptions
 * @property {string} target                    容器id
 * @property {string} htmlName                  html的name
 * @property {string} htmlId                    html的id
 * @property {string} dataSetId
 * @property {string} [fieldId]                 非快捷查询区可以为空。input的data-field-id. 服务端查询需要。
 * @property {boolean} initHtml                 默认true。是否需要初始化html。有些需求，需要html和最终的功能初始化分开。
 * @property {boolean} multiple                 默认false。是否可以多选。
 */
define([
        "jquery", "underscore", 'underscore-string', 'gaeajs-common-utils-ajax', 'gaeajs-common-utils-validate',
        "gaeajs-data", "gaeajs-ui-events", "gaeajs-ui-form", "gaeajs-common-utils-string",
        "gaeajs-ui-definition", "gaeajs-ui-view", "gaea-system-url", 'gaeajs-ui-notify',
        "gaeajs-ui-commons", "gaeajs-ui-multiselect", "gaeajs-common", "gaeajs-ui-tabs",
        "gaeajs-common-utils", "gaeajs-context", "gaeajs-ui-dataFilterDialog", "gaeajs-ui-grid",
        "gaeajs-data-content", "gaeajs-ui-chain",
        'gaea-jqui-dialog', "jquery-serializeObject", "jquery-ui-effects-all", "jquery-ui-position"],
    function ($, _, _s, gaeaAjax, gaeaValid,
              gaeaData, gaeaEvents, gaeaForm, gaeaString,
              GAEA_UI_DEFINE, gaeaView, SYS_URL, gaeaNotify,
              gaeaUI, gaeaMultiSelect, gaeaCommon, gaeaComponents,
              gaeaUtils, gaeaContext, gaeaDataFilterDialog, gaeaGrid,
              gaeaContent, gaeaUIChain, mod1, mod2, mod3, mod4) {

        var _private = {};

        var selectedLiId = "";
        var firstParentLiId = "";// 记录左上角的第一个Li的id。即父级的第一个的id。为了过渡到下一级、或者到上一级时查找用。
        var displayedFirstItemId = ""; // 第一个列表中，展示中的item id。一般是第一个带自己的item id。当然也可能是hover过的item id。

        var selectTree = {
            _defaultOpts: {
                multiple: false,
                fieldId: ""
                //initHtml: true
            },
            /**
             * 这个是针对opts参数（提前）初始化组件的。主要实现对一个空div，先preInit，然后再进一步init。
             * 例如：
             * 列表页的快捷查询区。
             * 因为在构建快捷查询区的时候，div是动态生成的，然后再统一(各种组件)初始化. 所以, 对于selectTree等组件也必须得分两步走.
             * @param {SelectTreeGaeaOptions} opts
             * @param {string} opts.dataSetId       当前没用到。但会放入组件的data中，再进一步init的时候会用到。
             */
            preInit: function (opts) {
                gaeaValid.isNull({check: opts.target, exception: "target参数为空，无法初始化select tree组件！"});
                _.defaults(opts, selectTree._defaultOpts);
                var $selectTreeCt = $(opts.target);
                var dataOptsTmpl = _.template('htmlId:"<%=HTML_ID %>",htmlName:"<%=HTML_NAME %>",dataSetId:"<%=DATASET_ID %>",fieldId:"<%=FIELD_ID %>",multiple:<%=MULTIPLE %>');
                $selectTreeCt.attr("data-" + GAEA_UI_DEFINE.UI.SELECT_TREE_DEFINE, dataOptsTmpl({
                    HTML_ID: opts.htmlId,
                    HTML_NAME: opts.htmlName,
                    DATASET_ID: opts.dataSetId,
                    FIELD_ID: opts.fieldId,
                    MULTIPLE: opts.multiple
                }));
                // 给容器id
                if (gaeaValid.isNull($selectTreeCt.attr("id"))) {
                    $selectTreeCt.attr("id", opts.htmlId + "-ct");
                }
            },
            /**
             *
             * @param {SelectTreeGaeaOptions} opts
             * @param {string} opts.dataSetId       当前没用到。但会放入组件的data中，再进一步init的时候会用到。
             */
            initHtml: function (opts) {
                gaeaValid.isNull({check: opts.target, exception: "target参数为空，无法初始化select tree组件！"});
                _.defaults(opts, selectTree._defaultOpts);
                var $selectTreeCt = $(opts.target);
                if ($selectTreeCt.length < 1) {
                    throw "找不到select tree容器，无法初始化select tree组件！";
                }
                //// cache options
                //$selectTreeCt.data("gaeaOptions", opts);
                // 加上select tree特有属性和class
                $selectTreeCt.addClass("multi-select-tree");
                //$selectTreeCt.attr("data-"+GAEA_UI_DEFINE.UI.SELECT_TREE_DEFINE, "");
                if (gaeaValid.isNull($selectTreeCt.attr("id"))) {
                    $selectTreeCt.attr("id", opts.htmlId + "-ct");
                }
                /**
                 * <ul>
                 * <li>.selected区域显示已选中的项</li>
                 * <li>{@code <select>}元素是作为form表单的值存储存在，不显示。</li>
                 * <li>{@code <input}是作为输入框、为了点击获取焦点存在</li>
                 * <li>.select-ct，是下拉面板。显示选择项。</li>
                 * <li></li>
                 * </ul>
                 * @type {string}
                 */
                var selectTreeHtmlTmpl = '' +
                    '<div class="inputbox">' +
                    '<span class="selected"></span>' +
                    '<span class="tree-input">' +
                        // 真正的form值
                    '<select class="<%=CLASS%>" multiple="multiple" name="<%=NAME %>" data-field-id="<%=FIELD_ID %>">' +
                        //'<option value="<%=VALUE %>" selected="selected"><%= TEXT%></option>' +
                    '</select>' +
                        // 只用于获取焦点的输入框
                    '<input id="<%= ID %>" type="text" value="">' +
                    '</span>' +
                        //'<div class="selected">' +
                        //'</div>' +
                    '</div>';
                //'<div class="selectbox-ct">' +
                //'<div id="div-to-parent" class="to-parent hidden"><div class="middle-ct"><i class="fa fa-chevron-left" aria-hidden="true"></i></div></div>' +
                //'</div>';
                var htmlTmpl = _.template(selectTreeHtmlTmpl);
                $selectTreeCt.html(htmlTmpl({
                    ID: ("input_" + _s.replaceAll(opts.htmlId, "\\.", "")), // id可能有特殊字符(.之类的)
                    NAME: opts.htmlName,
                    FIELD_ID: opts.fieldId,
                    CLASS: GAEA_UI_DEFINE.UI.QUERY.INPUT_FIELD_CLASS
                }));
            },
            /**
             *
             * @param {SelectTreeGaeaOptions} opts
             */
            init: function (opts) {
                gaeaValid.isNull({check: opts.target, exception: "target参数为空，无法初始化select tree组件！"});
                var $selectTreeCt = $(opts.target);
                if (!gaeaUtils.dom.checkUnique($selectTreeCt.attr("id"))) {
                    throw "select tree id不唯一，会导致下拉列表无法正常关闭等问题。id: " + $selectTreeCt.attr("id");
                }
                // 从data-gaea-ui-select-tree获取配置信息
                var strOptions = $selectTreeCt.data(GAEA_UI_DEFINE.UI.SELECT_TREE_DEFINE);
                if (gaeaValid.isNotNull(strOptions)) {
                    var extraOpts = gaeaString.parseJSON(strOptions);
                    _.extend(opts, extraOpts);
                }
                // data-gaea-ui-name覆盖htmlId和htmlName
                if (gaeaValid.isNotNull($selectTreeCt.data("gaea-ui-name"))) {
                    var name = $selectTreeCt.data("gaea-ui-name");
                    opts.htmlId = gaeaValid.isNull(opts.htmlId) ? name : opts.htmlId;
                    opts.htmlName = gaeaValid.isNull(opts.htmlName) ? name : opts.htmlName;
                }

                // options
                _.defaults(opts, selectTree._defaultOpts);
                // cache options
                $selectTreeCt.data("gaeaOptions", opts);
                // html
                //if(opts.initHtml){
                selectTree.initHtml(opts);
                //}


                //var gaeaOptions = $selectTreeCt.data("gaeaOptions");
                // 查询区的单元格（head-query-column）加上select-tree class，把overflow设为visible
                $selectTreeCt.parents(".head-query-column:first").addClass("select-tree");

                if (gaeaValid.isNull(opts.dataSetId)) {
                    return;
                }
                // 初始化数据
                // 同步调用获取数据.
                _private.initData({
                    dataSetId: opts.dataSetId,
                    //condition: opts.condition,
                    success: function (data) {
                        // 初始化组件
                        _private.init($selectTreeCt, data);
                        //dfd.resolve();
                    }
                });
            }
        };

        /**
         * 内部的初始化方法。真正的初始化方法。前提是所有的HTML、数据都准备好了，才能用这个初始化。
         * @param $selectTree
         * @param data
         */
        _private.init = function ($selectTree, data) {
            var $inputbox = $selectTree.find(".inputbox");
            //$(".selected .item-close").click(function () {
            //    $(this).parent().remove();
            //});
            //$selectTree.find("#add-item").click(function () {
            //    var itemText = $("#itemName").val();
            //    $selectTree.find(".selected").append('<span class="choose-item"><span class="item-text">' + itemText + '</span><span class="fa fa-times item-close"></span></span>');
            //});
            //$("#next").click(function () {
            //    _private.toChildren();
            //});
            //$("#btnSlide").click(function () {
            //    $("#testArea").append('<div class="test"></div>');
            //    $(".test").show("slide", {direction: "right"}, 5000);
            //});
            //$("#btnStopAnimate").click(function () {
            //    $(".test").stop(true,true);
            //});
            /**
             * 初始化数据
             */
            _private.initDataCT($selectTree, data);
            /**
             * 初始化下拉的内容
             */
            //_private.initDataPanel($selectTree);
            /**
             * 显示下面的列表
             */
            _private.bindShowAndHide($selectTree);
            // 点击删除事件
            //_private.events.bindRemove($selectTree);
            ////$(".multi-select-tree .inputbox input").focusin(function () {
            //var closeSelector = "#"+$selectTree.attr("id");
            //$inputbox.find("input").focusin(function () {
            //    $(".multi-select-tree .selectbox-ct").toggleClass("show");
            //    // 打开的时候，设定自己；然后后面就可以做全局的自动收起。
            //    //var closeSelector = "#"+$selectTree.attr("id");
            //    gaeaEvents.autoClose.setMe({
            //        jqSelector: closeSelector
            //    });
            //    //$("#testArea").append('<div class="test"></div>');
            //});
            //
            //
            //gaeaEvents.autoClose.registerAutoClose(closeSelector, function () {
            //    $(".multi-select-tree .selectbox-ct").removeClass("show");
            //});
            ////$(".multi-select-tree .inputbox input").focusout(function () {
            ////$inputbox.find("input").focusout(function () {
            ////    $(".multi-select-tree .selectbox-ct").toggleClass("show");
            ////});
            /**
             * 点击子项的某一项
             */
                //$(".children-list > span").click(function () {
                //    toChildren($(this));
                //});

            _private.bindClickToParentEvent($selectTree);
            //bindSelectEvent();
        };

        _private.initDataCT = function ($multiTree, data) {
            //var $multiTree = $selectTree.find(".multi-select-tree");
            var multiTreeId = $multiTree.attr("id");
            var $dataCT = $('<div class="data-ct" style="display: none"></div>');
            $dataCT.append(_private.getULData({
                data: data,
                parentIdx: "",
                ulPrefix: multiTreeId + "_ul",
                liPrefix: multiTreeId + "_li",
                levelPath: "",
                level: 0 // 默认level从1开始.会进入方法后+1. 因为方法会递归调用。
            }));
            $multiTree.append($dataCT);

        };

        /**
         * 初始化下拉框的html，和点击选中的事件处理。
         * @param $selectTree
         */
        _private.initDataPanel = function ($selectTree) {
            var $selectBox = $('<div class="selectbox-ct">' +
                '<div id="div-to-parent" class="to-parent hidden"><div class="middle-ct"><i class="fa fa-chevron-left" aria-hidden="true"></i></div></div>' +
                '</div>');
            $("body").append($selectBox);


            //var $selectBox = $selectTree.find(".selectbox-ct");
            // 数据还是从具体的某个multi-select-tree下面读
            var $dataCt = $selectTree.find(".data-ct");
            // 记录左上角的第一个Li的id。
            var refId = $dataCt.find("ul:first > li:first").attr("id");
            firstParentLiId = refId;
            displayedFirstItemId = refId;
            //var $parentList = $('<div class="parent-list"></div>');
            //var $childrenList = $('<div class="children-list"></div>');
            //$(".data-ct ul:first").children("li").each(function (index, arrObj) {
            //    var $li = $(this);
            //    var liId = $li.attr("id");
            //    var text = $li[0].childNodes[0].nodeValue;
            //    $parentList.append('<span data-refid="' + liId + '">' + text + '</span>');
            //});
            var $parentList = _private.getParentList($selectTree, $dataCt.find("ul:first"), false);
            // 初始化第一项的子级
            //$(".data-ct ul:first > li:first > ul > li").each(function (index, arrObj) {
            //    var $li = $(this);
            //    var liId = $li.attr("id");
            //    var text = $li[0].childNodes[0].nodeValue;
            //    var hasChild = $li.children("ul:first").length > 0 && $li.children("ul:first").children("li").length > 0;
            //    var iconHtml = "";
            //    if (hasChild) {
            //        iconHtml = '<i class="fa fa-chevron-right"></i>';
            //    }
            //    $childrenList.append('<span data-refid="' + liId + '">' + text + iconHtml + '</span>');
            //});


            var $firstUl = _private.getListFirstWithSubItem($selectTree, {
                level: 2 // 这里获取的是子列表要显示的item的ul。不是当前的第一个ul。
            });
            //var ulId = $(".data-ct ul:first > li:first > ul:first").attr("id");
            var ulId = $firstUl.attr("id");
            var $childrenList = _private.getChildrenList($selectTree, {
                dataUlId: ulId,
                isDisplay: true
            });
            $selectBox.append($parentList);
            $selectBox.append($childrenList);
            //$selectBox.append('<div class="children-list" style="display: none;"></div>');
            _private.bindSelectEvent($selectTree);
        };

        _private.toParent = function ($selectTree) {

            var $selectBox = $selectTree.find(".selectbox-ct");
            // 获取当前下拉列表的第一列表第一项的refid
            //var liRefId = $(".selectbox-ct .parent-list .item:first").data("refid");
            var liRefId = displayedFirstItemId;
            /**
             * 清空当前下拉面板中的内容
             */
            $selectBox.children(".parent-list").remove();
            $selectBox.children(".children-list").remove();
            //var $parentList = $('<div class="parent-list"></div>');
            //var $childrenList = $('<div class="children-list"></div>');
            //$(".data-ct ul:first").children("li").each(function (index, arrObj) {
            //    var $li = $(this);
            //    var liId = $li.attr("id");
            //    var text = $li[0].childNodes[0].nodeValue;
            //    $parentList.append('<span data-refid="' + liId + '">' + text + '</span>');
            //});
            /**
             * 根据data-level属性，找到上一级的第一列表
             */
            var levelPath = $("#" + liRefId).data("lvpath");
            var realLevelPath = levelPath.substring(0, levelPath.lastIndexOf("_"));
            // 往上找一级
            var jqParentLvPathSelectorTempl = _.template(".data-ct li[data-lvpath=<%= LEVEL_PATH %>]");
            // 找到要重新构建的列表，第一级的UL。
            var $parentUL = $(jqParentLvPathSelectorTempl({
                LEVEL_PATH: realLevelPath
            })).parent();


            /**
             * 子列表。第一个有子列表的item。
             * 必须放在getParentList之前。因为getParentList，会绑定hover事件，会用currentParentSpanId判断是否刷新。
             */
            var currentLevel = $parentUL.data("level");
            var nextLevel = currentLevel + 1;
            // 这个是子列表的ul
            var $firstUL = _private.getListFirstWithSubItem({
                level: nextLevel // 这里获取的是子列表要显示的item的ul。不是当前的第一个ul。
            });
            displayedFirstItemId = $firstUL.parent().attr("id");


            // 如果已经到最高一级，隐藏to-parent按钮
            if (currentLevel == 1) {
                $("#div-to-parent").addClass("hidden");
            }
            //var $parentUL = $('.data-ct ul:first'); // 这个是根的parent
            //if (firstParentLiId !== "" && firstParentLiId.length > 2) {
            //    var realParentId = firstParentLiId.substring(0, firstParentLiId.length - 2);
            //    $parentUL = $('#' + realParentId).children("ul");
            //}
            ////var $parentList = getParentList($(".data-ct ul:first"), true);
            var $parentList = _private.getParentList($selectTree, $parentUL, true);
            //// 初始化第一项的子级
            //$(".data-ct ul:first > li:first > ul > li").each(function (index, arrObj) {
            //    var $li = $(this);
            //    var liId = $li.attr("id");
            //    var text = $li[0].childNodes[0].nodeValue;
            //    var hasChild = $li.children("ul:first").length > 0 && $li.children("ul:first").children("li").length > 0;
            //    var iconHtml = "";
            //    if (hasChild) {
            //        iconHtml = '<i class="fa fa-chevron-right"></i>';
            //    }
            //    $childrenList.append('<span data-refid="' + liId + '">' + text + iconHtml + '</span>');
            //});
            //// 子级，默认展示父级第一个的对应子项，就是'父级UL > li:first >ul'
            //var $childrenUL = $parentUL.children("li:first").children("ul");


            //var $childrenList = getChildrenList($(".data-ct ul:first > li:first > ul"));
            // todo 长远来说，下面getChildrenList和getParentList看能不能融合成一个，才能支持多级扩展
            var $childrenList = _private.getChildrenList($selectTree, {
                dataUlId: $firstUL.attr("id"),
                isDisplay: true
            });
            $selectBox.append($parentList);
            //$selectBox.append($childrenList);

            $parentList.show("slide", {direction: "left"}, 200, function () {
                $selectBox.append($childrenList);
                //$selectBox.append('<div class="children-list" style="display: none;"></div>');
                _private.bindSelectEvent($selectTree);
            });

            //$selectBox.append('<div class="children-list" style="display: none;"></div>');
            firstParentLiId = $parentUL.children("li:first").attr("id");
        };

        /**
         * 获得组件父级（第一级）的元素列表
         * @param $selectTree
         * @param $ul
         * @param isHidden
         * @returns {*|jQuery|HTMLElement}
         */
        _private.getParentList = function ($selectTree, $ul, isHidden) {
            var hiddenStyle = "";
            // 全局公用一个下拉框
            var $selectBox = $(".selectbox-ct");
            if (isHidden) {
                hiddenStyle = 'style="display: none;"';
            }
            var $parentList = $('<div class="parent-list" ' + hiddenStyle + '></div>');
            $ul.children("li").each(function (index, arrObj) {
                var $li = $(this);
                var liId = $li.attr("id");
                var text = $li[0].childNodes[0].nodeValue; // 这个是通过jQuery内部对象获得当前节点的text（因为li是嵌套的，不要后代的text）
                var val = $li.data("value");
                var hasChild = _private.hasSubItem($li);
                var iconHtml = "";
                // 有子列表的按钮
                if (hasChild) {
                    iconHtml = '<i class="fa fa-chevron-right"></i>';
                }
                // 选中按钮
                iconHtml += '<i class="fa fa-check"></i>';
                var itemTmpl = _.template('<span class="item" data-refid="<%=REF_ID%>"><span class="text" data-value="<%=VALUE%>"><%=TEXT%></span><span class="action"><%=SELECT_HTML%></span></span>');
                var $item = $(itemTmpl({
                    REF_ID: liId,
                    TEXT: text,
                    VALUE: val,
                    SELECT_HTML: iconHtml
                }));
                //var $item = $('<span class="item" data-refid="' + liId + '"><span class="text">' + text + '</span><span class="action">' + iconHtml + '</span></span>');
                $parentList.append($item);
                // 如果有子项，hover就显示
                if (hasChild) {
                    /**
                     * hover事件会触发两次：进入的一次，和离开的一次。
                     * 因此，得判断当前移动到的id，避免同一个选项在进入后刷新一次，离开后又刷新一次。
                     */
                    $item.mouseenter(function (index, item) {
                        var refId = $item.data("refid");
                        if (refId == displayedFirstItemId) {
                            return;
                        }
                        // 更新。当前（子列表）显示的是哪个parentId
                        displayedFirstItemId = refId;
                        var $childrenList = _private.getChildrenListBySpan($selectTree, $item);
                        //var $selectBox = $(".selectbox-ct");
                        /**
                         * 【重要】这里需要一个比较复杂的处理。
                         * 由于下面是用了JQuery的方法制造动画，JQuery会给有动画的对象（例如children-list）包一个外部的div。
                         * 当快速切换多个parent的时候，由于前一个动画未完，即使调用stop停止动画，外面的div也是还未去除的。
                         * 这样立刻展示第二个的时候，动画就会不正常。
                         * 解决办法：
                         * 把整个selectbox-ct清空。
                         * 但由于parent-list还关联着mouseenter事件，所以用detach，不能用remove。
                         * 然后再贴回来，刷新子列表。
                         */
                        // 移除parent但保留事件等，等会还要回插。回插后hover等事件应该还得生效。
                        var $toParent = $selectBox.children("#div-to-parent").detach();
                        var $parentList = $selectBox.children(".parent-list").detach();
                        // 停止动画
                        $selectBox.find(".children-list").stop(true, true);
                        // 清空整个数据列表区.
                        $selectBox.html("");
                        //$selectBox.html("<div class='parent-list'>"+parentListHtml+"</div>");
                        // 把parent-list贴回来.这个是完全没动过的.
                        $selectBox.append($toParent);
                        $selectBox.append($parentList);
                        // 刷新children-list
                        $selectBox.append($childrenList);


                        //$selectBox.find(".children-list").remove();
                        //$selectBox.append($childrenList);
                        //$(".children-list").stop(true,true);


                        //$(".children-list").addClass("show");
                        // 刷新下一级（例如二级）列表
                        $selectBox.children(".children-list").show("slide", {direction: "right"}, 200);
                        _private.bindChildrenSelectEvent($selectTree);
                    })
                }
            });
            return $parentList;
        };

        _private.getChildrenListBySpan = function ($selectTree, $item) {
            var refid = $item.data("refid");
            var $li = $selectTree.find("#" + refid);
            var $ul = $li.children("ul:first");
            return _private.getChildrenList($selectTree, {
                dataUlId: $ul.attr("id"),
                isDisplay: false
            });
        };

        /**
         * 获得子级（第二级）的列表元素。
         * @param $selectTree
         * @param opts
         * @returns {*|jQuery|HTMLElement}
         */
        _private.getChildrenList = function ($selectTree, opts) {
            var dataUlId = opts.dataUlId; // 数据容器的UL的id
            var isDisplay = opts.isDisplay; // 默认children list这个块是否要设置 display:none
            var cssStyle = "";
            if (!isDisplay) {
                cssStyle = "display: none;";
            }
            var $childrenList = $('<div class="children-list" style="' + cssStyle + '"></div>');
            var $ul = $selectTree.find("#" + dataUlId);
            // 初始化第一项的子级
            $ul.children("li").each(function (index, arrObj) {
                var $li = $(this);
                var liId = $li.attr("id");
                var text = $li[0].childNodes[0].nodeValue;
                var val = $li.data("value");

                // 如果有下级，生成个下级的图标
                //var hasChild = $li.children("ul:first").length > 0 && $li.children("ul:first").children("li").length > 0;
                var hasChild = _private.hasSubItem($li);
                var iconHtml = "";
                if (hasChild) {
                    iconHtml = '<i class="fa fa-chevron-right"></i>';
                }
                // 选中按钮
                iconHtml += '<i class="fa fa-check"></i>';
                //$childrenList.append('<span class="item" data-refid="' + liId + '">' + text + iconHtml + '</span>');
                var itemTmpl = _.template('<span class="item" data-refid="<%=REF_ID%>"><span class="text" data-value="<%=VALUE%>"><%=TEXT%></span><span class="action"><%=SELECT_HTML%></span></span>');
                var $item = $(itemTmpl({
                    REF_ID: liId,
                    TEXT: text,
                    VALUE: val,
                    SELECT_HTML: iconHtml
                }));
                //var $item = $('<span class="item" data-refid="' + liId + '"><span class="text">' + text + '</span><span class="action">' + iconHtml + '</span></span>');
                // 如果有子项，点击才切换去子项。
                if (hasChild) {
                    $item.click(function () {
                        _private.toChildren($selectTree, $(this));
                    });
                }
                //$childrenList.append('<span class="item" data-refid="' + liId + '">' + text + iconHtml + '</span>');
                $childrenList.append($item);
            });
            return $childrenList;
        };

        /**
         * 把json数据转成一棵{@code <ul><li>}的树。这样方便检索。
         * @param opts
         * @returns {*|jQuery|HTMLElement}
         */
        _private.getULData = function (opts) {
            var data = opts.data;
            var parentIdx = opts.parentIdx;
            var ulPrefix = opts.ulPrefix;
            var liPrefix = opts.liPrefix;
            var id = ulPrefix + parentIdx;
            var levelPath = opts.levelPath;
            // 如果不是第一级，用“_”作分隔符
            if (opts.level != 0) {
                levelPath += "_";
            }
            levelPath += opts.level;
            var level = opts.level + 1; // level从1开始
            var ulDataTemplate = _.template('<ul id="<%= ID %>" data-level="<%= LEVEL %>" data-lvpath="<%= LEVEL_PATH %>"></ul>');
            //var $ul = $('<ul id="' + ulPrefix + parentIdx + '"></ul>');
            var $ul = $(ulDataTemplate({
                ID: id,
                LEVEL: level,
                LEVEL_PATH: levelPath
            }));
            $.each(data, function (index, arrObj) {
                var dataIdx = parentIdx + index;
                var liLevelPath = levelPath + index;
                var value = arrObj.value;
                if ($.isArray(arrObj.items)) {
                    // 递归子项数组
                    var $html = _private.getULData({
                        data: arrObj.items,
                        parentIdx: dataIdx,
                        ulPrefix: ulPrefix,
                        liPrefix: liPrefix,
                        levelPath: liLevelPath,
                        level: level
                    });
                    var id = liPrefix + dataIdx;
                    var liDataTemplate = _.template('<li id="<%= ID %>" data-lvpath="<%= LEVEL_PATH %>" data-value="<%= VALUE %>"></li>');
                    var $li = $(liDataTemplate({
                        ID: id,
                        LEVEL_PATH: liLevelPath,
                        VALUE: value
                    }));
                    $li.append(arrObj.text);
                    $li.append($html);
                    $ul.append($li);
                } else {
                    // 最底层，就不需要data-lvpath了
                    var liDataTemplate = _.template('<li id="<%= ID %>" data-value="<%= VALUE %>"><%=TEXT%></li>');
                    $ul.append(liDataTemplate({
                        ID: dataIdx,
                        VALUE: value,
                        TEXT: arrObj.text
                    }));
                    //$ul.append('<li id="' + dataIdx + '">' + arrObj.text + '</li>');
                }
            });
            return $ul;
        };

        _private.toChildren = function ($selectTree, $selectSpan) {
            //var content = $(".children-list:first").html();
            var refId = $selectSpan.data("refid");
            //var $dataCT = $(".data-ct");
            var $selectLi = $("#" + refId);
            var currentLevel = $selectLi.parent().data("level");
            var nextLevel = currentLevel + 1;

            // 设置li为已选中。作数据记录用。
            if (selectedLiId != "") {
                $("#" + selectedLiId).removeAttr("data-selected");
            }
            selectedLiId = refId;
            firstParentLiId = refId;
            displayedFirstItemId = refId;
            $selectLi.attr("data-selected", true);

            //var newChildren = $(".select-tree-next").html();
            var newChildren = "";


            var $selectBox = $(".selectbox-ct");
            $selectBox.children(".parent-list").remove();
            $selectBox.children(".children-list").remove();
            var $parentUL = $('#' + selectedLiId).parent(); // 这个是根的parent
            //if(firstParentLiId!==""){
            //    var realParentId = firstParentLiId.substring(0, firstParentLiId.length - 2);
            //    $parentUL = $('#'+realParentId).children("ul");
            //}
            var $parentList = _private.getParentList($selectTree, $parentUL, false);
            //// 子级，默认展示父级第一个的对应子项，就是'父级UL > li:first >ul'
            //var $childrenUL = $parentUL.children("li:first").children("ul");
            // 子列表。第一个有子列表的item。
            //var $firstUl = getListFirstWithSubItem({
            //    level: nextLevel // 这里获取的是子列表要显示的item的ul。不是当前的第一个ul。
            //});
            var ulId = $selectLi.children("ul").filter(":first").attr("id");
            var $childrenList = _private.getChildrenList({
                dataUlId: ulId,
                isDisplay: false
            });
            $selectBox.append($parentList);


            //newChildren = $childrenList.html();
            // 把子级内容放到父级
            //$(".parent-list").html(content);

            $("#div-to-parent").removeClass("hidden");

            // 移除第一个子级（因为已经复制到父级）
            //$(".children-list:first").remove();
            //$(".children-list").addClass("hidden");

            // 动态添加子列表的项
            //$(".children-list").html(newChildren);
            $selectBox.append($childrenList);
            // 添加子项的点击事件
            //bindClickChildrenEvent();

            //$(".children-list").addClass("show");
            $(".children-list").show("slide", {direction: "right"}, 350);
            //$(".selectbox-ct").append('<div class="children-list" style="display: none;"></div>');

            //bindClickChildrenEvent();
            _private.bindSelectEvent($selectTree);

            //$(".children-list").removeClass("hidden").addClass("show");
            //$(".test").append("<span>1</span><span>1</span><span>1</span><span>1</span><span>1</span>");
            //$(".test").addClass("show");
            //$("#testArea").append('<div class="test"></div>');
            //$(".test").show("slide", {direction: "right"}, 1000);
        };

        //_private.bindClickChildrenEvent = function() {
        //    var $childrenList = $(".children-list > span.item");
        //    $childrenList.each(function (index, item) {
        //        var $item = $(this);
        //        var refid = $item.data("refid");
        //        var $li = $("#" + refid);
        //        if (hasSubItem($li)) {
        //            $item.click(function () {
        //                _private.toChildren($item);
        //            });
        //        }
        //    });
        //    /**
        //     * 点击子项的某一项
        //     */
        //    //$(".children-list:first > span").click(function () {
        //    //        toChildren($(this));
        //    //});
        //}

        _private.events = {
            //bindRemove : function ($selectTree) {
            //    $selectTree.find(".selected .item-close").click(function () {
            //        $(this).parent().remove();
            //    });
            //}
        };

        /**
         * 树的下拉选择列表的展开和收起。
         * @param $selectTree
         */
        _private.bindShowAndHide = function ($selectTree) {
            var $inputbox = $selectTree.find(".inputbox");
            //var $selectbox = $selectTree.find(".selectbox-ct");
            // 用.multi-select-tree的id作为关闭触发key
            var closeSelector = "#" + $selectTree.attr("id");

            // 处理点击组件、打开下拉列表事件
            $inputbox.find("input").focusin(function (event) {
                var $input = $(this);
                // 初始化下拉框
                _private.initDataPanel($selectTree);

                // 全局公用一个下拉
                var $selectbox = $(".selectbox-ct");
                $selectbox.toggleClass("show");
                // position定位，需要（配合定位）元素是已显现的才行
                $selectbox.position({
                    my: "left top",
                    at: "left bottom",
                    of: "#" + this.id
                });

                // 打开的时候，设定自己；然后后面就可以做全局的自动收起。
                //var closeSelector = "#"+$selectTree.attr("id");
                gaeaEvents.autoClose.setMe({
                    jqSelector: closeSelector
                });
                //$("#testArea").append('<div class="test"></div>');
            });

            /**
             * 注册自动关闭。
             * 这里的closeSelector是监听器监控的对象。会对每一下鼠标点击判断，是否点击离开了$(closeSelector)容器。
             * 如果是，则触发回调函数。
             */
            var closeFunction = function (event) {
                // 点击下拉列表里面的项，就不要关闭了
                if ($(event.target).parents(".selectbox-ct").length > 0) {
                    return;
                }
                var $selectbox = $(".selectbox-ct");
                //$selectbox.removeClass("show");
                // 因为全局公用一个，每次隐藏其实就是移除
                $selectbox.remove();
            };
            // 先注册全局的自动关闭
            gaeaEvents.autoClose.registerAutoClose(closeSelector, closeFunction);
        };

        _private.bindClickToParentEvent = function ($selectTree) {
            $("#div-to-parent").click(function () {
                //alert(selectedLiId+"\n"+selectedLiId.substring(0,selectedLiId.length-2));
                // 因为数据列表UL的id是有规则的，都是按照sequence排的。如果用jquery的parent去获取，因为ul->li的结构，两个parent还获取不到上上级。所以，只需要把id的最后两位去掉，得到的就是上上级的li了。
                var realParentId = selectedLiId.substring(0, selectedLiId.length - 2);
                //_private.toParent(realParentId);
                _private.toParent($selectTree);
            });
        };

        _private.bindSelectEvent = function ($selectTree) {
            var $selectBox = $(".selectbox-ct");
            $selectBox.find(".item .action .fa-check").click(function () {
                var $checkButton = $(this);
                var $item = $checkButton.parent().parent();
                //var text = $item[0].childNodes[0].nodeValue;
                // check按钮的上一级的前一个text. 即： $(.item .text).text()
                var text = $checkButton.parent().prev().text();
                var val = $checkButton.parent().prev().data("value");
                _private.addSelect($selectTree, text, val);
            });
        };

        // TODO 这个和上面的方法是一样的。重构合成一个。当然为了避免事件重复绑定，应该在选择器上控制一下。
        _private.bindChildrenSelectEvent = function ($selectTree) {
            // 全局公用一个下拉框
            var $selectBox = $(".selectbox-ct");
            $selectBox.find(".children-list .item .action .fa-check").click(function () {
                var $checkButton = $(this);
                var $item = $checkButton.parent().parent();
                //var text = $item[0].childNodes[0].nodeValue;
                // check按钮的上一级的前一个text. 即： $(.item .text).text()
                var text = $checkButton.parent().prev().text();
                var val = $checkButton.parent().prev().data("value");
                _private.addSelect($selectTree, text, val);
            });
        };

        /**
         * 添加一个选中的项
         * @param $selectTree
         * @param text
         * @param value
         */
        _private.addSelect = function ($selectTree, text, value) {
            var $selected = $selectTree.find(".selected");
            var gaeaOptions = $selectTree.data("gaeaOptions");
            var $selectElement = $selectTree.find(".tree-input select");
            // 选中项容器
            var $chooseItem = $('<span class="choose-item"></span>');
            $chooseItem.append('<span class="item-text">' + text + '<input type="hidden" value="' + value + '"></span><span class="fa fa-times item-close"></span>');
            // 删除选中项事件
            $chooseItem.children(".item-close").click(function () {
                $(this).parent().remove();
            });
            // 单选先清空
            if (_.isBoolean(gaeaOptions.multiple) && !gaeaOptions.multiple) {
                // 清空显示的已选中
                $selected.html("");
                // 清空真的值<select>的已选中
                $selectElement.html("");
            }
            //$(".button-ct").append('<span class="choose-item"><span class="item-text">' + text + '<input type="hidden" value="'+value+'"></span><span class="fa fa-times item-close"></span></span>');
            $selected.append($chooseItem);
            // 添加到<select>的值，以便给form捕获
            var selectOptionTmpl = _.template('<option value="<%=VALUE %>" selected="selected"><%= TEXT%></option>');
            $selectElement.append(selectOptionTmpl({
                VALUE: value,
                TEXT: text
            }));
        };
        /**
         * 判断一个li是否有子项。
         * @param $li
         * @returns {boolean}
         */
        _private.hasSubItem = function ($li) {
            return $li.children("ul:first").length > 0 && $li.children("ul:first").children("li").length > 0;
        };

        _private.getListFirstWithSubItem = function ($selectTree, opts) {
            var level = opts.level;
            var jqUlSelectorTmpl = _.template(".data-ct ul[data-level=<%= LEVEL %>]");
            var $result = null;
            $selectTree.find(jqUlSelectorTmpl({
                LEVEL: level
            })).each(function () {
                var $ul = $(this);
                if ($ul.children("li").length > 0) {
                    $result = $ul;
                    return false; // 跳出循环
                }
            });
            return $result;
        };


        /**
         *
         * @param {object} opts
         * @param {string} opts.dataSetId           数据集id
         * @param {object} [opts.condition]         condition的配置。例如：{id:'byId',values:[{ type:'pageContext',value:'id' }]}
         * @param {function} opts.success           成功的callback
         *
         * @returns {*|jqXHR}
         */
        _private.initData = function (opts) {
            return gaeaData.dataSet.getData({
                submitData: {
                    dsId: opts.dataSetId,
                    condition: opts.condition
                },
                isAsync: true, // 异步
                success: opts.success
            });
        };

        return {
            preInit: selectTree.preInit,
            init: selectTree.init
            //initHtml: selectTree.initHtml
        };
    });