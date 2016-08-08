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
        },
        QUERY:{
            COMMON:"/sys/query", // 通用查询的url
            BY_CONDITION:"/sys/query/byCondition"
        },
        CRUD:{
            //PRE_UPDATE:"/sys/common/pre-update",
            UPDATE:"/sys/common/update",
            DELETE:"/gaea/common/crud/delete",
            PSEUDO_DELETE:"/gaea/common/crud/pseudo-delete"// 伪删除
        },
        MENU:{
            FIND_ALL:"/gaea/security/menu/find-all"// 查找所有的菜单
        }
    };
    return url;
});