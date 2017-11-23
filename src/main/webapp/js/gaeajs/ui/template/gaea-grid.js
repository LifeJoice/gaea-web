//@ sourceURL=gaea-grid.js
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
        $("#gaeaViewId").val(viewSchema.initData.views.id);
        // 缓存view组件的config options，并初始化id
        if ($("[data-gaea-ui-view]").length == 1) {
            $("[data-gaea-ui-view]:first").data("gaeaOptions", viewSchema.initData.views);
            $("[data-gaea-ui-view]:first").attr("id", viewSchema.initData.views.id);
        } else {
            throw "当前页面有两个view的绑定元素( [data-gaea-ui-view] )！无法确定如何初始化gaea view组件！";
        }

        // 初始化GRID
        viewSchema.initData.grid.listeners = {
            select: function (row) {
                $("#wfProcInstId").val(row.wfProcInstId);
            }
        };
        // 创建grid组件
        viewSchema.initData.grid.id = "gaea-grid-ct";
        viewSchema.initData.grid.preConditions = viewSchema.initData.views.preConditions; // 前置条件，如果有的话。一般链式view（下级页面）/data-filter-dialog等会有前置条件。前置条件过滤数据，一般也就会在grid中体现。
        viewSchema.initData.grid.schemaId = viewSchema.initData.id; // schema id, 定义了grid。通用查询的时候、dataFilterDialog等都需要
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
        // 加载dom完成后才要的js
        if (gaeaValid.isNotNullMultiple(viewSchema.initData, ["views", "imports", "domLastImportJs"])) {
            if (_.isArray(viewSchema.initData.views.imports.domLastImportJs)) {
                $.each(viewSchema.initData.views.imports.domLastImportJs, function (i, importObj) {
                    if (gaeaValid.isNotNull(importObj.src)) {
                        $.getScript(importObj.src);
                    }
                });

            }
        }

    });




