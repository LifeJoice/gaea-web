/**
 * DEPENDANCE:
 * gaea-common,
 * @type type
 * @since 2014-5-15 星期四
 * @author Iverson
 */
gaea.component = {
    biz: {
        options: {
            id:null,                    // 就是要创建dialog的DIV ID
            title: null,
            renderTo:null,
            width: null,
            height: null,
            maxHeight: 550, // 最大高度。这个关系自动生产高度的弹出框的最大高度。
            injectHtmlId: null,
            formId: null,
            okText: null,
            cancelText: null,
            autoOpen:false,
            resizable:true,
            // callback
            success: null,
            fail: null,
            cancel: null,
            buttons:{}
        },
        // 基于form普通弹出框
        create: function(argOptions) {
            this.options = argOptions;
            var dialog = gaea.component.bridge.biz.create(this.options);
            return dialog;
        }
    },
    /**
     * UR表格控件。
     * @type type
     */
    grid: {
        options: {
            title: null,
            width: null,
            hidden: null,
            resizable: null,
            autoLoad: null,
            renderTo: null,                 // 一般是id。把grid渲染到指定页面元素。
            data: null,                     // json数据。直接初始化表格。
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
                    renderType: null, // 渲染的类型。例如如果字段是日期的，需要转变成日期格式显示。可选：date,time（未实现），datetime（未实现）,link,datelink(未实现)
                    // callback
                    renderer: null          // 数据转换的拦截器
                }
            ],
            proxy: {
                url: null,
                headers: null,
                params:null
            },
            // 监听事件。例如：单击、双击、单击单元格等……
            listeners:{
                cellclick:null
            }
        },
        create: function(options) {
            this.options = options;
            if (gaea.utils.validate.isNull(this.options.renderTo)) {
                console.log("没有renderTo属性将看不到列表！");
            }
            var grid = gaea.component.bridge.grid.create(options);
            return grid;
        },
        getSelected: function(argId) {
            return gaea.component.bridge.grid.getSelected(argId);
        },
        getId: function(argId) {
            return gaea.component.bridge.grid.getId(argId);
        }
    }
};

gaea.component.biz.createDialog = function(argTitle, argHtmlId, argSaveFunc, argCancelFunc) {
    var dialog = gaea.component.bridge.biz.createDialog(argTitle, argHtmlId, argSaveFunc, argCancelFunc);
    return dialog;
};
/**
 * 根据传入的参数，请求特定url进行相关的操作（可能是保存、修改或删除等），并在提交前确认。
 * @param {type} options
 * @returns {undefined}
 */
gaea.component.biz.confirmAndSubmit = function(options) {
    options.optFunc = function() {
        gaea.utils.ajax.post({
            url: options.url,
            data: options.data,
            success: options.success,
            fail: options.fail
        });
    };
    return gaea.component.biz.confirm(options);
};
gaea.component.biz.confirm = function(options) {
    var dialog = gaea.component.bridge.biz.confirmDialog(options.title, options.content, options.optFunc, options.cancelFunc);
    return dialog;
};

//ur.component.grid = {
//    create: function(options) {
//        var grid = ur.component.bridge.grid.create(options);
//        return grid;
//    }
//};

//ur.component.grid = function(dataModel, dataStore, panel) {
//    var grid = ur.component.bridge.grid();
//    return grid;
//};


//ur.component.grid = {
//    getSelected: function(argId) {
//        return ur.component.bridge.grid.getSelected(argId);
//    },
//    getId: function(argId) {
//        return ur.component.bridge.grid.getId(argId);
//    }
//};

gaea.component.getComponent = function(argId) {
    return gaea.component.bridge.getComponent(argId);
};
