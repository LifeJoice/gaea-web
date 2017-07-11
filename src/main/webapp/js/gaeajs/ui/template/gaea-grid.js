/**
 * 重构，基于RequireJS的模块化。包括整个前端的架构都基于RequireJS模块化。
 * 2016-2-17 11:09:22
 * Iverson
 */
require(['jquery', 'gaeajs-common-utils-ajax', 'gaeajs-common-utils-validate', 'gaeajs-ui-grid', 'gaeajs-ui-toolbar', 'gaeajs-ui-notify', 'webuploader', "gaeajs-ui-chain", "gaeajs-ui-view",
        'jquery-ui-core', 'jquery-ui-widget', 'jquery-ui-mouse', 'jquery-ui-button', 'jquery-ui-draggable', 'jquery-ui-position',
        'jquery-ui-dialog', 'gaea-jqui-dialog', 'jquery-serializeObject'],
    function ($, gaeaAjax, gaeaValid, gaeaGrid, gaeaToolbar, gaeaNotify, webuploader, gaeaUIChain, gaeaView) {
        $("#urSchemaId").val(viewSchema.initData.id);

        // 最后，初始化链式view
        // 这个之后，才能初始化toolbar。里面的按钮关联的其他view会依赖这个作为父。
        gaeaView.addChain(viewSchema.initData.views);
        $("#viewId").val(viewSchema.initData.views.id);

        // 初始化GRID
        viewSchema.initData.grid.listeners = {
            select: function (row) {
                $("#wfProcInstId").val(row.wfProcInstId);
            }
        };
        // 创建grid组件
        viewSchema.initData.grid.id = "gaea-grid-ct";
        gaeaGrid.create(viewSchema.initData.grid);
        // 初始化 TOOLBAR
        gaeaToolbar.create({
            renderTo: "gaea-toolbar",
            buttons: viewSchema.initData.views.actions.buttons
        }, viewSchema.initData.views);
        // 初始化title
        if (gaeaValid.isNotNullMultiple(viewSchema.initData, ["views", "title"])) {
            $("#view-title").html(viewSchema.initData.views.title);
        }

    });




