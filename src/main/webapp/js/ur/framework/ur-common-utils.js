/**
 * DEPENDENCE:
 * JQuery,重写的Date.format
 * @type type
 * @since 2014-5-15 星期四
 * @author Iverson
 */
ur.utils = {
    form: {
        init: {
            options: [{
                    name: null,
                    propName: null,
                    type: {
                        name: null,
                        datetimeFormat: null,
                        datetimeType: null               // 日期类型有效。格式类型，例如：year-month
                    }
                }],
            /**
             * 初始化表单的值。
             * @param {type} containerId 父元素id，一般即form id
             * @param {type} data
             * @param {type} configs 自定义设置。针对某些特殊元素自定义规则。例如：{name:"createTime",datatype:"date"}。指定该输入框转换为日期。
             * @returns {undefined}
             */
            initValues: function(containerId, data, options) {
                this.options = options;
                var that = this;
                var selector = "#" + containerId + " input,select";
//        遍历argId下的各个元素,<input>、<select>...
                $(selector).each(function() {
                    var elmName = $(this).attr("name"); // 元素的name。例如：<input name="attrName"...
                    var elmValue = $(data).attr(elmName); // 元素的value。例如：<input value="attrValue"...
                    /* 遍历自定义设置。如果要初始化的值有自定义设置，比如日期，则需要转换； */
                    if ($.isArray(that.options)) {
                        for (var i = 0; i < that.options.length; i++) {
                            var cfg = that.options[i];
                            // 如果有设置propName，意味着用data.propName的值替换name元素的值
                            if (ur.utils.validate.isNotNull(cfg) && ur.utils.validate.isNotNull(cfg.propName) && cfg.name === elmName) {
                                elmValue = $(data).attr(cfg.propName);
                            }
                            if (cfg.name === elmName && cfg.type.name === "date") { // 如果子元素的名字在自定义配置中存在，并且类型是date
                                // 如果有指定日期类型，转换日期格式。
                                if (ur.utils.validate.isNull(cfg.type.datetimeFormat)) {
                                    cfg.type.datetimeFormat = ur.utils.date.parser.parseType(cfg.type.datetimeType);
                                }
                                // 转换日期格式
                                elmValue = ur.utils.date.parser.getDate(elmValue, {format: cfg.type.datetimeFormat});
                                break;
                            }
                        }
                    }
                    $(this).val(elmValue);
                });
            }
        }
    },
    /**
     * 清楚obj中所以子输入框的内容。例如：input...等。
     * @param {type} obj dom对象，非JQuery对象
     * @returns {undefined}
     */
    clearForm: function(argId) {
        var selector = "#" + argId;
        $(selector).find("input").each(function() {
            $(this).val("");
        });
    },
    /**
     * 消息入口。提供统一的消息提醒，目前是Jnotify。如：新增成功、修改成功等。
     * @type type
     */
    message: {
        /**
         * 
         * @param {type} data Controller返回的json数据，带有处理结果信息的。
         * @returns {undefined}
         */
        show: function(data) {
            parent.warn(data.RESULT_MSG);
        }
    }
};

ur.utils.validate = {
    isNotNull: function(arg1) {
        try {
            if (arg1 === null) {
                return false;
            }
            if (typeof arg1 === "undefined") {
                return false;
            }
        } catch (error) {
            console.log("错误信息：" + error.message);
            if (error.message.indexOf("undefined")) {
                return false;
            }
        }
        return true;
    },
    isNull: function(arg1) {
        if (arg1 === null) {
            return true;
        }
        if (typeof arg1 === "undefined") {
            return true;
        }
        return false;
    }
};
/**
 * 日期类工具。
 */
ur.utils.date = {
    parser: {
        options: {
            format: null,
            type: null
        },
        /**
         * 这个需要依赖重写过的Date.format方法。<p/>
         * 把一个毫秒的日期转换为一定的格式化后的日期。
         * @param {type} argMillisecond
         * @param {type} options
         * @returns {unresolved}
         */
        getDate: function(argMillisecond, options) {
            this.options = options;
            var millisecond = parseInt(argMillisecond);
            var d = new Date(millisecond);
            if (ur.utils.validate.isNotNull(this.options.type)) {
                this.options.format = ur.utils.date.parser.parseType(this.options.type);
            }
            var strFormat = "MM/dd/yyyy";
            if (ur.utils.validate.isNotNull(this.options) && ur.utils.validate.isNotNull(this.options.format)) {
                strFormat = this.options.format;
            }
            return d.format(strFormat);
        },
        /**
         * 自定义的日期类型转换。例如：year-month代表只显示年月，就会转换为一般的yyyy-MM表示。
         * @param {type} datetimeType
         * @returns {String}
         */
        parseType: function(datetimeType) {
            var datetimeFormat = "MM/dd/yyyy"; // 默认类型
            if (datetimeType === "year-month") {
                datetimeFormat = "yyyy-MM";
            }
            return datetimeFormat;
        }
    }
}
/**
 * 这个是基于JQuery.post的Ajax请求方法。非ExtJS等其他框架的Ajax。
 * @type type
 */
ur.utils.ajax = {
    options: {
        url: null,
        data: null,
        async: true,
        /* 回调函数 */
        success: null,
        fail: null
    },
    post: function(options) {
        this.options = options;
        // 使用jquery的post方法.
        $.post(this.options.url, this.options.data, this.options.success).fail(this.options.fail);
    },
    ajax: function(options) {
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
    }
}