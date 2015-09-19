/**
 * 
 * @type type
 * 2014-5-4 星期日
 */
var ur = {
    util : {
        /**
         * 清楚obj中所以子输入框的内容。例如：input...等。
         * @param {type} obj dom对象，非JQuery对象
         * @returns {undefined}
         */
        clearAll:function(obj){
            $(obj).find("input").each(function(){
                $(this).val("");
            });
        }
    }
}