function save() {
    // ---------------------- form data 请求方式 ----------------------
    $.post("/product/save.do",
            $("#add-form").serializeObject(),
            function() {
                alert("新增成功");
                successCallback();
            }, "json").fail(function(jqXHR) {
                var obj = $.parseJSON(jqXHR.responseText);
//        alert(obj.ERROR_MSG);
        failCallback(obj);
    });
}

function update() {
    // ---------------------- form data 请求方式 ----------------------
    $.post("/product/update.do",
            $("#add-form").serializeObject(),
            function(data,textStatus,jqXHR) {
                var obj = $.parseJSON(jqXHR.responseText);
//                alert("data:"+data.RESULT_MSG+"\ntextStatus:"+textStatus);
//                alert("修改成功");
                successCallback(obj);
            }).fail(function(jqXHR) {
                var obj = $.parseJSON(jqXHR.responseText);
//        alert("修改失败");
        failCallback(obj);
    });
}

function del(prodId) {
    $.post("/product/delete.do",
            {productId: prodId},
    function(jqXHR) {
                var obj = $.parseJSON(jqXHR.responseText);
//        alert("删除成功");
        successCallback(obj);
    }).fail(function(jqXHR) {
                var obj = $.parseJSON(jqXHR.responseText);
//        alert("删除失败");
        failCallback(obj);
    });
}