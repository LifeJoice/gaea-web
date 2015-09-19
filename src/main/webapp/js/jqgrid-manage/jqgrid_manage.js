$(function() {
    // init UI
    $("input[type='button'").button();
    // init dialog
    initDialog();
    // init grid
    initGrid();
    // init jnotify
    initNotification();
    // init action
    initAction();
});

function initNotification() {
    // For jNotify Inizialization
    // Parameter:
    // oneAtTime : true if you want show only one message for time
    // appendType: 'prepend' if you want to add message on the top of stack, 'append' otherwise
//    $('#StatusBar').jnotifyInizialize({
//        oneAtTime: true
//    })
    $('#div_notification')
            .jnotifyInizialize({
                oneAtTime: false,
                appendType: 'append'
            })
            .css({'position': 'absolute',
                'marginTop': '20px',
                'right': '20px',
                'width': '250px',
                'z-index': '9999'
            });
}

function initGrid() {
//    var mydata = [
//        {productId:"1",name:"aaa",description:"axx",status:"1",lastPrice:"19.99"},
//        {productId:"2",name:"bbb",description:"bxx",status:"1",lastPrice:"29.99"},
//        {productId:"3",name:"ccc",description:"cxx",status:"1",lastPrice:"39.99"},
//        {productId:"4",name:"ddd",description:"dxx",status:"1",lastPrice:"49.99"},
//        {productId:"5",name:"eee",description:"exx",status:"1",lastPrice:"59.99"}
//    ];
    $('#tb-product').jqGrid({
        url: "/product/list-all.do",
        datatype: "json",
//        datatype: "local",
        autowidth: true,
        height: 300,
        colNames: ['产品ID', '产品名称', '产品描述', '产品状态', '最新价格'],
        colModel: [
            {name: 'productId', index: 'prodId', width: 100, hidden: true},
            {name: 'name', index: 'name', width: 100},
            {name: 'description', title: 'description', width: 100},
            {name: 'status', title: 'status', width: 100},
            {name: 'lastPrice', title: 'lastPrice'}
        ],
        rowNum: 10,
        rowList: [10, 20, 30]
    });
//    for(var i=0;i<=mydata.length;i++)
//	$('#tb-product').jqGrid('addRowData',i+1,mydata[i]);
}

function initDialog() {
    $("#div-add-form").dialog({
        autoOpen: false,
        resizable: false,
        buttons: {
            "保存": function() {
                $(this).dialog("close");
            },
            "取消": function() {
                $(this).dialog("close");
            }
        }
    });
}

function initAction() {
    $("#new_button").click(function() {
        ur.util.clearAll($("#add-form").get(0));
        $("#div-add-form").dialog("option", "title", "新增产品");
        $("#div-add-form").dialog({
            buttons: {
                "保存": function() {
                    save();
                },
                "取消": function() {
                    $("#div-add-form").dialog("close");
                }
            }
        });
        $("#div-add-form").dialog("open");
    });
    // 更新
    $("#update_button").click(function() {
        $("#div-add-form").dialog("option", "title", "修改产品");
        $("#div-add-form").dialog({
            buttons: {
                "保存": function() {
                    update();
                },
                "取消": function() {
                    $("#div-add-form").dialog("close");
                }
            }
        });
        var rowid = $('#tb-product').jqGrid('getGridParam', 'selrow');
        var record = $('#tb-product').jqGrid("getRowData", rowid);
        $("#productId").val(record.productId);
        $("#name").val(record.name);
        $("#description").val(record.description);
        $("#status").val(record.status);
        $("#lastPrice").val(record.lastPrice);
        $("#div-add-form").dialog("open");
    });
    // 删除
    $("#del_button").click(function() {
        var rowid = $('#tb-product').jqGrid('getGridParam', 'selrow');
        var record = $('#tb-product').jqGrid("getRowData", rowid);
//        alert("row id: "+rowid+"product Id: "+record.productId);
        del(record.productId);
    });
}

function successCallback(data) {
    $("#div-add-form").dialog("close");
    parent.warn(data.RESULT_MSG);
    $('#tb-product').trigger("reloadGrid");
}
function failCallback(data) {
    $("#div-add-form").dialog("close");
    parent.warn(data.RESULT_MSG);
//    $('#div_notification').jnotifyAddMessage({
//        text: data.ERROR_MSG,
//        permanent: true,
//        type: 'error'
//    });
}