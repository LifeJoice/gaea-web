/**
 * Dependency: JQuery
 * 2015年10月25日14:36:44
 * Iverson
 */
require(['jquery','gaeajs-common-utils-ajax','gaeajs-common-utils-validate'], function($,gaeaAjax,gaeaValid) {

    gaeaAjax.ajax({
        url:"http://localhost:8080/menu/find-all",
        async: false,
        data:null,
        success: function (data, textStatus, jqXHR) {
            console.log("done!");
            var menuHtml = "";
            $.each(data, function(index) {
                //if (index === 0) {
                //    return;
                //}
                var lv2menuHtml = "<div><span class='menu lv2'>"+this.name+"</span>";
                if(gaeaValid.isNotNullArray(this.subMenus)){
                    lv2menuHtml += "<div class='menu-container lv2'>";
                    $.each(this.subMenus, function (index) {
                        var lv3menuHtml = "<span class='menu lv3'>"+this.name+"</span>";
                        lv2menuHtml += lv3menuHtml;
                    });
                    lv2menuHtml += "</div>";
                }
                lv2menuHtml += "</div>";
                menuHtml += lv2menuHtml;
            });
            $(".gaea-menu-list").append(menuHtml);
        },
        fail: function () {
            alert("shit!");
        }
    });


    //$(function () {
        var menulist = $(".gaea-menu-list"),
            $openMenuCT = $(".menu-container.lv2"),
            DELAY_BASE = 0.04;
        menulist.find(".menu-container").filter(":first").css("height","auto");
        menulist.find(".menu-container").filter(":first").find(".menu.lv3").addClass("open");
        //$.each(menulist.find(".menu-container").filter(":first").find(".menu.lv3"), function () {
        //    $(this).css("opacity","1").css("transform","translateX(0)");
        //})



        menulist.find("span.menu.lv2").click(function () {
            //opennedMenuList.hide();
            var spanHeight = $openMenuCT.find(".menu.lv3").css("height");
            $openMenuCT.css({
                "height":"0",
                "visibility":"hidden"
            });
            $openMenuCT.find(".menu.lv3").css("transition","all 0s");
            $openMenuCT.find(".menu.lv3.open").removeClass("open");
            var menuCT = $(this).next(".menu-container.lv2");
            //menuCT.show();
            menuCT.css({
                "height":"auto",
                "visibility":"visible"
            });
            $.each(menuCT.find(".menu.lv3"), function (index,elem) {
                var delaySec = (index+1)*DELAY_BASE;
                //$(this).css("transform","translateX(0)").css("opacity", "1");
                //$(this).animate({
                //    "opacity": "1",
                //    "margin-left": "20px"
                //},delaySec);
                $(this).css("transition","all 0.4s").css("transition-delay",delaySec+"s").addClass("open");
            });
            //menuCT.find(".menu.lv3").toggleClass("show");
            //menuCT.find(".menu.lv3").css({
            //    "opacity": "1",
            //"transform": "translateX(0)"
            //});
            $openMenuCT = $(this).next(".menu-container.lv2");
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




