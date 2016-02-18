/**
 * Created by iverson on 2016/2/14.
 * 今天起，开始重构UR创建的一套前端js框架。重新以gaea命名。另外基于RequireJS的模块化。
 *
 * DEPENDENCE:
 * RequireJS,JQuery,重写的Date.format
 */
define(["jquery","underscore",'gaeajs-common-utils-validate'],function ($,_,gaeaValid) {
    var datetime = {
        parser: {
            options: {
                format: null,
                type: null
            },
            /**
             * 可用。但需要更强大的功能，引入了DateJs。这个注释掉不用。
             * 这个需要依赖重写过的Date.format方法。<p/>
             * 把一个毫秒的日期转换为一定的格式化后的日期。
             * @param {type} argMillisecond
             * @param {type} options
             * @returns {unresolved}
             */
            //getDate: function(argMillisecond, options) {
            //    this.options = options;
            //    var millisecond = parseInt(argMillisecond);
            //    var d = new Date(millisecond);
            //    if (ur.utils.validate.isNotNull(this.options.type)) {
            //        this.options.format = ur.utils.date.parser.parseType(this.options.type);
            //    }
            //    var strFormat = "MM/dd/yyyy";
            //    if (ur.utils.validate.isNotNull(this.options) && ur.utils.validate.isNotNull(this.options.format)) {
            //        strFormat = this.options.format;
            //    }
            //    return d.format(strFormat);
            //},
            /**
             * 和上面的功能一样。只是这个是基于DateJS框架的。功能更强大。
             * @param unformatDateTime
             * @param options
             * @returns {*}
             */
            getDate: function(unformatDateTime, options) {
                this.options = options;
                //var millisecond = parseInt(argMillisecond);
                //var d = new Date(millisecond);
                if (gaeaValid.isNotNull(this.options.type)) {
                    this.options.format = this.parseType(this.options.type);
                }
                //var strFormat = "MM/dd/yyyy";
                //if (ur.utils.validate.isNotNull(this.options) && ur.utils.validate.isNotNull(this.options.format)) {
                //    strFormat = this.options.format;
                //}
                //return d.format(strFormat);

                var result;
                var regx = new RegExp("[1-9][0-9][0-9][0-9]-[0-9][0-9]-[0-9][0-9]T[0-9][0-9]:[0-9][0-9]:[0-9][0-9]\.[0-9][0-9][0-9]Z");
                if (gaeaValid.isNotNull(this.options) && gaeaValid.isNotNull(this.options.format)) {
                    if ($.isNumeric(unformatDateTime)) {                // 如果是数字毫秒型
                        var millisecond = parseInt(unformatDateTime);
                        result = new Date(millisecond).toString(this.options.format);
                    } else if (unformatDateTime.match(regx)) {          // 如果是ISO-8601日期标准。类似：2015-08-12T00:30:49.000Z
                        // 由于DateJS暂时不支持ISO-8601日期后面的.000的毫秒值，转换前去掉。
                        var replaceRegx = new RegExp("\.[0-9][0-9][0-9]Z");
                        var strDateTime = unformatDateTime.replace(replaceRegx, "Z");
                        result = Date.parse(strDateTime).toString(this.options.format);
                    }else{
                        result = Date.parse(unformatDateTime).toString(this.options.format);
                        //console.error("该内容无法转换日期格式。input = "+unformatDateTime);
                    }
                }
                return result;
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
    };
    /**
     * 返回（暴露）的接口
     */
    return {
        getDate: datetime.parser.getDate
    }
})