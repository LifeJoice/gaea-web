/**
 * Created by iverson on 2016/2/14.
 * 今天起，开始重构UR创建的一套前端js框架。重新以gaea命名。另外基于RequireJS的模块化。
 *
 * DEPENDENCE:
 * RequireJS,JQuery
 */
define(["jquery", "underscore", 'underscore-string', "knockoutJS", 'gaeajs-common-utils-validate', 'gaeajs-common-utils-string', "gaeajs-common-utils-ajax",
        "gaea-system-url", 'gaeajs-ui-notify'],
    function ($, _, _s, ko, gaeaValid, gaeaString, gaeaAjax, SYS_URL, gaeaNotify) {
        var options = {
            dataset: null,// 结果集名称
            /* 结果集的对象别名。会在结果集的每个结果的key前加上别名。
             * 主要是页面的元素的名字也可能会用user.name这样的基于对象的命名，所以结果集名称可以做对应。
             */
            aliasObjName: null,
            _viewModel: {}
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
                    if (gaeaValid.isNotNull(configOptions.dataset)) {
                        gaeaAjax.post({
                            url: SYS_URL.DATA.DATASET.GET,
                            data: {
                                dsId: configOptions.dataset,
                                aliasObjName: configOptions.aliasObjName
                            },
                            success: function (data) {
                                var viewModel = root.select.initData(dataSetId,data, $select, $formDiv);
                                options._viewModel = _.extend(options._viewModel, viewModel);
                                //var result = $.parseJSON(jqXHR.responseText);
                                // 用查询结果，刷新数据列表
                            },
                            fail: function (data) {
                                gaeaNotify.error(_.template("加载数据集<%= dsName %>失败!")({dsName:configOptions.dataset}));
                            }
                        });
                    }
                });
                // 在所有的ajax请求后再绑定KO。否则多个DATASET的时候会导致重复绑定出错。
                $(document).ajaxStop(function () {
                    // 应用于KnockoutJS
                    ko.applyBindings(options._viewModel);
                });
            },
            select: {
                initData: function (config,data, $select, $formDiv) {
                    var viewModel = {};
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
                    viewModel[selectOptions] = data;
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
                                //}else{
                                //    var test = viewModel[selectedObj];
                                //    console.log(test());
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
                    $formDiv.find("input,textarea").each(function (index, element) {
                        var $self = $(this);
                        var elementName = $(this).attr("name");
                        console.log("element name: " + elementName);
                        // 检查JSON数据中是否有该字段存在
                        var hasDataKey = _.has(data[0], elementName);
                        console.log("has key : " + hasDataKey);
                        if (hasDataKey) {
                            $self.attr("data-bind", "value:" + selectedObj + "()." + elementName);
                        }
                    });
                    //$select.attr("data-bind", "options:selectData,optionsText:'text',optionsValue:'value'");
                    // 各字段绑定的是user，但通过上面的value不能直接指定user，必须通过中间变量找到对象。然后再触发下面的更新。
                    //$("#userId").attr("data-bind", "value:user().userId");
                    //$("#address").attr("data-bind", "value:user().address");
                    // 应用于KnockoutJS
                    //ko.applyBindings(new viewModel());
                    //})

                    //ko.applyBindings(koViewModel);
                    //var dataFor = ko.dataFor($("#createOrEditDialog")[0]);
                    //var contextFor = ko.contextFor($("#createOrEditDialog").get());
                    return viewModel;
                }
            },
            _binding: function () {

            }
        };
        return gaeaData;
    });