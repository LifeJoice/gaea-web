/**
 * Created by iverson on 2016/2/14.
 * 今天起，开始重构UR创建的一套前端js框架。重新以gaea命名。另外基于RequireJS的模块化。
 *
 * DEPENDENCE:
 * RequireJS,JQuery,重写的Date.format
 */
define(function () {
    var post = function(options) {
        this.options = options;
        // 使用jquery的post方法.
        $.post(this.options.url, this.options.data, this.options.success).fail(this.options.fail);
    };
    var ajax = function(options) {
        this.options = options;
        // 使用jquery的ajax方法。本质还是以post的方式。
        $.ajax({
            type: "POST",
            url: this.options.url,
            data: this.options.data,
            success: this.options.success,
            dataType: "json",
            async: this.options.async
        }).fail(this.options.fail);
    };
    return {
        post:post,
        ajax:ajax
    }
})