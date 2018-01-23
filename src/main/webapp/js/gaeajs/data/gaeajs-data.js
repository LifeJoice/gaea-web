/**
 * Created by iverson on 2016/2/14.
 * 今天起，开始重构UR创建的一套前端js框架。重新以gaea命名。另外基于RequireJS的模块化。
 *
 * 2016-6-1 16:50:02
 * input，在代码注释中是个代表关键字，首先代表一个DOM元素，其实是一个输入元素（包括TEXTAREA等）。
 * 因为注释方便描述。
 *
 * DEPENDENCE:
 * RequireJS,JQuery
 */
define([
        "jquery", "underscore", 'underscore-string', "knockoutJS", 'gaeajs-common-utils-validate', 'gaeajs-common-utils-string', "gaeajs-common-utils-ajax",
        "gaea-system-url", 'gaeajs-ui-notify', 'gaeajs-ui-definition', 'gaeajs-ui-grid',
        "gaeajs-ui-events", "gaeajs-ui-definition", "gaeajs-common-utils", "gaeajs-context"],
    function ($, _, _s, ko, gaeaValid, gaeaString, gaeaAjax,
              SYS_URL, gaeaNotify, GAEA_UI_DEFINE, gaeaGrid,
              GAEA_EVENTS, gaeaUI, gaeaUtils, gaeaContext) {
        /**
         * 当前页面的缓存，主要数据集依赖使用。
         */
        //var PAGE_CONTEXT = {};

        var opt = {
            /**
             * 对应的数据源(结果集名称)
             */
            dataset: null,
            /**
             * 数据集绑定的前缀，针对input（等）name的前缀（例如：user.name,bindPrefix='user.')
             * 服务端返回的结果集可能是没有前缀的，例如：name。页面可能是有前缀的，例如：user.name。
             * 同时gaeaData自动建模对象，是不含前缀的。所以：
             * <input name='user.name' ...> 绑定的是user().name
             */
            bindPrefix: null,
            /**
             * 渲染数据视图类型。表示把数据渲染到怎样的UI中。
             * 例如：一个div，指定了dataView=table-grid，则会在div中创建一个table展示数据。
             * select(保留) | table | grid(非table构成的表格)
             */
            component: null,
            /**
             * 字段名。
             * 即当前整个view的数据的名（当前只针对 component=grid 有效）。例如：
             * 列表有3条用户数据，name=users，则最后请求应该类似：
             * {..., users : [ { id:1,username:ABC }, {id:2,username:DEF} ] ,...}
             */
            name: null,
            isbindGaeaUI: false,
            _viewModel: {}
        };

        /**
         * 一些通用的定义
         */
        var DEFINE = {
            CONDITION: {
                TYPE: {
                    STATIC: "static",
                    PAGE_CONTEXT: "pageContext",
                    DEPEND_TRIGGER: "dependTrigger"
                }
            }
        };

        var templates = {
            dataBind: {
                SIMPLE: "value: <%= bindObject %>().<%= elementName %>",
                TEXT: "text: <%=TEXT_VALUE %>",
                VALUE: "value: <%=VALUE %>",
                FOR_EACH: "foreach:<%=LOOP_PARAM %>"
            },
            HTML: {
                TR: "<TR></TR>",
                TD: "<TD></TD>",
                TD_WITH_DATABIND: "<TD data-bind='<%=DATA_BIND %>'></TD>",
                TD_WITH_INPUT: '<TD><input id="<%=ID %>" name="<%=NAME %>" data-bind="<%=DATA_BIND %>"></TD>',
                /**
                 * 下面这个信息量很大:
                 * 1. td的class,不可省略.
                 * 2. < i >是图标.对应的class也不可以省略.关系到图标样式,和图标大小.
                 * 3. < i >里面的span是背景效果.对应的class也不可省略.
                 */
                SPAN_REMOVE_BUTTON: '<td class="gaea-icon-set"><i class="iconfont icon-remove gaea-icon gaea-button-size m" data-bind="<%=DATA_BIND %>"><span id="delete" class="gaea-button-bg"></span></i></td>',
                INPUT_WITH_DATABIND: '<input id="<%=ID %>" name="<%=NAME %>" data-bind="<%=DATA_BIND %>">'
            }
        };

        var defaultOpts = {
            CONDITION_VALUE: {
                type: "pageContext"
            }
        };

        var gaeaData = {
            /**
             * ko binding的唯一对象（暂时）
             */
            viewModel: {},
            /**
             * 初始化数据相关的（数据集，MVVM等）
             * 扫描dialog里面的元素，看有没有配置数据集之类的，如果有，每个数据集再发出ajax请求数据集请求，加载数据集。
             *
             * @param divId
             * @param afterBindingCallback 在绑定后在调用（一般绑定是本方法的最后一步了）
             */
            scanAndInit: function (divId, afterBindingCallback, data) {
                var root = this;
                var $formDiv = $("#" + divId);
                /* 遍历所有配置了data-gaea-data的元素 */
                gaeaData.dataSet.scanAndInit(divId);
            },
            /**
             * 解除绑定。
             * @param divId
             */
            unbind: function (divId) {
                var $formDiv = $("#" + divId);
                ko.cleanNode($formDiv[0]);
                var isBind = $formDiv.data("gaea-data-isbind");
                if (gaeaValid.isNotNull(isBind)) {
                    $formDiv.data("gaea-data-isbind", false);
                }
            },
            select: {
                /**
                 * 初始化下拉列表的KO 的模型对象，并且初始化该下拉列表的数据
                 *
                 * @param {object} options
                 * @param {string} options.bindContainerId      搜索的整个binding区域（一般是某个div）的id. 例如：某个dataset的父容器。这个主要标识整个页面的viewModel。
                 * @param {string} options.bindSelectId         一般就是下拉框的id
                 * @param {string} options.dataset              数据集id
                 * @param {object} options.data                 要填充的数据
                 * @returns {{}}
                 */
                initModelAndData: function (options) {
                    var viewModel = {};
                    var data = options.data;

                    // 首先建立数据集的对象模型
                    viewModel = gaeaData.select.initModel(options);
                    // 设入数据（多清空一次没事）
                    gaeaData.select.resetData(options);
                    // 创建动态计算对象
                    gaeaData.ko.createComputeObj(options);
                    //var firstData = _.first(data);
                    // 把下拉列表和页面的input等元素做data-bind
                    if (gaeaValid.isNotNull(data)) {
                        var dataSample = null;// 从data里拿一个作定义对象。主要获取有哪些属性。
                        if (Array.isArray(data)) {
                            dataSample = data[0];
                        } else if (_.isArray(data)) {
                            dataSample = data;
                        }
                        var bindObjName = gaeaData.select.getBindObjName(options.bindSelectId, options.dataset);
                        gaeaData._bindHtmlField(options, dataSample, bindObjName);
                    }
                    return viewModel;
                },
                /**
                 * 数据集建模。主要是生成ko.binding需要的属性设置等，未binding！（在别的地方执行binding）
                 * 主要是利用ko的方式, 做< select >的data-bind.
                 * <p>( < select options:<%= selectOptionsName %>,optionsText:'text',optionsValue:'value',value:<%= selectedVarName %> ... )</p>
                 * 同时,创建一个隐藏的中间变量,存储选中的值. ( 如果其它组件要和选中的对象交互, 需要这个中间变量去找出对应的对象. )
                 * <p/>
                 * 以前通过中间变量找对应的对象的, 现在这部分代码移到gaeaData.ko.createComputeObj去.
                 * @param {object} options
                 * @param {string} options.dataset
                 * @param {string} options.bindSelectId
                 * @param {string} options.bindFieldContainerId
                 * @param {string} options.bindContainerId
                 */
                initModel: function (options) {
                    var root = this;
                    var vm = {};
                    var dataSetId = options.dataset;
                    // 对HTML id做合法性处理，否则jQuery选择器会失效，特别包含一些特殊字符的（例如：.）
                    var selectId = gaeaString.format.getValidName(options.bindSelectId);
                    var $select = $("#" + selectId);
                    var bindContainerId = options.bindContainerId;
                    // 重复绑定会导致刷新数据失效
                    if (gaeaData.isBinded($select)) {
                        return;
                    }
                    //var $formDiv = $("#" + options.bindFieldContainerId);
                    //var bindPrefix = options.bindPrefix;
                    var data = new Array();
                    /**
                     * 把数据集的名称，转换为驼峰命名的变量名，
                     * 然后作为当前这个下拉框的所有ko binding的一个标志（例如，参与到所有的自动生成变量的命名中）
                     * idPrefix = userList_dsUserDataSet (下拉框id+_+数据集名称)
                     */
                    //var idPrefix = gaeaData.utils.getIdPrefix(options.bindSelectId, options.dataset);
                    // 定义一个ViewModel
                    //var selectOptions = idPrefix + "_options";
                    var selectOptions = gaeaData.select.getOptionsName(options.bindSelectId, options.dataset);
                    //var selected = idPrefix + "_selected";
                    var selected = gaeaData.select.getSelectedName(options.bindSelectId, options.dataset);
                    vm[selectOptions] = ko.observableArray(data);// 可以用一个空的数组初始化
                    vm[selected] = ko.observable();// 这个就是中间变量
                    // 初始化
                    // 下拉框的data-bind模板
                    var selectBindingTemplate = _.template("options:<%= selectOptionsName %>,optionsText:'text',optionsValue:'value',value:<%= selectedVarName %>");
                    // 应用模板
                    $select.attr("data-bind", selectBindingTemplate({
                        selectOptionsName: selectOptions,
                        selectedVarName: selected
                    }));

                    // debug
                    //gaeaData.utils.debug.checkViewId({
                    //    viewModelName: bindContainerId,
                    //    optionName:selectOptions
                    //});
                    // 把viewModel缓存
                    gaeaData.dataSet.setViewModel(bindContainerId, vm);
                },
                /**
                 * 重置数据。主要是得利用ko的原生方法去清空和推数据，否则整个页面的binding会有错。
                 * 1. 清空原有数据
                 * 2. push新的数据
                 * @param options
                 *              bindSelectId 用于生成变量名,找到对应的viewModel中的属性
                 *              dataset 用于生成变量名,找到对应的viewModel中的属性
                 *              data 要推入的数据
                 *              bindContainerId 当前元素所在的大的绑定容器(data-gaea-data-bind-area) id （因为ko binding不可能只绑定一个下拉框的数据，一般是一个表单）
                 */
                resetData: function (options) {
                    if (gaeaValid.isNull(options.bindSelectId) || gaeaValid.isNull(options.dataset) || gaeaValid.isNull(options.bindContainerId)) {
                        throw "绑定下拉框id|数据集名|(data-gaea-data-bind-area)id 为空，无法进行数据刷新（reset）！";
                    }
                    var data = options.data;
                    var bindContainerId = options.bindContainerId;
                    var selectOptions = gaeaData.select.getOptionsName(options.bindSelectId, options.dataset);
                    // 使用KO的原生方法先把原有数组清空！
                    gaeaData.ko.removeAll(gaeaData.viewModel[bindContainerId][selectOptions]);
                    if (gaeaValid.isNotNull(data)) {
                        gaeaData.ko.addAll(gaeaData.viewModel[bindContainerId][selectOptions], data);
                    }
                },
                /**
                 * 重置数据。主要是得利用ko的原生方法去清空和推数据，否则整个页面的binding会有错。
                 * 1. 清空原有数据
                 * 2. push新的数据
                 * @param options
                 *              bindSelectId 用于生成变量名,找到对应的viewModel中的属性
                 *              dataset 用于生成变量名,找到对应的viewModel中的属性
                 *              data 要推入的数据
                 *              bindContainerId 当前元素所在的大的绑定容器(data-gaea-data-bind-area) id （因为ko binding不可能只绑定一个下拉框的数据，一般是一个表单）
                 */
                removeAllData: function (options) {
                    if (gaeaValid.isNull(options.bindSelectId) || gaeaValid.isNull(options.dataset)) {
                        throw "绑定下拉框id 或 数据集名 为空，无法进行数据刷新（reset）！";
                    }
                    var selectOptions = gaeaData.select.getOptionsName(options.bindSelectId, options.dataset);
                    var bindContainerId = options.bindContainerId;
                    // 使用KO的原生方法先把原有数组清空！
                    gaeaData.ko.removeAll(gaeaData.viewModel[bindContainerId][selectOptions]);
                },
                /**
                 * 组装data-bind的对象名.
                 * @param bindSelectId
                 * @param dataSetId
                 * @returns {string}
                 */
                getBindObjName: function (bindSelectId, dataSetId) {
                    var prefix = gaeaData.utils.getIdPrefix(bindSelectId, dataSetId);
                    var objName = prefix + "_Obj";
                    return objName;
                },
                /**
                 * 获取data-bind : value对应的ko viewModel的name。选中时的中间变量的名称。
                 * @param bindSelectId
                 * @param dataSetId
                 * @returns {string}
                 */
                getSelectedName: function (bindSelectId, dataSetId) {
                    var prefix = gaeaData.utils.getIdPrefix(bindSelectId, dataSetId);
                    var selectedName = prefix + "_selected";
                    return selectedName;
                },
                /**
                 * 获取data-bind : options对应的ko viewModel的name。用于下拉框KO数据集绑定。
                 * @param bindSelectId
                 * @param dataSetId
                 * @returns {string}
                 */
                getOptionsName: function (bindSelectId, dataSetId) {
                    var prefix = gaeaData.utils.getIdPrefix(bindSelectId, dataSetId);
                    var selectedName = prefix + "_options";
                    return selectedName;
                },
                /**
                 * 更新select的数据。主要涉及KO框架，需要专用方法调用。
                 * @param {object} opt
                 * @param {string} opt.bindSelectId 用于生成变量名,找到对应的viewModel中的属性
                 * @param {string} opt.dataset 用于生成变量名,找到对应的viewModel中的属性
                 * @param {object} opt.data 要推入的数据
                 * @param {string} opt.bindContainerId 当前元素所在的大的绑定容器(data-gaea-data-bind-area) id （因为ko binding不可能只绑定一个下拉框的数据，一般是一个表单）
                 * @param {string} [opt.bindAsObject]   bindAsObject暂时未启用和测试。预留。
                 * @param {object} data
                 */
                setData: function (opt, data) {
                    if (gaeaValid.isNotNull(data)) {
                        opt.data = data;
                        gaeaData.select.resetData(opt);
                        // 把当前数据集作对象绑定。把数据集其他字段和页面同名字段绑定。
                        // bindAsObject暂时未启用和测试。预留。
                        if (gaeaValid.isNotNull(opt.bindAsObject) && opt.bindAsObject) {
                            gaeaData.ko.createComputeObj(opt);
                        }
                    } else {
                        gaeaData.select.removeAllData(opt);
                    }
                },
                /**
                 * 级联依赖的select的初始化（数据部分）
                 * @param {object} opts
                 * @param {string} opts.id
                 * @param {string} opts.successCallback
                 */
                dpSelect: {
                    /**
                     * 触发下拉框的数据刷新。
                     * @param target
                     * @param data  这个一般是event data
                     */
                    triggerReloadData: function (target, data) {
                        if (gaeaValid.isNull(target)) {
                            throw "触发级联控件的数据刷新。输入参数id不允许为空！";
                        }
                        var $target = $(target);
                        var opts = $target.data("gaeaOptions");
                        // value暂时只支持一个。类型暂时为static。
                        opts.condition.values = [{
                            type: "static",
                            value: data.value
                        }];
                        var newCondition = gaeaData.parseCondition(opts.condition);

                        // 获取数据集数据，更新组件
                        gaeaData.dataSet.getData({
                            isConditionParsed: true,// 表示condition已经解析过，不要再解析了！
                            submitData: {
                                condition: gaeaData.newQueryCondition(newCondition),
                                dsId: opts.dataset
                            },
                            isAsync: true,// 异步调用
                            success: function (data) {
                                gaeaData.select.setData(opts, data);
                            }
                        });
                    }
                }
            },
            binding: function (options, callback) {
                var divId = options.containerId;
                if (gaeaValid.isNull(divId)) {
                    throw "要gaea data binding的目标HTML元素 ID不允许为空。";
                }
                var $formDiv = $("#" + divId);
                //var bindAreaTag = $formDiv.data("gaea-data-bind-area");
                // 查找要绑定的HTML元素的id
                var bindContainerId = gaeaData.dataBind.findBindingId(divId);
                var $bindContainer = $("#" + bindContainerId);
                var root = this;
                // 应用于KnockoutJS
                if (!gaeaData.isBinded($bindContainer)) {
                    ko.applyBindings(gaeaData.viewModel[bindContainerId], $bindContainer[0]);
                    /**
                     * 在KO绑定后再调用。
                     * 场景( 编辑用户信息 )：
                     * 对于通用的更新操作，点击编辑 -> 弹框 -> 加载数据集 -> 绑定 -> afterBindingCallback( 加载编辑数据 -> 填充编辑数据 )
                     * 上面的场景，就可以在加载了数据集后，再用编辑数据覆盖数据集。否则数据集的内容就会反过来覆盖要编辑的数据。
                     */
                    if (_.isFunction(callback)) {
                        callback();
                    }
                    // 设定已经在这个元素做了ko binding
                    $bindContainer.attr("data-gaea-data-isbind", true);
                    //var $data = ko.dataFor($formDiv[0]);
                    //$data.dsIsEnabled_options.push({"text":"永远OK","value":"2"});
                    //$data.dsResourceManagement_options = ko.observableArray([{"text":"登录","description":"登录url","resource":"/login","value":"1","orderseq":"1"},{"text":"测试","description":"测试菜单","resource":"/menu/test","value":"2","orderseq":"2"}]);
                    //}else{
                    //ko.cleanNode($formDiv[0]);
                    //var $data = ko.dataFor($formDiv[0]);
                    //ko.applyBindings(options._viewModel, $formDiv[0]);
                }
                //});
            },
            /**
             * 绑定表单中的各个input（等）与数据集的联系。基于KO。
             * @param options
             *              bindFieldContainerId 要去找input来绑定的容器的id
             *              bindPrefix 绑定前缀.
             * @param jsonObj   这个用作类定义（其中的数据并无作用）。通过这个对象有什么属性，去和页面同名的属性做data-bind。
             * @param bindObjectName 给DOM加上data-bind的对象名
             * @private
             */
            _bindHtmlField: function (options, jsonObj, bindObjectName) {
                //var $select = $("#" + options.bindSelectId);
                var $formDiv = $("#" + options.bindFieldContainerId);
                var bindPrefix = options.bindPrefix;
                $formDiv.find("input,textarea").each(function (index, element) {
                    var $self = $(this);
                    var fullName = $(this).attr("name");
                    var withoutpreName = fullName;
                    var bindTemplate = _.template(templates.dataBind.SIMPLE);
                    var datakeyMapsName = true;// 名字属性和数据集的key对应
                    if (gaeaValid.isNotNull($self.attr("type"))) {
                        return;
                    }
                    // 检查<input>的name是否有前置
                    if (gaeaValid.isNotNull(bindPrefix)) {
                        // 抽取出没有前缀的属性名
                        withoutpreName = _s.ltrim(fullName, bindPrefix + ".");
                        // 检查属性名是否有前缀（区分本身没有，还是去掉了）
                        datakeyMapsName = _s.startsWith(fullName, bindPrefix + ".");
                    }
                    //console.log("element name: " + fullName + " withoutObjectPrefix : " + withoutpreName);
                    // 转换为小写。因为服务端返回的结果集的key应该都是小写。data-bind的属性不需要跟input属性名一致，重点是跟数据集key一致。
                    withoutpreName = withoutpreName.toLowerCase();
                    // 检查JSON数据中是否有该字段存在
                    var hasDataKey = _.has(jsonObj, withoutpreName);
                    //console.log("has key : " + hasDataKey);
                    // 如果数据集结果有对应的字段，而且页面表单也有对应的属性的元素（如<input>），则绑定。
                    if (hasDataKey && datakeyMapsName) {
                        /**
                         * 参考：
                         * 各字段绑定的是userId，但通过上面的value不能直接指定userId，必须通过中间变量找到对象。然后再触发下面的更新。
                         * $("#userId").attr("data-bind", "value:user().userId");
                         */
                        $self.attr("data-bind", bindTemplate({
                            bindObject: bindObjectName,
                            elementName: withoutpreName
                        }));
                    }
                });
            },
            /**
             * 是否KO已经绑定过了。如果重复绑定，KO会抛出异常。
             * 除了检查KO框架的binding，还检查gaea框架的binding（通过gaea-data-isbind属性）。
             * @returns {boolean}
             * @private
             */
            isBinded: function ($bindingDiv) {
                if (gaeaValid.isNull($bindingDiv)) {
                    return false;
                }
                // gaea自主的binding配置项
                var imBinded = $bindingDiv.data("gaea-data-isbind");
                if (gaeaValid.isNotNull(imBinded)) {
                    // 如果imBinded是boolean就直接返回，反则转换一下返回
                    return _.isBoolean(imBinded) ? imBinded : _s.toBoolean(imBinded.toLowerCase());
                }
                // 如果没有设置data-gaea-data-isbind，则用KO的API检查
                return !!ko.dataFor($bindingDiv[0]);
            },
            /**
             * 监听事件'gaeaEvent_page_context_update'，更新上下文信息。
             *
             * @param eventName
             */
            //listen: function (eventName, eventBindingDivId) {
            //    //var $bindingDiv = $("#" + eventBindingDivId);
            //    if (gaeaString.equalsIgnoreCase(eventName, GAEA_EVENTS.DEFINE.CONTEXT.PAGE.UPDATE)) {
            //        GAEA_EVENTS.registerListener(GAEA_EVENTS.DEFINE.CONTEXT.PAGE.UPDATE, "#" + eventBindingDivId, function (event, data) {
            //            PAGE_CONTEXT = _.extend(PAGE_CONTEXT, data.PAGE_CONTEXT);
            //        });
            //    }
            //},
            /**
             * 根据column的定义，拼凑一个带有各种属性的空的对象。例如：
             * { id:'', name:'', age:''}
             * 这其中的id,name,age等属性需要从column定义中获取.
             */
            createEmptyObject: function (columnsDefine) {
                var obj = {};
                $.each(columnsDefine, function (idx, column) {
                    obj[column.id] = "";
                });
                return obj;
            },
            /**
             * 外部方法。解析配置的查询条件。
             * <b>注意</b>
             * 这个方法提供有限的转换！像级联类型的还无法提供转换！
             * @param {object} configCondition 对象。格式：condition:{id:'byId',values:[{ type:'pageContext',value:'id' }]}
             * @returns {{}}
             */
            parseCondition: function (configCondition) {
                var queryCondition = {};
                //if(gaeaValid.isNotNull(configObj.condition)){
                //    var configCondition = configObj.condition;
                queryCondition.id = configCondition.id;
                if (gaeaValid.isNotNull(configCondition.values) && _.isArray(configCondition.values)) {
                    var queryValues = new Array();
                    // 遍历condition.values
                    $.each(configCondition.values, function (key, condValue) {
                        _.defaults(condValue, defaultOpts.CONDITION_VALUE); // 默认值
                        /**
                         * 如果配置项要的是当前页面上下文的值，则需要从上下文取值。而不是页面配置的静态值。
                         */
                        if (gaeaString.equalsIgnoreCase(condValue.type, "pageContext")) {
                            if (gaeaValid.isNotNull(condValue.value)) {
                                //var val = PAGE_CONTEXT[condValue.value];
                                var val = gaeaContext.getValue(condValue.value);
                                queryValues.push({
                                    type: condValue.type,
                                    value: val
                                });
                            }
                        } else if (gaeaString.equalsIgnoreCase(condValue.type, "static")) {
                            queryValues.push({
                                type: condValue.type,
                                value: condValue.value
                            });
                        }
                    });
                    queryCondition.values = queryValues;
                }

                //}
                return queryCondition;
            },
            /**
             * 创建一个新的queryCondition。如果传入参数有，以传入参数为基础裁剪。
             * 主要是，请求查询的查询对象只需要几个关键值，而queryCondition有时候会有一些init:function之类的额外无关参数。
             * @param queryCondition
             */
            newQueryCondition: function (queryCondition) {
                if (gaeaValid.isNotNull(queryCondition)) {
                    var newCondtion = {};
                    newCondtion.id = queryCondition.id;
                    newCondtion.values = new Array();
                    $.each(queryCondition.values, function () {
                        newCondtion.values.push({
                            type: this.type,
                            value: this.value
                        });
                    });
                    return newCondtion;
                }
            }
        };
        /**
         * 数据集相关的操作
         */
        gaeaData.dataSet = {
            /**
             * 扫描容器下的所有配置了数据集的组件，进行数据集的初始化。
             * <p>
             *     <b>重点</b>
             *     <ul>
             *         <li>同一个页面/容器(或者说标注data-gaea-data-bind-area=true的元素下的子元素), <b style='color: red'>应该统一只调用一次! </b>因为传入任意id都会往上找data-gaea-data-bind-area=true元素并遍历全部子元素.</li>
             *     </ul>
             * </p>
             * <p><b>
             *     【重要】
             *     每个数据集都会单独发起请求获取数据. 并在所有数据集加载完、初始化完后再返回同步对象。
             *     即全部完成后才会返回。
             * </b></p>
             * @param divId
             */
            scanAndInit: function (divId) {
                var dfd = $.Deferred();// JQuery同步对象
                //var $formDiv = $("#" + divId);
                var bindContainerId = gaeaData.dataBind.findBindingId(divId);
                var $bindingContainer = $("#" + bindContainerId);
                var dsLoadFunctions = new Array();
                /**
                 * 【重要】
                 * 本来select应该在gaeaUI初始化。然而它又依赖KO框架。所以这里的initSelect只是初始化了一些gaea组件的onChange和registerEvents而已。
                 * 而放在这里，是因为得绑定事件后，再填充数据，才能触发多级组件等的更新。
                 * TODO 长远来说，还是移到gaeaUI.initSelect。但这个涉及KO框架的重构。
                 */
                var gaeaUI = require("gaeajs-ui-commons");
                // 初始化按钮上的事件, 例如什么onComplete等。
                gaeaUI.initSelect("#" + divId);
                /**
                 * 【1】遍历所有配置了 data-gaea-data|data-gaea-ui-select2 的元素
                 * 【重要】暂时扫描下拉框select类的数据集。因为这个和KO的下拉框绑定强相关！以后DIV类的下拉数据集需要另外处理。
                 */
                $bindingContainer.find("select[data-gaea-data],select[data-gaea-ui-select2]").each(function (index, element) {
                    var $select = $(this);// 默认是下拉选择框，其实可能不是。
                    var gaeaDataDefStr = $(this).data("gaea-data");
                    // 可能是data-gaea-ui-select2
                    if (gaeaValid.isNull(gaeaDataDefStr)) {
                        gaeaDataDefStr = $(this).data("gaea-ui-select2");
                    }
                    var thisId = $select.attr("id");
                    // 把元素的gaea-data配置转成对象，并和默认配置合并。
                    var configOptions = gaeaString.parseJSON(gaeaDataDefStr);
                    var dataSetId = configOptions.dataset;
                    //var bindPrefix = configOptions.bindPrefix;
                    configOptions.id = thisId; // data-bind需要
                    configOptions.bindSelectId = thisId; // data-bind需要
                    configOptions.bindFieldContainerId = divId; // data-bind需要
                    configOptions.bindContainerId = bindContainerId; // data-bind需要
                    // cache options
                    $select.data("gaeaOptions", configOptions);

                    if (gaeaValid.isNotNull(configOptions.dataset)) {
                        //var newCondition = null;
                        /**
                         * 【解析condition】
                         * 如果配置有condition，需要先解析condition
                         */
                        if (gaeaValid.isNotNull(configOptions.condition)) {
                            var condition = configOptions.condition;
                            //var queryCondition = {};
                            //queryCondition.id = condition.id;
                            if (gaeaValid.isNotNull(condition.values) && _.isArray(condition.values)) {
                                //var queryValues = new Array();
                                /**
                                 * 【2】遍历condition中的每个value.
                                 *
                                 * 简单的value可能只是关联着值;
                                 * 复杂的value可能会关联着别的数据集之类的. 这个时候就需要用事件触发等方式实现.
                                 */
                                $.each(condition.values, function (key, condValue) {
                                    //var value = null;
                                    /**
                                     * 如果配置项要的是当前页面上下文的值，则需要从上下文取值。而不是页面配置的静态值。
                                     */
                                    if (gaeaString.equalsIgnoreCase(condValue.type, DEFINE.CONDITION.TYPE.PAGE_CONTEXT)) {
                                        //if (gaeaValid.isNotNull(condValue.value)) {
                                        //    //value = gaeaData.utils.getPageContextValue(condValue.value);
                                        //    value = gaeaContext.getValue(condValue.value);
                                        //    queryValues.push({
                                        //        type: condValue.type,
                                        //        value: value
                                        //    });
                                        //}
                                    } else if (gaeaString.equalsIgnoreCase(condValue.type, DEFINE.CONDITION.TYPE.STATIC)) {
                                        //queryValues.push({
                                        //    type: condValue.type,
                                        //    value: condValue.value
                                        //});
                                    }
                                    /**
                                     * URGENT.TODO 这个应该拆分一个类似data-gaea-ui-dp-select之类的，当做另一个组件处理！而不是遍历条件的时候发现是个新组件又初始化组件。
                                     * 重要！
                                     * -------------------->>  级联（依赖）数据集  <<--------------------
                                     */
                                    else if (gaeaString.equalsIgnoreCase(condValue.type, DEFINE.CONDITION.TYPE.DEPEND_TRIGGER)) {
                                        //
                                        //var opt = _.clone(configOptions);
                                        //opt.conditionValue = condValue;
                                        //opt.id = thisId;
                                        //
                                        ///**
                                        // * 1. 监听目标对象的完成事件
                                        // * 2. 绑定目标对象的change事件（或手动配置的事件）
                                        // * 3. 触发刷新当前这个数据集和组件（在callback函数中）
                                        // */
                                        //gaeaData.dataSet.dependTriggerDataSetInit(opt, function (data) {
                                        //
                                        //    gaeaData.select.setData(opt, data);
                                        //
                                        //    //if (gaeaValid.isNotNull(data)) {
                                        //    //    opt.data = data;
                                        //    //    gaeaData.select.resetData(opt);
                                        //    //    // 把当前数据集作对象绑定。把数据集其他字段和页面同名字段绑定。
                                        //    //    // bindAsObject暂时未启用和测试。预留。
                                        //    //    if (gaeaValid.isNotNull(opt.bindAsObject) && opt.bindAsObject) {
                                        //    //        gaeaData.ko.createComputeObj(opt);
                                        //    //    }
                                        //    //} else {
                                        //    //    gaeaData.select.removeAllData(opt);
                                        //    //}
                                        //});
                                    }
                                });
                                //queryCondition.values = queryValues;
                            }
                        }
                        // 解析完condition后，把condition的值合并，统一发起查询。
                        // 如果没有配置（或配置了initTiming :'onload'） , 一开始就加载一次数据。
                        if (gaeaValid.isNull(configOptions.initTiming) || gaeaString.equalsIgnoreCase(configOptions.initTiming, "onload")) {
                            // 把加载数据集的方法push到一个数组里面。随后一起并发加载。
                            dsLoadFunctions.push(function () {
                                return gaeaData.dataSet.getData({
                                    url: SYS_URL.DATA.DATASET.GET,
                                    //condition: newCondition,
                                    submitData: {
                                        dsId: dataSetId
                                    },
                                    isAsync: true,// 异步调用
                                    success: function (data) {
                                        if (!_.isArray(data)) {
                                            data = [data];
                                        }
                                        configOptions.data = data;
                                        /**
                                         * data bind建模，初始化数据
                                         */
                                        var viewModel = gaeaData.select.initModelAndData(configOptions);
                                        // 用查询结果，刷新数据列表

                                        // 告诉全世界，我初始化完啦！
                                        // 其他绑定到这个组件的级联数据集，就会开始初始化or刷新。
                                        //$select.trigger(GAEA_EVENTS.DEFINE.UI.INIT_COMPLETE, {
                                        //    value: $select.val()
                                        //});
                                    }
                                })
                            });
                        }
                    }
                });
                // 对同个页面多个数据集并发ajax请求，加载数据
                // 利用functionsExecutor进行并发的方法调用
                $.when(gaeaUtils.defer.functionsExecutor(dsLoadFunctions)).done(function () {
                    var resolveContext = this;
                    dfd.resolve();
                });
                return dfd.promise();
            },
            /**
             * 初始化有依赖的数据集。
             * <p>
             *     会注册两个事件：
             *     <ul>
             *         <li>gaeaUI_event_init_complete: 当父级对象数据初始化完后触发.</li>
             *     </ul>
             * </p>
             * @param {object} options
             * @param {string} options.id                       当前这个对象的DOM id
             * @param {string} options.dataset                  数据集的id
             * @param {string} options.condition.id
             * @param {string} options.conditionValue
             * @param {string} options.bindSelectId
             * @param {string} options.bindFieldContainerId
             * @param successCallback
             */
            //dependTriggerDataSetInit: function (options, successCallback) {
            //if (gaeaValid.isNull(options.id)) {
            //    throw "当前基于依赖的数据集的id（DOM ID）不允许为空！";
            //}
            //var $this = $("#" + opt.id);
            //var dataSetId = options.dataset;
            ////var queryCondition = {};
            ////queryCondition.id = options.condition.id;
            //var condValue = options.conditionValue;
            //// 看是否有内置变量，处理一下。
            ////var value = gaeaData.utils.getPageContextValue(condValue.value);
            //var value = gaeaContext.getValue(condValue.value);
            //if (gaeaValid.isNull(value)) {
            //    var domId = condValue.dependId;
            //    var triggerEvent = condValue.triggerEvent;
            //    if (gaeaValid.isNull(domId)) {
            //        throw "数据集配置有误.type是dependTrigger,要求dependId不允许为空.";
            //    }
            //    // 默认事件为onchange
            //    if (gaeaValid.isNull(triggerEvent)) {
            //        triggerEvent = "change";
            //    }
            //
            //    var $target = $("#" + domId);// 目标对象，一般是个下拉框（带数据集功能）
            //
            //    /**
            //     * 初始化select下拉框, 建模,data-bind...
            //     * 一开始就初始化，不要等到依赖的上级触发再初始化。那样会导致重复binding问题。
            //     */
            //    var viewModel = gaeaData.select.initModel(options);
            //    // Function ---------------------------------------------------->>>>
            //    // 监听事件. 当依赖的对象的值有变化的时候, 就触发重新查询结果集.
            //
            //    // 默认在依赖对象的gaeaUI_event_init_complete事件发生后，再进行自己的初始化
            //    GAEA_EVENTS.registerListener(GAEA_EVENTS.DEFINE.UI.INIT_COMPLETE, "#" + domId, function () {
            //        // 依赖的对象触发change事件（一般），则发起请求刷新当前的组件。
            //        GAEA_EVENTS.registerListener(triggerEvent, "#" + domId, function (event, data) {
            //            //var newCondition = queryCondition;
            //            //queryValues = new Array();
            //            //value = $(this).val();
            //            //if (gaeaValid.isNotNull(value)) {
            //            //    queryValues.push({
            //            //        type: condValue.type,
            //            //        value: value
            //            //    });
            //            //}
            //            //newCondition.values = queryValues;
            //
            //
            //
            //            options.condition.values[0].type="static";
            //            options.condition.values[0].value=$(this).val();
            //            var newCondition = gaeaData.parseCondition(options.condition);
            //
            //
            //
            //            gaeaData.dataSet.getData({
            //                isConditionParsed: true,// 表示condition已经解析过，不要再解析了！
            //                submitData: {
            //                    condition: gaeaData.newQueryCondition(newCondition),
            //                    dsId: dataSetId
            //                },
            //                isAsync: true,// 异步调用
            //                success: function (data) {
            //                    successCallback(data);
            //                    // 告诉全世界，我初始化完啦！
            //                    // 其他绑定到这个组件的级联数据集，就会开始初始化or刷新。
            //                    $this.trigger(GAEA_EVENTS.DEFINE.UI.INIT_COMPLETE);
            //                }
            //            });
            //        });
            //    });
            //}
            //},
            /**
             * 根据某个页面元素id，获取它的gaea-data配置，然后请求服务端，获取数据并返回。
             * @param containerId
             * @returns jqXHR
             *              gaeaData ajax返回的data放在这个属性中
             */
            getDataByDomId: function (containerId) {
                var $container = $("#" + containerId);
                var configStr = $container.data("gaea-data");
                var configObj = gaeaString.parseJSON(configStr);
                //var queryCondition = {};// 查询条件。( gaea-data: ... condition:{id:'byId',values:[{ type:'pageContext',value:'id' }]} ... )
                return gaeaData.dataSet.getData({
                    submitData: {
                        condition: configObj.condition,
                        dsId: configObj.dataset
                    }
                });
            },
            /**
             *
             * @param {object} options
             * @param {string} options.url                      请求的地址。默认是 SYS_URL.QUERY.BY_CONDITION
             * @param {object} options.submitData               需要同步提交到服务端的数据
             * @param {object} [options.submitData.condition]   例如：{id:'byId',values:[{ type:'pageContext',value:'id' }]}
             * @param {object} options.submitData.dsId          数据集id
             * @param {string} options.isConditionParsed=false  condition是否已经解析过！重复解析会有问题！
             //* @param {string} options.dataset                  数据集id
             * @param {string} options.isAsync=false            是否异步调用。默认false，即同步调用。
             * @param {string} options.success                  完成后的回调
             * @returns jqXHR
             *              gaeaData ajax返回的data放在这个属性中
             */
            getData: function (options) {
                var queryCondition = {};// 查询条件。( gaea-data: ... condition:{id:'byId',values:[{ type:'pageContext',value:'id' }]} ... )
                var isConditionParsed = gaeaValid.isNull(options.isConditionParsed) ? false : options.isConditionParsed;// 默认false
                /**
                 * 解析gaea-data配置的查询条件。
                 */
                if (!isConditionParsed && gaeaValid.isNotNull(options.submitData.condition)) {
                    queryCondition = gaeaData.parseCondition(options.submitData.condition);
                } else {
                    queryCondition = options.submitData.condition;
                }
                options.submitData.conditions = JSON.stringify(queryCondition);
                // 统一后台数据集获取接口
                options.url = SYS_URL.DATA.DATASET.GET;
                return gaeaData.getData(options);
            },
            /**
             * 获取缓存的ViewModel的某个。
             * @param viewModelName 一般就是data-gaea-data-bind-area所在的HTML id.
             * @returns {*}
             */
            getViewModel: function (viewModelName) {
                if (gaeaValid.isNull(viewModelName)) {
                    throw "无法获取页面data bind的view model对象。view model name不允许为空！";
                }
                var vm = null;
                if (gaeaValid.isNull(gaeaData.viewModel) || gaeaValid.isNull(gaeaData.viewModel[viewModelName])) {
                    vm = {};
                } else {
                    vm = gaeaData.viewModel[viewModelName];
                }
                return vm;
            },
            /**
             * 设置当前的缓存的总ViewModel的某个viewModel。如果当前有存在同名的，则针对属性同名覆盖，不同名新增。
             * @param viewModelName 一般就是bindContainerId
             * @param vm viewModel对象。如果系统缓存有其他viewModel数据，则vm的数据会覆盖同名的，新增不同名的。
             */
            setViewModel: function (viewModelName, vm) {
                var cacheViewModel = gaeaData.dataSet.getViewModel(viewModelName);
                gaeaData.viewModel[viewModelName] = _.extend(cacheViewModel, vm);
            }
        };
        gaeaData.component = {
            /**
             * 这个其实就是初始化可编辑表格。原来是基于table实现的。最新的已经整合在gaea.ui.grid里面了。这个已经作废了。
             * 原来是基于KO框架生成可编辑table，限制比较多。
             * by Iverson 2017年8月8日14:58:06
             *
             * 初始化页面的组件相关的数据。例如某div的属性：
             data-gaea-data="name:'testList',dataset:'DS_IS_ENABLED', condition:{id:'byId',values:[{ type:'refer',value:'PAGE_CONTEXT.id' }]}, initTiming :'onload'"
             data-gaea-ui="component:'table',isbindGaeaData:true"
             * 我们会根据其中的gaea-ui找到对应的gaea-data，然后初始化该UI需要的数据。
             * @param divId
             * @param options 未设计，暂无用
             * @returns deferred object.
             */
            //init: function (divId, options) {
            //    var $div = $("#" + divId);
            //    var dfd = $.Deferred();// JQuery同步对象
            //    /* 遍历所有配置了data-gaea-data的元素 */
            //    $div.find("[data-gaea-ui]").each(function (index, element) {
            //        //var $this = $(this);// 默认是下拉选择框，其实可能不是。
            //        //var uiStr = $this.data("gaea-ui");
            //        //var thisUI = gaeaString.parseJSON(uiStr);
            //        //var componentCtId = $this.attr("id");
            //
            //        /**
            //         * 把数据转换为table显示
            //         */
            //        //if (gaeaValid.isNotNull(thisUI.isbindGaeaData) && thisUI.isbindGaeaData) {
            //        //    var dataStr = $this.data("gaea-data");
            //        //    var dataConfig = gaeaString.parseJSON(dataStr);
            //        //    if (gaeaString.equalsIgnoreCase(thisUI.component, GAEA_UI_DEFINE.UI.COMPONENT.TABLE)) {
            //        //        // 获取数据
            //        //        //var dsData = gaeaData.dataSet.getData(componentCtId);
            //        //        // 初始化table
            //        //        gaeaData.component.table.init(componentCtId);
            //        //    }
            //        //}
            //    });
            //    dfd.resolve();
            //    return dfd.promise();
            //},
            /**
             * 如果有多个gaea-UI，并发ajax请求，刷新数据。
             * 例如：如果多个子表，会同时刷新数据。
             * 当全部完成后，把同步对象dfd.resolve。
             * @param divId
             * @param options
             * @returns {jqDeferred}
             */
            initData: function (divId, options) {
                var dfd = $.Deferred();// JQuery同步对象
                //var dsLoadFunctions = new Array();
                //var $div = $("#" + divId);
                /* 遍历所有配置了data-gaea-data的元素 */
                //$div.find("[data-gaea-ui]").each(function (index, element) {
                //    var $this = $(this);// 默认是下拉选择框，其实可能不是。
                //    var uiStr = $this.data("gaea-ui");
                //    var thisUI = gaeaString.parseJSON(uiStr);
                    //var componentCtId = $this.attr("id");

                    /**
                     * 把数据转换为table显示
                     */
                    //if (gaeaValid.isNotNull(thisUI.isbindGaeaData) && thisUI.isbindGaeaData) {
                        //var dataStr = $this.data("gaea-data");
                        //var dataConfig = gaeaString.parseJSON(dataStr);
                        //if (gaeaString.equalsIgnoreCase(thisUI.component, GAEA_UI_DEFINE.UI.COMPONENT.TABLE)) {
                        //    var func = function () {
                        //        $.when(gaeaData.dataSet.getDataByDomId(componentCtId)).done(function (data, textStatus, jqXHR) {
                        //            //var jqXHR = params[2]; // 从$.ajax请求返回，封装过来的jqXHR应该是第三个
                        //            //var dsData = jqXHR.gaeaData;
                        //            // 初始化table
                        //            gaeaData.component.table.initData(componentCtId, data);
                        //        });
                        //    };
                        //    dsLoadFunctions.push(func());
                        //}
                    //}
                //});
                //$.when.apply($, dsLoadFunctions).done(function () {
                    dfd.resolve();
                //});
                return dfd.promise();
            }
            /**
             * 在KO binding后再初始化。因为有些操作必须在binding后再初始化。
             * 例如：
             * table中的数据的操作，因为binding后KO才会把数据转为table的tr，所以针对数据的操作（例如：input的改名等），都需要在binding后进行。
             * @param containerId
             */
            //initAfterBinding: function (containerId) {
            //    var $container = $("#" + containerId);
            //    /* 遍历所有配置了data-gaea-data的元素 */
            //    //$container.find("[data-gaea-ui]").each(function (index, element) {
            //    //    var $this = $(this);// 默认是下拉选择框，其实可能不是。
            //    //    var uiStr = $this.data("gaea-ui");
            //    //    var thisUI = gaeaString.parseJSON(uiStr);
            //    //    var componentCtId = $this.attr("id");// 遍历到当前组件的容器id，一般是一个divId
            //    //
            //    //    /**
            //    //     * 把数据转换为table显示
            //    //     */
            //    //    var dataStr = $this.data("gaea-data");
            //    //    var dataConfig = gaeaString.parseJSON(dataStr);
            //    //    if (gaeaString.equalsIgnoreCase(thisUI.component, GAEA_UI_DEFINE.UI.COMPONENT.TABLE)) {
            //    //        if (gaeaValid.isNull(dataConfig.name)) {
            //    //            throw "gaea-ui对应的gaea-data的name属性不允许为空！";
            //    //        }
            //    //        gaeaData.component.table.initAfterBinding(componentCtId, dataConfig);
            //    //    }
            //    //});
            //}
            /**
             * 这个是和KO binding密切相关的可行编辑的table。之所以不放在ui.grid中，是因为这个重度依赖KO提供行编辑功能。
             * 而且，重点不是在列表展示。所以一些效果的会比较简单，不会有什么排序之类的。
             *
             * 涉及按钮的生成。
             * table的建模和数组的observableArray。但没有binding。
             *
             * 没用了！
             * 可编辑表格，改为用gaea.ui.grid实现！2017-5-24
             */
            //table: {
            //    init: function (containerId) {
            //        var that = this;
            //        var $this = $("#" + containerId);
            //        var $tbody = $this.find("tbody");
            //        var dataStr = $this.data("gaea-data");
            //        var dataConfig = gaeaString.parseJSON(dataStr);
            //        var name = dataConfig.name;// 整个table的变量名。data-gaea-data="name:'testList'...
            //        var $bindContainer = $this.parents("[data-gaea-data-bind-area=true]");
            //        var bindContainerId = $bindContainer.attr("id");
            //        if (gaeaValid.isNull(name)) {
            //            throw "gaea-data未配置name属性，无法进行初始化！";
            //        }
            //
            //        var toolbarDivName = name + "_toolbar";
            //        var btnAddName = name + "_btn_add";
            //        $this.append(_.template(gaeaUI.TEMPLATE.DIV.WITH_NAME)({
            //            NAME: toolbarDivName,
            //            ID: toolbarDivName,
            //            CONTENT: "" // 这里不需要用到content。设个空即可。
            //        }));
            //        // 初始化 TOOLBAR
            //        var gaeaToolbar = require("gaeajs-ui-toolbar");
            //        gaeaToolbar.create({
            //            renderTo: toolbarDivName,
            //            buttons: [{
            //                "id": btnAddName,
            //                "name": btnAddName,
            //                "htmlName": btnAddName,
            //                "htmlId": btnAddName,
            //                "htmlValue": "添加",
            //                "type": null,
            //                "href": null,
            //                "linkViewId": null,
            //                "linkComponent": null,
            //                "componentName": "button",
            //                "action": null
            //            }]
            //        });
            //
            //
            //        var array = new Array();
            //        gaeaGrid = require("gaeajs-ui-grid"); // 经常拿不到模块，为什么
            //        var tableDefine = gaeaGrid.tableGrid.getColumnDefine(containerId);
            //        // TODO 把按钮触发封装一下？
            //        $("#" + btnAddName).click(function () {
            //            // 根据定义，生成一个对象，对象各个属性为空
            //            var obj = {};
            //            /**
            //             * 根据column的定义，拼凑一个带有各种属性的空的对象。例如：
            //             * { id:'', name:'', age:''}
            //             * 这其中的id,name,age等属性需要从column定义中获取.
            //             */
            //            obj = gaeaData.createEmptyObject(tableDefine.columns);
            //            gaeaData.viewModel[bindContainerId][name].push(obj);// push后，由于KO binding了，所以table会多出一行
            //
            //            // 找到最后一行，把里面的input的name属性修改掉
            //            var trCount = $tbody.children("tr").length;
            //            var rowIdx = trCount - 1;
            //            $.each($tbody.children("tr:last").find("td input"), function (idx, val) {
            //                var nameVal = $(this).attr("name");
            //                gaeaData.component.table.resetName($(this), {
            //                    ARRAY_NAME: name,
            //                    ARRAY_INDEX: rowIdx,
            //                    NAME: nameVal
            //                });
            //            });
            //        });
            //
            //        /* 创建定义行！！这一行只是定义用（各个列的data-bind），如果结合了KO，就会把这一行隐藏，然后push的新数据，就会以这一行的模板进行添加。 */
            //
            //        // 创建第一行，并添加相关列的KO binding
            //        that.appendTrWithBinding($tbody, tableDefine.columns);
            //        // 增加行编辑的删除方法。依赖KO。
            //        that.initRemoveFunction({
            //            name: name,
            //            bindContainerId: bindContainerId
            //        });
            //        // 初始化第一行（模板行）的序号列。（本来想用来做行删除，不过后来用了KO的方法就不用了）
            //        that.firstTR.initSequence(containerId);
            //        // 初始化第一行(模板行)的按钮区,并默认添加删除按钮.
            //        that.firstTR.initRowButtons(containerId, that.getRemoveFunctionName(name));
            //        gaeaData.dataBind.bindForEach($tbody, name);
            //        //options._viewModel[name] = ko.observableArray(array);
            //        gaeaData.viewModel[bindContainerId][name] = ko.observableArray(array);
            //    },
            //    initData: function (containerId, data) {
            //        var $this = $("#" + containerId);
            //        var dataStr = $this.data("gaea-data");
            //        var dataConfig = gaeaString.parseJSON(dataStr);
            //        var name = dataConfig.name;// 整个table的变量名。data-gaea-data="name:'testList'...
            //        var $bindContainer = $this.parents("[data-gaea-data-bind-area=true]");
            //        var bindContainerId = $bindContainer.attr("id");
            //        if (gaeaValid.isNull(name)) {
            //            throw "gaea-data未配置name属性，无法进行初始化！";
            //        }
            //        /**
            //         * 填充数据
            //         */
            //        if (gaeaValid.isNotNull(data)) {
            //            if (_.isArray(data)) {
            //                $.each(data, function (key, val) {
            //                    //options._viewModel[name].push(val);
            //                    gaeaData.viewModel[bindContainerId][name].push(val);
            //                });
            //            } else {
            //                //options._viewModel[name].push(data);
            //                gaeaData.viewModel[bindContainerId][name].push(data);
            //            }
            //        }
            //    },
            //    initAfterBinding: function (containerId, gaeaDataConfig) {
            //        // 把填充的数据的name属性修改掉。按照数组的方式命名。
            //        this.resetNames(containerId, gaeaDataConfig.name);
            //    },
            //    /**
            //     * 把table中所有input的name，根据gaea-data定义的name，改掉。
            //     * 即：
            //     * table下所有input，都会加上table的gaea-data定义的name作为前缀，并转换为数组形式。
            //     * @param containerId
            //     * @param name
            //     */
            //    resetNames: function (containerId, name) {
            //        // 把填充的数据的name属性修改掉。按照数组的方式命名。
            //        var $tbody = $("#" + containerId).find("tbody");
            //        //var name = "testList";
            //        $.each($tbody.children("tr"), function (trIdx, tr) {
            //            //console.log("idx: " + trIdx);
            //            $.each($(tr).find("td input"), function (idx, val) {
            //                var nameVal = $(this).attr("name");
            //                gaeaData.component.table.resetName($(this), {
            //                    ARRAY_NAME: name,
            //                    ARRAY_INDEX: trIdx,
            //                    NAME: nameVal
            //                });
            //            });
            //        });
            //    },
            //    /**
            //     * 往给定id容器的最后，append一行。列以conlumnsDefine定义拼凑，附带data-bind。
            //     * @param $container JQuery对象。一般是tbody。
            //     */
            //    appendTrWithBinding: function ($container, columnsDefine) {
            //        //var $container = $("#"+$container);
            //        if (gaeaValid.isNull($container)) {
            //            throw "缺少目标对象，例如tbody，无法append TR.";
            //        }
            //        $container.append(templates.HTML.TR);
            //        var dataBindTemplate = _.template(templates.dataBind.VALUE);
            //        $.each(columnsDefine, function (idx, column) {
            //            //var nameVal = name + "[0]."+column.id;
            //            var nameVal = column.id;// 这只是个base name。因为这个是列表，为了和服务端配合，name还得加上前缀和下标才能注入List。
            //            //if(!column.hidden){
            //            var tdTemplate = _.template(templates.HTML.TD_WITH_INPUT);
            //            $container.children("tr").append(tdTemplate({
            //                ID: column.id,
            //                NAME: nameVal,
            //                DATA_BIND: dataBindTemplate({
            //                    VALUE: column.id
            //                })
            //            }));
            //        });
            //    },
            //    /**
            //     * 第一行（模板行）的相关方法
            //     */
            //    firstTR: {
            //        /**
            //         * 1. 给table增加一个排序列
            //         * 2. 增加最后的命令操作区。增加删除行的按钮，点击删除一行。
            //         * @param containerId
            //         * @param removeFunctionName
            //         */
            //        initRowButtons: function (containerId, removeFunctionName) {
            //            var that = this;
            //            //var $thRow = $("#"+containerId).find("thead tr");
            //            //$thRow.prepend("<th>序号</th>");
            //
            //            var $tbody = $("#" + containerId).find("tbody");
            //            //var tdTemplate = _.template(templates.HTML.TD_WITH_DATABIND);
            //            var removeButtonTemplate = _.template(templates.HTML.SPAN_REMOVE_BUTTON);
            //            // 给data-bind模板行的最前面，加一个排序列。主要是获取序号做删除。
            //            $tbody.children("tr").append(removeButtonTemplate({
            //                DATA_BIND: "click: $parent." + removeFunctionName   // 这是KO的方法。$parent 是ko的内置变量.
            //            }));
            //        },
            //        /**
            //         * 初始化序号的列
            //         * @param containerId
            //         */
            //        initSequence: function (containerId) {
            //            var $thRow = $("#" + containerId).find("thead tr");
            //            $thRow.prepend("<th>序号</th>");
            //
            //            var $tbody = $("#" + containerId).find("tbody");
            //            var tdTemplate = _.template(templates.HTML.TD_WITH_DATABIND);
            //            // 给data-bind模板行的最前面，加一个序号列。主要是获取序号做删除。
            //            $tbody.children("tr").prepend(tdTemplate({
            //                DATA_BIND: "text: $index" // $index 是KO的内部变量
            //            }));
            //        }
            //    },
            //    /**
            //     * 定义行编辑的移除行的方法名。因为可能一个编辑页有多个行编辑table,不想相互的删除行方法混淆.
            //     * 因为如果名字不作区分,都是调用 $parent.remove()
            //     * 方法命名规则:
            //     * 用该行编辑table的name + "_remove"
            //     * @param name
            //     * @returns {string}
            //     */
            //    getRemoveFunctionName: function (name) {
            //        return name + "_remove";
            //    },
            //    /**
            //     * 基于KO binding的移除一个列表的某行。列表应该是基于KO foreach生成。
            //     *
            //     * @param options
            //     *              name table数据（数组）在viewModel中的name.例如(name=user): viewModel.xx.user
            //     *              bindContainerId
            //     */
            //    initRemoveFunction: function (options) {
            //        var that = this;
            //        var name = options.name;
            //        var bindContainerId = options.bindContainerId;
            //        var removeFunctionName = that.getRemoveFunctionName(name);
            //        //options._viewModel[removeFunctionName] = function () {
            //        //    options._viewModel[name].remove(this);// 这个是利用了KO的特性。如果没有用ko binding应该是不行的。
            //        //};
            //        gaeaData.viewModel[bindContainerId][removeFunctionName] = function () {
            //            gaeaData.viewModel[bindContainerId][name].remove(this);// 这个是利用了KO的特性。如果没有用ko binding应该是不行的。
            //        };
            //    },
            //    /**
            //     * 把某对象（例如，一个input，或者div）的name属性改掉。
            //     * @param $target jquery对象。要改name属性的对象。
            //     * @param options
            //     ARRAY_NAME:name,   // 数组名
            //     ARRAY_INDEX:rowIdx, // 数组下标
            //     NAME:nameVal // 真正的名字
            //     */
            //    resetName: function ($target, options) {
            //        var nameVal = $target.attr("name");
            //        var nameTemplate = _.template("<%=ARRAY_NAME %>[<%=ARRAY_INDEX %>].<%=NAME %>");
            //        nameVal = nameTemplate(options);
            //        $target.attr("name", nameVal);
            //    }
            //}
        };
        /**
         * 把 data 填充到 divId 中的字段中去（input,textarea,select等）
         * @param divId
         * @param dataObj 一个json对象，不是数组。例如：{"id":"3","NAME":"资源管理"}
         */
        gaeaData.fieldData = {
            /**
             * 一般是用在弹出框的编辑数据的情况下。初始化弹框里的字段的数据。
             * @param {jqSelector} target 弹框的区域.
             * @param dataObj 要填充到区域中的字段的js对象
             * @returns {$.Deffered}
             */
            init: function (target, dataObj) {
                var dfd = $.Deferred();// JQuery同步对象
                if (gaeaValid.isNull(target)) {
                    console.log("divId为空，无法定位要初始化数据的位置！数据填充失败！");
                    return null;
                }
                if (gaeaValid.isNull(dataObj)) {
                    dfd.resolve();
                    return dfd.promise();
                }
                if (_.isArray(dataObj)) {
                    console.log(_.template("数据填充要求传入的数据为对象，不是数组！放弃填充当前数据：\n<%= data%>")({data: JSON.stringify(dataObj)}));
                    return;
                }
                gaeaData.fieldData._setValue(target, dataObj);
                // 这里没有ajax，顺序执行到这里就resolve了
                dfd.resolve();
                return dfd.promise();
            },
            /**
             * 遍历dataObj，把里面各个属性值，设置到某个区域（div）里面的对应输入框之类中。
             * @param target 要注入的区域id
             * @param dataObj 数据
             * @private
             */
            _setValue: function (target, dataObj) {
                // 调用工具类的填充
                gaeaUtils.data.fillData({
                    //id: divId,
                    target: target,
                    name: "",
                    data: dataObj
                });
            }
        };
        /**
         * 通过通用查询接口，查询数据。
         * @param options
         *              url 请求地址
         * @param {object} options.submitData               需要同步提交到服务端的数据
         * @param {object} [options.submitData.condition]   查询条件。格式为json字符串（非对象，切记！）
         * @param {object} options.submitData.dsId          数据集id
         * @param {boolean} options.isAsync 是否异步调用。默认false，即同步调用。
         * @param {function} options.success 完成后的回调
         * @returns jqXHR
         *              gaeaData ajax返回的data放在这个属性中
         */
        gaeaData.getData = function (options) {
            var dfd = $.Deferred();// JQuery同步对象

            var result = null;
            var isAsync = false;
            // default -> /sys/query/byCondition
            var url = gaeaValid.isNull(options.url) ? SYS_URL.QUERY.BY_CONDITION : options.url;
            //if (gaeaValid.isNotNull(options.url)) {
            //    url = options.url;
            //}
            if (gaeaValid.isNotNull(options.isAsync) && _.isBoolean(options.isAsync)) {
                isAsync = options.isAsync;
            }
            // 数据加载要求同步
            gaeaAjax.ajax({
                url: url,
                async: isAsync,
                data: options.submitData,
                success: function (data, textStatus, jqXHR) {

                    if (_.isArray(data)) {
                        if (data.length > 1) {
                            result = data;
                        } else {
                            result = data[0];
                        }
                    } else {
                        result = data;
                    }
                    /**
                     * 成功后的回调
                     */
                    if (_.isFunction(options.success)) {
                        options.success(result);
                    }

                    jqXHR.gaeaData = result;
                    // 告诉同步对象，已完成
                    dfd.resolve();
                },
                fail: function (data) {
                    gaeaUtils.processResponse(data, {
                        fail: {
                            baseMsg: gaeaString.builder.simpleBuild("加载数据集 '%s' 失败！", options.submitData.dsId)
                        },
                        onlyFail: true // 只显示错误的。成功的不显示。
                    });
                    // 告诉同步对象，失败
                    dfd.reject();
                }
            });
            //return result;
            return dfd.promise();
        };
        /**
         * 和绑定相关的通用操作
         */
        gaeaData.dataBind = {
            /**
             * 根据给定的某个元素的id，找到对应的具体binding HTML元素的id。
             * 从当前id的元素，向下找（包括当前）。找到的第一个返回。
             * @param {string} beginId                  从dom的哪个id往下找
             * @param {string} html                     如果非空，就在这堆html里面找，而不是整个页面找。
             * @returns {html id} 某包含data-gaea-data-bind-area=true的HTML元素的id
             */
            findBindingId: function (beginId, html) {
                if (gaeaValid.isNull(beginId)) {
                    throw "查找gaea data binding的起始id不允许为空！";
                }
                var $someDiv = $("#" + beginId);
                // 如果html不为空，则在给定的html里面找。
                if (gaeaValid.isNotNull(html)) {
                    $someDiv = $(html);
                }
                // 是否本身就是binding位置
                var imBindArea = $someDiv.data("gaea-data-bind-area");
                // 如果所有子元素都没有data-gaea-data-bind-area，或者本身也没有
                if (gaeaValid.isNull($someDiv.find("[data-gaea-data-bind-area=true]")) && gaeaValid.isNull(imBindArea)) {
                    throw "找不到对应的数据绑定区域(data-gaea-data-bind-area属性)设置。无法初始化dataset。";
                }

                // 查找具体要binding的区域
                var $bindingContainer = null;
                /**
                 * if 我就是绑定区 ok
                 * else 查找第一个子的包含data-gaea-data-bind-area=true的，作为绑定区
                 */
                if (gaeaValid.isNotNull(imBindArea)) {
                    if (!_.isBoolean(imBindArea)) {
                        throw "data-gaea-data-bind-area配置必须是boolean.";
                    }
                    if (imBindArea) {
                        $bindingContainer = $someDiv;
                    } else {
                        return;
                    }
                } else {
                    $bindingContainer = $someDiv.find("[data-gaea-data-bind-area=true]").first();
                }
                var bindContainerId = $bindingContainer.attr("id");// 做data binding的整个容器（div）的id
                if (gaeaValid.isNull(bindContainerId)) {
                    throw "gaea data binding区域（一般是HTML元素）的id不允许为空！";
                }
                return bindContainerId;
            },
            /**
             * 绑定KO的for each.
             * @param $container JQuery对象，一般是tbody。
             * @param name
             */
            bindForEach: function ($container, name) {
                if (gaeaValid.isNull($container)) {
                    throw "缺少目标对象，例如div，无法binding(for each).";
                }
                //var $container = $("#"+bindtoId);
                var tbodyBindTemplate = _.template(templates.dataBind.FOR_EACH);
                $container.attr("data-bind", tbodyBindTemplate({
                    LOOP_PARAM: name
                }));
            },
            bindValue: function (bindToId, name) {
                if (gaeaValid.isNull(bindToId)) {
                    throw "缺少目标对象id，例如div，无法binding(for each).";
                }
                var $container = $("#" + bindToId);

            }
        };
        gaeaData.utils = {
            /**
             * 当前，只会复制input、textarea、select的值。
             * 以源区域的内容为基准，寻找覆盖目标区域同名的。
             * <p>
             *     所谓同名，是在加上前缀（无论源前缀，还是目标前缀）基础上。
             * </p>
             * <p>对前缀的判断，不区分大小写</p>
             * 举例：
             * 源区域：
             *     <form id='form2'><input name='b.name'></form>
             * 目标区域
             *     <form id='form1'><input name='a.name'></form>
             * 则复制就该是：
             * opts.fromCtId='form2', opts.fromFieldPrefix='b.', opts.toCtId='form1', opts.toFieldPrefix='a.'
             * 这样才能匹配到name这个值。
             * @param {object} opts
             * @param {string} opts.fromCtId                这是源区域的id
             * @param {string} opts.fromFieldPrefix         源字段的默认前缀
             * @param {string} opts.toCtId                  这是目标区域的id
             * @param {string} opts.toFieldPrefix           目标字段的默认前缀
             */
            copyByField: function (opts) {
                if (gaeaValid.isNull(opts.fromCtId) || gaeaValid.isNull(opts.toCtId)) {
                    throw "fromCtId 或 toCtId为空，无法复制。";
                }
                var $fromCT = $("#" + opts.fromCtId);
                var $toCT = $("#" + opts.toCtId);
                $fromCT.find("input,textarea,select").each(function (idx, val) {
                    var $fromInput = $(this);
                    var fromName = $fromInput.attr("name");
                    // 先假设from/to的name一样。后面不一样再修改。
                    var baseName = fromName; // 这个是复制双方去掉前缀后，共同拥有的部分
                    // 缺少name属性的略过
                    if (gaeaValid.isNull(fromName)) {
                        return;
                    }
                    if (gaeaValid.isNotNull(opts.fromFieldPrefix)) {
                        // 缺少fromFieldPrefix的略过
                        if (!_s.startsWith(fromName.toLowerCase(), opts.fromFieldPrefix.toLowerCase())) {
                            return;
                        }
                        // 去掉前缀，得到baseName
                        baseName = fromName.substring(opts.fromFieldPrefix.length);
                    }
                    var toName = gaeaValid.isNull(opts.toFieldPrefix) ? baseName : opts.toFieldPrefix + baseName;
                    var $toInput = $("[name='" + toName + "'");
                    if ($toInput.length > 1) {
                        console.debug("批量复制值的目标对象'%s'有不止一个!", toName);
                    }
                    console.debug("准备复制。baseName:%s, 从name='%s' 到 name='%s'", baseName, fromName, toName);
                    $toInput.val($fromInput.val());
                    //}

                });
            },
            /**
             * 把绑定数据集的下拉框的id，如果名字有一些特殊字符的，例如“.”，去掉并转成驼峰命名。
             * @param bindSelectId
             * @param dataSetId
             * @returns {string}
             */
            getIdPrefix: function (bindSelectId, dataSetId) {
                bindSelectId = bindSelectId.split(".").join("_");// 把.转为下划线
                // 改为驼峰命名
                var idPrefix = _s.camelize(bindSelectId, true) + "_" + _s.camelize(dataSetId.toLocaleLowerCase(), true);
                return idPrefix;
            },
            /**
             * 根据dataDefine的属性，创建一个对应的对象obj。
             * @param dataDefine
             * @returns {{}}
             */
            newObject: function (dataDefine) {
                var bean = {};
                if (gaeaValid.isNotNull(dataDefine) && Array.isArray(dataDefine)) {
                    $.each(dataDefine, function (idx, fieldDef) {
                        var fieldName = fieldDef.fieldName;
                        if (gaeaValid.isNull(fieldName)) {
                            throw "gaea-data的dataDefine的fieldName不允许为空！\n" + JSON.stringify(dataDefine);
                        }
                        bean[fieldName] = "";// 暂时值都是空的
                    });
                }
                return bean;
                //},
                //getPageContextValue: function (name) {
                //    var $pageContext = PAGE_CONTEXT;
                //    var value = null;
                //    if (gaeaValid.isNotNull(name)) {
                //        if (_s.startsWith(name, "$pageContext.")) {
                //            value = eval(name);
                //        }
                //        if (gaeaValid.isNull(value)) {
                //            value = PAGE_CONTEXT[name];
                //        }
                //    }
                //    return value;
            },
            /**
             * 工具，协助获取真正的值。
             * 因为在gaea框架中，“值”有很多种形态，可能是表达式，也可能是数据集（值是对象）。在真正成为填充在输入框的值前，需要一定的转换。
             * @param {object|string} value
             * @param valueDefine       可以为空。值的定义。一般例如：可编辑表格的列定义的值(column.value)等
             * @returns {*}
             */
            getRealValue: function (value, valueDefine) {
                var realValue = _.clone(value);
                if (gaeaValid.isNull(value) && gaeaValid.isNotNull(valueDefine)) {
                    /**
                     * if 通过gaeaContext获取到值（表示表达式方式） then 以gaeaContext获取的值为准
                     * else (可能valueDefine是个静态值) 就以列定义的值，作为最终的值
                     */
                    if (gaeaValid.isNotNull(gaeaContext.getValue(valueDefine))) {
                        realValue = gaeaContext.getValue(valueDefine);
                    } else {
                        realValue = valueDefine;
                    }
                } else {
                    /**
                     * 这个可能是数据集返回的值
                     * 结构可能是：value: { text: '男', value: 1}
                     * 这个时候，我们要提取的是value
                     */
                    if (_.isObject(value)) {
                        realValue = value.value;
                    }
                }
                return realValue;
            }
        };

        // 放一些重要的debug方法
        gaeaData.utils.debug = {
            /**
             * 检查是否有同名的viewModelName，这个很重要！
             * 这是很多页面数据集出不来的一个重要原因。因为bindContainerId是用div的id动态生成的。
             * 如果多个页面的做binding的div id相同（例如多个嵌套dialog），就会导致后面页面的数据集出不来。
             * @param {object} opts
             * @param {string} opts.viewModelName
             * @param {string} opts.optionName
             */
            checkViewId: function (opts) {
                if (gaeaValid.isNotNull(gaeaData.viewModel[opts.viewModelName]) && _.keys(gaeaData.viewModel[opts.viewModelName]).length > 0) {
                    console.debug(" id = '%s'该ViewModel的子项已经存在。\nkey列表: %s",
                        opts.viewModelName,
                        JSON.stringify(_.keys(gaeaData.viewModel[opts.viewModelName]))
                    );
                    // 有时候，不知道为什么KO的model里面的属性返回的是一个window对象。会导致js错误。所以这里得判断一下。
                    if (_.isFunction(gaeaData.viewModel[opts.viewModelName][opts.optionName]) && !Object.is(gaeaData.viewModel[opts.viewModelName][opts.optionName]()[0], window)
                    ) {
                        // 把某个数据集的项（options）打印出来。限100个，避免死循环。
                        for (var i = 0; i < gaeaData.viewModel[opts.viewModelName][opts.optionName]().length && i < 100; i++) {
                            var debugOptions = gaeaData.viewModel[opts.viewModelName][opts.optionName]()[i];
                            console.debug("%s.%s 的值: %s", opts.viewModelName, opts.optionName, JSON.stringify(debugOptions));
                        }
                    }
                }
            },
            /**
             * 检查是否有同名的viewModelName，这个很重要！
             * <p>这个，暂时在dialog加载内容的时候调用（对新加入的内容做检查）。</p>
             * 这是很多页面数据集出不来的一个重要原因。因为bindContainerId是用div的id动态生成的。
             * 如果多个页面的做binding的div id相同（例如多个嵌套dialog），就会导致后面页面的数据集出不来。
             * @param {object} opts
             * @param {string} opts.containerId
             * @param {string} opts.html
             */
            checkViewModel: function (opts) {
                if (gaeaValid.isNotNull(opts.containerId)) {
                    var viewModelName = gaeaData.dataBind.findBindingId(opts.containerId, opts.html);
                    if (gaeaValid.isNotNull(opts.html) && $("#" + viewModelName).length > 0) {
                        console.debug(" id = '%s'的html元素已经存在页面。这是关系数据集初始化、缓存根命名、数据绑定的id，重复会导致不同页面的数据不一致。\nkey列表: %s",
                            viewModelName,
                            JSON.stringify(_.keys(gaeaData.viewModel[viewModelName]))
                        );
                    }

                    if (gaeaValid.isNull(opts.html) && !gaeaUtils.dom.checkUnique(viewModelName)) {
                        console.debug(" id = '%s'的html元素已经存在页面。这是关系数据集初始化、缓存根命名、数据绑定的id，重复会导致不同页面的数据不一致。\nkey列表: %s",
                            viewModelName,
                            JSON.stringify(_.keys(gaeaData.viewModel[viewModelName]))
                        );
                    }
                }
            }
        };

        /**
         * 依赖KO框架的一些方法
         */
        gaeaData.ko = {
            /**
             * 创建一个ko的compute的obj.例如用于下拉时的对象绑定,例如下拉选了用户A,则页面和用户A相关的字段都刷新.就需要一个这样的一个compute字段.
             * @param options
             *              bindSelectId 用于生成变量名,找到对应的viewModel中的属性
             *              dataset 用于生成变量名,找到对应的viewModel中的属性
             *              data 数据.不能为空.为空无法让其他字段binding这个obj.
             *              bindContainerId 当前元素所在的大的绑定容器(data-gaea-data-bind-area) id （因为ko binding不可能只绑定一个下拉框的数据，一般是一个表单）
             */
            createComputeObj: function (options) {
                var data = options.data;
                var bindContainerId = options.bindContainerId;
                var selectedObj = gaeaData.select.getBindObjName(options.bindSelectId, options.dataset);
                var selectedName = gaeaData.select.getSelectedName(options.bindSelectId, options.dataset);
                gaeaData.viewModel[bindContainerId][selectedObj] = ko.computed(function () { // 通过中间变量，遍历数组查找对象。再触发页面更新。
                    var standardObj = gaeaData.utils.newObject(options.dataDefine);
                    if (gaeaValid.isNull(data) || !_.isArray(data)) {
                        return standardObj;
                    }
                    var result = ko.utils.arrayFirst(data, function (item) {
                        //console.log("item name:" + item.value + " self name:" + viewModel[selected]());
                        // 一开始viewModel[selected]是没用值的，undefined。这个时候需要初始化，返回一个对象，否则会出错！！( ERROR : unable to process binding value function () return order seq cannot read property of null )
                        if (gaeaValid.isNull(gaeaData.viewModel[bindContainerId][selectedName]())) {
                            return _.first(data);
                        }
                        return item.value === gaeaData.viewModel[bindContainerId][selectedName]();
                    });
                    // 无论如何不能返回空！否则banding了这个对象的相关字段会出错！
                    if (gaeaValid.isNull(result)) {
                        result = standardObj;
                    }
                    return result;
                });
            },
            /**
             * 这是个依赖KO的方法。移除数组的所有。
             * 由于涉及binding后的数组的整个页面的交互，所以必须用KO的原生方法移除。否则即使移除了内容，其他binding也不会刷新。
             * @param koArrayObj
             */
            removeAll: function (koArrayObj) {
                koArrayObj.removeAll();
            },
            /**
             * 把所有data都推入ko的数组中。涉及ko binding的数组都需要用这个方法压入数据（或用push）。
             * @param koArray
             * @param data
             */
            addAll: function (koArray, data) {
                if (Array.isArray(data)) {
                    $.each(data, function () {
                        koArray.push(this);
                    });
                } else if (_.isObject(data)) {
                    koArray.push(data);
                }
            }
        };
        return gaeaData;
    });