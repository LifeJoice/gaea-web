/**
 * 重构，基于RequireJS的模块化。包括整个前端的架构都基于RequireJS模块化。
 * 2016-2-17 11:09:22
 * Iverson
 */
require(['jquery','gaeajs-common-utils-ajax','gaeajs-common-utils-validate','gaeajs-ui-grid','gaeajs-ui-toolbar','gaeajs-ui-notify','webuploader',
'jquery-ui-core','jquery-ui-widget','jquery-ui-mouse','jquery-ui-button','jquery-ui-draggable','jquery-ui-position',
    'jquery-ui-dialog','gaea-jqui-dialog','jquery-serializeObject'],
    function($,gaeaAjax,gaeaValid,gaeaGrid,gaeaToolbar,gaeaNotify,webuploader) {
//$(function () {
    $("#urSchemaId").val(viewSchema.initData.id);
    // 初始化GRID
    viewSchema.initData.grid.listeners = {
        select: function (row) {
            $("#wfProcInstId").val(row.wfProcInstId);
        }
    };
    gaeaGrid.create(viewSchema.initData.grid);
    // 初始化 TOOLBAR
    gaeaToolbar.create({
        renderTo: "ur-toolbar",
        buttons: viewSchema.initData.views.actions.buttons
        /**    ur_gridview.html的自定义通用功能!!!    **/
        //interface:{
        //    /* 和actions.buttons.interfaceAction对应。 */
        //    "deleteSelected": function (row) {      // 通用删除！
        //        $.post("/gaea/common/crud/delete",
        //            {
        //                id:row.id,
        //                urSchemaId:$("#urSchemaId").val(),
        //                gridId:$("#gridId").val(),
        //                wfProcInstId:row.wfProcInstId
        //            },
        //            function () {
        //                gaeaNotify.message("删除成功！");
        //                //alert("成功");
        //            }).fail(function () {
        //            gaeaNotify.warn("删除失败！");
        //                //alert("失败");
        //            });
        //    }
        //}
    }, viewSchema.initData.views);
    // 初始化title
    if(gaeaValid.isNotNullMultiple(viewSchema.initData,["views","title"])) {
        $("#view-title").html(viewSchema.initData.views.title);
    }

});




