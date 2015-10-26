/**
 * Dependency: JQuery
 * 2015年10月25日14:36:44
 * Iverson
 */
$(function () {
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
})




