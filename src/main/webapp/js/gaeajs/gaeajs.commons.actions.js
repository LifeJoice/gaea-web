/**
 * Created by iverson on 2016-8-5 15:15:49
 * 今天起，开始重构UR创建的一套前端js框架。重新以gaea命名。另外基于RequireJS的模块化。
 *
 * 这个是一些常用操作的封装。例如：对应schema的button的action。
 * 某种角度说，这个集合不是一个很组件的东西。只是把类似的东西归集在一起，可能会比较乱。
 * 例如：
 * 新增编辑弹框的新增action、编辑action、通用删除action等，不同的action，都放在这里。但很难说都是一种组件。
 *
 * by Iverson 2016-8-5 15:18:15
 *
 */
define([
        "jquery", "underscore",
        'gaeajs-common-utils-ajax', 'gaeajs-common-utils-validate', "gaeajs-common-utils-string", "gaea-system-url",
        "gaeajs-ui-events", "gaeajs-ui-definition", "gaeajs-ui-notify"
    ],
    function ($, _,
              gaeaAjax, gaeaValid, gaeaString, URL,
              GAEA_EVENT, GAEA_UI_DEFINE, gaeaNotify) {
        var actions = {};

        /**
         * 通用删除操作。
         */
        actions.deleteSelected = {
            init: function (options) {
                var buttonDef = options.button;
                var $button = $("#" + buttonDef.htmlId);
                // 默认伪删除
                var deleteURL = URL.CRUD.PSEUDO_DELETE;
                if(gaeaValid.isNotNull(options.url)){
                    deleteURL = options.url;
                }
                /**
                 * 绑定按钮触发的删除事件。
                 */
                $button.on(GAEA_EVENT.DEFINE.ACTION.DELETE_SELECTED, function (event, data) {
                    var schemaId = $("#" + GAEA_UI_DEFINE.UI.SCHEMA.ID).val();
                    var gridId = $("#" + GAEA_UI_DEFINE.UI.GRID.ID).val();
                    var row = data.selectedRow;
                    // 通用删除！
                    gaeaAjax.ajax({
                        url: deleteURL,
                        data: {
                            id: row.id,
                            urSchemaId: schemaId,
                            gridId: gridId,
                            wfProcInstId: row.wfProcInstId
                        },
                        success: function () {
                            gaeaNotify.message("删除成功！");
                        },
                        fail: function () {
                            gaeaNotify.warn("删除失败！");
                        }
                    });
                });

            }
        };

        return actions;
    });