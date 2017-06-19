/**
 * 链式操作库。
 * 所谓页面的操作链，即类似面包屑/连续多个弹出框等操作，会构成一个操作链条的，并且链条之间的数据是有关系的。
 *
 * Created by iverson on 2017-6-19 10:52:18
 */
define([
        "jquery", "underscore", 'underscore-string', 'gaeajs-common-utils-ajax', 'gaeajs-common-utils-validate',
        "gaeajs-data", "gaeajs-ui-events", "gaeajs-ui-form", "gaeajs-common-utils-string",
        "gaeajs-ui-definition", "gaeajs-ui-view", "gaea-system-url", 'gaeajs-ui-notify',
        "gaeajs-ui-commons", "gaeajs-ui-multiselect", "gaeajs-common", "gaeajs-ui-tabs",
        "gaeajs-common-utils", "gaeajs-context", "gaeajs-ui-dataFilterDialog", "gaeajs-ui-grid", "gaeajs-data-content",
        'gaea-jqui-dialog', "jquery-serializeObject", "jquery-ui-effects-all"],
    function ($, _, _s, gaeaAjax, gaeaValid,
              gaeaData, GAEA_EVENTS, gaeaForm, gaeaString,
              GAEA_UI_DEFINE, gaeaView, SYS_URL, gaeaNotify,
              gaeaUI, gaeaMultiSelect, gaeaCommon, gaeaComponents,
              gaeaCommonUtils, gaeaContext, gaeaDataFilterDialog, gaeaGrid, gaeaContent) {

        // view chain param name
        var vcCtxName = "gaeaViewChain";
        // init
        if (_.isUndefined(gaeaContext.getValue(vcCtxName))) {
            gaeaContext.setValue(vcCtxName, {});
        }

        var TEMPLATE = {
            CHAIN: {
                NAME: "<%= PARENT_ID %>-><%= ID %>",                                 // dialog1->dialog2
                NAME_SEPARATOR: "->"
            }
        };
        /**
         * 弹框链相关。
         * 所谓弹框链，就是：
         * 例如有一个弹框，里面有一个按钮，点一下，又弹一个框；新弹框里面有个按钮，点一下又弹一个框……
         * 如果，我们从第二个开始不弹框，改为覆盖当前弹框的内容，注意是内容！
         * 则，这些共用同一个框的（本来应该是弹框的），所有弹框会形成一个链路。从而确保，最后一个弹框点确认的时候，可以回到第二个；第二个点确认，可以回到第三个……
         */
        var public = {
            cache: {
                /**
                 * 已打开的弹出框的链路表。
                 * key：所有打开弹出框的id组合，基于id以打开顺序拼凑而成。
                 * value：应该对应的是dialog.option
                 */
                openDialogChainList: {
                    // { dialog1->dialog2:{ dialog1:{...}, dialog1->dialog2:{...} }, dialog3->dialog4:{dialog3:{...}, dialog3->dialog4:{...} } }
                }
            },
            // 新建一个弹出链
            new: function (key, value) {
                if (gaeaValid.isNull(key)) {
                    throw "id为空，无法获取对应的弹框链。";
                }
                public.cache.openDialogChainList[key] = value;
            },
            /**
             *
             * @param {object} opts
             * @param {string} opts.id
             * @param {string} [opts.parentId]                          如果没有父级弹框id, 我就是第一个
             * @param {object} opts.options                             要缓存的对象。一般是当前弹框的一些配置项，例如：按钮
             */
            add: function (opts) {
                if (gaeaValid.isNull(opts.id)) {
                    throw "dialog id为空，无法缓存新的弹出框操作链。";
                }
                // 不知道为什么，第一次创建的按钮也有了缓存
                //if(_private.chain.exist(opts.id)){
                //    throw "缓存错误。缓存的弹出框操作链已存在该id："+opts.id;
                //}
                // 如果没有父级弹框id，且当前弹出框id也还没缓存过
                if (gaeaValid.isNull(opts.parentId)) {
                    public.new(opts.id, opts.options);
                } else {
                    // 找到缓存的父级弹框的操作链. parentChain应该是一个对象。
                    var parentChain = _private.pickEndWith(opts.parentId);
                    var newKeyTemplate = _.template(TEMPLATE.CHAIN.NAME);
                    if (_.isNull(parentChain)) {
                        throw "通过parent id，找不到要加入的已存在的弹框链。id: " + opts.parentId;
                    }
                    // 命名当前弹框的操作链名称
                    var newKey = newKeyTemplate({
                        PARENT_ID: _.keys(parentChain)[0],
                        ID: opts.id
                    });
                    //parentChain[newKey] = opts.options;
                    _private.add(newKey, opts.options);
                }
            },
            getEndWith: function (opts) {
                if (gaeaValid.isNull(opts.id)) {
                    throw "id为空，无法获取对应的弹框链。";
                }
                return _private.pickEndWith(opts.id);
            },
            /**
             * 获取id的上一级的parent dialog id。
             * @param id
             * @returns {*}
             */
            getParentId: function (id) {
                gaeaValid.isNull({
                    check: id,
                    exception: "dialog id为空，无法获取对应的弹出框操作链的第一个弹出框id。"
                });
                var myChain = public.getEndWith({id: id});

                gaeaValid.isNull({
                    check: myChain,
                    exception: "根据id无法找到缓存的弹框链中，对应的最顶级dialog id。可能是框架的缓存功能异常。id: " + id
                });
                //if(gaeaValid.isNull(parentChain)){
                //    throw "根据id无法找到缓存的弹框链中，对应的最顶级dialog id。可能是框架的缓存功能异常。id: "+id;
                //    //return null;
                //}
                var chainKey = _.keys(myChain)[0];
                // 自己就是最根本，返回null
                if (!_s.include(chainKey, TEMPLATE.CHAIN.NAME_SEPARATOR)) {
                    return null;
                }
                // 把名字按'->'分隔符切分，并返回最后一个（认为就是root dialog id）。
                // initial去掉最后一个（就是自己），然后再返回（相当倒数第二个）
                return _.last(_.initial(chainKey.split(TEMPLATE.CHAIN.NAME_SEPARATOR)));
            },
            /**
             * 获取id对应的缓存弹框链的最顶级的dialog的id。
             * @param id
             * @returns {string} id
             */
            getRootId: function (id) {
                if (gaeaValid.isNull(id)) {
                    throw "dialog id为空，无法获取对应的弹出框操作链的第一个弹出框id。";
                }
                var parentChain = public.getEndWith({id: id});
                if (gaeaValid.isNull(parentChain)) {
                    //throw "根据id无法找到缓存的弹框链中，对应的最顶级dialog id。可能是框架的缓存功能异常。id: "+id;
                    return null;
                }
                var parentChainKey = _.keys(parentChain)[0];
                // 把名字按'->'分隔符切分，并返回第一个（认为就是root dialog id）。
                return parentChainKey.split(TEMPLATE.CHAIN.NAME_SEPARATOR)[0];
            },
            isRoot: function (id) {
                if (gaeaValid.isNull(id)) {
                    throw "dialog id为空。";
                }
                if (!gaeaValid.isNull(_private.pick(id))) {
                    return true;
                }
                return false;
            },
            /**
             * 检查缓存的弹出框链是否已经有该弹出框id。
             * @param id
             * @returns {boolean}
             */
            exist: function (id) {
                var dialogChain = _private.pickChain(id);
                if (_.isNull(dialogChain)) {
                    return false;
                }
                return true;
            }
        };

        var _private = {
            /**
             * 往缓存中写入一个新的弹出框。
             * @param key           当前弹出框和前面n多弹出框的id的组合名
             * @param value         值。一般是当前弹出框的配置项。
             */
            add: function (key, value) {
                if (gaeaValid.isNull(key)) {
                    throw "(缓存弹出框链)key为空, 无法进行缓存弹出框链信息的操作.";
                }
                public.cache.openDialogChainList[key] = value;
            },
            /**
             * 精确获取缓存弹框链的某一个id和对应的值。
             * @param id
             * @returns {object}
             */
            pick: function (id) {
                var result = _.pick(public.cache.openDialogChainList, function (value, key, object) {
                    return gaeaString.equalsIgnoreCase(key, id);
                });
                // pick方法找不到，会返回一个空的（{}）对象，而不是null
                if (_.isEmpty(result)) {
                    return null;
                }
                return result;
            },
            /**
             * 从缓存的dialog弹出链中，找到id对应的那个key的value。
             * @param id
             * @returns {对象}
             */
            pickChain: function (id) {
                var result = _.pick(public.cache.openDialogChainList, function (value, key, object) {
                    return _s.include(key, id);
                });
                // pick方法找不到，会返回一个空的（{}）对象，而不是null
                if (_.isEmpty(result)) {
                    return null;
                }
                return result;
            },
            /**
             * 找到我所在的链的具体位置, 即key end with id就是我。
             * 例如，对于id=dialog2就是：
             * {
                     dialog1: ... ,
                     dialog1->dialog2 : ...,               <----- 这就是我
                     dialog1->dialog2->dialog3 : ...
                   }
             * @param id
             * @returns {object} chainObject    一个根据id找到的在缓存中的值，像这样：{ ***->id : value }
             */
            pickEndWith: function (id) {
                // 找到我所在的链（正常应该唯一）
                //var chain = _private.chain._private.pickChain(id);
                //if (gaeaValid.isNull(chain)) {
                //    return null;
                //}
                /**
                 * 找到我所在的链的具体位置, 即key end with id就是我。
                 * 例如，对于id=dialog2就是：
                 * {
                     * dialog1: ... ,
                     * dialog1->dialog2 : ...,               <----- 这就是我
                     * dialog1->dialog2->dialog3 : ...
                     * }
                 */
                var result = _.pick(public.cache.openDialogChainList, function (value, key, object) {
                    return _s.endsWith(key, id);
                });

                // pick方法找不到，会返回一个空的（{}）对象，而不是null
                if (_.isEmpty(result)) {
                    return null;
                }
                return result;
            }
        };
        /**
         * 返回（暴露）的接口
         */
        return public;
    });