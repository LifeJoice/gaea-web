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
        "gaeajs-data",
        "jquery-select2"
    ],
    function ($, _, _s,
              gaeaValid, gaeaString, GAEA_UI_DEFINE, gaeaNotify,
              gaeaData) {

        var select2 = {
            /**
             *
             * @param {object} opts
             * @param {string} opts.id
             */
            init: function (opts) {
                if (gaeaValid.isNull(opts.id)) {
                    throw "初始化select2，不允许id为空！";
                }
                var $select2 = $("#" + opts.id);
                var initOpts = {};

                var gaeaDefStr = $select2.data("gaea-ui-select2");
                // 把元素的gaea-data配置转成对象，并和默认配置合并。
                var select2Define = gaeaString.parseJSON(gaeaDefStr);
                // 初始化默认显示提示文字（请选择……）
                if (gaeaValid.isNotNull(select2Define.placeholder)) {
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
            }
        };

        /**
         * 返回接口定义。
         */
        return {
            init: select2.init
        };
    });