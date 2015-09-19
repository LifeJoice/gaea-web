/**
 * biz,商用的组件。例如：品类选择框、系列选择框。。。
 * DEPENDANCE:
 * ur-common,
 * AI.TODO 选择框部分的代码可以抽出来公用。
 * @type type
 * @since 2014年7月21日 星期一
 * @author Iverson
 */
ur.component.biz = {
    /**
     * 系列
     * @type type
     * @createTime 2014年7月23日 星期三
     * @author Iverson
     */
    clothesSerial: {
        options: {
            containerId: null, // 组件容器的id。例如：一个div的id。
            key: {
                id: null, // 选择框的id属性
                name: null                   // 选择框的name属性
            },
            id: null, // 系列名隐藏输入框的id属性。
            name: null, // 系列名隐藏输入框的name属性。
            defaultSelected: {// 需要默认选中的值。可以是id，也可以是值。但id优先。
                id: null,
                value: null
            }
        },
        create: function(options) {
            this.options = options;
            var that = this;
            var selector = "#" + this.options.containerId;
            var defaultCatName;
            var htmlContent =
                    "<select id=\"" + this.options.keyId + "\" name=\"" + this.options.keyName + "\">\n";
//                        + "    <option value=\"\" selected=\"selected\"></option>\n";
            // 获取系列
            ur.utils.ajax.ajax({
                url: "/component/biz/dict/master/list-clothes-serial.do",
                async: false,
                success: function(data, textStatus, jqXHR) {
                    $.each(data, function(index) {
                        if (index === 0) {
                            defaultCatName = this.mname;
                        }
//                            console.log("name=" + this.mname);
                        // 每个系列形成一个选项
                        htmlContent += "    <option value=\"" + this.mkey + "\"";
                        // 是否设置默认选择，如果和当前项一致则选中
                        if (ur.utils.validate.isNotNull(that.options.defaultSelectedValue)
                                && that.options.defaultSelectedValue === this.mkey) {
                            defaultCatName = this.mname;
                            htmlContent += " selected=\"selected\"";
                        }
                        htmlContent += ">" + this.mname + "</option>\n";
                    })
                }
            });
            htmlContent += "</select>\n";
            // 拼凑系列名隐藏输入框。保存系列名。
            htmlContent += "<input type=\"hidden\" id=\"" + this.options.id + "\" name=\"" + this.options.name + "\" value=\"" + defaultCatName + "\">";
            // 给选择加上事件。选择的时候给系列名赋值。
            var sltSelector = "#" + this.options.keyId;     // 选择框
            var inputSelector = "#" + this.options.id;      // 隐藏输入框
            $(selector).html(htmlContent);
            $(sltSelector).on("change", function() {
                console.log("select value=" + $(sltSelector).find("option:selected").text());
                $(inputSelector).val($(sltSelector).find("option:selected").text());
            });
        }
    },
    /**
     * 品类组件
     * @type type
     * @author Iverson
     */
    clothesCategory: {
        options: {
            containerId: null,
            keyId: null, // 选择框的id属性
            keyName: null, // 选择框的name属性
            id: null, // 品类名隐藏输入框的id属性。
            name: null, // 品类名隐藏输入框的name属性。
            defaultSelectedValue: null
        },
        create: function(options) {
            this.options = options;
            var that = this;
            var selector = "#" + this.options.containerId;
            var defaultCatName;
            var htmlContent =
                    "<select id=\"" + this.options.keyId + "\" name=\"" + this.options.keyName + "\">\n";
//                        + "    <option value=\"\" selected=\"selected\"></option>\n";
            // 获取品类
            ur.utils.ajax.ajax({
                url: "/component/biz/dict/master/list-clothes-category.do",
                async: false,
                success: function(data, textStatus, jqXHR) {
                    $.each(data, function(index) {
                        if (index === 0) {
                            defaultCatName = this.mname;
                        }
//                            console.log("name=" + this.mname);
                        // 每个品类形成一个选项
                        htmlContent += "    <option value=\"" + this.mkey + "\"";
                        // 是否设置默认选择，如果和当前项一致则选中
                        if (ur.utils.validate.isNotNull(that.options.defaultSelectedValue)
                                && that.options.defaultSelectedValue === this.mkey) {
                            defaultCatName = this.mname;
                            htmlContent += " selected=\"selected\"";
                        }
                        htmlContent += ">" + this.mname + "</option>\n";
                    })
                }
            });
            htmlContent += "</select>\n";
            // 拼凑品类名隐藏输入框。保存品类名。
            htmlContent += "<input type=\"hidden\" id=\"" + this.options.id + "\" name=\"" + this.options.name + "\" value=\"" + defaultCatName + "\">";
            // 给选择加上事件。选择的时候给品类名赋值。
            var sltSelector = "#" + this.options.keyId;     // 选择框
            var inputSelector = "#" + this.options.id;      // 隐藏输入框
            $(selector).html(htmlContent);
            $(sltSelector).on("change", function() {
                console.log("select value=" + $(sltSelector).find("option:selected").text());
                $(inputSelector).val($(sltSelector).find("option:selected").text());
            });
        }
    },
    /**
     * 供应商
     * @type type
     * @author Iverson
     * @createTime 2014年7月24日 星期四
     */
    supplier: {
        options: {
            containerId: null, // 组件容器的id。例如：一个div的id。
            htmlElement: {
                select: {
                    id: null,// 选择框的id属性
                    name: null// 选择框的name属性
                },
                hiddenInput: [{
                        id: null,// 供应商名隐藏输入框的id属性。
                        name: null// 供应商名隐藏输入框的name属性。
                    }]
            },
            defaultSelected: {// 需要默认选中的值。可以是id，也可以是值。但id优先。
                id: null,
                value: null
            }
        },
        create: function(options) {
            this.options = options;
            var that = this;
            var selector = "#" + this.options.containerId;
            var defaultName;
            var htmlContent =
                    "<select id=\"" + this.options.htmlElement.select.id + "\" name=\"" + this.options.htmlElement.select.name + "\">\n";
//                        + "    <option value=\"\" selected=\"selected\"></option>\n";
            // 获取供应商
            ur.utils.ajax.ajax({
                url: "/component/biz/supplier/list.do",
                async: false,
                success: function(data, textStatus, jqXHR) {
                    $.each(data, function(index) {
                        if (index === 0) {
                            defaultName = this.name;
                        }
//                            console.log("name=" + this.name);
                        // 每个供应商形成一个选项
                        htmlContent += "    <option value=\"" + this.id + "\"";
                        // 是否设置默认选择，如果和当前项一致则选中
                        if (ur.utils.validate.isNotNull(that.options.defaultSelectedValue)
                                && that.options.defaultSelectedValue === this.id) {
                            defaultName = this.name;
                            htmlContent += " selected=\"selected\"";
                        }
                        htmlContent += ">" + this.name + "</option>\n";
                    })
                }
            });
            htmlContent += "</select>\n";
            // 拼凑供应商名隐藏输入框。保存供应商名。
            if ($.isArray(this.options.htmlElement.hiddenInput) && this.options.htmlElement.hiddenInput.length > 0) {
                for (var i = 0; i < this.options.htmlElement.hiddenInput.length; i++) {
                    var inputElement = this.options.htmlElement.hiddenInput[i];
                    htmlContent += "<input type=\"hidden\" id=\"" + inputElement.id + "\" name=\"" + inputElement.name + "\" value=\"" + defaultName + "\">";
                }
            }
            // 给选择加上事件。选择的时候给供应商名赋值。
            var sltSelector = "#" + this.options.keyId;     // 选择框
            var inputSelector = "#" + this.options.id;      // 隐藏输入框
            $(selector).html(htmlContent);
            $(sltSelector).on("change", function() {
                console.log("select value=" + $(sltSelector).find("option:selected").text());
                $(inputSelector).val($(sltSelector).find("option:selected").text());
            });
        }
    },
    /**
     * 加工方式
     * @type type
     * @author Iverson
     * @createTime 2014年7月29日 星期二
     */
    mfgType: {
        options: {
            containerId: null, // 组件容器的id。例如：一个div的id。
            htmlElement: {
                select: {
                    id: null,// 选择框的id属性
                    name: null// 选择框的name属性
                },
                hiddenInput: [{
                        id: null,// 加工方式隐藏输入框的id属性。
                        name: null// 加工方式隐藏输入框的name属性。
                    }]
            },
            defaultSelected: {// 需要默认选中的值。可以是id，也可以是值。但id优先。
                id: null,
                value: null
            }
        },
        create: function(options) {
            this.options = options;
            var that = this;
            var selector = "#" + this.options.containerId;
            var defaultName;
            var htmlContent =
                    "<select id=\"" + this.options.htmlElement.select.id + "\" name=\"" + this.options.htmlElement.select.name + "\">\n";
//                        + "    <option value=\"\" selected=\"selected\"></option>\n";
            // 获取所以加工方式类型
            ur.utils.ajax.ajax({
                url: "/component/biz/dict/master/list-mfg-type.do",
                async: false,
                success: function(data, textStatus, jqXHR) {
                    $.each(data, function(index) {
                        if (index === 0) {
                            defaultName = this.mname;
                        }
//                            console.log("name=" + this.name);
                        // 每个供应商形成一个选项
                        htmlContent += "    <option value=\"" + this.mkey + "\"";
                        // 是否设置默认选择，如果和当前项一致则选中
                        if (ur.utils.validate.isNotNull(that.options.defaultSelectedValue)
                                && that.options.defaultSelectedValue === this.mkey) {
                            defaultName = this.mname;
                            htmlContent += " selected=\"selected\"";
                        }
                        htmlContent += ">" + this.mname + "</option>\n";
                    })
                }
            });
            htmlContent += "</select>\n";
            // 拼凑加工方式隐藏输入框。保存加工方式。
            if ($.isArray(this.options.htmlElement.hiddenInput) && this.options.htmlElement.hiddenInput.length > 0) {
                for (var i = 0; i < this.options.htmlElement.hiddenInput.length; i++) {
                    var inputElement = this.options.htmlElement.hiddenInput[i];
                    htmlContent += "<input type=\"hidden\" id=\"" + inputElement.id + "\" name=\"" + inputElement.name + "\" value=\"" + defaultName + "\">";
                }
            }
            // 给选择加上事件。选择的时候给加工方式赋值。
            var sltSelector = "#" + this.options.keyId;     // 选择框
            var inputSelector = "#" + this.options.id;      // 隐藏输入框
            $(selector).html(htmlContent);
            $(sltSelector).on("change", function() {
                console.log("select value=" + $(sltSelector).find("option:selected").text());
                $(inputSelector).val($(sltSelector).find("option:selected").text());
            });
        }
    }
}