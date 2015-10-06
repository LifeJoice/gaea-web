/**
 * Created by Iverson on 2015/5/18.
 */
$(function () {
    /**
     * 初始化页面组件和元素
     */
    // 在点击按钮的时候初始化
    gaea.macula.toolbar.button.afterLoadInClick(viewSchema.initData.views,"btnNew", function () {
        $('#beginDatetime').datetimepicker({
            yearStart: 2015,
            dayOfWeekStart: 1,
            lang: 'ch',
            format:'Y-m-d H:i',
            defaultDate: new Date(),
            minTime: '8:30',
            maxTime: '18:10',
            defaultTime: '08:30',
            step: 10
        });
        $('#endDatetime').datetimepicker({
            yearStart: 2015,
            dayOfWeekStart: 1,
            lang: 'ch',
            format:'Y-m-d H:i',
            defaultDate: new Date(),
            minTime: '8:30',
            maxTime: '18:10',
            defaultTime: '08:30',
            step: 10
        });
    });
    //$("#btn_new").click(function () {
    //    $("#mydialog").urDialog("open");
    //    // 不能提前初始化日期组件。否则焦点自动聚焦的时候，日期控件就自动蹦出来了。
    //    //初始化日期时间控件
    //    $('#beginDatetime').datetimepicker({
    //        yearStart: 2015,
    //        dayOfWeekStart: 1,
    //        lang: 'ch',
    //        format:'Y-m-d H:i:s',
    //        defaultDate: new Date(),
    //        minTime: '8:30',
    //        maxTime: '18:00',
    //        defaultTime: '08:30',
    //        step: 10
    //    });
    //    $('#endDatetime').datetimepicker({
    //        yearStart: 2015,
    //        dayOfWeekStart: 1,
    //        lang: 'ch',
    //        format:'Y-m-d H:i:s',
    //        defaultDate: new Date(),
    //        minTime: '8:30',
    //        maxTime: '18:00',
    //        defaultTime: '08:30',
    //        step: 10
    //    });
    //});
});