/**
 * 2015年7月2日18:54:49
 * Iverson
 */
$(function () {
    $("#urSchemaId").val(viewSchema.initData.id);
    // 初始化GRID
    viewSchema.initData.grid.listeners = {
        select: function (row) {
            $("#wfProcInstId").val(row.wfProcInstId);
        }
    }
    gaea.component.grid.create(viewSchema.initData.grid);
    // 初始化 TOOLBAR
    gaea.macula.toolbar.create({
        renderTo: "ur-toolbar",
        buttons: viewSchema.initData.views.actions.buttons,
        /**    ur_gridview.html的自定义通用功能!!!    **/
        interface:{
            /* 和actions.buttons.interfaceAction对应。 */
            "deleteSelected": function (row) {      // 通用删除！
                $.post("/admin/common-crud/delete.do",
                    {
                        id:row.id,
                        urSchemaId:$("#urSchemaId").val(),
                        gridId:$("#gridId").val(),
                        wfProcInstId:row.wfProcInstId
                    },
                    function () {
                        alert("成功");
                    }).fail(function () {
                        alert("失败");
                    });
            }
        }
    }, viewSchema.initData.views);
    // 初始化title
    if(gaea.utils.validate.isNotNullMultiple(viewSchema.initData,["views","title"])) {
        $("#view-title").html(viewSchema.initData.views.title);
    }

})




