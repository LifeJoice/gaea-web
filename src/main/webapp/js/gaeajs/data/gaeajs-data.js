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
define(["jquery", "underscore", 'underscore-string', "knockoutJS", 'gaeajs-common-utils-validate', 'gaeajs-common-utils-string', "gaeajs-common-utils-ajax",
        "gaea-system-url", 'gaeajs-ui-notify'],
    function ($, _, _s, ko, gaeaValid, gaeaString, gaeaAjax, SYS_URL, gaeaNotify) {
        var options = {
            dataset: null,// 结果集名称
            /*
             * 数据集绑定的前缀，针对input（等）name的前缀（例如：user.name,bindPrefix='user.')
             * 主要是页面的元素的名字也可能会用user.name这样的基于对象的命名，所以结果集名称可以做对应。
             */
            bindPrefix: null,
            _viewModel: {}
        };

        var templates = {
            dataBind: {
                SIMPLE: "value: <%= bindObject %>().<%= elementName %>"
            }
        };

        var gaeaData = {
            scanAndInit: function (divId) {
                var root = this;
                var $formDiv = $("#" + divId);
                /* 遍历所有配置了data-gaea-data的元素 */
                $formDiv.find("[data-gaea-data]").each(function (index, element) {
                    var $select = $(this);// 默认是下拉选择框，其实可能不是。
                    var gaeaDataStr = $(this).data("gaea-data");
                    console.log("scan gaea form data. gaea-data : " + gaeaDataStr);
                    //var elementCo = ;
                    // 把元素的gaea-data配置转成对象，并和默认配置合并。
                    var configOptions = _.extend(options, gaeaString.parseJSON(gaeaDataStr));
                    options = configOptions;
                    var dataSetId = configOptions.dataset;
                    var bindPrefix = configOptions.bindPrefix;
                    if (gaeaValid.isNotNull(configOptions.dataset)) {
                        gaeaAjax.post({
                            url: SYS_URL.DATA.DATASET.GET,
                            data: {
                                dsId: configOptions.dataset
                            },
                            success: function (data) {
                                var viewModel = root.select.initData(dataSetId, data, $select, $formDiv, bindPrefix);
                                options._viewModel = _.extend(options._viewModel, viewModel);
                                //var result = $.parseJSON(jqXHR.responseText);
                                // 用查询结果，刷新数据列表
                            },
                            fail: function (data) {
                                gaeaNotify.error(_.template("加载数据集<%= dsName %>失败!")({dsName: configOptions.dataset}));
                            }
                        });
                    }
                });
                // 在所有的ajax请求后再绑定KO。否则多个DATASET的时候会导致重复绑定出错。
                $(document).ajaxStop(function () {
                    // 应用于KnockoutJS
                    if (!root._isBinded($formDiv)) {
                        ko.applyBindings(options._viewModel, $formDiv[0]);
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
             * 解除绑定。
             * @param divId
             */
            unbind: function (divId) {
                var $formDiv = $("#" + divId);
                ko.cleanNode($formDiv[0]);
            },
            select: {
                initData: function (config, data, $select, $formDiv, bindPrefix) {
                    var viewModel = {};
                    var root = this;
                    /**
                     * 把数据集的名称，转换为驼峰命名的变量名，
                     * 然后作为当前这个下拉框的所有ko binding的一个标志（例如，参与到所有的自动生成变量的命名中）
                     */
                    var idPrefix = _s.camelize(config.toLocaleLowerCase(), true) + "_";
                    console.log("idprefix: " + idPrefix + " test: " + _s.camelize("gaeaDataSetManagement", true));
                    var dataStr = JSON.stringify(data);
                    console.log("before clean: " + dataStr);
                    //$(data).each(function (index, element) {
                    // 定义一个ViewModel
                    var selectOptions = idPrefix + "options";
                    var selected = idPrefix + "selected";
                    var selectedObj = idPrefix + "Obj";
                    viewModel[selectOptions] = ko.observableArray(data);
                    viewModel[selected] = ko.observable();// 这个就是中间变量
                    /**
                     * 计算对象，根据下拉框选中的值去json数据中找对应的对象。代表下拉选择的对象。例如user。
                     * 再把对象的属性和表单的各个字段绑定。例如：(user)name,address,phone...
                     * ko.computed在加载的时候就会运行一次了！切记！这个时候如果返回undefined，会导致页面错误！
                     */
                    viewModel[selectedObj] = ko.computed(function () { // 通过中间变量，遍历数组查找对象。再触发页面更新。
                        var result = ko.utils.arrayFirst(data, function (item) {
                            //console.log("item name:" + item.value + " self name:" + viewModel[selected]());
                            // 一开始viewModel[selected]是没用值的，undefined。这个时候需要初始化，返回一个对象，否则会出错！！( ERROR : unable to process binding value function () return order seq cannot read property of null )
                            if (gaeaValid.isNull(viewModel[selected]())) {
                                return _.first(data);
                            }
                            return item.value === viewModel[selected]();
                        });
                        return result;
                    });
                    // 初始化
                    // 下拉框的data-bind模板
                    var selectBindingTemplate = _.template("options:<%= selectOptionsName %>,optionsText:'text',optionsValue:'value',value:<%= selectedVarName %>");
                    // 应用模板
                    $select.attr("data-bind", selectBindingTemplate({
                        selectOptionsName: selectOptions,
                        selectedVarName: selected
                    }));
                    //var firstData = _.first(data);
                    gaeaData._bindHtmlField($formDiv, data[0], bindPrefix, selectedObj);
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
                }
            },
            _binding: function () {

            },
            /**
             * 绑定表单中的各个input（等）与数据集的联系。基于KO。
             * @param $formDiv
             * @param jsonObj
             * @param bindPrefix
             * @param bindObject
             * @private
             */
            _bindHtmlField: function ($formDiv, jsonObj, bindPrefix, bindObject) {
                $formDiv.find("input,textarea").each(function (index, element) {
                    var $self = $(this);
                    var fullName = $(this).attr("name");
                    var withoutpreName = fullName;
                    var bindTemplate = _.template(templates.dataBind.SIMPLE);
                    var datakeyMapsName = true;// 名字属性和数据集的key对应
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
                            bindObject: bindObject,
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
            }
        };
        return gaeaData;
    });