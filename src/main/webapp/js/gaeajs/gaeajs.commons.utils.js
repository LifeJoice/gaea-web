/**
 * 今天起，开始重构UR创建的一套前端js框架。重新以gaea命名。另外基于RequireJS的模块化。
 *
 * 通用工具。
 * Created by iverson on 2016-7-26 16:39:54
 *
 */
define([
        "jquery", "underscore", 'underscore-string',
        'gaeajs-common-utils-validate', "gaeajs-common-utils-string", "gaeajs-ui-definition", "gaeajs-ui-notify"
    ],
    function ($, _, _s,
              gaeaValid, gaeaString, GAEA_UI_DEFINE, gaeaNotify) {

        var utils = {};

        utils.object = {
            /**
             * 帮助从object中获取某个key的值。主要是解决大小写问题。即：key可能是小写，而obj里面的key是大写。
             * 例如：
             * key=text
             * object.TEXT = 'hi'
             * 这个时候本方法就有用了。
             * @param key   要获取的对象某个属性的key
             * @param obj   对象
             * @returns {*}
             */
            getValue: function (key, obj) {
                if (gaeaValid.isNull(key) || gaeaValid.isNull(obj)) {
                    console.debug("key或object为空，无法从指定object获取指定key的值。");
                    return;
                }
                var result;
                $.each(_.keys(obj), function (idx, eachKey) {
                    // 如果请求的key，和对象的某个key相等
                    if (gaeaString.equalsIgnoreCase(key, eachKey)) {
                        // 必须用遍历的key去获取值，因为可能大小写不一样，用请求的key去获取值会获取不到的
                        result = obj[eachKey];
                        return false;
                    }
                });
                return result;
            }
        };

        utils.array = {
            /**
             * 合并两个数组并返回。
             * 如果有removeDuplicate配置项，并且keys不为空，则数组2会根据keys判断数组1中是否有同样值的对象，有的话就不合并。
             *
             * @param {Array} arr1                              可以为对象，自动转换为数组。
             * @param {Array} arr2                              可以为对象，自动转换为数组。
             * @param {object} [opts]
             * @param {string[]} opts.keys                      arr1/arr2的元素的某些属性的集合。配合removeDuplicate，移除数组中重复的值。
             * @param {boolean} opts.removeDuplicate=false      移除合并数组重复的。这个取决于另一个参数keys。
             * @returns {Array} 如果两个数组参数为空，则返回空；如果只是其中一个为空，则返回另一个；
             */
            combine: function (arr1, arr2, opts) {
                if (gaeaValid.isNull(arr1) && gaeaValid.isNull(arr2)) {
                    return;
                }
                var result = new Array();
                opts = gaeaValid.isNull(opts) ? {} : opts; // 初始化undefined的
                // 初始化默认配置
                _.defaults(opts, {
                    removeDuplicate: false
                });
                // 处理数组1
                if (gaeaValid.isNotNull(arr1)) {
                    // 如果不是数组，转换成数组合并
                    if (!_.isArray(arr1)) {
                        arr1 = [arr1];
                    }
                    result = result.concat(arr1);
                }
                // 处理数组2
                if (gaeaValid.isNotNull(arr2)) {
                    // 如果不是数组，转换成数组合并
                    if (!_.isArray(arr2)) {
                        arr2 = [arr2];
                    }
                    /**
                     * if 需要剔除两个数组中重复的
                     * else 直接整合
                     */
                    if (opts.removeDuplicate && _.isArray(opts.keys) && opts.keys.length > 0) {
                        // 遍历数组2, 处理重复
                        $.each(arr2, function (i, newVal) {
                            var hasDuplicate = false; // 是否有重复值
                            // 遍历数组1，对比有没有重复的。没有重复的才加入
                            $.each(arr1, function (j, existVal) {
                                $.each(opts.keys, function (m, key) {
                                    // 如果key为空，不比较
                                    if (gaeaValid.isNull(key)) {
                                        throw "合并数组，不允许为空的key！keys: " + JSON.stringify(opts.keys);
                                    }
                                    // 比较数组1和数组2的值，是否有重复的。这个得把所有key遍历一遍，因为多个key表示多个条件and。
                                    // 如果多个key，上一个判断为true，可能下一个为false
                                    if (gaeaString.equalsIgnoreCase(newVal[key], existVal[key])) {
                                        hasDuplicate = true;
                                    } else {
                                        hasDuplicate = false;
                                    }
                                });
                                // 如果已经找到重复的，就不需要继续检查后面的了。否则后面的检查会把hasDuplicate重置。
                                if (hasDuplicate) {
                                    return false;
                                }
                            });
                            // 所有key验证过，不重复
                            if (!hasDuplicate) {
                                result.push(newVal);
                            }
                        });
                    } else {
                        result = result.concat(arr2);
                    }
                }
                return result;
            },
            /**
             * 检查数组的值，是普通的值，非子数组或对象之类的。
             * 考虑性能，只抽取第一个检查！除非第一个是空，则顺延下一个。
             * @param value
             */
            isGenericValue: function (arr) {
                if (gaeaValid.isNull(arr)) {
                    throw "检查数组的值是否普通的值. 数组对象不允许为空！";
                }
                var result = false;
                if (_.isArray(arr)) {
                    $.each(arr, function (i, iObj) {
                        // if null, continue.
                        if (gaeaValid.isNull(iObj)) {
                            return;
                        }
                        if (_.isArray(iObj) || _.isObject(iObj)) {
                            // it's not generic value. break!
                            return false;
                        } else {
                            // it's generic value. break.
                            result = true;
                            return false;
                        }
                    });
                }
                return result;
            }
        };

        /**
         * 和JQuery defer相关的，或者JS同步相关的方法。
         */
        utils.defer = {
            /**
             * 一般的defer function的数组，在push进数组的时候就会发生调用。这个会导致重复调用。
             * 因为在用$.when.apply( functions...)的时候，又会调用一次。
             * 而最糟糕的是，done方法在第一次push完成后就触发了。
             * 所以，以下测试就是：
             * functions数组，push进去的方式是：function, 而不是function()
             * 这样不会在构造数组的时候就触发方法的调用。当然换来的，就是得多一个functionExecutor包装器，来做function的调用。
             *
             * @param funcArray
             */
            functionsExecutor: function (funcArray) {
                var dfd = $.Deferred();// JQuery同步对象
                if (gaeaValid.isNull(funcArray)) {
                    console.debug("functionsExecutor要执行的方法队列为空.");
                    dfd.resolve();
                    return dfd.promise();
                }
                if (!_.isArray(funcArray)) {
                    throw "不正确使用。输入参数非function数组。";
                }
                var deferreds = new Array();
                // 遍历方法数组，逐一推到deferred数组中。是以function()的方式哦。会触发一次调用。
                $.each(funcArray, function (idx, func) {
                    deferreds.push(func());
                });
                /**
                 * 当deferreds方法数组都执行完后，执行done函数。
                 * 默认是把各个方法的回调结果放入一个对象后，返回给上下文。
                 */
                $.when.apply($, deferreds).done(function (arg1/* ... argN */) {
                    var data = {};
                    // 不确定有多少输入参数。when调用了多少方法，就有多少个输入参数
                    data.gaeaArgs = Array.prototype.slice.call(arguments);
                    dfd.resolveWith(data);
                });
                return dfd.promise();
            }
        };

        /**
         * 这个是通用的数据处理工具。
         * 这一点是和gaeaData的区别。很重要！
         */
        utils.data = {
            /**
             * 把data里的所有对象扁平化。主要是为了适配Spring MVC的bean注入。
             * jQuery会把对象的属性用[]包住.例如: user:{id:1} 会变成 user[id]=1.
             * 但Spring会觉得中括号的,要么是list,要么是map. 跟接收的bean对不上就会抛异常.
             * 例如：
             {
                    id:1,
                    medal:["金牌","银牌","铜牌"],
                    children:[{id:101,name:"Joe",title:{text:"TheBoy",value:1,color:[{id:1,desc:"red"},{id:2,desc:"yellow"}]}},{id:102,name:"jack",title:{text:"Awesome",value:2,color:["red","yellow"]}}]
             }
             就会压扁成：
             id:1
             medal[0]:"金牌"
             medal[1]:"银牌"
             medal[2]:"铜牌"
             children[0].id:101
             children[0].name:"Joe"
             children[0].title:1
             children[0].title.color[0].desc:"red"
             children[0].title.color[0].id:1
             children[0].title.color[1].desc:"yellow"
             children[0].title.color[1].id:2
             children[0].title.text:"TheBoy"
             children[0].title.value:1
             children[1].id:102
             children[1].name:"jack"
             children[1].title:2
             children[1].title.color[0]:"red"
             children[1].title.color[1]:"yellow"
             children[1].title.text:"Awesome"
             children[1].title.value:2
             * @param data 原数据
             * @param opts 配置项(暂时没用)
             * @param parentFieldName 父对象的名字。用来把对象扁平化后拼凑对象名。例如：children[0].title
             */
            flattenData: function (data, opts, parentFieldName) {
                if (gaeaValid.isNull(data)) {
                    return;
                }
                var result = {};
                /**
                 * 如果是数组
                 */
                if (_.isArray(data)) {
                    $.each(data, function (idx, val) {
                        // 拼凑请求paramName,作为父名称传给递归调用.才能实现扁平化.
                        var paramName = "[" + idx + "]";
                        if (gaeaValid.isNotNull(parentFieldName)) {
                            paramName = parentFieldName + "." + paramName;
                        }
                        // 递归调用
                        var newData = utils.data.flattenData(this, opts, paramName);
                        // 把转换过的值覆盖到现在结果中。因为扁平化后，不同对象中同名的属性，应该变成不同属性名了。
                        result = _.extend(result, newData);
                    });
                } else if (_.isObject(data)) {
                    /**
                     * 如果是对象
                     * 遍历对象属性。如果对象中某个属性值是数组或对象，继续递归调用。
                     */
                        // 遍历对象的属性
                    $.each(data, function (key, val) {
                        // 拼凑请求paramName,作为父名称传给递归调用.才能实现扁平化.
                        var paramName = key;
                        if (gaeaValid.isNotNull(parentFieldName)) {
                            paramName = parentFieldName + "." + key;
                        }
                        if (_.isArray(val)) {
                            $.each(val, function (idx2, val2) {
                                // 拼凑请求paramName,作为父名称传给递归调用.才能实现扁平化.
                                var paramName2 = paramName + "[" + idx2 + "]";
                                // 递归调用
                                var newData = utils.data.flattenData(val2, opts, paramName2);
                                // 把转换过的值覆盖到现在结果中。因为扁平化后，不同对象中同名的属性，应该变成不同属性名了。
                                result = _.extend(result, newData);
                            });
                        } else if (_.isObject(val)) {
                            // 递归调用
                            var newData = utils.data.flattenData(this, opts, paramName);
                            // 把转换过的值覆盖到现在结果中。因为扁平化后，不同对象中同名的属性，应该变成不同属性名了。
                            result = _.extend(result, newData);
                        } else {
                            result[paramName] = val;
                            /**
                             * 如果有一个"value=123"这样的键值对，则认为可能这就是父对象属性的原本的值（即用了数据集，虽然不严谨但不重要了）。就加一个直接和父对象属性的值。
                             * 举例
                             * 对于 { level: { value:1, text:一级, ... } }
                             * 由于有value，最后应该转换成：
                             * { level:1, level.value:1, level.text:一级 ... }
                             */
                            if (gaeaString.equalsIgnoreCase(key, GAEA_UI_DEFINE.GAEA_DATA.DS.DEFAULT_VALUE_NAME) && gaeaValid.isNotNull(parentFieldName) && gaeaValid.isNull(result[parentFieldName])) {
                                result[parentFieldName] = val;
                            }
                        }
                    });
                } else {
                    /**
                     * 如果只是普通的值，简单赋值后返回
                     * 例如：medal : ["金牌","银牌","铜牌"]
                     */
                    if (gaeaValid.isNull(parentFieldName)) {
                        result = data;
                    } else {
                        result[parentFieldName] = data;
                    }
                }
                return result;
            },
            /**
             * 数据填充工具类。把一个对象的值，按gaea框架命名方式，填充到页面。
             * <p>
             *     举例:
             *     一个user对象: {user: { id: 1, name: 'Jack', roles: [{ id: 10, name: 'admin'}, {id: 11, name: 'CUSTOMER'}, address:{code: '10001', address:'GuangZhou' } ] }}
             * </p>
             * <p>
             *     在填充过程中，会对select进行识别。如果是select[multiple]，则对于数组，可以直接填充，不需要进一步遍历，在逐个填充。
             *     （那样可能也填充不到正确的，因为进一步就会按arr[0]...的方式去找目标填充）
             * </p>
             * <p>
             *     暂时支持select, input, textarea这几类输入。<br/>
             *     不支持grid。这个需要组件另外处理。
             * </p>
             * @param {object} opts
             * @param {string} opts.id                      作废了！要填充入的容器（例如div）id
             * @param {string} opts.target                  要填充入的容器（例如div）id
             * @param {string} [opts.name]                  父级的前缀。是一串按父级名字拼凑而成的。
             * @param {string} [opts.isTriggerEvent=true]   是否触发填充时的事件。例如：填充下拉框触发change。
             * @param {object} opts.data                    要填充的数据
             */
            fillData: function (opts) {
                var gaeaEvents = require("gaeajs-ui-events");
                if (gaeaValid.isNull(opts) || gaeaValid.isNull(opts.target)) {
                    throw "缺少要填充数据的目标容器target定义！";
                }
                if (gaeaValid.isNull(opts.name)) {
                    opts.name = "";
                }
                // 默认值
                _.defaults(opts, {
                    isTriggerEvent: true
                });
                var SEPERATOR = ".";
                // 一个html dom元素的name比较、检索器
                var jqIgnoreCaseFilter = function (argName) {
                    return function () {
                        var name = argName; // 要搜索的name
                        var $this = $(this);
                        var gaeaName = $this.data("gaea-ui-name"); // 某些gaea组件，会用这个作为name
                        return gaeaString.equalsIgnoreCase(name, $this.attr("name")) || gaeaString.equalsIgnoreCase(name, gaeaName);
                    };
                };
                // array必须在前，因为_.isObject会把array也当object的
                if (_.isArray(opts.data)) {
                    // empty, continue
                    if (_.isEmpty(opts.data)) {
                        return;
                    }
                    /**
                     * it's array
                     */
                    var $filterResult = $(opts.target).find("select").filter(jqIgnoreCaseFilter(opts.name)); // find by name
                    var $cbxFilter = $(opts.target).find("[type='checkbox']").filter(jqIgnoreCaseFilter(opts.name));
                    // 普通的值+是select、checkbox的，就直接填充
                    // 否则递归
                    if (utils.array.isGenericValue(opts.data) && $filterResult.length > 0) {
                        // 目标对象是select，可以批量填充。不再需要遍历了。
                        $filterResult.val(opts.data);
                    } else if (utils.array.isGenericValue(opts.data) && $cbxFilter.length > 0) {
                        $cbxFilter.each(function () {
                            var $this = $(this);
                            $.each(opts.data, function (i, value) {
                                if (gaeaString.equalsIgnoreCase(value, $this.val())) {
                                    $this.prop("checked", true);
                                    // 如果需要触发，才触发
                                    if (opts.isTriggerEvent) {
                                        $this.trigger("change");
                                    }
                                }
                            });
                        });
                    } else {
                        // 目标不是select，或者数组里面的是对象等其他复杂数据
                        $.each(opts.data, function (i, iObj) {
                            // 复制一个新的，否则会覆盖原来的某些值
                            var newOpts = _.clone(opts);
                            newOpts = _.extend(newOpts, opts);
                            // 遍历array每一个值，并递归
                            // 数组名称，roles[0], roles[1]...
                            newOpts.name = gaeaString.builder.simpleBuild("%s[%s]", opts.name, i);
                            newOpts.data = iObj;
                            // 递归调用
                            utils.data.fillData(newOpts);
                        });
                    }
                } else if (_.isObject(opts.data)) {
                    /**
                     * it's object
                     */
                    $.each(opts.data, function (key, val) {
                        // 复制一个新的，否则会覆盖原来的某些值
                        var newOpts = _.clone(opts);
                        newOpts = _.extend(newOpts, opts);
                        // set new parent name
                        // 例如：user.address | user.roles
                        newOpts.name = gaeaValid.isNull(opts.name) ? key : opts.name + SEPERATOR + key;
                        newOpts.data = val;
                        // 递归调用
                        utils.data.fillData(newOpts);
                    });
                } else {
                    var gaeaUI = require("gaeajs-ui-commons");
                    /**
                     * it's value
                     * 目标可能有几种
                     * <ul>
                     *     <li>普通input, select之类的，可以直接把值set到value</li>
                     *     <li>radio，不能set value的。而且还有gaea特定样式的radio</li>
                     *     <li>图片类img。必须把url转换成img。</li>
                     * </ul>
                     */
                    //var findTemplate = _.template("[name='<%=NAME%>']");
                    //var jqSelector = findTemplate({
                    //    NAME: opts.name
                    //});
                    var $filterResult = $(opts.target).find("input,select,textarea").filter(jqIgnoreCaseFilter(opts.name));
                    // radio的选择器
                    var $radioFilter = $filterResult.filter("[type='radio']");
                    // gaea img的选择器
                    var $gaeaImgFilter = $(opts.target).find("[data-" + GAEA_UI_DEFINE.UI.IMG_DEFINE + "]").filter(jqIgnoreCaseFilter(opts.name));
                    // gaea selectTree的选择器
                    var $selectTreeFilter = $(opts.target).find("[data-" + GAEA_UI_DEFINE.UI.SELECT_TREE_DEFINE + "]").filter(jqIgnoreCaseFilter(opts.name));
                    // 设定值
                    if ($radioFilter.length > 0) {
                        $radioFilter.filter("[value='" + opts.data + "']").prop("checked", true);
                        // 如果需要触发，才触发
                        if (opts.isTriggerEvent) {
                            $radioFilter.filter("[value='" + opts.data + "']").trigger("change");
                        }
                    } else if ($gaeaImgFilter.length > 0) {
                        // 填充表单里面的图片字段
                        var optsStr = $gaeaImgFilter.data(GAEA_UI_DEFINE.UI.IMG_DEFINE); // = data-gaea-ui-img
                        var imgOpts = gaeaString.parseJSON(optsStr);
                        imgOpts.value = opts.data;
                        gaeaUI.img.init($gaeaImgFilter, imgOpts);
                    } else if ($selectTreeFilter.length > 0) {
                        // 填充select-tree组件的值
                        var gaeaSelectTree = require("gaeajs-ui-selectTree");
                        // 写入值，并触发“fill_data_complete”事件。
                        gaeaSelectTree.setValue($selectTreeFilter.first(), opts.data, gaeaEvents.DEFINE.UI.FILL_DATA_COMPLETE);
                    } else {
                        if ($filterResult.length > 0) {
                            // 普通输入框，直接用val方法设置
                            $filterResult.val(opts.data);
                            // 下拉框
                            // 如果需要触发，才触发
                            if ($filterResult.is("select")) {
                                if (opts.isTriggerEvent) {
                                    $filterResult.change();
                                }
                            }
                            // 写入值，并触发“fill_data_complete”事件。
                            $filterResult.trigger(gaeaEvents.DEFINE.UI.FILL_DATA_COMPLETE);
                        }
                    }
                }
            },
            /**
             * 提供对某数据数组，以传入的条件进行过滤，并返回过滤后的结果集。并且在每个结果集单个元素中，植入原数组的位置（origIndex）。
             * 这个基本上，就等同于crud-grid的查询功能。
             * @param {object} opts
             * @param {object[]} opts.data
             * @param {QueryCondition[]} opts.conditions
             */
            filterData: function (opts) {
                var filterData = [];
                if (gaeaValid.isNull(opts) || gaeaValid.isNull(opts.data)) {
                    throw "data为空，filterData无法执行数据过滤。";
                }
                if (gaeaValid.isNull(opts.conditions)) {
                    return opts.data;
                }
                if (_.isArray(opts.data)) {
                    if (!_.isArray(opts.conditions)) {
                        opts.conditions = [opts.conditions];
                    }
                    // 遍历条件，这样比较少点
                    $.each(opts.conditions, function (i, cond) {

                        // 遍历数据，并过滤
                        $.each(opts.data, function (j, dataItem) {
                            if (gaeaValid.isNull(cond.propName) || gaeaValid.isNull(cond.op)) {
                                console.debug("filterData里的条件格式不完整。%s", JSON.stringify(cond));
                                return;
                            }
                            // 只有"是否空"检查，才允许条件的propValue为空。否则跳过。
                            if (gaeaValid.isNull(cond.propValue) && !gaeaString.equalsIgnoreCase(GAEA_UI_DEFINE.QUERY.OP.NNA, cond.op) && !gaeaString.equalsIgnoreCase(GAEA_UI_DEFINE.QUERY.OP.NA, cond.op)) {
                                console.debug("filterData里的条件格式不完整。%s", JSON.stringify(cond));
                                return;
                            }
                            // 要比较的值
                            var value = dataItem[cond.propName];
                            // 根据关系比较符，进行比较匹配
                            if (gaeaString.equalsIgnoreCase(GAEA_UI_DEFINE.QUERY.OP.EQ, cond.op)) {
                                // 等于
                                // 大小写敏感
                                if (_.isEqual(value, cond.propValue)) {
                                    // 设定在原数组的位置，这个对grid会有用
                                    dataItem.origIndex = j;
                                    filterData.push(dataItem);
                                    return;
                                }
                            } else if (gaeaString.equalsIgnoreCase(GAEA_UI_DEFINE.QUERY.OP.GE, cond.op)) {
                                // 大于等于
                                if (_.isNumber(value) && _.isNumber(cond.propValue)) {
                                    if (value >= cond.propValue) {
                                        // 设定在原数组的位置，这个对grid会有用
                                        dataItem.origIndex = j;
                                        filterData.push(dataItem);
                                        return;
                                    }
                                } else {
                                    console.debug("filterData比较大小对象不为数值，无法比较。");
                                }
                            } else if (gaeaString.equalsIgnoreCase(GAEA_UI_DEFINE.QUERY.OP.GT, cond.op)) {
                                // 大于
                                if (_.isNumber(value) && _.isNumber(cond.propValue)) {
                                    if (value > cond.propValue) {
                                        // 设定在原数组的位置，这个对grid会有用
                                        dataItem.origIndex = j;
                                        filterData.push(dataItem);
                                        return;
                                    }
                                } else {
                                    console.debug("filterData比较大小对象不为数值，无法比较。");
                                }
                            } else if (gaeaString.equalsIgnoreCase(GAEA_UI_DEFINE.QUERY.OP.LE, cond.op)) {
                                // 小于等于
                                if (_.isNumber(value) && _.isNumber(cond.propValue)) {
                                    if (value <= cond.propValue) {
                                        // 设定在原数组的位置，这个对grid会有用
                                        dataItem.origIndex = j;
                                        filterData.push(dataItem);
                                        return;
                                    }
                                } else {
                                    console.debug("filterData比较大小对象不为数值，无法比较。");
                                }
                            } else if (gaeaString.equalsIgnoreCase(GAEA_UI_DEFINE.QUERY.OP.LT, cond.op)) {
                                // 小于
                                if (_.isNumber(value) && _.isNumber(cond.propValue)) {
                                    if (value < cond.propValue) {
                                        // 设定在原数组的位置，这个对grid会有用
                                        dataItem.origIndex = j;
                                        filterData.push(dataItem);
                                        return;
                                    }
                                } else {
                                    console.debug("filterData比较大小对象不为数值，无法比较。");
                                }
                            } else if (gaeaString.equalsIgnoreCase(GAEA_UI_DEFINE.QUERY.OP.LK, cond.op)) {
                                // Like
                                if (gaeaString.containIgnoreCase(value, cond.propValue)) {
                                    // 设定在原数组的位置，这个对grid会有用
                                    dataItem.origIndex = j;
                                    filterData.push(dataItem);
                                    return;
                                }
                            } else if (gaeaString.equalsIgnoreCase(GAEA_UI_DEFINE.QUERY.OP.NE, cond.op)) {
                                // 不等于
                                if (!_.isEqual(value, cond.propValue)) {
                                    // 设定在原数组的位置，这个对grid会有用
                                    dataItem.origIndex = j;
                                    filterData.push(dataItem);
                                    return;
                                }
                            } else if (gaeaString.equalsIgnoreCase(GAEA_UI_DEFINE.QUERY.OP.NA, cond.op)) {
                                // is Null
                                if (gaeaValid.isNull(value)) {
                                    // 设定在原数组的位置，这个对grid会有用
                                    dataItem.origIndex = j;
                                    filterData.push(dataItem);
                                    return;
                                }
                            } else if (gaeaString.equalsIgnoreCase(GAEA_UI_DEFINE.QUERY.OP.NNA, cond.op)) {
                                // is Not null
                                if (gaeaValid.isNotNull(value)) {
                                    // 设定在原数组的位置，这个对grid会有用
                                    dataItem.origIndex = j;
                                    filterData.push(dataItem);
                                    return;
                                }
                            }
                        });
                        // 每过滤一次条件，就只留过滤下的数据
                        opts.data = filterData;
                        // 清空过滤后的数据
                        filterData = [];

                    });
                }
                return opts.data;
            }
        };

        // 和HTML相关的DOM的操作
        utils.dom = {
            /**
             * 检查某id在整个页面是否唯一。
             * 无法用JQuery检查，因为对于一些ajax加载的内容页，会检查不出来。所以还是使用原生的js语法检查。
             * @param id
             * @returns {boolean}
             */
            checkUnique: function (id) {
                if (gaeaValid.isNull(id)) {
                    throw "id为空，无法进行元素的唯一性检查！";
                }
                return document.querySelectorAll("#" + id).length == 1;
            }
        };

        /**
         * 业务相关的处理, 服务端的返回处理
         * <p>
         *     没有返回，当前来说也是成功的一种。具体用default还是success，就看传入，default优先.
         * </p>
         * @param {object} responseObj          ajax请求后的错误返回json对象。
         * @param {object} [opts]
         * @param {object} opts.fail                失败的相关处理配置
         * @param {object} opts.fail.baseMsg        错误的基本信息。叠在服务端返回错误的前面。
         * @param {object} opts.success             成功的相关处理配置
         * @param {object} opts.success.baseMsg     成功的基本信息。叠在服务端返回成功的前面。
         * @param {object} opts.default             如果responseObj为空，就用这个
         * @param {object} opts.default.baseMsg
         * @param {boolean} opts.onlyFail=false     默认只处理失败的
         */
        utils.processResponse = function (responseObj, opts) {
            _.defaults(opts, {
                onlyFail: false
            });
            // 返回对象转换
            //var respObj = {};
            if (gaeaValid.isNotNull(responseObj) && gaeaValid.isNotNull(responseObj.responseText)) {
                responseObj = JSON.parse(responseObj.responseText);
            }
            // 处理返回消息
            if (_.isObject(responseObj)) {
                var baseMsg = "";
                if (gaeaValid.isNotNullMultiple(opts, ["fail", "baseMsg"])) {
                    baseMsg = opts.fail.baseMsg;
                }
                if (gaeaString.equalsIgnoreCase(responseObj.status, "600")) {
                    // 普通错误/验证警告
                    gaeaNotify.fail(gaeaString.builder.simpleBuild("%s %s", baseMsg, responseObj.message));
                } else if (gaeaString.equalsIgnoreCase(responseObj.status, "500")) {
                    // 非普通的异常
                    gaeaNotify.error(gaeaString.builder.simpleBuild("%s %s", baseMsg, responseObj.message));
                } else if (gaeaString.equalsIgnoreCase(responseObj.status, "270")) {
                    if (!opts.onlyFail) {
                        // 正常返回，有信息需要显示，并且不自动消失。
                        gaeaNotify.message(gaeaString.builder.simpleBuild("%s %s", baseMsg, responseObj.message), true);
                    }
                } else if (gaeaString.equalsIgnoreCase(responseObj.status, "200")) {
                    if (!opts.onlyFail) {
                        // 成功
                        gaeaNotify.success(gaeaString.builder.simpleBuild("%s %s", baseMsg, responseObj.message));
                    }
                } else {
                    /**
                     * 不可识别的状态码, 或者返回的对象不完整（没有状态码）等
                     */
                    if (gaeaValid.isNotNull(responseObj.message)) {
                        gaeaNotify.message(responseObj.message);
                    } else if (gaeaValid.isNotNull(opts.default)) {
                        gaeaNotify.message(opts.default.baseMsg);
                    } else if (gaeaValid.isNotNull(opts.success)) {
                        gaeaNotify.success(opts.success.baseMsg);
                    }
                }
            } else {
                /**
                 * 返回非json对象。需要特殊处理。
                 * - 没有返回，当前来说也是成功的一种。具体用default还是success，就看传入，default优先
                 */
                if (gaeaValid.isNotNull(opts.default)) {
                    gaeaNotify.message(opts.default.baseMsg);
                } else if (gaeaValid.isNotNull(opts.success)) {
                    gaeaNotify.success(opts.success.baseMsg);
                }
            }
        };

        /**
         * 返回接口定义。
         */
        return utils;
    });