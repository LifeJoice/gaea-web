/**
 * Dependency: JQuery
 * 2015年10月25日14:36:44
 * Iverson
 */
require(['jquery', 'gaeajs-common-utils-ajax', 'gaeajs-common-utils-validate','gaeajs-ui-notify'], function ($, gaeaAjax, gaeaValid,gaeaNotify ) {
    // 初始化消息提示组件
    gaeaNotify.init();
    /**
     * 【1】加载用户所能操作的菜单功能。阻塞加载，否则后面的菜单js会获取不到动态插入的菜单项。
     *  当前支持1、2级菜单，未支持3级菜单。不过将来可以方便扩展。
     */
    gaeaAjax.ajax({
        url: "/menu/find-all",
        async: false,
        data: null,
        success: function (data, textStatus, jqXHR) {
            console.log("done!");
            var menuHtml = "";
            // data即菜单列表对象。[{"name":"系统管理","level":2,"url":null,"subMenus"………………
            $.each(data, function (index) {
                var lv2menuHtml = "<div><span class='menu lv2'>" + this.name + "</span>";
                // 如果二级菜单的子菜单不为空,拼凑三级菜单
                if (gaeaValid.isNotNullArray(this.subMenus)) {
                    lv2menuHtml += "<div class='menu-container lv2'>";
                    // 遍历三级菜单项,加入菜单中
                    $.each(this.subMenus, function (index) {
                        var lv3menuHtml = "<span class='menu lv3' data-href='" + this.url + "'>" + this.name + "</span>";
                        lv2menuHtml += lv3menuHtml;
                    });
                    lv2menuHtml += "</div>";
                }
                lv2menuHtml += "</div>";
                menuHtml += lv2menuHtml;
            });
            // 把组装完的菜单放入页面菜单DIV中.
            $(".gaea-menu-list").append(menuHtml);
        },
        fail: function () {
            alert("shit!");
        }
    });

    /**
     * 【2】制造菜单动态切换的效果。
     */
    //$(function () {
    var menulist = $(".gaea-menu-list"),
        $openMenuCT = $(".menu-container.lv2"),
        DELAY_BASE = 0.04;
    menulist.find(".menu-container").filter(":first").css("height", "auto");
    menulist.find(".menu-container").filter(":first").find(".menu.lv3").addClass("open");
    //$.each(menulist.find(".menu-container").filter(":first").find(".menu.lv3"), function () {
    //    $(this).css("opacity","1").css("transform","translateX(0)");
    //})

    /**
     * 点击二级菜单，展开三级菜单。
     */
    menulist.find("span.menu.lv2").click(function () {
        //opennedMenuList.hide();
        var spanHeight = $openMenuCT.find(".menu.lv3").css("height");
        $openMenuCT.css({
            "height": "0",
            "visibility": "hidden"
        });
        $openMenuCT.find(".menu.lv3").css("transition", "all 0s");
        $openMenuCT.find(".menu.lv3.open").removeClass("open");
        var menuCT = $(this).next(".menu-container.lv2");
        //menuCT.show();
        menuCT.css({
            "height": "auto",
            "visibility": "visible"
        });
        $.each(menuCT.find(".menu.lv3"), function (index, elem) {
            var delaySec = (index + 1) * DELAY_BASE;
            //$(this).css("transform","translateX(0)").css("opacity", "1");
            //$(this).animate({
            //    "opacity": "1",
            //    "margin-left": "20px"
            //},delaySec);
            $(this).css("transition", "all 0.4s").css("transition-delay", delaySec + "s").addClass("open");
        });
        //menuCT.find(".menu.lv3").toggleClass("show");
        //menuCT.find(".menu.lv3").css({
        //    "opacity": "1",
        //"transform": "translateX(0)"
        //});
        $openMenuCT = $(this).next(".menu-container.lv2");
    });

    /**
     * 点击三级菜单，切换选中状态，并加载页面。
     */
    $(".menu.lv3").click(function () {
        // 取消已选中的
        menulist.find(".selected").removeClass("selected");
        // 选中当前点击的
        $(this).addClass("selected");
        // 加载对应的功能页面到内容块。
        if (gaeaValid.isNotNull($(this).data("href"))) {
            $(".gaea-sys-content").load($(this).data("href"));
        }
    });
    //})
});

//$(function () {
//    var menulist = $(".gaea-menu-list"),
//    $openMenuCT = $(".menu-container.lv2"),
//        DELAY_BASE = 0.04;
//    menulist.find(".menu-container").filter(":first").css("height","auto");
//    menulist.find(".menu-container").filter(":first").find(".menu.lv3").addClass("open");
//    //$.each(menulist.find(".menu-container").filter(":first").find(".menu.lv3"), function () {
//    //    $(this).css("opacity","1").css("transform","translateX(0)");
//    //})
//
//
//
//    menulist.find("span.menu.lv2").click(function () {
//        //opennedMenuList.hide();
//        var spanHeight = $openMenuCT.find(".menu.lv3").css("height");
//        $openMenuCT.css({
//            "height":"0",
//            "visibility":"hidden"
//        });
//        $openMenuCT.find(".menu.lv3").css("transition","all 0s");
//        $openMenuCT.find(".menu.lv3.open").removeClass("open");
//        var menuCT = $(this).next(".menu-container.lv2");
//        //menuCT.show();
//        menuCT.css({
//            "height":"auto",
//            "visibility":"visible"
//        });
//        $.each(menuCT.find(".menu.lv3"), function (index,elem) {
//            var delaySec = (index+1)*DELAY_BASE;
//            //$(this).css("transform","translateX(0)").css("opacity", "1");
//            //$(this).animate({
//            //    "opacity": "1",
//            //    "margin-left": "20px"
//            //},delaySec);
//            $(this).css("transition","all 0.4s").css("transition-delay",delaySec+"s").addClass("open");
//        });
//        //menuCT.find(".menu.lv3").toggleClass("show");
//        //menuCT.find(".menu.lv3").css({
//        //    "opacity": "1",
//        //"transform": "translateX(0)"
//        //});
//        $openMenuCT = $(this).next(".menu-container.lv2");
//    });
//})




