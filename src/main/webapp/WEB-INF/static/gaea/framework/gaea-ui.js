/**
 * DEPENDENCY:
 * JQuery
 */
$(function () {
    //初始化按钮按下的效果
    //$(".ur-toolbar a").mousedown(function () {
    //    $(this).removeClass("grey button").addClass("grey press-button");
    //}).mouseup(function () {
    //    $(this).removeClass("grey press-button").addClass("grey button");
    //})
    /**
     * 复选框效果
     */
    $('label').click(function() {

        // find the first span which is our circle/bubble
        var el = $(this).children('span:first-child');

        // add the bubble class (we do this so it doesnt show on page load)
        el.addClass('circle');

        // clone it
        var newone = el.clone(true);

        // add the cloned version before our original
        el.before(newone);

        // remove the original so that it is ready to run on next click
        $("." + el.attr("class") + ":last").remove();
    });
})