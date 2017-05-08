/**
 * Dependency: JQuery
 * 2015年10月25日14:36:44
 * Iverson
 */
require([
    'jquery', 'gaeajs-common-utils-ajax', 'gaeajs-common-utils-validate', 'gaeajs-ui-notify',
    "gaea-system-url"
], function ($, gaeaAjax, gaeaValid, gaeaNotify,
             URL) {
    // 初始化消息提示组件
    gaeaNotify.init();
    /**
     * 【1】加载用户所能操作的菜单功能。阻塞加载，否则后面的菜单js会获取不到动态插入的菜单项。
     *  当前支持1、2级菜单，未支持3级菜单。不过将来可以方便扩展。
     */
    gaeaAjax.ajax({
        url: URL.MENU.FIND_ALL,
        async: false,
        data: null,
        success: function (data, textStatus, jqXHR) {
            //console.log("done!");
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
            // 如果不是第一个二级菜单（第一个默认显示），其他的都隐藏（添加hidden class）
            $(".gaea-menu-list").find(".menu-container.lv2").not(":first").addClass("hidden");
        },
        fail: function () {
            //console.log("load menu error!");
            window.location.href = "/";
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
        menuCT.css({
            "height": "auto",
            "visibility": "visible"
        });
        $.each(menuCT.find(".menu.lv3"), function (index, elem) {
            var delaySec = (index + 1) * DELAY_BASE;
            $(this).css("transition", "all 0.4s").css("transition-delay", delaySec + "s").addClass("open");
        });
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
        // 加载内容前做一些清理. 把.gaea-main的同级的其他元素（jQuery dialog，datetimepicker）都移除。
        // 像jQuery dialog的一些插件，会在初始化后把一些信息放在body中，这个超出了框架的内容区，会导致加载下一个页面的时候，这些内容会残留，从而和下一个页面冲突。
        $(".gaea-main").siblings(".xdsoft_datetimepicker, .ui-dialog").remove();
        // 加载对应的功能页面到内容块。
        if (gaeaValid.isNotNull($(this).data("href"))) {
            $(".gaea-sys-content").load($(this).data("href"));
        }
    });
});





