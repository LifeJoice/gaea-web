/**
 * Created by Iverson on 2015/5/19.
 * 修改支持RequireJS和AMD。并改名为gaeaDialog。 —— modify by Iverson on 2016-2-17 17:28:15
 */
(function( factory ) {
    if ( typeof define === "function" && define.amd ) {

        // AMD. Register as an anonymous module.
        define([
            "jquery",
            "jquery-ui-dialog"
        ], factory );
    } else {
        // Browser globals
        factory( jQuery );
    }
}(function( $ ) {
    return $.widget("custom.gaeaDialog", $.ui.dialog, {
        _createTitlebar: function () {
            var uiDialogTitle;

            this.uiDialogTitlebar = $("<div>")
                .addClass("ui-dialog-titlebar ui-widget-header ui-corner-all ui-helper-clearfix")
                .prependTo(this.uiDialog);
            this._on(this.uiDialogTitlebar, {
                mousedown: function (event) {
                    // Don't prevent click on close button (#8838)
                    // Focusing a dialog that is partially scrolled out of view
                    // causes the browser to scroll it into view, preventing the click event
                    if (!$(event.target).closest(".ui-dialog-titlebar-close")) {
                        // Dialog isn't getting focus when dragging (#8063)
                        this.uiDialog.focus();
                    }
                }
            });

            // support: IE
            // Use type="button" to prevent enter keypresses in textboxes from closing the
            // dialog in IE (#9312)
            this.uiDialogTitlebarClose = $("<span class='ur-ui-dialog-close-icon'></span>")
                //.button({
                //    label: this.options.closeText,
                //    icons: {
                //        primary: "ui-icon-closethick"
                //    },
                //    text: false
                //})
                //.addClass("ui-dialog-titlebar-close")
                .appendTo(this.uiDialogTitlebar);
            this._on(this.uiDialogTitlebarClose, {
                click: function (event) {
                    event.preventDefault();
                    this.close(event);
                }
            });

            uiDialogTitle = $("<span>")
                .uniqueId()
                .addClass("ui-dialog-title")
                .prependTo(this.uiDialogTitlebar);
            this._title(uiDialogTitle);

            this.uiDialog.attr({
                "aria-labelledby": uiDialogTitle.attr("id")
            });
        }
    });
}));