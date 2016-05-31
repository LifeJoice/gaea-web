/**
 * Created by iverson on 2016-5-25 19:11:51
 * 今天起，开始重构UR创建的一套前端js框架。重新以gaea命名。另外基于RequireJS的模块化。
 *
 * DEPENDENCE:
 * RequireJS,JQuery,重写的Date.format
 */
define(function () {
    var url = {
        DATA:{
            DATASET:{
                GET:"/gaea/data/ds/get" // 获取数据集接口
            }
        }
    };
    return url;
});