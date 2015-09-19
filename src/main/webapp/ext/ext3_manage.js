//var grid;
//var store;
// ---------------------------- Test new GRID framework ----------------------------
$(function() {
    ur.component.grid.create({
        model: {
            idProperty: "productId",
            fields: [
                {id: 'productId'}, // 对应ExtJS的field
                {id: 'name'},
                {id: 'description'},
                {id: 'status'},
                {id: 'lastPrice'},
                {id: 'createTime'}
            ]
        },
        columns: [
            {text: "productId", width: 60, menuDisabled: false, hidden: true}, // text对应ExtJS 3的header，ExtJS 4的text。
            {text: "名称", width: 150, id: 'name'},
            {text: "描述"},
            {text: "状态"},
            {text: "最新价格", resizable: false},
            {text: "创建时间", renderType: "date"}
        ],
        proxy: {
            url: "/product/list-all.do",
            headers: {'Accept': 'application/json'}, // 这个很重要。设定请求头。因为服务端的异常处理架构需要这个信息。
        },
        autoLoad: true,
        renderTo: "gridDemo"
    });
});


$(function() {
//    var colModel = new Ext.grid.ColumnModel({
//        columns: [
//            {header: "productId", width: 60, menuDisabled: false, hidden: true},
//            {header: "name", width: 150, id: 'name'},
//            {header: "description"},
//            {header: "status"},
//            {header: "lastPrice", resizable: false},
////            {header: "createTime"}
//            {header: "createTime",
//                renderer: function(value, row) {
////                    alert(ur.utils.validate.isNotNull(value));
//                    if (ur.utils.validate.isNotNull(value)) {
//                        return Ext.util.Format.date(new Date(parseInt(value)), 'Y-m-d')
//                    } else {
//                        return "";
//                    }
//                }
//            }
//        ]
////        defaults: {
////            sortable: true,
////            menuDisabled: true,
////            width: 100
////        },
////        listeners: {
////            hiddenchange: function(cm, colIndex, hidden) {
////                saveConfig(colIndex, hidden);
////            }
////        }
//    });
//
//    store = new Ext.data.JsonStore({
//        // store configs
////    autoDestroy: true,
////    url: '/product/list-all.do',
////    storeId: 'myStore',
////    // reader configs
////    root: 'images',
////    idProperty: 'name',
////    fields: ['name', 'url', {name:'size', type: 'float'}, {name:'lastmod', type:'date'}],
//        idProperty: "productId",
//        fields: ['productId', 'name', 'description', 'status', 'lastPrice', {name: "createTime"}],
//        autoLoad: true,
//        proxy: new Ext.data.HttpProxy({
//            type: "ajax",
//            url: '/product/list-all.do',
//            headers: {'Accept': 'application/json'}, // 这个很重要。设定请求头。因为服务端的异常处理架构需要这个信息。
//            reader: {
//                type: 'json'
//            }
//        })
////        proxy: {
////            type: 'ajax',
////            url: '/product/list-all.do',
////            reader: {
////                type: 'json'
////            }
////        }
//    });
//
//    grid = new Ext.grid.GridPanel({
//        id: "mygrid",
//        store: store,
//        colModel: colModel,
//        renderTo: "gridDemo", // 放grid列表的DIV
////        store: new Ext.data.Store({
////            autoDestroy: true,
////            reader: reader,
////            data: xg.dummyData
////        }),
////        colModel: new Ext.grid.ColumnModel({
////            defaults: {
////                width: 120,
////                sortable: true
////            },
////            columns: [
////                {id: 'company', header: 'Company', width: 200, sortable: true, dataIndex: 'company'},
////                {header: 'Price', renderer: Ext.util.Format.usMoney, dataIndex: 'price'},
////                {header: 'Change', dataIndex: 'change'},
////                {header: '% Change', dataIndex: 'pctChange'},
////                // instead of specifying renderer: Ext.util.Format.dateRenderer('m/d/Y') use xtype
////                {
////                    header: 'Last Updated', width: 135, dataIndex: 'lastChange',
////                    xtype: 'datecolumn', format: 'M d, Y'
////                }
////            ]
////        }),
////        viewConfig: {
////            forceFit: true,
//////      Return CSS class to apply to rows depending upon data values
////            getRowClass: function(record, index) {
////                var c = record.get('change');
////                if (c < 0) {
////                    return 'price-fall';
////                } else if (c > 0) {
////                    return 'price-rise';
////                }
////            }
////        },
//        sm: new Ext.grid.RowSelectionModel({singleSelect: true}),
//        width: 600,
//        height: 300,
//        frame: true,
//        title: '产品管理',
//        iconCls: 'icon-grid'
//    });

    var tb = new Ext.Toolbar({
        renderTo: "tool-bar",
        items: [
            {
                text: '新增', iconCls: "drop-add",
                handler: function() {
                    prepareAdd();
                }
            }, {
                text: '修改', iconCls: "edit",
                handler: function() {
                    update();
                }
            }, {
                text: '删除', iconCls: "drop-no",
                handler: function() {
                    del();
                }
            }, {
                text: '测试', iconCls: "drop-no",
                handler: function() {
                    var d = new Date(1400601600000);
//                    var d = new Date("2014/5/22 17:19:10");
                    alert(d.format("yy/MM/dd"));
                }
            }
        ]
    });
// ----------------------------------------------------- 日期输入框 -----------------------------------------------------
    new Ext.form.DateField({
//        format: 'd F Y', // 'd mmm yyyy' is not valid, but I assume this is close?
//        width: 200,
        renderTo: "div-create-time",
        name: "createTime",
        id: "createTime"
//        value: '2013-08-11'
    });
});

// ----------------------------------------------------- 弹出框test -----------------------------------------------------
function prepareAdd() {
//    var dialog = ur.component.dialog.createDialog("新增", "div-add-form", function() {
//        $.post("/product/save.do",
//                $("#add-form").serializeObject(),
//                function() {
//                    store.load();
//                    alert("新增成功");
//                }).fail(function() {
//            alert("新增失败");
//        });
//    });
    // ----------------NEW open dialog------------------ 
    ur.component.dialog.create({
        title: "新增",
        injectHtmlId: "div-add-form", // 要放入弹出框的内容
        formId: "add-form", // 要提交的form的id。一般该form会是在injectHtmlId中。用于获取表单的值并提交。
        okText: "保存",
        cancelText: "取消",
        url: "/product/save.do",
        success: function() {
            parent.warn("新增成功。");
            store.load();
        }
    });
}

function update() {
    var record = ur.component.grid.getSelected("mygrid");
    ur.utils.initInputValues("add-form", record, [{name: "createTime", datatype: "date"}]);
//    var createTimeObj = ur.component.getComponent("createTime");
//    alert("date: " + record.createTime);


//    ur.component.dialog.createDialog("修改", "div-add-form", function() {
//        $.post("/product/update.do",
//                $("#add-form").serializeObject(),
//                function() {
//                    store.load();
//                    alert("修改成功");
////                                editWindow.hide();
//                }).fail(function() {
//            alert("修改失败");
////                        editWindow.hide();
//        });
//    });
    // ----------------NEW open dialog------------------
    ur.component.dialog.create({
        title: "修改",
        injectHtmlId: "div-add-form", // 要放入弹出框的内容
        formId: "add-form", // 要提交的form的id。一般该form会是在injectHtmlId中。用于获取表单的值并提交。
        okText: "保存",
        cancelText: "取消",
        url: "/product/update.do",
        success: function() {
            parent.warn("修改成功。");
            store.load();
        }
    });

}

function del() {
    var pId = ur.component.bridge.grid.getId("mygrid");
    ur.component.dialog.confirmAndSubmit({
        title: "删除",
        content: "你确定删除？",
//        save: function() {
//            ur.utils.ajax.post({
        url: "/product/delete.do",
        data: {productId: pId},
        success: function() {
            parent.warn("删除成功。");
            store.load();
        }
//            });
//        $.post("/product/delete.do",
//                {productId: pId},
//        function() {
//            alert("删除成功");
//            store.load();
//        }).fail(function() {
//            alert("删除失败");
//        });
//        }
    });
}