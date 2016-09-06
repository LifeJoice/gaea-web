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
        "gaeajs-ui-events", "gaeajs-ui-definition"],
    function ($, _, _s, ko, gaeaValid, gaeaString, gaeaAjax,
              SYS_URL, gaeaNotify, GAEA_UI_DEFINE, gaeaGrid,
              GAEA_EVENTS, gaeaUI) {
        /**
         * 当前页面的缓存，主要数据集依赖使用。
         */
        var PAGE_CONTEXT = {};

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
                //$formDiv.find("[data-gaea-data]").each(function (index, element) {
                //    var $select = $(this);// 默认是下拉选择框，其实可能不是。
                //    var gaeaDataStr = $(this).data("gaea-data");
                //    console.log("scan gaea form data. gaea-data : " + gaeaDataStr);
                //    //var elementCo = ;
                //    // 把元素的gaea-data配置转成对象，并和默认配置合并。
                //    var configOptions = _.extend(options, gaeaString.parseJSON(gaeaDataStr));
                //    options = configOptions;
                //    var dataSetId = configOptions.dataset;
                //    var bindPrefix = configOptions.bindPrefix;
                //    if (gaeaValid.isNotNull(configOptions.dataset)) {
                //        gaeaAjax.post({
                //            url: SYS_URL.DATA.DATASET.GET,
                //            data: {
                //                dsId: configOptions.dataset
                //            },
                //            success: function (data) {
                //                var viewModel = root.select.initData(dataSetId, data, $select, $formDiv, bindPrefix);
                //                options._viewModel = _.extend(options._viewModel, viewModel);
                //                //var result = $.parseJSON(jqXHR.responseText);
                //                // 用查询结果，刷新数据列表
                //            },
                //            fail: function (data) {
                //                gaeaNotify.error(_.template("加载数据集<%= dsName %>失败!")({dsName: configOptions.dataset}));
                //            }
                //        });
                //    }
                //});
                //gaeaData.component.init(divId);
                // 在所有的ajax请求后再绑定KO。否则多个DATASET的时候会导致重复绑定出错。
                //$(document).ajaxStop(function () {
                //    // 应用于KnockoutJS
                //    if (!root._isBinded($formDiv)) {
                //        ko.applyBindings(options._viewModel, $formDiv[0]);
                //        /**
                //         * 在KO绑定后再调用。
                //         * 场景( 编辑用户信息 )：
                //         * 对于通用的更新操作，点击编辑 -> 弹框 -> 加载数据集 -> 绑定 -> afterBindingCallback( 加载编辑数据 -> 填充编辑数据 )
                //         * 上面的场景，就可以在加载了数据集后，再用编辑数据覆盖数据集。否则数据集的内容就会反过来覆盖要编辑的数据。
                //         */
                //        if (gaeaValid.isNotNull(afterBindingCallback)) {
                //            afterBindingCallback();
                //        }
                //        //var $data = ko.dataFor($formDiv[0]);
                //        //$data.dsIsEnabled_options.push({"text":"永远OK","value":"2"});
                //        //$data.dsResourceManagement_options = ko.observableArray([{"text":"登录","description":"登录url","resource":"/login","value":"1","orderseq":"1"},{"text":"测试","description":"测试菜单","resource":"/menu/test","value":"2","orderseq":"2"}]);
                //        //}else{
                //        //ko.cleanNode($formDiv[0]);
                //        //var $data = ko.dataFor($formDiv[0]);
                //        //ko.applyBindings(options._viewModel, $formDiv[0]);
                //    }
                //});
            },
            /**
             * 解除绑定。
             * @param divId
             */
            unbind: function (divId) {
                var $formDiv = $("#" + divId);
                ko.cleanNode($formDiv[0]);
            },
            select: {
                /**
                 * 初始化下拉列表的KO 的模型对象，并且初始化该下拉列表的数据
                 * @param options
                 * @param config
                 * @param data
                 * @param $select211
                 * @param $formDiv
                 * @param bindPrefix
                 * @returns {{}}
                 */
                initModelAndData: function (options) {
                    var viewModel = {};
                    var data = options.data;
                    //var $select = $("#" + options.bindSelectId);
                    //var root = this;
                    //if (gaeaValid.isNull(data)) {
                    //    //throw "数据为空，无法初始化下拉选择框。而且进行KO binding会出错。";
                    //    data = new Array();
                    //}
                    //if (!_.isArray(data)) {
                    //    data = [data];
                    //}
                    ///**
                    // * 把数据集的名称，转换为驼峰命名的变量名，
                    // * 然后作为当前这个下拉框的所有ko binding的一个标志（例如，参与到所有的自动生成变量的命名中）
                    // * idPrefix = userList_dsUserDataSet (下拉框id+_+数据集名称
                    // */
                    ////var idPrefix = _s.camelize(config.toLocaleLowerCase(), true) + "_";
                    //var idPrefix = options.bindSelectId + "_" + _s.camelize(config.toLocaleLowerCase(), true);
                    //console.log("idprefix: " + idPrefix + " test: " + _s.camelize("gaeaDataSetManagement", true));
                    //var dataStr = JSON.stringify(data);
                    //console.log("before clean: " + dataStr);
                    ////$(data).each(function (index, element) {
                    //// 定义一个ViewModel
                    //var selectOptions = idPrefix + "_options";
                    //var selected = idPrefix + "_selected";
                    //var selectedObj = idPrefix + "_Obj";
                    //viewModel[selectOptions] = ko.observableArray(data);// 可以用一个空的数组初始化
                    //viewModel[selected] = ko.observable();// 这个就是中间变量
                    ///**
                    // * 计算对象，根据下拉框选中的值去json数据中找对应的对象。代表下拉选择的对象。例如user。
                    // * 再把对象的属性和表单的各个字段绑定。例如：(user)name,address,phone...
                    // * ko.computed在加载的时候就会运行一次了！切记！这个时候如果返回undefined，会导致页面错误！
                    // */
                    //viewModel[selectedObj] = ko.computed(function () { // 通过中间变量，遍历数组查找对象。再触发页面更新。
                    //    if (gaeaValid.isNull(data) || !_.isArray(data)) {
                    //        return null;
                    //    }
                    //    var result = ko.utils.arrayFirst(data, function (item) {
                    //        //console.log("item name:" + item.value + " self name:" + viewModel[selected]());
                    //        // 一开始viewModel[selected]是没用值的，undefined。这个时候需要初始化，返回一个对象，否则会出错！！( ERROR : unable to process binding value function () return order seq cannot read property of null )
                    //        if (gaeaValid.isNull(viewModel[selected]())) {
                    //            return _.first(data);
                    //        }
                    //        return item.value === viewModel[selected]();
                    //    });
                    //    return result;
                    //});
                    //// 初始化
                    //// 下拉框的data-bind模板
                    //var selectBindingTemplate = _.template("options:<%= selectOptionsName %>,optionsText:'text',optionsValue:'value',value:<%= selectedVarName %>");
                    //// 应用模板
                    //$select.attr("data-bind", selectBindingTemplate({
                    //    selectOptionsName: selectOptions,
                    //    selectedVarName: selected
                    //}));

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
                    //$formDiv.find("input,textarea").each(function (index, element) {
                    //    var $self = $(this);
                    //    var elementName = $(this).attr("name");
                    //    console.log("element name: " + elementName);
                    //    // 检查JSON数据中是否有该字段存在
                    //    var hasDataKey = _.has(data[0], elementName);
                    //    console.log("has key : " + hasDataKey);
                    //    if (hasDataKey) {
                    //        $self.attr("data-bind", "value:" + selectedObj + "()." + elementName);
                    //    }
                    //});

                    //ko.applyBindings(koViewModel);
                    //var dataFor = ko.dataFor($("#createOrEditDialog")[0]);
                    //var contextFor = ko.contextFor($("#createOrEditDialog").get());
                    return viewModel;
                },
                /**
                 * 数据集建模.
                 * 主要是利用ko的方式, 做< select >的data-bind.
                 * <p>( < select options:<%= selectOptionsName %>,optionsText:'text',optionsValue:'value',value:<%= selectedVarName %> ... )</p>
                 * 同时,创建一个隐藏的中间变量,存储选中的值. ( 如果其它组件要和选中的对象交互, 需要这个中间变量去找出对应的对象. )
                 * <p/>
                 * 以前通过中间变量找对应的对象的, 现在这部分代码移到gaeaData.ko.createComputeObj去.
                 * @param options
                 *              dataset
                 *              bindSelectId
                 *              bindFieldContainerId
                 */
                initModel: function (options) {
                    var root = this;
                    var viewModel = {};
                    var dataSetId = options.dataset;
                    var $select = $("#" + options.bindSelectId);
                    //var $formDiv = $("#" + options.bindFieldContainerId);
                    //var bindPrefix = options.bindPrefix;
                    var data = new Array();
                    /**
                     * 把数据集的名称，转换为驼峰命名的变量名，
                     * 然后作为当前这个下拉框的所有ko binding的一个标志（例如，参与到所有的自动生成变量的命名中）
                     * idPrefix = userList_dsUserDataSet (下拉框id+_+数据集名称
                     */
                    var idPrefix = gaeaData.utils.getIdPrefix(options.bindSelectId, options.dataset);
                    // 定义一个ViewModel
                    var selectOptions = idPrefix + "_options";
                    var selected = idPrefix + "_selected";
                    viewModel[selectOptions] = ko.observableArray(data);// 可以用一个空的数组初始化
                    viewModel[selected] = ko.observable();// 这个就是中间变量
                    // 初始化
                    // 下拉框的data-bind模板
                    var selectBindingTemplate = _.template("options:<%= selectOptionsName %>,optionsText:'text',optionsValue:'value',value:<%= selectedVarName %>");
                    // 应用模板
                    $select.attr("data-bind", selectBindingTemplate({
                        selectOptionsName: selectOptions,
                        selectedVarName: selected
                    }));
                    gaeaData.viewModel = _.extend(gaeaData.viewModel, viewModel);
                    // 返回增量的部分。一般没用。
                    return viewModel;
                },
                /**
                 * 重置数据。主要是得利用ko的原生方法去清空和推数据，否则整个页面的binding会有错。
                 * 1. 清空原有数据
                 * 2. push新的数据
                 * @param options
                 *              bindSelectId 用于生成变量名,找到对应的viewModel中的属性
                 *              dataset 用于生成变量名,找到对应的viewModel中的属性
                 *              data 要推入的数据
                 */
                resetData: function (options) {
                    if (gaeaValid.isNull(options.bindSelectId) || gaeaValid.isNull(options.dataset)) {
                        throw "绑定下拉框id 或 数据集名 为空，无法进行数据刷新（reset）！";
                    }
                    var data = options.data;
                    //var idPrefix = gaeaData.utils.getIdPrefix(options.bindSelectId, options.dataset);
                    var selectOptions = gaeaData.select.getOptionsName(options.bindSelectId, options.dataset);
                    // 使用KO的原生方法先把原有数组清空！
                    gaeaData.ko.removeAll(gaeaData.viewModel[selectOptions]);
                    if (gaeaValid.isNotNull(data)) {
                        gaeaData.ko.addAll(gaeaData.viewModel[selectOptions], data);
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
                 */
                removeAllData: function (options) {
                    if (gaeaValid.isNull(options.bindSelectId) || gaeaValid.isNull(options.dataset)) {
                        throw "绑定下拉框id 或 数据集名 为空，无法进行数据刷新（reset）！";
                    }
                    var selectOptions = gaeaData.select.getOptionsName(options.bindSelectId, options.dataset);
                    //var selectOptions = idPrefix + "_options";
                    // 使用KO的原生方法先把原有数组清空！
                    gaeaData.ko.removeAll(gaeaData.viewModel[selectOptions]);
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
                }
            },
            binding: function (divId, callback) {
                var $formDiv = $("#" + divId);
                $(document).ajaxStop(function () {
                    var root = this;
                    // 应用于KnockoutJS
                    if (!gaeaData._isBinded($formDiv)) {
                        //ko.applyBindings(options._viewModel, $formDiv[0]);
                        ko.applyBindings(gaeaData.viewModel, $formDiv[0]);
                        /**
                         * 在KO绑定后再调用。
                         * 场景( 编辑用户信息 )：
                         * 对于通用的更新操作，点击编辑 -> 弹框 -> 加载数据集 -> 绑定 -> afterBindingCallback( 加载编辑数据 -> 填充编辑数据 )
                         * 上面的场景，就可以在加载了数据集后，再用编辑数据覆盖数据集。否则数据集的内容就会反过来覆盖要编辑的数据。
                         */
                        if (_.isFunction(callback)) {
                            callback();
                        }
                        //var $data = ko.dataFor($formDiv[0]);
                        //$data.dsIsEnabled_options.push({"text":"永远OK","value":"2"});
                        //$data.dsResourceManagement_options = ko.observableArray([{"text":"登录","description":"登录url","resource":"/login","value":"1","orderseq":"1"},{"text":"测试","description":"测试菜单","resource":"/menu/test","value":"2","orderseq":"2"}]);
                        //}else{
                        //ko.cleanNode($formDiv[0]);
                        //var $data = ko.dataFor($formDiv[0]);
                        //ko.applyBindings(options._viewModel, $formDiv[0]);
                    }
                });
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
                    console.log("element name: " + fullName + " withoutObjectPrefix : " + withoutpreName);
                    // 转换为小写。因为服务端返回的结果集的key应该都是小写。data-bind的属性不需要跟input属性名一致，重点是跟数据集key一致。
                    withoutpreName = withoutpreName.toLowerCase();
                    // 检查JSON数据中是否有该字段存在
                    var hasDataKey = _.has(jsonObj, withoutpreName);
                    console.log("has key : " + hasDataKey);
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
             * @returns {boolean}
             * @private
             */
            _isBinded: function ($bindingDiv) {
                return !!ko.dataFor($bindingDiv[0]);
            },
            /**
             * 监听事件，触发和gaeaData相关的操作。例如：
             *
             * @param eventName
             */
            listen: function (eventName, eventBindingDivId) {
                var $bindingDiv = $("#" + eventBindingDivId);
                if (gaeaString.equalsIgnoreCase(eventName, GAEA_EVENTS.DEFINE.CONTEXT.PAGE.UPDATE)) {
                    $bindingDiv.on(GAEA_EVENTS.DEFINE.CONTEXT.PAGE.UPDATE, function (event, data) {
                        PAGE_CONTEXT = _.extend(PAGE_CONTEXT, data.PAGE_CONTEXT);
                    });
                }
            },
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
             * @param configCondition 对象。格式：condition:{id:'byId',values:[{ type:'pageContext',value:'id' }]}
             *              id
             *              values[]
             *                  type
             *                  value
             * @returns {{}}
             */
            parseCondition: function (configCondition) {
                var queryCondition = {};
                //if(gaeaValid.isNotNull(configObj.condition)){
                //    var configCondition = configObj.condition;
                queryCondition.id = configCondition.id;
                if (gaeaValid.isNotNull(configCondition.values) && _.isArray(configCondition.values)) {
                    var queryValues = new Array();
                    $.each(configCondition.values, function (key, condValue) {
                        /**
                         * 如果配置项要的是当前页面上下文的值，则需要从上下文取值。而不是页面配置的静态值。
                         */
                        if (gaeaString.equalsIgnoreCase(condValue.type, "pageContext")) {
                            if (gaeaValid.isNotNull(condValue.value)) {
                                var val = PAGE_CONTEXT[condValue.value];
                                queryValues.push({
                                    type: condValue.type,
                                    value: val
                                });
                            }
                        } else if (gaeaString.equalsIgnoreCase(value.type, "static")) {
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
             * 解析配置的查询条件。
             *
             * @param options 对应data-gaea-data。格式：
             *              dataset: ***,
             *              bindAsObject: false, // 是否作为对象绑定。默认不是。
             *              condition:{
             *                  id:'byId',
             *                  values:[{
             *                      type:'static | pageContext | dependTrigger',
             *                      value:'id',
             *                     dependId: 'someId',
             *                     triggerEvent: 'change'
             *                      }]}
             *               bindSelectId : ***, // 数据集要绑定的下拉框的id
             *               bindFieldContainerId: *** // 数据集要绑定一堆input,则这堆input在哪里?给出一个容器的id
             * @returns queryCondition
             *              init 初始化function. 如果页面的condition是级联(触发)的话, 需要一个绑定事件的初始化.
             */
            //parseCondition: function (options) {
            //    var configCondition = options.condition;
            //    //var dataSetId = options.dataset;
            //    //var bindPrefix = options.bindPrefix;
            //    var queryCondition = {};
            //    //var $pageContext = PAGE_CONTEXT;
            //    //if(gaeaValid.isNotNull(configObj.condition)){
            //    //    var configCondition = configObj.condition;
            //    queryCondition.id = configCondition.id;
            //    if (gaeaValid.isNotNull(configCondition.values) && _.isArray(configCondition.values)) {
            //        var queryValues = new Array();
            //        $.each(configCondition.values, function (key, condValue) {
            //            var value = null;
            //            /**
            //             * 如果配置项要的是当前页面上下文的值，则需要从上下文取值。而不是页面配置的静态值。
            //             */
            //            if (gaeaString.equalsIgnoreCase(condValue.type, DEFINE.CONDITION.TYPE.PAGE_CONTEXT)) {
            //                if (gaeaValid.isNotNull(condValue.value)) {
            //                    gaeaData.utils.getPageContextValue(condValue.value);
            //                    //if (_s.startsWith(condValue.value, "$pageContext.")) {
            //                    //    value = eval(condValue.value);
            //                    //}
            //                    //if (gaeaValid.isNull(value)) {
            //                    //    value = PAGE_CONTEXT[condValue.value];
            //                    //}
            //                    queryValues.push({
            //                        type: condValue.type,
            //                        value: value
            //                    });
            //                }
            //            } else if (gaeaString.equalsIgnoreCase(condValue.type, DEFINE.CONDITION.TYPE.STATIC)) {
            //                queryValues.push({
            //                    type: condValue.type,
            //                    value: condValue.value
            //                });
            //            }
            //            /**
            //             * 如果是级联（依赖）数据集。
            //             */
            //            else if (gaeaString.equalsIgnoreCase(condValue.type, DEFINE.CONDITION.TYPE.DEPEND_TRIGGER)) {
            //
            //                options.conditionValue = condValue;
            //                gaeaData.dataSet.dependTriggerDataSetInit(options, function (data) {
            //                    if (gaeaValid.isNotNull(data)) {
            //                        options.data = data;
            //                        gaeaData.select.resetData(options);
            //                        // 把当前数据集作对象绑定。把数据集其他字段和页面同名字段绑定。
            //                        // bindAsObject暂时未启用和测试。预留。
            //                        if (gaeaValid.isNotNull(options.bindAsObject) && options.bindAsObject) {
            //                            gaeaData.ko.createComputeObj(options);
            //                        }
            //                    }else{
            //                        gaeaData.select.removeAllData(options);
            //                    }
            //                });
            //
            //
            //
            //
            //                //// 看是否有内置变量，处理一下。
            //                //if (gaeaValid.isNotNull(condValue.value)) {
            //                //    value = eval(condValue.value);
            //                //}
            //                //if (gaeaValid.isNull(value)) {
            //                //    var domId = condValue.dependId;
            //                //    var triggerEvent = condValue.triggerEvent;
            //                //    if (gaeaValid.isNull(domId)) {
            //                //        throw "数据集配置有误.type是dependTrigger,要求dependId不允许为空.";
            //                //    }
            //                //    // 默认事件为onchange
            //                //    if (gaeaValid.isNull(triggerEvent)) {
            //                //        triggerEvent = "change";
            //                //    }
            //                //
            //                //    var $target = $("#" + domId);// 目标对象，一般是个下拉框（带数据集功能）
            //                //
            //                //    /**
            //                //     * 初始化select下拉框, 建模,data-bind...
            //                //     * 一开始就初始化，不要等到依赖的上级触发再初始化。那样会导致重复binding问题。
            //                //     */
            //                //    var viewModel = gaeaData.select.initModel(options);
            //                //    // Function ---------------------------------------------------->>>>
            //                //    // 监听事件. 当依赖的对象的值有变化的时候, 就触发重新查询结果集.
            //                //    //var valueInit = function (options) {
            //                //
            //                //    // 默认在依赖对象的gaeaUI_event_init_complete事件发生后，再进行自己的初始化
            //                //    $target.on(GAEA_EVENTS.DEFINE.UI.INIT_COMPLETE, function () {
            //                //        // 依赖的对象触发change事件（一般），则发起请求刷新当前的组件。
            //                //        $target.on(triggerEvent, function (event, data) {
            //                //            var newCondition = queryCondition;
            //                //            queryValues = new Array();
            //                //            value = $(this).val();
            //                //            if (gaeaValid.isNotNull(value)) {
            //                //                queryValues.push({
            //                //                    type: condValue.type,
            //                //                    value: value
            //                //                });
            //                //            }
            //                //            //if (_.isFunction(options.success)) {
            //                //            //options.success(queryValues);
            //                //
            //                //
            //                //            //
            //                //            //
            //                //            newCondition.values = queryValues;
            //                //            gaeaData.dataSet.getData({
            //                //                isConditionParsed: true,// 表示condition已经解析过，不要再解析了！
            //                //                condition: gaeaData.newQueryCondition(newCondition),
            //                //                dsId: dataSetId,
            //                //                isAsync: true,// 异步调用
            //                //                success: function (data) {
            //                //                    //var viewModel = gaeaData.select.initModelAndData(options,dataSetId, data, $select, $formDiv, bindPrefix);
            //                //                    //options._viewModel = _.extend(options._viewModel, viewModel);
            //                //                    ////var result = $.parseJSON(jqXHR.responseText);
            //                //                    //// 用查询结果，刷新数据列表
            //                //                    options.data = data;
            //                //                    if (gaeaValid.isNotNull(data)) {
            //                //                        gaeaData.select.resetData(options);
            //                //                        // 把当前数据集作对象绑定。把数据集其他字段和页面同名字段绑定。
            //                //                        if (gaeaValid.isNotNull(options.bindAsObject) && options.bindAsObject) {
            //                //                            gaeaData.ko.createComputeObj(options);
            //                //                        }
            //                //                    }
            //                //                }
            //                //            });
            //                //        });
            //                //    });
            //                //
            //                //}
            //
            //                //queryValues.push({
            //                //    type: condValue.type,
            //                //    value: condValue.value,
            //                //    init: valueInit
            //                //});
            //            }
            //        });
            //        queryCondition.values = queryValues;
            //    }
            //
            //    //}
            //    return queryCondition;
            //},
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
             * 扫描容器下的所有配置了数据集的组件，进行数据集的初始化。（每个数据集都会单独发起请求获取数据）
             * @param divId
             */
            scanAndInit: function (divId) {
                var $formDiv = $("#" + divId);
                /**
                 * 【1】遍历所有配置了data-gaea-data的元素
                 * 【重要】暂时扫描下拉框select类的数据集。因为这个和KO的下拉框绑定强相关！以后DIV类的下拉数据集需要另外处理。
                 */
                $formDiv.find("select[data-gaea-data]").each(function (index, element) {
                    var $select = $(this);// 默认是下拉选择框，其实可能不是。
                    var gaeaDataStr = $(this).data("gaea-data");
                    var thisId = $select.attr("id");
                    //console.log("scan gaea form data. gaea-data : " + gaeaDataStr);
                    //var elementCo = ;
                    // 把元素的gaea-data配置转成对象，并和默认配置合并。
                    //var configOptions = _.extend(options, gaeaString.parseJSON(gaeaDataStr));
                    var configOptions = gaeaString.parseJSON(gaeaDataStr);
                    //options = configOptions;
                    var dataSetId = configOptions.dataset;
                    var bindPrefix = configOptions.bindPrefix;
                    configOptions.bindSelectId = $select.attr("id");
                    configOptions.bindFieldContainerId = divId;
                    if (gaeaValid.isNotNull(configOptions.dataset)) {
                        var newCondition = null;
                        /**
                         * 【解析condition】
                         * 如果配置有condition，需要先解析condition
                         */
                        if (gaeaValid.isNotNull(configOptions.condition)) {
                            var condition = configOptions.condition;
                            var queryCondition = {};
                            queryCondition.id = condition.id;
                            if (gaeaValid.isNotNull(condition.values) && _.isArray(condition.values)) {
                                var queryValues = new Array();
                                /**
                                 * 【2】遍历condition中的每个value.
                                 *
                                 * 简单的value可能只是关联着值;
                                 * 复杂的value可能会关联着别的数据集之类的. 这个时候就需要用事件触发等方式实现.
                                 */
                                $.each(condition.values, function (key, condValue) {
                                    var value = null;
                                    /**
                                     * 如果配置项要的是当前页面上下文的值，则需要从上下文取值。而不是页面配置的静态值。
                                     */
                                    if (gaeaString.equalsIgnoreCase(condValue.type, DEFINE.CONDITION.TYPE.PAGE_CONTEXT)) {
                                        if (gaeaValid.isNotNull(condValue.value)) {
                                            gaeaData.utils.getPageContextValue(condValue.value);
                                            queryValues.push({
                                                type: condValue.type,
                                                value: value
                                            });
                                        }
                                    } else if (gaeaString.equalsIgnoreCase(condValue.type, DEFINE.CONDITION.TYPE.STATIC)) {
                                        queryValues.push({
                                            type: condValue.type,
                                            value: condValue.value
                                        });
                                    }
                                    /**
                                     * 重要！
                                     * -------------------->>  级联（依赖）数据集  <<--------------------
                                     */
                                    else if (gaeaString.equalsIgnoreCase(condValue.type, DEFINE.CONDITION.TYPE.DEPEND_TRIGGER)) {

                                        var opt = _.clone(configOptions);
                                        opt.conditionValue = condValue;
                                        opt.id = thisId;

                                        /**
                                         * 1. 监听目标对象的完成事件
                                         * 2. 绑定目标对象的change事件（或手动配置的事件）
                                         * 3. 触发刷新当前这个数据集和组件（在callback函数中）
                                         */
                                        gaeaData.dataSet.dependTriggerDataSetInit(opt, function (data) {
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
                                        });
                                    }
                                });
                                queryCondition.values = queryValues;
                            }

                            //$.each(newCondition.values, function (idx, condValue) {
                            //    if (_.isFunction(condValue.init)) {
                            //        condValue.init({
                            //            success: function (queryValues) {
                            //                newCondition.values = queryValues;
                            //                gaeaData.dataSet.getData({
                            //                    isConditionParsed: true,// 表示condition已经解析过，不要再解析了！
                            //                    condition: gaeaData.newQueryCondition(newCondition),
                            //                    dsId: dataSetId,
                            //                    isAsync: true,// 异步调用
                            //                    success: function (data) {
                            //                        var viewModel = gaeaData.select.initData(dataSetId, data, $select, $formDiv, bindPrefix);
                            //                        options._viewModel = _.extend(options._viewModel, viewModel);
                            //                        //var result = $.parseJSON(jqXHR.responseText);
                            //                        // 用查询结果，刷新数据列表
                            //                    }
                            //                });
                            //            }
                            //        });
                            //    }
                            //});
                        }
                        // 解析完condition后，把condition的值合并，统一发起查询。
                        // 如果没有配置（或配置了initTiming :'onload'） , 一开始就加载一次数据。
                        if (gaeaValid.isNull(configOptions.initTiming) || gaeaString.equalsIgnoreCase(configOptions.initTiming, "onload")) {
                            var result = gaeaData.dataSet.getData({
                                url: SYS_URL.DATA.DATASET.GET,
                                //condition: newCondition,
                                dsId: dataSetId,
                                isAsync: true,// 异步调用
                                success: function (data) {
                                    if (!_.isArray(data)) {
                                        data = [data];
                                    }
                                    configOptions.data = data;
                                    var viewModel = gaeaData.select.initModelAndData(configOptions);
                                    //options._viewModel = _.extend(options._viewModel, viewModel);
                                    //gaeaData.viewModel = _.extend(gaeaData.viewModel, viewModel);
                                    //var result = $.parseJSON(jqXHR.responseText);
                                    // 用查询结果，刷新数据列表

                                    // 告诉全世界，我初始化完啦！
                                    // 其他绑定到这个组件的级联数据集，就会开始初始化or刷新。
                                    $select.trigger(GAEA_EVENTS.DEFINE.UI.INIT_COMPLETE);
                                }
                            });
                        }


                        //gaeaAjax.post({
                        //    url: SYS_URL.DATA.DATASET.GET,
                        //    data: {
                        //        dsId: configOptions.dataset
                        //    },
                        //    success: function (data) {
                        //        var viewModel = gaeaData.select.initData(dataSetId, data, $select, $formDiv, bindPrefix);
                        //        options._viewModel = _.extend(options._viewModel, viewModel);
                        //        //var result = $.parseJSON(jqXHR.responseText);
                        //        // 用查询结果，刷新数据列表
                        //    },
                        //    fail: function (data) {
                        //        gaeaNotify.error(_.template("加载数据集<%= dsName %>失败!")({dsName: configOptions.dataset}));
                        //    }
                        //});
                    }
                });
            },
            /**
             * 初始化有依赖的数据集。
             * @param options
             *              id 当前这个对象的DOM id
             *              dataset
             *              condition.id
             *              conditionValue
             *              bindSelectId
             *              bindFieldContainerId
             * @param successCallback
             */
            dependTriggerDataSetInit: function (options, successCallback) {
                if (gaeaValid.isNull(options.id)) {
                    throw "当前基于依赖的数据集的id（DOM ID）不允许为空！";
                }
                var $this = $("#" + opt.id);
                var dataSetId = options.dataset;
                var queryCondition = {};
                queryCondition.id = options.condition.id;
                var condValue = options.conditionValue;
                // 看是否有内置变量，处理一下。
                var value = gaeaData.utils.getPageContextValue(condValue.value);
                if (gaeaValid.isNull(value)) {
                    var domId = condValue.dependId;
                    var triggerEvent = condValue.triggerEvent;
                    if (gaeaValid.isNull(domId)) {
                        throw "数据集配置有误.type是dependTrigger,要求dependId不允许为空.";
                    }
                    // 默认事件为onchange
                    if (gaeaValid.isNull(triggerEvent)) {
                        triggerEvent = "change";
                    }

                    var $target = $("#" + domId);// 目标对象，一般是个下拉框（带数据集功能）

                    /**
                     * 初始化select下拉框, 建模,data-bind...
                     * 一开始就初始化，不要等到依赖的上级触发再初始化。那样会导致重复binding问题。
                     */
                    var viewModel = gaeaData.select.initModel(options);
                    // Function ---------------------------------------------------->>>>
                    // 监听事件. 当依赖的对象的值有变化的时候, 就触发重新查询结果集.

                    // 默认在依赖对象的gaeaUI_event_init_complete事件发生后，再进行自己的初始化
                    $target.on(GAEA_EVENTS.DEFINE.UI.INIT_COMPLETE, function () {
                        // 依赖的对象触发change事件（一般），则发起请求刷新当前的组件。
                        $target.on(triggerEvent, function (event, data) {
                            var newCondition = queryCondition;
                            queryValues = new Array();
                            value = $(this).val();
                            if (gaeaValid.isNotNull(value)) {
                                queryValues.push({
                                    type: condValue.type,
                                    value: value
                                });
                            }
                            newCondition.values = queryValues;
                            gaeaData.dataSet.getData({
                                isConditionParsed: true,// 表示condition已经解析过，不要再解析了！
                                condition: gaeaData.newQueryCondition(newCondition),
                                dsId: dataSetId,
                                isAsync: true,// 异步调用
                                success: function (data) {
                                    successCallback(data);
                                    // 告诉全世界，我初始化完啦！
                                    // 其他绑定到这个组件的级联数据集，就会开始初始化or刷新。
                                    $this.trigger(GAEA_EVENTS.DEFINE.UI.INIT_COMPLETE);
                                }
                            });
                        });
                    });
                }
            },
            getDataByDomId: function (containerId) {
                var $container = $("#" + containerId);
                var configStr = $container.data("gaea-data");
                var configObj = gaeaString.parseJSON(configStr);
                //var queryCondition = {};// 查询条件。( gaea-data: ... condition:{id:'byId',values:[{ type:'pageContext',value:'id' }]} ... )
                var result = gaeaData.dataSet.getData({
                    condition: configObj.condition,
                    dsId: configObj.dataset
                });
                /**
                 * 解析gaea-data配置的查询条件。
                 */
                //if (gaeaValid.isNotNull(configObj.condition)) {
                //    queryCondition = gaeaData.parseCondition(configObj.condition);
                //}
                //var result = gaeaData.getData({
                //    data: {
                //        conditions: JSON.stringify(queryCondition),
                //        dsId: configObj.dataset
                //    }
                //});
                return result;
            },
            /**
             *
             * @param options
             *              url 请求的地址。默认是 SYS_URL.QUERY.BY_CONDITION
             *              condition 对象。例如：{id:'byId',values:[{ type:'pageContext',value:'id' }]}
             *              isConditionParsed default false. condition是否已经解析过！重复解析会有问题！
             *              dataset 数据集id
             *              isAsync 是否异步调用。默认false，即同步调用。
             *              success 完成后的回调
             * @returns {*}
             */
            getData: function (options) {
                //var $container = $("#" + containerId);
                //var configStr = $container.data("gaea-data");
                //var configObj = gaeaString.parseJSON(configStr);
                var queryCondition = {};// 查询条件。( gaea-data: ... condition:{id:'byId',values:[{ type:'pageContext',value:'id' }]} ... )
                var isConditionParsed = gaeaValid.isNull(options.isConditionParsed) ? false : options.isConditionParsed;// 默认false
                /**
                 * 解析gaea-data配置的查询条件。
                 */
                if (!isConditionParsed && gaeaValid.isNotNull(options.condition)) {
                    queryCondition = gaeaData.parseCondition(options.condition);
                } else {
                    queryCondition = options.condition;
                }
                options.conditions = JSON.stringify(queryCondition);
                var result = gaeaData.getData(options);
                return result;
            }
        };
        gaeaData.component = {
            /**
             * 初始化页面的组件相关的数据。例如某div的属性：
             data-gaea-data="name:'testList',dataset:'DS_IS_ENABLED', condition:{id:'byId',values:[{ type:'refer',value:'PAGE_CONTEXT.id' }]}, initTiming :'onload'"
             data-gaea-ui="component:'table',isbindGaeaData:true"
             * 我们会根据其中的gaea-ui找到对应的gaea-data，然后初始化该UI需要的数据。
             * @param divId
             * @param options 未设计，暂无用
             */
            init: function (divId, options) {
                var $div = $("#" + divId);
                /* 遍历所有配置了data-gaea-data的元素 */
                $div.find("[data-gaea-ui]").each(function (index, element) {
                    var $this = $(this);// 默认是下拉选择框，其实可能不是。
                    var uiStr = $this.data("gaea-ui");
                    var thisUI = gaeaString.parseJSON(uiStr);
                    var componentCtId = $this.attr("id");

                    /**
                     * 把数据转换为table显示
                     */
                    if (gaeaValid.isNotNull(thisUI.isbindGaeaData) && thisUI.isbindGaeaData) {
                        var dataStr = $this.data("gaea-data");
                        var dataConfig = gaeaString.parseJSON(dataStr);
                        if (gaeaString.equalsIgnoreCase(thisUI.component, GAEA_UI_DEFINE.UI.COMPONENT.TABLE)) {
                            // 获取数据
                            //var dsData = gaeaData.dataSet.getData(componentCtId);
                            // 初始化table
                            gaeaData.component.table.init(componentCtId);
                        }
                    }
                });
            },
            initData: function (divId, options) {
                var $div = $("#" + divId);
                /* 遍历所有配置了data-gaea-data的元素 */
                $div.find("[data-gaea-ui]").each(function (index, element) {
                    var $this = $(this);// 默认是下拉选择框，其实可能不是。
                    var uiStr = $this.data("gaea-ui");
                    var thisUI = gaeaString.parseJSON(uiStr);
                    var componentCtId = $this.attr("id");

                    /**
                     * 把数据转换为table显示
                     */
                    if (gaeaValid.isNotNull(thisUI.isbindGaeaData) && thisUI.isbindGaeaData) {
                        var dataStr = $this.data("gaea-data");
                        var dataConfig = gaeaString.parseJSON(dataStr);
                        if (gaeaString.equalsIgnoreCase(thisUI.component, GAEA_UI_DEFINE.UI.COMPONENT.TABLE)) {
                            // 获取数据
                            var dsData = gaeaData.dataSet.getDataByDomId(componentCtId);
                            // 初始化table
                            gaeaData.component.table.initData(componentCtId, dsData);
                        }
                    }
                });
            },
            /**
             * 在KO binding后再初始化。因为有些操作必须在binding后再初始化。
             * 例如：
             * table中的数据的操作，因为binding后KO才会把数据转为table的tr，所以针对数据的操作（例如：input的改名等），都需要在binding后进行。
             * @param containerId
             */
            initAfterBinding: function (containerId) {
                var $container = $("#" + containerId);
                /* 遍历所有配置了data-gaea-data的元素 */
                $container.find("[data-gaea-ui]").each(function (index, element) {
                    var $this = $(this);// 默认是下拉选择框，其实可能不是。
                    var uiStr = $this.data("gaea-ui");
                    var thisUI = gaeaString.parseJSON(uiStr);
                    var componentCtId = $this.attr("id");// 遍历到当前组件的容器id，一般是一个divId

                    /**
                     * 把数据转换为table显示
                     */
                    //if(gaeaValid.isNotNull(thisUI.isbindGaeaData) && thisUI.isbindGaeaData) {
                    var dataStr = $this.data("gaea-data");
                    var dataConfig = gaeaString.parseJSON(dataStr);
                    if (gaeaString.equalsIgnoreCase(thisUI.component, GAEA_UI_DEFINE.UI.COMPONENT.TABLE)) {
                        if (gaeaValid.isNull(dataConfig.name)) {
                            throw "gaea-ui对应的gaea-data的name属性不允许为空！";
                        }
                        gaeaData.component.table.initAfterBinding(componentCtId, dataConfig);
                    }
                    //}
                });
            },
            /**
             * 这个是和KO binding密切相关的可行编辑的table。之所以不放在ui.grid中，是因为这个重度依赖KO提供行编辑功能。
             * 而且，重点不是在列表展示。所以一些效果的会比较简单，不会有什么排序之类的。
             *
             * 涉及按钮的生成。
             * table的建模和数组的observableArray。但没有binding。
             */
            table: {
                init: function (containerId) {
                    var that = this;
                    var $this = $("#" + containerId);
                    var $tbody = $this.find("tbody");
                    var dataStr = $this.data("gaea-data");
                    var dataConfig = gaeaString.parseJSON(dataStr);
                    var name = dataConfig.name;// 整个table的变量名。data-gaea-data="name:'testList'...
                    if (gaeaValid.isNull(name)) {
                        throw "gaea-data未配置name属性，无法进行初始化！";
                    }

                    var toolbarDivName = name + "_toolbar";
                    var btnAddName = name + "_btn_add";
                    $this.append(_.template(gaeaUI.TEMPLATE.DIV.WITH_NAME)({
                        NAME: toolbarDivName,
                        ID: toolbarDivName,
                        CONTENT: "" // 这里不需要用到content。设个空即可。
                    }));
                    // 初始化 TOOLBAR
                    var gaeaToolbar = require("gaeajs-ui-toolbar");
                    gaeaToolbar.create({
                        renderTo: toolbarDivName,
                        buttons: [{
                            "id": btnAddName,
                            "name": btnAddName,
                            "htmlName": btnAddName,
                            "htmlId": btnAddName,
                            "htmlValue": "添加",
                            "type": null,
                            "href": null,
                            "linkViewId": null,
                            "linkComponent": null,
                            "viewName": "button",
                            "action": null
                        }]
                    });


                    //if (gaeaValid.isNotNull(name)) {
                    var array = new Array();
                    //options._viewModel[name]=new Array();
                    var tableDefine = gaeaGrid.tableGrid.getColumnDefine(containerId);
                    //// 根据定义，生成一个对象，对象各个属性为空
                    //var obj = {};
                    //$.each(tableDefine.columns, function (idx,column) {
                    //    obj[column.id] = "";
                    //});
                    // TODO 把按钮触发封装一下？
                    $("#" + btnAddName).click(function () {
                        // 根据定义，生成一个对象，对象各个属性为空
                        var obj = {};
                        /**
                         * 根据column的定义，拼凑一个带有各种属性的空的对象。例如：
                         * { id:'', name:'', age:''}
                         * 这其中的id,name,age等属性需要从column定义中获取.
                         */
                        obj = gaeaData.createEmptyObject(tableDefine.columns);
                        //$.each(tableDefine.columns, function (idx,column) {
                        //    obj[column.id] = "";
                        //});
                        //options._viewModel[name].push(obj);// push后，由于KO binding了，所以table会多出一行
                        gaeaData.viewModel[name].push(obj);// push后，由于KO binding了，所以table会多出一行

                        // 找到最后一行，把里面的input的name属性修改掉
                        var trCount = $tbody.children("tr").length;
                        var rowIdx = trCount - 1;
                        $.each($tbody.children("tr:last").find("td input"), function (idx, val) {
                            var nameVal = $(this).attr("name");
                            gaeaData.component.table.resetName($(this), {
                                ARRAY_NAME: name,
                                ARRAY_INDEX: rowIdx,
                                NAME: nameVal
                            });
                        });
                    });

                    /* 创建定义行！！这一行只是定义用（各个列的data-bind），如果结合了KO，就会把这一行隐藏，然后push的新数据，就会以这一行的模板进行添加。 */

                    // 创建第一行，并添加相关列的KO binding
                    that.appendTrWithBinding($tbody, tableDefine.columns);
                    // 增加行编辑的删除方法。依赖KO。
                    that.initRemoveFunction(name);
                    // 初始化第一行（模板行）的序号列。（本来想用来做行删除，不过后来用了KO的方法就不用了）
                    that.firstTR.initSequence(containerId);
                    // 初始化第一行(模板行)的按钮区,并默认添加删除按钮.
                    that.firstTR.initRowButtons(containerId, that.getRemoveFunctionName(name));
                    gaeaData.dataBind.bindForEach($tbody, name);
                    //options._viewModel[name] = ko.observableArray(array);
                    gaeaData.viewModel[name] = ko.observableArray(array);
                    /**
                     * 填充数据
                     */
                    //if(gaeaValid.isNotNull(data)){
                    //    if(_.isArray(data)){
                    //        $.each(data, function (key, val) {
                    //            options._viewModel[name].push(val);
                    //        });
                    //    }else {
                    //        options._viewModel[name].push(data);
                    //    }
                    //    //var TRs = $tbody.children("tr");
                    //    //console.log("row count: "+TRs.length);
                    //    // 把填充的数据的name属性修改掉。按照数组的方式命名。
                    //    //$.each($tbody.children("tr"), function (trIdx,tr) {
                    //    //    console.log("idx: "+trIdx);
                    //    //    $.each($(tr).find("td input"), function (idx, val) {
                    //    //        var nameVal = $(this).attr("name");
                    //    //        gaeaData.component.table.resetName($(this),{
                    //    //            ARRAY_NAME:name,
                    //    //            ARRAY_INDEX:trIdx,
                    //    //            NAME:nameVal
                    //    //        });
                    //    //    });
                    //    //});
                    //}
                },
                initData: function (containerId, data) {
                    var $this = $("#" + containerId);
                    var dataStr = $this.data("gaea-data");
                    var dataConfig = gaeaString.parseJSON(dataStr);
                    var name = dataConfig.name;// 整个table的变量名。data-gaea-data="name:'testList'...
                    if (gaeaValid.isNull(name)) {
                        throw "gaea-data未配置name属性，无法进行初始化！";
                    }
                    /**
                     * 填充数据
                     */
                    if (gaeaValid.isNotNull(data)) {
                        if (_.isArray(data)) {
                            $.each(data, function (key, val) {
                                //options._viewModel[name].push(val);
                                gaeaData.viewModel[name].push(val);
                            });
                        } else {
                            //options._viewModel[name].push(data);
                            gaeaData.viewModel[name].push(data);
                        }
                    }
                },
                initAfterBinding: function (containerId, gaeaDataConfig) {
                    // 把填充的数据的name属性修改掉。按照数组的方式命名。
                    this.resetNames(containerId, gaeaDataConfig.name);
                },
                /**
                 * 把table中所有input的name，根据gaea-data定义的name，改掉。
                 * 即：
                 * table下所有input，都会加上table的gaea-data定义的name作为前缀，并转换为数组形式。
                 * @param containerId
                 * @param name
                 */
                resetNames: function (containerId, name) {
                    // 把填充的数据的name属性修改掉。按照数组的方式命名。
                    var $tbody = $("#" + containerId).find("tbody");
                    //var name = "testList";
                    $.each($tbody.children("tr"), function (trIdx, tr) {
                        console.log("idx: " + trIdx);
                        $.each($(tr).find("td input"), function (idx, val) {
                            var nameVal = $(this).attr("name");
                            gaeaData.component.table.resetName($(this), {
                                ARRAY_NAME: name,
                                ARRAY_INDEX: trIdx,
                                NAME: nameVal
                            });
                        });
                    });
                },
                /**
                 * 往给定id容器的最后，append一行。列以conlumnsDefine定义拼凑，附带data-bind。
                 * @param $container JQuery对象。一般是tbody。
                 */
                appendTrWithBinding: function ($container, columnsDefine) {
                    //var $container = $("#"+$container);
                    if (gaeaValid.isNull($container)) {
                        throw "缺少目标对象，例如tbody，无法append TR.";
                    }
                    $container.append(templates.HTML.TR);
                    var dataBindTemplate = _.template(templates.dataBind.VALUE);
                    $.each(columnsDefine, function (idx, column) {
                        //var nameVal = name + "[0]."+column.id;
                        var nameVal = column.id;// 这只是个base name。因为这个是列表，为了和服务端配合，name还得加上前缀和下标才能注入List。
                        //if(!column.hidden){
                        var tdTemplate = _.template(templates.HTML.TD_WITH_INPUT);
                        $container.children("tr").append(tdTemplate({
                            ID: column.id,
                            NAME: nameVal,
                            DATA_BIND: dataBindTemplate({
                                VALUE: column.id
                            })
                        }));
                    });
                },
                /**
                 * 第一行（模板行）的相关方法
                 */
                firstTR: {
                    /**
                     * 1. 给table增加一个排序列
                     * 2. 增加最后的命令操作区。增加删除行的按钮，点击删除一行。
                     * @param containerId
                     * @param removeFunctionName
                     */
                    initRowButtons: function (containerId, removeFunctionName) {
                        var that = this;
                        //var $thRow = $("#"+containerId).find("thead tr");
                        //$thRow.prepend("<th>序号</th>");

                        var $tbody = $("#" + containerId).find("tbody");
                        //var tdTemplate = _.template(templates.HTML.TD_WITH_DATABIND);
                        var removeButtonTemplate = _.template(templates.HTML.SPAN_REMOVE_BUTTON);
                        // 给data-bind模板行的最前面，加一个排序列。主要是获取序号做删除。
                        $tbody.children("tr").append(removeButtonTemplate({
                            DATA_BIND: "click: $parent." + removeFunctionName   // 这是KO的方法。$parent 是ko的内置变量.
                        }));
                    },
                    /**
                     * 初始化序号的列
                     * @param containerId
                     */
                    initSequence: function (containerId) {
                        var $thRow = $("#" + containerId).find("thead tr");
                        $thRow.prepend("<th>序号</th>");

                        var $tbody = $("#" + containerId).find("tbody");
                        var tdTemplate = _.template(templates.HTML.TD_WITH_DATABIND);
                        // 给data-bind模板行的最前面，加一个序号列。主要是获取序号做删除。
                        $tbody.children("tr").prepend(tdTemplate({
                            DATA_BIND: "text: $index" // $index 是KO的内部变量
                        }));
                    }
                },
                /**
                 * 定义行编辑的移除行的方法名。因为可能一个编辑页有多个行编辑table,不想相互的删除行方法混淆.
                 * 因为如果名字不作区分,都是调用 $parent.remove()
                 * 方法命名规则:
                 * 用该行编辑table的name + "_remove"
                 * @param name
                 * @returns {string}
                 */
                getRemoveFunctionName: function (name) {
                    return name + "_remove";
                },
                /**
                 * 基于KO binding的移除一个列表的某行。列表应该是基于KO foreach生成。
                 * @param name
                 */
                initRemoveFunction: function (name) {
                    var that = this;
                    var removeFunctionName = that.getRemoveFunctionName(name);
                    //options._viewModel[removeFunctionName] = function () {
                    //    options._viewModel[name].remove(this);// 这个是利用了KO的特性。如果没有用ko binding应该是不行的。
                    //};
                    gaeaData.viewModel[removeFunctionName] = function () {
                        gaeaData.viewModel[name].remove(this);// 这个是利用了KO的特性。如果没有用ko binding应该是不行的。
                    };
                },
                /**
                 * 把某对象（例如，一个input，或者div）的name属性改掉。
                 * @param $target jquery对象。要改name属性的对象。
                 * @param options
                 ARRAY_NAME:name,   // 数组名
                 ARRAY_INDEX:rowIdx, // 数组下标
                 NAME:nameVal // 真正的名字
                 */
                resetName: function ($target, options) {
                    var nameVal = $target.attr("name");
                    var nameTemplate = _.template("<%=ARRAY_NAME %>[<%=ARRAY_INDEX %>].<%=NAME %>");
                    nameVal = nameTemplate(options);
                    $target.attr("name", nameVal);
                }
            }
        };
        /**
         * 把 data 填充到 divId 中的字段中去（input,textarea,select等）
         * @param divId
         * @param dataObj 一个json对象，不是数组。例如：{"id":"3","NAME":"资源管理"}
         */
        gaeaData.fieldData = {
            init: function (divId, dataObj) {
                if (gaeaValid.isNull(divId)) {
                    console.log("divId为空，无法定位要初始化数据的位置！数据填充失败！");
                    return null;
                }
                if (_.isArray(dataObj)) {
                    console.log(_.template("数据填充要求传入的数据为对象，不是数组！放弃填充当前数据：\n<%= data%>")({data: JSON.stringify(dataObj)}));
                    return;
                }
                gaeaData.fieldData._setValue(divId, dataObj);
            },
            _setValue: function (divId, dataObj) {
                var $div = $("#" + divId);
                // 遍历对象里的每一个属性和值
                $.each(dataObj, function (key, val) {
                    if (_.isArray(val)) {
                        $.each(val, function (idx, val2) {
                            gaeaData.fieldData._setValue(divId, val2);
                        });
                    } else {
                        gaeaData.fieldData._setFieldValue($div, key, val);
                    }
                });
            },
            _setFieldValue: function ($div, objKey, objValue) {
                if (gaeaValid.isNull(objKey) || gaeaValid.isNull(objValue)) {
                    return;
                }
                // 遍历DIV下的所有field，查看是否有对应的可以设置值
                $div.find("input,textarea").each(function (index, element) {
                    var $thisElement = $(this);
                    var attrNamVal = $thisElement.attr("name");// 元素的name属性值
                    // 检查JSON数据中是否有该字段存在
                    var hasDataKey = gaeaString.equalsIgnoreCase(attrNamVal, objKey);
                    if (hasDataKey) {
                        $thisElement.val(objValue);
                        return false;// 跳出循环
                    }
                });

            }
        };
        /**
         * 通过通用查询接口，查询数据。
         * @param options
         *              url 请求地址
         *              conditions 查询条件。格式为json字符串（非对象，切记！）
         *              dsId 数据集id
         *              isAsync 是否异步调用。默认false，即同步调用。
         *              success 完成后的回调
         * @returns {*}
         */
        gaeaData.getData = function (options) {
            var result = null;
            var isAsync = false;
            var url = SYS_URL.QUERY.BY_CONDITION;// default
            if (gaeaValid.isNotNull(options.url)) {
                url = options.url;
            }
            if (gaeaValid.isNotNull(options.isAsync) && _.isBoolean(options.isAsync)) {
                isAsync = options.isAsync;
            }
            // 数据加载要求同步
            gaeaAjax.ajax({
                url: url,
                async: isAsync,
                data: options,
                success: function (data) {

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

                    //result = data[0];
                    // 用查询结果，刷新数据列表
                    //ur.component.bridge.grid.refreshData(data);
                    //alert("成功");
                },
                fail: function (data) {
                    alert("加载数据集 '" + options.dsId + "' 失败.");
                }
            });
            return result;
        };
        /**
         * 和绑定相关的通用操作
         */
        gaeaData.dataBind = {
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
            getIdPrefix: function (bindSelectId, dataSetId) {
                var idPrefix = bindSelectId + "_" + _s.camelize(dataSetId.toLocaleLowerCase(), true);
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
            },
            getPageContextValue: function (name) {
                var $pageContext = PAGE_CONTEXT;
                var value = null;
                if (gaeaValid.isNotNull(name)) {
                    if (_s.startsWith(name, "$pageContext.")) {
                        value = eval(name);
                    }
                    if (gaeaValid.isNull(value)) {
                        value = PAGE_CONTEXT[name];
                    }
                }
                return value;
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
             */
            createComputeObj: function (options) {
                var data = options.data;
                var selectedObj = gaeaData.select.getBindObjName(options.bindSelectId, options.dataset);
                var selectedName = gaeaData.select.getSelectedName(options.bindSelectId, options.dataset);
                gaeaData.viewModel[selectedObj] = ko.computed(function () { // 通过中间变量，遍历数组查找对象。再触发页面更新。
                    var standardObj = gaeaData.utils.newObject(options.dataDefine);
                    if (gaeaValid.isNull(data) || !_.isArray(data)) {
                        return standardObj;
                    }
                    var result = ko.utils.arrayFirst(data, function (item) {
                        //console.log("item name:" + item.value + " self name:" + viewModel[selected]());
                        // 一开始viewModel[selected]是没用值的，undefined。这个时候需要初始化，返回一个对象，否则会出错！！( ERROR : unable to process binding value function () return order seq cannot read property of null )
                        if (gaeaValid.isNull(gaeaData.viewModel[selectedName]())) {
                            return _.first(data);
                        }
                        return item.value === gaeaData.viewModel[selectedName]();
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