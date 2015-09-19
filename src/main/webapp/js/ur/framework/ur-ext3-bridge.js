/**
 * 
 * DEPENDANCE:
 * ExtJs 3的相关的包。JQuery。
 * AI.TODO 重构一下。应该都归到component.ui下面
 * @type type
 * @author Iverson
 * @since 2014-5-15 星期四
 */
//var ur = {
//    component: {
//        bridge: {
//            dialog:{}
//        }}}

ur.component.bridge = {
    dialog: {
        options: {
            title: null,
            width: null,
            height: null,
            maxHeight: 550, // 最大高度。这个关系自动生产高度的弹出框的最大高度。
            injectHtmlId: null,
            formId: null,
            okText: null,
            cancelText: null,
            // callback
            success: null,
            fail: null,
            cancel: null
        },
        // 基于form普通弹出框
        create: function(argOptions) {
            this.options = argOptions;
            var dialog = this.ext3Dialog(argOptions);
            // 设置要注入dialog的表单id（一般来说是表单id）。否则弹出框就没内容显示了。
            dialog.contentEl = this.options.injectHtmlId;
            dialog.show();
        },
        ext3Dialog: function(options) {
            var dataSelector = "#" + options.formId;
            /* 如果没有设定大小，自动根据内容计算弹出框大小 */
            if (ur.utils.validate.isNull(this.options.height)) {
                var formInputSelector = dataSelector + " input,select";
                // 表单输入项的个数
                var inputCount = $(formInputSelector).not("input[type='hidden']").length;
                // 输入框个数 * (输入框高度20 + 框间距5) + 最下面距离5
                var h = inputCount * (20 + 5) + 5;
                h += 70;    // 70是给弹出框title和操作区的。
                this.options.height = h > this.options.maxHeight ? this.options.maxHeight : h;
            }
            /* 如果没有传入fail方法，则创建默认的fail方法 */
            if (!$.isFunction(options.fail)) {
                options.fail = function(jqXHR) {
                    var data = $.parseJSON(jqXHR.responseText);
                    // 显示后台传来的错误信息，可能是抛出的异常信息。
                    ur.utils.message.show(data);
                }
            }
            /* 生成ExtJS 3的弹出框 */
            var dialog = new Ext.Window({
                title: options.title,
                height: this.options.height,
                width: 400,
                layout: 'form', // Iverson setting
//                    layout: 'fit',
//        contentEl: config.htmlId, // 这个改为由具体方法自己设置。因为像确认框这种不需要表单信息。
                buttons: [
                    {
                        text: options.okText,
                        handler: function() {
                            ur.utils.ajax.post({
                                url: options.url,
                                data: $(dataSelector).serializeObject(), // 把form的内容自动转成json请求
                                success: options.success,
                                fail: options.fail
                            });
                            // ---------------------- form data 请求方式 ----------------------
//                            options.success();
                            dialog.hide();
                        }
                    },
                    {
                        text: options.cancelText,
                        handler: function() {
                            if ($.isFunction(options.cancel)) {
                                options.cancel();
                            }
                            dialog.hide();
                        }
                    }]
            });
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
                cellclick: null
            }
        },
        create: function(options) {
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
            for (var i = 0; i < options.columns.length; i++) {
                var column = options.columns[i];
                var field = options.model.fields[i];
                /* 处理日期、时间类型的字段。产生日期类的column renderer方法。 */
                if (!$.isFunction(column.renderer) && column.renderType === "date") {
                    // ExtJS 3的列的renderer方式
                    column.renderer = function(value, row) {
                        if (ur.utils.validate.isNotNull(value)) {
                            // 默认日期格式：yyyy-MM-dd
                            return Ext.util.Format.date(new Date(parseInt(value)), 'Y-m-d')
                        } else {
                            return "";
                        }
                    }
                } else if (!$.isFunction(column.renderer) && column.renderType === "link") { // 处理超链接的单元格渲染
                    column.renderer = function(value, metaData, record, rowIndex, colIndex, store) {
//                        console.log("value=" + value + ",rowIndex=" + rowIndex + ",colIndex=" + colIndex);
                        // 加上超链接
                        value = "<a href='#'>" + value + "</a>";
                        // 把单元格渲染成红色？就在这里……
                        metaData.css = "ur-grid-cell-link";
                        return value;
                    }
                }
                // 构建ExtJs的字段id
                myFields.push(field.id);
                // 构建ExtJS的column数组。复合ExtJS的数组规范。
                myColumns.push({
                    id: column.id,
                    header: column.text, // 列名。在ExtJS 4就是用text了。
                    width: column.width, // 列宽
                    hidden: column.hidden, // 是否显示列
                    resizable: column.resizable,
                    renderer: column.renderer
                });
            }





//        $.each(argColumns, function() {
//            if (this.isPk) {
//                pkColumnId = this.columnId;
//            }
//            
//            
//        });
            /* Model */
            var colModel = new Ext.grid.ColumnModel({
                columns: myColumns
//        defaults: {
//            sortable: true,
//            menuDisabled: true,
//            width: 100
//        },
//        listeners: {
//            hiddenchange: function(cm, colIndex, hidden) {
//                saveConfig(colIndex, hidden);
//            }
//        }
            });
            /* Store */
            var store = new Ext.data.JsonStore({
                // store configs
//    autoDestroy: true,
//    url: '/product/list-all.do',
//    storeId: 'myStore',
//    // reader configs
//    root: 'images',
//    idProperty: 'name',
//    fields: ['name', 'url', {name:'size', type: 'float'}, {name:'lastmod', type:'date'}],
                idProperty: options.model.idProperty, // 没有这个，就不能通过record.id获取行数据的id。
                fields: myFields,
                autoLoad: options.autoLoad,
                baseParams: this.options.proxy.params,
                proxy: new Ext.data.HttpProxy({
                    type: "ajax",
                    url: options.proxy.url,
                    headers: options.proxy.headers,
                    reader: {
                        type: 'json'
                    }
                })
            });
            /* Grid */
            grid = new Ext.grid.GridPanel({
                id: "mygrid",
                store: store,
                colModel: colModel,
                renderTo: options.renderTo,
//        store: new Ext.data.Store({
//            autoDestroy: true,
//            reader: reader,
//            data: xg.dummyData
//        }),
//        colModel: new Ext.grid.ColumnModel({
//            defaults: {
//                width: 120,
//                sortable: true
//            },
//            columns: [
//                {id: 'company', header: 'Company', width: 200, sortable: true, dataIndex: 'company'},
//                {header: 'Price', renderer: Ext.util.Format.usMoney, dataIndex: 'price'},
//                {header: 'Change', dataIndex: 'change'},
//                {header: '% Change', dataIndex: 'pctChange'},
//                // instead of specifying renderer: Ext.util.Format.dateRenderer('m/d/Y') use xtype
//                {
//                    header: 'Last Updated', width: 135, dataIndex: 'lastChange',
//                    xtype: 'datecolumn', format: 'M d, Y'
//                }
//            ]
//        }),
//        viewConfig: {
//            forceFit: true,
////      Return CSS class to apply to rows depending upon data values
//            getRowClass: function(record, index) {
//                var c = record.get('change');
//                if (c < 0) {
//                    return 'price-fall';
//                } else if (c > 0) {
//                    return 'price-rise';
//                }
//            }
//        },
                sm: new Ext.grid.RowSelectionModel({singleSelect: true}),
                width: 600,
                height: 300,
                frame: true,
                title: '产品管理',
                iconCls: 'icon-grid'
            });
            /* 添加事件相应 */
            if (ur.utils.validate.isNotNull(this.options.listeners)
                    && ur.utils.validate.isNotNull(this.options.listeners.cellclick)) {
                grid.on({
                    cellclick: function(grd, rowIndex, columnIndex, e) {
                        if (ur.utils.validate.isNotNull(that.options.listeners.cellclick)) {
//                        console.log(" grid on click ---->>> rowIndex=" + rowIndex + ",columnIndex=" + columnIndex);
                            var record = grd.getStore().getAt(rowIndex);  // Get the Record
                            var colModel = grd.getColumnModel();
                            var colId = colModel.getColumnId(columnIndex);
                            // 通过id获取点击的单元格的值。
                            var value = record.get(colId);
                            that.options.listeners.cellclick(value,record);
//                        console.log(" grid on click ---->>> value=" + value);
                        }
                    }
                });
            }
            return grid;
        },
        getGrid: function(argId) {
            var grid = Ext.getCmp(argId);
            return grid;
        },
        getSelected: function(argId) {
            // 需要用Ext自己的方式获取。grid不是一个普通的DOM对象。
            var grid = Ext.getCmp(argId);
            // ExtJs 3是getSelections，多个's'；ExtJs 4是getSelection。getSelected是返回第一个选中的。
            var result = grid.getSelectionModel().getSelected().data;
            return result;
        },
        getId: function(argId) {
            var result = ur.component.bridge.grid.getGrid(argId).getSelectionModel().getSelected().id; // ExtJs 4是getId()
            return result;
        }
    },
    getComponent: function(argId) {
        // 需要用Ext自己的方式获取。grid不是一个普通的DOM对象。
        var result = Ext.getCmp(argId);
        // ExtJs 3是getSelections，多个's'；ExtJs 4是getSelection。getSelected是返回第一个选中的。
//        var result = grid.getSelectionModel().getSelected().data;
        return result;
    }
};

ur.component.bridge.dialog.createDialog = function(argTitle, argHtmlId, argSaveFunc, argCancelFunc) {
    var dialog = ur.component.bridge.dialog.simpleDialog(
            {
                title: argTitle,
                htmlId: argHtmlId,
                okText: "保存",
                cancelText: "取消"
            }, argSaveFunc, argCancelFunc);
    dialog.contentEl = argHtmlId;
    dialog.show();
};

ur.component.bridge.dialog.confirmDialog = function(argTitle, argContent, argFunction, argCancelFunc) {
    var dialog = ur.component.bridge.dialog.simpleDialog(
            {
                title: argTitle,
                okText: "确定",
                cancelText: "取消"
            }, argFunction, argCancelFunc);
    dialog.html = argContent;
    dialog.show();
};

ur.component.bridge.dialog.simpleDialog = function(config, argSaveFunc, argCancelFunc) {
    var dialog = new Ext.Window({
        title: config.title,
        height: 200,
        width: 400,
        layout: 'form', // Iverson setting
//                    layout: 'fit',
//        contentEl: config.htmlId, // 这个改为由具体方法自己设置。因为像确认框这种不需要表单信息。
        buttons: [
            {
                text: config.okText,
                handler: function() {
                    // ---------------------- form data 请求方式 ----------------------
                    argSaveFunc();
                    dialog.hide();
                }
            },
            {
                text: config.cancelText,
                handler: function() {
                    if (!typeof argCancelFunc === "undefined") {
                        argCancelFunc();
                    }
                    dialog.hide();
                }
            }]
    });
    return dialog;
};

//ur.component.bridge.grid = {
//    options: {
//        title: null,
//        width: null,
//        hidden: null,
//        resizable: null,
//        autoLoad: null,
//        model: {
//            fields: {
//                id: null,
//                name: null
//            },
//            idProperty: null
//        },
//        columns: [
//            {
//                text: null, // 表头的文字
//                name: null, // 预留字段
//                id: null,
//                isPk: false,
//                width: null,
//                hidden: false,
//                resizable: false,
//                // callback
//                renderer: null       // 数据转换的拦截器
//            }
//        ],
//        proxy: {
//            url: null,
//            headers: null
//        }
//    },
//    create: function(options) {
//        this.options = options;
//        if (!$.isArray(options.fields) || !$.isArray(options.columns)) {
//            conosle.log("fields与columns必须是数组！");
//            return;
//        }
//        if (options.fields.length !== options.columns.length) {
//            conosle.log("fields与columns长度必须一致！");
//            return;
//        }
//        var myColumns = new Array();
//        var myFields = new Array();         // 这个是字段id的列表
//        var pkColumnId;
//        for (var i = 0; i < options.columns.length; i++) {
//            var column = options.columns[i];
//            var field = options.fields[i];
//            if (column.isPk) {
//                pkColumnId = column.name; // 暂时用column name做PKID吧
//            }
//            // 构建ExtJs的字段id
//            myFields.push(field.id);
//            // 构建ExtJS的column
//            myColumns.push({
//                id: column.id,
//                header: column.text, // 列名。在ExtJS 4就是用text了。
//                width: column.width, // 列宽
//                hidden: column.hidden, // 是否显示列
//                resizable: column.resizable,
//                renderer: column.renderer
//            });
//        }
//
//
//
//
//
////        $.each(argColumns, function() {
////            if (this.isPk) {
////                pkColumnId = this.columnId;
////            }
////            
////            
////        });
//        /* Model */
//        var colModel = new Ext.grid.ColumnModel({
//            columns: myColumns
////        defaults: {
////            sortable: true,
////            menuDisabled: true,
////            width: 100
////        },
////        listeners: {
////            hiddenchange: function(cm, colIndex, hidden) {
////                saveConfig(colIndex, hidden);
////            }
////        }
//        });
//        /* Store */
//        var store = new Ext.data.JsonStore({
//            // store configs
////    autoDestroy: true,
////    url: '/product/list-all.do',
////    storeId: 'myStore',
////    // reader configs
////    root: 'images',
////    idProperty: 'name',
////    fields: ['name', 'url', {name:'size', type: 'float'}, {name:'lastmod', type:'date'}],
//            idProperty: pkColumnId,
//            fields: myFields,
//            autoLoad: options.autoLoad,
////        autoLoad: true,
//            proxy: new Ext.data.HttpProxy({
//                type: "ajax",
//                url: options.proxy.url,
//                headers: options.proxy.headers,
//                reader: {
//                    type: 'json'
//                }
//            })
//        });
//        /* Grid */
//        grid = new Ext.grid.GridPanel({
//            id: "mygrid",
//            store: store,
//            colModel: colModel,
//            renderTo: "gridDemo",
////        store: new Ext.data.Store({
////            autoDestroy: true,
////            reader: reader,
////            data: xg.dummyData
////        }),
////        colModel: new Ext.grid.ColumnModel({
////            defaults: {
////                width: 120,
////                sortable: true
////            },
////            columns: [
////                {id: 'company', header: 'Company', width: 200, sortable: true, dataIndex: 'company'},
////                {header: 'Price', renderer: Ext.util.Format.usMoney, dataIndex: 'price'},
////                {header: 'Change', dataIndex: 'change'},
////                {header: '% Change', dataIndex: 'pctChange'},
////                // instead of specifying renderer: Ext.util.Format.dateRenderer('m/d/Y') use xtype
////                {
////                    header: 'Last Updated', width: 135, dataIndex: 'lastChange',
////                    xtype: 'datecolumn', format: 'M d, Y'
////                }
////            ]
////        }),
////        viewConfig: {
////            forceFit: true,
//////      Return CSS class to apply to rows depending upon data values
////            getRowClass: function(record, index) {
////                var c = record.get('change');
////                if (c < 0) {
////                    return 'price-fall';
////                } else if (c > 0) {
////                    return 'price-rise';
////                }
////            }
////        },
//            sm: new Ext.grid.RowSelectionModel({singleSelect: true}),
//            width: 600,
//            height: 300,
//            frame: true,
//            title: '产品管理',
//            iconCls: 'icon-grid'
//        });
//    }
//}
/**
 * 属性：
 * title,width,hidden,resizable,columnId,isPk
 * config
 * listUrl,autoLoad
 * @param {type} argColumns
 * @returns {undefined}
 */
//ur.component.bridge.grid.create = function(argColumns, config) {
//    var myColumns = new Array();
//    var myFields = new Array();         // 这个是字段id的列表
//    var pkColumnId;
//    $.each(argColumns, function() {
//        if (this.isPk) {
//            pkColumnId = this.columnId;
//        }
//        myColumns.push({
//            header: this.title, // 列名
//            width: this.width, // 列宽
//            hidden: this.hidden, // 是否显示列
//            resizable: this.resizable
//        });
//        // 构建ExtJs的字段id
//        myFields.push(this.columnId);
//    });
//    /* Model */
//    var colModel = new Ext.grid.ColumnModel({
//        columns: myColumns
////        defaults: {
////            sortable: true,
////            menuDisabled: true,
////            width: 100
////        },
////        listeners: {
////            hiddenchange: function(cm, colIndex, hidden) {
////                saveConfig(colIndex, hidden);
////            }
////        }
//    });
//    /* Store */
//    var store = new Ext.data.JsonStore({
//        // store configs
////    autoDestroy: true,
////    url: '/product/list-all.do',
////    storeId: 'myStore',
////    // reader configs
////    root: 'images',
////    idProperty: 'name',
////    fields: ['name', 'url', {name:'size', type: 'float'}, {name:'lastmod', type:'date'}],
//        idProperty: pkColumnId,
//        fields: myFields,
//        autoLoad: config.autoLoad,
////        autoLoad: true,
//        proxy: new Ext.data.HttpProxy({
//            type: "ajax",
//            url: config.listUrl,
//            headers: {'Accept': 'application/json'}, // 这个很重要。设定请求头。因为服务端的异常处理架构需要这个信息。
//            reader: {
//                type: 'json'
//            }
//        })
//    });
//    /* Grid */
//    grid = new Ext.grid.GridPanel({
//        id: "mygrid",
//        store: store,
//        colModel: colModel,
//        renderTo: "gridDemo",
////        store: new Ext.data.Store({
////            autoDestroy: true,
////            reader: reader,
////            data: xg.dummyData
////        }),
////        colModel: new Ext.grid.ColumnModel({
////            defaults: {
////                width: 120,
////                sortable: true
////            },
////            columns: [
////                {id: 'company', header: 'Company', width: 200, sortable: true, dataIndex: 'company'},
////                {header: 'Price', renderer: Ext.util.Format.usMoney, dataIndex: 'price'},
////                {header: 'Change', dataIndex: 'change'},
////                {header: '% Change', dataIndex: 'pctChange'},
////                // instead of specifying renderer: Ext.util.Format.dateRenderer('m/d/Y') use xtype
////                {
////                    header: 'Last Updated', width: 135, dataIndex: 'lastChange',
////                    xtype: 'datecolumn', format: 'M d, Y'
////                }
////            ]
////        }),
////        viewConfig: {
////            forceFit: true,
//////      Return CSS class to apply to rows depending upon data values
////            getRowClass: function(record, index) {
////                var c = record.get('change');
////                if (c < 0) {
////                    return 'price-fall';
////                } else if (c > 0) {
////                    return 'price-rise';
////                }
////            }
////        },
//        sm: new Ext.grid.RowSelectionModel({singleSelect: true}),
//        width: 600,
//        height: 300,
//        frame: true,
//        title: '产品管理',
//        iconCls: 'icon-grid'
//    });
//};

/**
 * 列表组件的实现。
 */
//ur.component.bridge.grid = function(dataModel, dataStore, panel) {
//
//};

//ur.component.bridge.grid = {
//    getGrid: function(argId) {
//        var grid = Ext.getCmp(argId);
//        return grid;
//    },
//    getSelected: function(argId) {
//        // 需要用Ext自己的方式获取。grid不是一个普通的DOM对象。
//        var grid = Ext.getCmp(argId);
//        // ExtJs 3是getSelections，多个's'；ExtJs 4是getSelection。getSelected是返回第一个选中的。
//        var result = grid.getSelectionModel().getSelected().data;
//        return result;
//    }
//};

//ur.component.bridge.grid.getId = function(argId) {
//    var result = ur.component.bridge.grid.getGrid(argId).getSelectionModel().getSelected().id; // ExtJs 4是getId()
//    return result;
//};