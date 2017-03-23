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
        "gaeajs-ui-multiselect", "gaeajs-ui-button", "gaeajs-common-utils", "gaeajs-ui-select2"
    ],
    function ($, _, _s,
              gaeaValid, gaeaString, GAEA_UI_DEFINE,
              gaeaMultiSelect, gaeaButton, gaeaUtils, gaeaSelect2) {

        var gaeaCommons = {
            initGaeaUI: function (containerId) {
                var dfd = $.Deferred();// JQuery同步对象
                // 没有相关的组件，也是需要resolve的
                if (gaeaValid.isNull(containerId)) {
                    dfd.resolve();
                }
                // 初始化按钮(在html中通过data-gaea-ui-button配置的)
                _private.initGaeaButton(containerId);
                // 初始化select2插件
                _private.initSelect2(containerId);

                return gaeaMultiSelect.init(containerId);
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
            }
        };

        var _private = {
            /**
             * 初始化按钮。
             * 当前只初始化弹出框中页面的按钮，不负责初始化toolbar中的按钮。
             */
            initGaeaButton: function (containerId) {
                var dfd = $.Deferred();// JQuery同步对象
                // 没有相关的组件，也是需要resolve的
                if (gaeaValid.isNull(containerId)) {
                    dfd.resolve();
                }
                // data-gaea-ui-button（这个是gaeaUI的按钮的特殊定义属性）
                var attrName = "data-" + GAEA_UI_DEFINE.UI.BUTTON.DEFINE;
                // 找gaeaUI按钮的jq选择器条件( <a data-gaea-ui-button=*** ...> )
                var buttonFilterTemplate = _.template("a[<%= ATTR_NAME %>]");
                // 查找所有按钮，遍历并初始化
                $("#" + containerId).find(buttonFilterTemplate({
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
                        parentDialogId: containerId
                    });
                });
                dfd.resolve();
                return dfd.promise();
            },
            /**
             * 初始化jQuery select2插件。
             * @param containerId
             * @returns {*}
             */
            initSelect2: function (containerId) {
                var dfd = $.Deferred();// JQuery同步对象
                // 没有相关的组件，也是需要resolve的
                if (gaeaValid.isNull(containerId)) {
                    dfd.resolve();
                }
                // data-gaea-ui-button（这个是gaeaUI的按钮的特殊定义属性）
                var attrName = "data-" + GAEA_UI_DEFINE.UI.SELECT2.DEFINE;
                // 找gaeaUI按钮的jq选择器条件( <select data-gaea-ui-select2=*** ...> )
                var buttonFilterTemplate = _.template("select[<%= ATTR_NAME %>]");
                // 查找所有按钮，遍历并初始化
                $("#" + containerId).find(buttonFilterTemplate({
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
                        id: id
                    });
                });
                dfd.resolve();
                return dfd.promise();
            }
        };

        /**
         * 返回接口定义。
         */
        return gaeaCommons;
    });