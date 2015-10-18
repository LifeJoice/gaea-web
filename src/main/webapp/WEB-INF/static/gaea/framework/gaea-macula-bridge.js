/**
 * DEPENDANCE:
 * JQuery, gaea-common-utils.js
 * JQuery-UI,gaea-jquery.ui.dialog.custom.js
 * @since 2015年7月3日 星期五
 * @author Iverson
 */

gaea.component.bridge = {
    dialog: {
        options: {
            id: null,
            title: null,
            renderTo: null,
            width: null,
            height: null,
            maxHeight: 550, // 最大高度。这个关系自动生产高度的弹出框的最大高度。
            injectHtmlId: null,
            formId: null,
            okText: null,
            cancelText: null,
            autoOpen: false,
            resizable: true,
            // callback
            success: null,
            fail: null,
            cancel: null,
            buttons: {}
        },
        // 基于form普通弹出框
        create: function (argOptions) {
            this.options = argOptions;
            var dialog = this._createDialog();
            return dialog;
            // 设置要注入dialog的表单id（一般来说是表单id）。否则弹出框就没内容显示了。
            //dialog.contentEl = this.options.injectHtmlId;
            //dialog.show();
        },
        open: function (jqSelector) {
            $(jqSelector).urDialog("open");
        },
        close: function (jqSelector) {
            $(jqSelector).urDialog("close");
        },
        _createDialog: function () {
            var that = this;
            var dialogDivSelector = "#" + this.options.id;
            //初始化弹出框
            var dialog = $(dialogDivSelector).urDialog({
                autoOpen: this.options.autoOpen,
                resizable: this.options.resizable,
                width: this.options.width,
                height: this.options.height,
                title: this.options.title,
                modal: true,
                buttons: this.options.buttons
            });
//        },
            // 老的实现，基于ExtJS 3.自动根据form内容调整高度。
//        _urAutoSizeFormDialog: function(options) {
//            var dataSelector = "#" + options.formId;
//            /* 如果没有设定大小，自动根据内容计算弹出框大小 */
//            if (ur.utils.validate.isNull(this.options.height)) {
//                var formInputSelector = dataSelector + " input,select";
//                // 表单输入项的个数
//                var inputCount = $(formInputSelector).not("input[type='hidden']").length;
//                // 输入框个数 * (输入框高度20 + 框间距5) + 最下面距离5
//                var h = inputCount * (20 + 5) + 5;
//                h += 70;    // 70是给弹出框title和操作区的。
//                this.options.height = h > this.options.maxHeight ? this.options.maxHeight : h;
//            }
//            /* 如果没有传入fail方法，则创建默认的fail方法 */
//            if (!$.isFunction(options.fail)) {
//                options.fail = function(jqXHR) {
//                    var data = $.parseJSON(jqXHR.responseText);
//                    // 显示后台传来的错误信息，可能是抛出的异常信息。
//                    ur.utils.message.show(data);
//                }
//            }
//            /* 生成UR定制的JQuery UI的弹出框 */
//            var dialog = $("#mydialog").urDialog({
//                    autoOpen: false,
//                    resizable: true,
//                    width: 500,
//                    height: 320,
//                    modal: true,
//                    buttons: {
//                        "确定": function () {
//                            $("#dateoffForm").submit();
//                            $(this).urDialog("close");
//                        },
//                        "取消": function () {
//                            $(this).urDialog("close");
//                        }
//                    }
//                });
//
//
//
//            var dialog = new Ext.Window({
//                title: options.title,
//                height: this.options.height,
//                width: 400,
//                layout: 'form', // Iverson setting
////                    layout: 'fit',
////        contentEl: config.htmlId, // 这个改为由具体方法自己设置。因为像确认框这种不需要表单信息。
//                buttons: [
//                    {
//                        text: options.okText,
//                        handler: function() {
//                            ur.utils.ajax.post({
//                                url: options.url,
//                                data: $(dataSelector).serializeObject(), // 把form的内容自动转成json请求
//                                success: options.success,
//                                fail: options.fail
//                            });
//                            // ---------------------- form data 请求方式 ----------------------
////                            options.success();
//                            dialog.hide();
//                        }
//                    },
//                    {
//                        text: options.cancelText,
//                        handler: function() {
//                            if ($.isFunction(options.cancel)) {
//                                options.cancel();
//                            }
//                            dialog.hide();
//                        }
//                    }]
//            });
            return dialog;
        }
    },
    /**
     * UR列表控件
     * @type type
     */
    grid: {
        options: {
            title: null,
            width: null,
            height: null,
            hidden: null,
            resizable: null,
            autoLoad: null,
            renderTo: null,
            data: null,             // json数据。直接初始化表格。
            model: {
                fields: {
                    id: null,
                    name: null
                },
                idProperty: null
            },
            columns: [
                {
                    text: null, // 表头的文字
                    name: null, // 预留字段
                    id: null,
                    width: null,
                    hidden: false,
                    resizable: false,
                    renderType: null, // 渲染的类型。例如如果字段是日期的，需要转变成日期格式显示。可选：date,time（未实现），datetime（未实现）
                    // callback
                    renderer: null          // 数据转换的拦截器
                }
            ],
            proxy: {
                url: null,
                headers: null,
                params: null
            },
            // 监听事件。例如：单击、双击、单击单元格等……
            listeners: {
                cellclick: null,
                select: null
            },
            page: {
                page: 1,
                size: 20,
                rowCount: 0,
                pageCount: 0
            }
        },
        cache: {
            selectedRow: null,
            hasCreatedRowHeadActions: false,     // 是否已经为grid列头创建了行前操作区列
            rows: [
                //{
                //    index: null,                 // 行下标。第几行。
                //    /**
                //     * headActions和endActions格式：
                //     * {
                //     *      type（必选）: 按钮（action）的类型。根据类型去生成对应的组件。例如：wf-diagram(查看定义的流程图），wf-active-diagram(当前记录对应的流程图）
                //     *      #其他属性#： 这个是可选的。由具体功能动态生成，然后丢给具体生成组件的方法去获取，去调用。
                //     * }
                //     */
                //    headActions: [],             // 每一行前面（一般是第二列）的操作区，或者按钮区。例如：查看工作流流程按钮等
                //    endActions: []               // 每一行最后面（一般是最后一列）的操作区，或者按钮区。例如：查看工作流流程按钮等
                //}
            ]
        },
        default: {
            css: {
                columnHeadWidthPadding: 5,
                gridTdPadding: 2
            }
        },
        create: function (options) {
            var that = this;
            this.options = options;
            if (!$.isArray(options.model.fields) || !$.isArray(options.columns)) {
                console.log("fields与columns必须是数组！");
                return;
            }
            if (options.model.fields.length !== options.columns.length) {
                console.log("fields与columns长度必须一致！");
                return;
            }
            var myColumns = new Array();
            var myFields = new Array();         // 这个是字段id的列表
            var pkColumnId;
//            for (var i = 0; i < options.columns.length; i++) {
//                var column = options.columns[i];
//                var field = options.model.fields[i];
//                /* 处理日期、时间类型的字段。产生日期类的column renderer方法。 */
//                if (!$.isFunction(column.renderer) && column.renderType === "date") {
//                    // ExtJS 3的列的renderer方式
//                    column.renderer = function(value, row) {
//                        if (ur.utils.validate.isNotNull(value)) {
//                            // 默认日期格式：yyyy-MM-dd
//                            return Ext.util.Format.date(new Date(parseInt(value)), 'Y-m-d')
//                        } else {
//                            return "";
//                        }
//                    }
//                } else if (!$.isFunction(column.renderer) && column.renderType === "link") { // 处理超链接的单元格渲染
//                    column.renderer = function(value, metaData, record, rowIndex, colIndex, store) {
////                        console.log("value=" + value + ",rowIndex=" + rowIndex + ",colIndex=" + colIndex);
//                        // 加上超链接
//                        value = "<a href='#'>" + value + "</a>";
//                        // 把单元格渲染成红色？就在这里……
//                        metaData.css = "ur-grid-cell-link";
//                        return value;
//                    }
//                }
//                // 构建ExtJs的字段id
//                myFields.push(field.id);
//                // 构建ExtJS的column数组。复合ExtJS的数组规范。
//                myColumns.push({
//                    id: column.id,
//                    header: column.text, // 列名。在ExtJS 4就是用text了。
//                    width: column.width, // 列宽
//                    hidden: column.hidden, // 是否显示列
//                    resizable: column.resizable,
//                    renderer: column.renderer
//                });
//            }

            /* --------------------------------------------------------------------------------------------------------- 华丽的分割线 -------------------------- */
            //var urGridId = "#" + options.renderTo;
            var grid = $("#" + options.renderTo);
            grid.append("<div class='gaea-grid'>" +
                "<div class='gaea-grid-header'><div id=\"mars-tb-head\" class=\"mars-tb-head\"></div></div>" +
                "<div class='gaea-grid-body'><table class='ur-gridtable'></table></div>" +
                "<div class='gaea-grid-footer'><div id=\"pagination\" class=\"pagination\"></div></div>" +
                "<input type='hidden' id='gridId' name='gridId' value='" + options.id + "'>" +
                "</div>");
            var tableHeadCT = $(".gaea-grid-header");
            var tableHead = $("#mars-tb-head");
            var tableBody = $(".ur-gridtable");
            var autoGenClassNamePrefix = "autogen-col-";
            var tdDefaultClasses = "grid-td";
            var colCssArray = new Array();
            var selectedRow;                                    // 如果点击了数据表中某行，记录该行
            /* 创建列表的表头 */
            this._createTableHead();
            /* 创建列表的数据部分 */
            this._createTableData();
            /* 创建Grid的脚部分页部分 */
            this._createFooter();
            /* 设置Grid样式 */
            this._applyCSS();
            //// 遍历column数组，设置显示样式（CSS等）
            //$.each(options.columns, function (idx, obj) {
            //    var col = this;
            //    var gridColumnId = "gridcolumn-" + (idx + 1);
            //    if (ur.utils.validate.isNotNull(col.width) && $.isNumeric(col.width)) {
            //        var jqSelector = "td[data-columnid=" + gridColumnId + "]";
            //        // 设置数据table的单元格的样式
            //        urGrid.find(jqSelector).children(".grid-td-div").css("width", col.width);
            //        // 设置列头的样式
            //        urGrid.find("#" + gridColumnId).find("p").css("width", col.width);
            //    }
            //    if (ur.utils.validate.isNotNull(col.hidden)) {
            //        if (col.hidden) {
            //            urGrid.find(jqSelector).css("display", "none");
            //            $("#" + gridColumnId).css("display", "none");
            //        }
            //    }
            //})
            this._bindingEvents();
            //// 绑定事件。点击行选中复选框。
            //tableBody.find("tr").click(function () {
            //    $(":checkbox[id^='urgrid-chb']").prop("checked", false);
            //    $(this).find("[id^='urgrid-chb']").prop("checked", "true");
            //    //console.log("rowindex: "+$(this).data("rowindex"));
            //    $(this).find("[id^='urgrid-chb']").val($(this).data("rowindex") - 1);
            //    selectedRow = options.data[($(this).data("rowindex") - 1)];
            //    selectedRow.index = $(this).data("rowindex");
            //    that._setSelectRow(selectedRow);
            //    options.listeners.select(selectedRow);
            //});
            /**
             * 高级查询
             */
                // TODO 这个应该可以放在上面一起初始化。
            tableHeadCT.append("<div id='mars-tb-head-query' class='mars-tb-head-query'>" +
                "<div id=\"mars-headquery-inputs\" class=\"mars-headquery-inputs\">" +
                "<div class='mars-headquery-column select-all'></div>" +                            // 占位块。为了和列头对上。
                "<div class='mars-headquery-column row-headactions'></div></div>" +                 // 占位块。为了和列头对上。
                "<div id=\"mars-headquery-actions\" class='mars-headquery-actions'></div>" +
                "</div>");
            this._initAdvancedQuery();
            /**
             * 行操作区
             */
            this._createRowActions();
            /* --------------------------------------------------------------------------------------------------------- WEB_FRAMEWORK的extJS代码 -------------------------- */
//            /* Model */
//            var colModel = new Ext.grid.ColumnModel({
//                columns: myColumns
//            });
//            /* Store */
//            var store = new Ext.data.JsonStore({
//                idProperty: options.model.idProperty, // 没有这个，就不能通过record.id获取行数据的id。
//                fields: myFields,
//                autoLoad: options.autoLoad,
//                baseParams: this.options.proxy.params,
//                proxy: new Ext.data.HttpProxy({
//                    type: "ajax",
//                    url: options.proxy.url,
//                    headers: options.proxy.headers,
//                    reader: {
//                        type: 'json'
//                    }
//                })
//            });
//            /* Grid */
//            grid = new Ext.grid.GridPanel({
//                id: "mygrid",
//                store: store,
//                colModel: colModel,
//                renderTo: options.renderTo,
//                sm: new Ext.grid.RowSelectionModel({singleSelect: true}),
//                width: 600,
//                height: 300,
//                frame: true,
//                title: '产品管理',
//                iconCls: 'icon-grid'
//            });
//            /* 添加事件相应 */
//            if (ur.utils.validate.isNotNull(this.options.listeners)
//                && ur.utils.validate.isNotNull(this.options.listeners.cellclick)) {
//                grid.on({
//                    cellclick: function(grd, rowIndex, columnIndex, e) {
//                        if (ur.utils.validate.isNotNull(that.options.listeners.cellclick)) {
////                        console.log(" grid on click ---->>> rowIndex=" + rowIndex + ",columnIndex=" + columnIndex);
//                            var record = grd.getStore().getAt(rowIndex);  // Get the Record
//                            var colModel = grd.getColumnModel();
//                            var colId = colModel.getColumnId(columnIndex);
//                            // 通过id获取点击的单元格的值。
//                            var value = record.get(colId);
//                            that.options.listeners.cellclick(value,record);
////                        console.log(" grid on click ---->>> value=" + value);
//                        }
//                    }
//                });
//            }
//            return grid;
        },
        /**
         * 获取grid中选中的行的数据对象。
         * @param argId
         * @returns {jsonData}
         */
        getSelected: function (argId) {
            console.log("这里缺一个grid id");
            return this.cache.selectedRow;
        },
        _setSelectRow: function (row) {
            this.cache.selectedRow = row;
        },
        refreshData: function (data) {
            this.options.data = data;
            $(".ur-gridtable").html("");
            this._createTableData();
            // 设置Grid样式
            this._applyCSS();
            // 绑定事件，例如：行前复选框
            this._bindingEvents();
            // 创建行操作区
            this._createRowActions();
        },
        _createTableHead: function () {
            var data = this.options.data;
            //var tableBody = $(".ur-gridtable");
            //var tableHead = $("#mars-tb-head");
            var autoGenClassNamePrefix = "autogen-col-";
            var fields = this.options.model.fields;
            var columns = this.options.columns;
            //var tdDefaultClasses = "grid-td";
            // 遍历每一行数据
            //for (var i = 0; i < data.length; i++) {
            //    var row = data[i];
            // 遍历每一列。遍历column等效于遍历field
            for (var j = 0; j < columns.length; j++) {
                var tmpCol = columns[j];
                var field = fields[j];
                var genClsName = autoGenClassNamePrefix + field.id;
                var defaultClass = "column-header";
                var columnHtmId = "gridcolumn-" + (j + 1); // column的序列化从1开始吧
                // 如果是第一行，即第一次，生成列头
                //if (i == 0) {
                // 第一列，生成复选框。
                if (j == 0) {
                    $("#mars-tb-head").append("<div id='selectAll' class='select-all column-header'><input type='checkbox' id='checkAll' class='checkAll' ></div>");
                }
                $("#mars-tb-head").append("<div id='" + columnHtmId + "' class='" + defaultClass + "' data-field-id='" + field.id + "'><p>" + tmpCol.text + "</p></div>");
                //}
            }
            $("#mars-tb-head").append("<div id='" + columnHtmId + "' class='" + defaultClass + " last' />");
            //if (i == 0) {
            $("#mars-tb-head").append("</tr>");
            //}
            //}
        },
        /**
         * 创建列表页（grid）的数据部分（table row)
         * param need:
         * data
         * @private
         */
        _createTableData: function () {
            var that = this;
            var data = this.options.data;
            //var tableBody = $(".ur-gridtable");
            //var tableHead = $("#mars-tb-head");
            var autoGenClassNamePrefix = "autogen-col-";
            var fields = this.options.model.fields;
            var columns = this.options.columns;
            var arrRowHeadActions = new Array();
            //var tdDefaultClasses = "grid-td";
            // 清空一下。如果是刷新数据的时候需要。
            $(".ur-gridtable").html("");
            // 先清空缓存
            this.cache.rows = [];
            // 遍历每一行数据
            for (var i = 0; i < data.length; i++) {
                var row = data[i];
                //console.log("name= "+row.name);
                $(".ur-gridtable").append("<tr data-rowindex='" + (i + 1) + "'>");
                // 遍历每一列。遍历column等效于遍历field
                for (var j = 0; j < columns.length; j++) {
                    //var tmpCol = columns[j];
                    var field = fields[j];
                    var column = columns[j];
                    var genClsName = autoGenClassNamePrefix + field.id;
                    //var defaultClass = "column-header";
                    var columnHtmId = "gridcolumn-" + (j + 1); // column的序列化从1开始吧
                    // AI.TODO css列表待处理
                    //colCssArray.push(genClsName);
                    // 如果是第一行，即第一次，生成列头
                    //if (i == 0) {
                    //    // 第一列，生成复选框。
                    //    if (j == 0) {
                    //        $("#mars-tb-head").append("<div id='selectAll' class='selectAll column-header'><input type='checkbox' id='checkAll' class='checkAll' ></div>");
                    //    }
                    //    $("#mars-tb-head").append("<div id='" + columnHtmId + "' class='" + defaultClass + "' data-field-id='" + field.id + "'><p>" + tmpCol.text + "</p></div>");
                    //}
                    // 遍历一行数据中每一个字段
                    $.each(row, function (key, nRowColVal) {
                        // 如果数据中的key和field中的设置一致，则把值复制到表格中。
                        if (field.id == key) {
                            // 第一列，生成复选框。
                            if (j == 0) {
                                $(".ur-gridtable tr:last").append("<td>" +
                                    "<div class=\"row-check\">" +
                                    "<input type='checkbox' id='urgrid-chb-" + i + "'>" +
                                        // Label里面的都是复选框的效果元素。box是框。check是勾。
                                    "<label id='urgrid-cb-label-" + i + "' for='urgrid-chb-" + i + "'>" +       // label的for和checkbox的id绑定
                                    "<span class=\"check\"></span>" +
                                    "<span class=\"box\"></span>" +
                                    "</label>" +
                                    "</div>" +
                                    "</td>");
                            }
                            // 转换日期格式
                            if (gaea.utils.validate.isNotNull(column.datetimeFormat)) {
                                nRowColVal = gaea.utils.date.parser.getDate(nRowColVal, {format: column.datetimeFormat});
                            }
                            $(".ur-gridtable tr:last").append("<td class='grid-td' data-columnid='" + columnHtmId + "'>" +
                                "<div class=\"grid-td-div\">" + nRowColVal + "</div></td>");
                        }
                    });
                }
                // 生成行前操作区。判断是否有工作流。有的话生成'查看工作流'的按钮
                if (this.options.withWorkflow == true) {
                    if (gaea.utils.validate.isNotNull(row.wfProcInstId)) {
                        this.cache.rows.push({
                            index: i,                       // 从0开始的
                            headActions: [{
                                type: "wf-active-diagram",   // 这个是规范定义的，不能乱起。
                                wfProcInstId: row.wfProcInstId
                            }]
                        });
                    } else {
                        this.cache.rows.push(null);
                    }
                }
                //if (i == 0) {
                //    $("#mars-tb-head").append("</tr>");
                //}
                $(".ur-gridtable").append("</tr>");
            }
        },
        _applyCSS: function () {
            var that = this;
            var urGrid = $("#" + this.options.renderTo);
            // 遍历column数组，设置显示样式（CSS等）
            $.each(this.options.columns, function (idx, obj) {
                var col = this;
                var gridColumnId = "gridcolumn-" + (idx + 1);
                if (gaea.utils.validate.isNotNull(col.width) && $.isNumeric(col.width)) {
                    var columnTDs = "td[data-columnid=" + gridColumnId + "]";
                    // 设置数据table的单元格的样式
                    // 单元格宽度，等于Schema设置的宽度 + 列头的左右padding - 单元格td自带的左右padding + 列头的列间边框（白缝）。因为左右一样，所以都是x2
                    var gridCellWidth = parseInt(col.width) + that.default.css.columnHeadWidthPadding * 2 - that.default.css.gridTdPadding * 2 + 1;
                    urGrid.find(columnTDs).children(".grid-td-div").css("width", gridCellWidth);
                    // 设置列头的样式
                    urGrid.find("#" + gridColumnId).find("p").css("width", col.width);
                }
                // 隐藏列
                if (gaea.utils.validate.isNotNull(col.hidden)) {
                    if (col.hidden) {
                        urGrid.find(columnTDs).css("display", "none");
                        $("#" + gridColumnId).css("display", "none");
                    }
                }
            });
            /* 设置数据区域的高度 */
            var bodyHeight = document.body.scrollHeight;
            // 页面高度 - 上方title、toolbar等占用高度 - 列头高度
            bodyHeight = bodyHeight - 130 - 30;
            $(".gaea-grid-body").css("height", bodyHeight); // grid行数据部分的高度
        },
        _bindingEvents: function () {
            var that = this;
            // 绑定事件。点击行选中复选框。
            $(".ur-gridtable").find("tr").click(function () {
                var index = $(this).data("rowindex");
                var i = index - 1;
                $(":checkbox[id^='urgrid-chb']").prop("checked", false);
                $(this).find("[id^='urgrid-chb']").prop("checked", "true");
                //console.log("rowindex: "+$(this).data("rowindex"));
                $(this).find("[id^='urgrid-chb']").val($(this).data("rowindex") - 1);
                selectedRow = that.options.data[($(this).data("rowindex") - 1)];
                selectedRow.index = $(this).data("rowindex");
                that._setSelectRow(selectedRow);
                that.options.listeners.select(selectedRow);
                // 复选框选中的效果
                // find the first span which is our circle/bubble
                //var jqLabel = $("#urgrid-cb-label-" + i);
                ////jqLabel.append("<span class=\"check\"></span>" +
                ////    "<span class=\"box\"></span>");
                //var el = jqLabel.children('span:first-child');
                //
                //// add the bubble class (we do this so it doesnt show on page load)
                //el.addClass('circle');
                //
                //// clone it
                //var newone = el.clone(true);
                //
                //// add the cloned version before our original
                //el.before(newone);
                //
                //// remove the original so that it is ready to run on next click
                //$("." + el.attr("class") + ":last").remove();
            });
        },
        /**
         * 构造Grid的脚部元素。即Pagination分页部分。
         * 本方法即用于创建，也用于刷新。
         * @private
         */
        _createFooter: function () {
            var pageDiv = $(".gaea-grid-footer .pagination");
            var that = this;
            var page = parseInt(this.options.page.page);
            var size = parseInt(this.options.page.size);
            var rowCount = parseInt(this.options.page.rowCount);
            // 清空内容
            pageDiv.html("");
            // 第一页
            pageDiv.append("<div class='button'><span class=\"icon first\"><input type='hidden' value='" + 1 + "'></span></div>");
            // 上一页
            pageDiv.append("<div class='button'><span class=\"icon previous\"><input type='hidden' value='" + (page - 1) + "'></span></div>");
            // 页码部分: 1 2 3 4 ...
            pageDiv.append("<div class='page-numbers'></div>");
            // 生成页码
            var half = 3;   // 这个是要显示多少页的一半
            var firstPage = page - half;
            var p = firstPage > 0 ? firstPage : 1;
            for (i = 1; i < 8; i++) {
                if (i != page) {
                    if (firstPage > 0) {
                        pageDiv.find(".page-numbers").append("<span>" + p + "<input type='hidden' value='" + p + "'></span>");
                    } else {
                        pageDiv.find(".page-numbers").append("<span>" + i + "<input type='hidden' value='" + i + "'></span>");
                    }
                } else {
                    pageDiv.find(".page-numbers").append("<span class=\"selected\">" + p + "</span>");
                }
                p++;
            }
            // 下一页
            pageDiv.append("<div class='button'><span class=\"icon next\"><input type='hidden' value='" + (page + 1) + "'></span></div>");     // p在循环最后自加了，这里就不用加了。
            // 最后一页
            pageDiv.append("<div class='button'><span class=\"icon last\"><input type='hidden' value='" + (Math.ceil(rowCount / size)) + "'></span></div>");
            // 生成：显示第1条至第20条 当前第几页
            var first = 1;
            if (page > 1) {
                first += (page - 1) * size;
            }
            var last = page * size;
            pageDiv.append("<span class=\"page-desc\">" + first + " - " + last + " 共 " + rowCount + "</span>");
            /* 【2】点击页码事件 */
            pageDiv.find("span:has(input)").click(function () {
                var pageVal = $(this).children("input").val();
                that.options.page.page = pageVal;     // 先赋值。待会查询完成后可用于刷新页码。
                // 查询（下一页 etc……）
                that._query({
                    "page.page": pageVal
                });
            });
            //return html;
        },
        /**
         * 高级查询
         * @private
         */
        _initAdvancedQuery: function () {
            var that = this;
            var fields = this.options.model.fields;
            var columns = this.options.columns;
            var optionData = null;
            for (var i = 0; i < fields.length; i++) {
                var field = fields[i];
                var column = columns[i];
                var defaultClass = "mars-headquery-column";
                var columnHtmId = "mars-hq-column-" + (i + 1); // column的序列化从1开始吧
                var inputId = "mars-hq-" + field.id;
                // 拼凑各个字段的查询输入框
                if (gaea.utils.validate.isNotNull(column.hidden) && !column.hidden) {
                    $("#mars-headquery-inputs").append("<div id='" + columnHtmId + "' class='" + defaultClass + "'><input id='" + inputId + "' data-field-id='" + field.id + "' ></div>");
                    // +1是列头的列间边框宽度。
                    $("#" + columnHtmId).css("width", (parseInt(column.width) + 1));
                    $("#" + inputId).css("width", (column.width - 10));        // 输入框的默认宽度为列宽-10.
                }
            }
            // 组装按钮
            $("#mars-headquery-actions").append(gaea.component.bridge.button.create({
                "htmlId": "headqueryOK",
                "text": "确定",
                "size": "small"
            }));
            // 【2】 点击确定，开始查询。
            $("#headqueryOK").click(function () {
                // 收起查询区
                $("#mars-tb-head-query").slideUp("fast");    // cool一点的方式
                var queryConditions = new Object();         // 查询请求数据
                var i = 0;      // 查询条件数组的下标
                //queryConditions.urSchemaId = $("#urSchemaId").val();
                $("#mars-headquery-inputs").find("input").each(function (index) {
                    console.log("input value: " + $(this).val() + " , " + $(this).prop("value"));
                    var inputVal = $(this).val();
                    console.log("empty length: " + inputVal.length + " 0 length: " + "0".length);
                    if (gaea.utils.validate.isNotNull(inputVal)) {
                        var nameKey = "filters[" + i + "].name";        // 不能用index。输入框为空的时候index也会递增。
                        var nameValue = $(this).data("field-id");
                        var valKey = "filters[" + i + "].value";
                        var valValue = $(this).val();
                        queryConditions[nameKey] = nameValue;
                        queryConditions[valKey] = valValue;
                        i += 1;
                    }
                });
                that._query(queryConditions);
                //gaea.utils.ajax.post({
                //    url: "/admin/common/query.do",
                //    data: queryConditions,
                //    success: function (data) {
                //        //alert("成功。id: " + data[0].id);
                //        // 用查询结果，刷新数据列表
                //        gaea.component.bridge.grid.refreshData(data);
                //    },
                //    fail: function (data) {
                //        alert("失败");
                //    }
                //})
            });
            // 【3】 点击列头，展示查询区。
            $("#mars-tb-head").find(".column-header").click(function () {
                //console.log(" 选中的column： " + $(this).data("field-id"));
                //$("#mars-tb-head-query").css("display","block");
                $("#mars-tb-head-query").slideDown("fast");    // cool一点的方式
            })
        },
        _query: function (queryConditions) {
            var that = this;
            // 获取SchemaId。对于Grid查询必须。
            queryConditions.urSchemaId = $("#urSchemaId").val();
            gaea.utils.ajax.post({
                url: "/admin/common/query.do",
                data: queryConditions,
                success: function (data) {
                    //var result = $.parseJSON(jqXHR.responseText);
                    // 用查询结果，刷新数据列表
                    that.refreshData(data.content);
                    that.options.page.rowCount = data.totalElements;
                    that._createFooter();
                },
                fail: function (data) {
                    alert("失败");
                }
            });
        },
        /**
         * 创建行操作区，包括行前操作区（按钮区），行尾操作区（按钮区）
         * @private
         */
        _createRowActions: function () {
            var that = this;
            if (gaea.utils.validate.isNotNull(this.cache.rows)) {
                var hasShowDiagramDialog = false;
                var hasHeadActionAtAll = false;         // 如果true，即任意一行有行前操作区。作为增加操作区列头的标志。
                // 遍历每一行
                $.each(this.cache.rows, function (key, rowCache) {
                    var actionsHtml = "";
                    var hasHeadActions = false;     // 行前操作区开关
                    // 遍历每行的行前操作区
                    if (gaea.utils.validate.isNull(rowCache)) {
                        return;
                    }
                    $.each(rowCache.headActions, function (k, actionConfig) {
                        if (gaea.utils.validate.isNotNull(actionConfig)) {
                            // 是否有行前操作区
                            if (!hasHeadActions) {
                                hasHeadActions = true;
                                // 全局的，只赋值一次。
                                if (!hasHeadActionAtAll) {
                                    hasHeadActionAtAll = true;
                                }
                            }
                            // 根据headActions的配置项，处理不同的类型
                            if (actionConfig.type == "wf-active-diagram") {    // 查看工作流流程图
                                // 是否创建全局的流程查看弹框
                                if (!hasShowDiagramDialog) {
                                    hasShowDiagramDialog = true;
                                }
                                actionsHtml += "<a href='/admin/workflow/showdiagram/" + actionConfig.wfProcInstId + "'>查看流程</a>";
                            }
                        } else {
                            return;
                        }
                    });
                    // 生成行前操作区
                    if (hasHeadActions) {
                        $(".ur-gridtable tr").eq(rowCache.index).children("td").eq(0).after("<td class=\"grid-td row-headactions\" data-columnid=\"headactions\">" + actionsHtml + "</td>");
                    }
                    // 遍历处理行尾操作区。未完成。。。
                });
                // 如果任意一行有行前操作区，增加列头。
                if (hasHeadActionAtAll && !that.cache.hasCreatedRowHeadActions) {
                    that.cache.hasCreatedRowHeadActions = true;
                    $("#mars-tb-head .select-all").after("<div id='row-headactions' class='row-headactions column-header'><p>操作</p></div>");
                }
                // TODO 如果有查看流程图的按钮，生成弹框DIV。未完成。。。
                //if (hasShowDiagramDialog) {
                //    $("body").append("<div id='wf-active-diagram-viewer'></div>");
                //    var dialog = ur.component.bridge.dialog.create({
                //        id: "wf-active-diagram-viewer",
                //        autoOpen: false,
                //        width: 500,
                //        height: 500,
                //        buttons: [{
                //            "确定": function () {
                //                $(this).urDialog("close");
                //            }
                //        }]
                //    });
                //}
            }
        }
    },
    button: {
        create: function (btnOptions) {
            var buttonHtml = "";
            if (gaea.utils.validate.isNotNull(btnOptions.size) && "small" == btnOptions.size) {
                html = "<a id='" + btnOptions.htmlId + "'" +
                    " class=\"small darkslategrey button\">" +
                    "<span>" +
                    btnOptions.text +
                    "</span>" +
                    "</a>";
            } else {
                html = "<a id='" + btnOptions.htmlId + "'" +
                    " class=\"medium darkslategrey button\">" +
                    "<span>" +
                    btnOptions.text +
                    "</span>" +
                    "</a>";
            }
            return html;
        }
    }
};

// 未实现dialog。暂时禁用。

//ur.component.bridge.dialog.createDialog = function(argTitle, argHtmlId, argSaveFunc, argCancelFunc) {
//    var dialog = ur.component.bridge.dialog.simpleDialog(
//        {
//            title: argTitle,
//            htmlId: argHtmlId,
//            okText: "保存",
//            cancelText: "取消"
//        }, argSaveFunc, argCancelFunc);
//    dialog.contentEl = argHtmlId;
//    dialog.show();
//};
//
//ur.component.bridge.dialog.confirmDialog = function(argTitle, argContent, argFunction, argCancelFunc) {
//    var dialog = ur.component.bridge.dialog.simpleDialog(
//        {
//            title: argTitle,
//            okText: "确定",
//            cancelText: "取消"
//        }, argFunction, argCancelFunc);
//    dialog.html = argContent;
//    dialog.show();
//};
//
//ur.component.bridge.dialog.simpleDialog = function(config, argSaveFunc, argCancelFunc) {
//    var dialog = new Ext.Window({
//        title: config.title,
//        height: 200,
//        width: 400,
//        layout: 'form', // Iverson setting
////                    layout: 'fit',
////        contentEl: config.htmlId, // 这个改为由具体方法自己设置。因为像确认框这种不需要表单信息。
//        buttons: [
//            {
//                text: config.okText,
//                handler: function() {
//                    // ---------------------- form data 请求方式 ----------------------
//                    argSaveFunc();
//                    dialog.hide();
//                }
//            },
//            {
//                text: config.cancelText,
//                handler: function() {
//                    if (!typeof argCancelFunc === "undefined") {
//                        argCancelFunc();
//                    }
//                    dialog.hide();
//                }
//            }]
//    });
//    return dialog;
//};




