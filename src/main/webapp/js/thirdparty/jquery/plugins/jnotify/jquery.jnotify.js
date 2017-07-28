/**
*	jQuery.jNotify
*	jQuery Notification Engine
*		
*   Copyright (c) 2010 Fabio Franzini
*
*	Permission is hereby granted, free of charge, to any person obtaining a copy
*	of this software and associated documentation files (the "Software"), to deal
*	in the Software without restriction, including without limitation the rights
*	to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
*	copies of the Software, and to permit persons to whom the Software is
*	furnished to do so, subject to the following conditions:
*
*	The above copyright notify and this permission notify shall be included in
*	all copies or substantial portions of the Software.
*
*	THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
*	IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
*	FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
*	AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
*	LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
*	OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN
*	THE SOFTWARE.
*	
*	@author 	Fabio Franzini
* 	@copyright  2010 www.fabiofranzini.com
*	@version    1
**/

/**
 * 改一下支持RequireJS和AMD —— by Iverson 2016-5-31 10:11:59
 */
(function (factory) {
    if (typeof define === "function" && define.amd) {
        // AMD. Register as an anonymous module.
        define([
            "jquery"
        ], factory);
    } else {
        // Browser globals
        factory(jQuery);
    }
}(function(jQuery) {
    jQuery.fn.jnotifyInizialize = function(options) {
        var element = this;

        var defaults = {
            oneAtTime: false,
            appendType: 'append'
        };

        var options = jQuery.extend({}, defaults, options);

        this.addClass('notify-wrapper');

        if (options.oneAtTime)
            this.addClass('notify-wrapper-oneattime');

        if (options.appendType == 'prepend' && options.oneAtTime == false)
            this.addClass('notify-wrapper-prepend');

        return this;
    };
    jQuery.fn.jnotifyAddMessage = function(options) {

        var notifyWrapper = this;
        // <<<<--------------- 先隐藏，为后面动画铺垫。 modify by Iverson 2017年3月8日19:30:06
        //notifyWrapper.css("display","none");

        if (notifyWrapper.hasClass('notify-wrapper')) {

            var defaults = {
                text: '',
                type: 'message',
                showIcon: true,
                permanent: true,
                disappearTime: 3000
            };

            var options = jQuery.extend({}, defaults, options);
            var styleClass;
            var iconClass;

            switch (options.type) {
                case 'message':
                    {
                        // --------------->>>>
                        //styleClass = 'ui-state-highlight';
                        //iconClass = 'ui-icon-info';
                        // <<<<--------------- 改为自己的“提醒消息”图标 modify by Iverson 2017年3月8日19:30:06
                        iconClass = 'fa fa-info-circle fa-3x';
                    }
                    break;
                // add by Iverson 2017年3月9日09:24:30
                case 'success':
                {
                    iconClass = 'fa fa-check-circle fa-3x';
                }
                    break;
                // add by Iverson 2017年3月9日09:24:30
                case 'fail':
                {
                    iconClass = 'fa fa-times-circle fa-3x';
                }
                    break;
                // add by Iverson 2017年7月24日11:46:07
                case 'warn':
                {
                    iconClass = 'fa fa-exclamation-triangle fa-3x';
                }
                    break;
                case 'error':
                    {
                        styleClass = 'ui-state-error';
                        iconClass = 'ui-icon-alert';
                    }
                    break;
                default:
                    {
                        styleClass = 'ui-state-highlight';
                        iconClass = 'ui-icon-info';
                    }
                    break;
            }

            if (notifyWrapper.hasClass('notify-wrapper-oneattime')) {
                this.children().remove();
            }

            var notifyItemWrapper = jQuery('<div class="jnotify-item-wrapper" style="display: none;"></div>');
            var notifyItem = jQuery('<div class="ui-corner-all jnotify-item"></div>')
                                    .addClass(styleClass);

            if (notifyWrapper.hasClass('notify-wrapper-prepend')) {
                notifyItem.prependTo(notifyWrapper);
            } else {
                notifyItem.appendTo(notifyWrapper);
            }

            notifyItem.wrap(notifyItemWrapper);

            // <<<<---------------
            // 改为自己的图标（用font-awesome）.
            // ui-icon -> jnotify-ui-icon
            // modify by Iverson 2017年3月8日19:30:06
            if (options.showIcon) {
                var $uiIconCt = jQuery('<span class="jnotify-ui-icon" style="float:left; margin-right: .3em;" />');
                var $icon = $('<i aria-hidden="true"></i>').addClass(iconClass).appendTo($uiIconCt);
                $uiIconCt.appendTo(notifyItem);
            }

            // 增加一个class，不然不好控制。 modify by Iverson 2017年3月8日19:30:06
            jQuery('<span class="jnotify-content-detail"></span>').html(options.text).appendTo(notifyItem);

            // <<<<--------------- 改为动画式展现.直接用上面的notifyWrapper好像不行。
            // modify by Iverson 2017年3月8日19:30:06
            $(".jnotify-item-wrapper:hidden").show("slide", {direction: "right"}, 300);
            // --------------->>>>
            //jQuery('<div class="jnotify-item-close"><span class="ui-icon ui-icon-circle-close"/></div>')
            //                        .prependTo(notifyItem)
            //                        .click(function() { remove(notifyItem) });
            // <<<<--------------- 改为自己的图标 modify by Iverson 2017年3月8日19:30:06
            jQuery('<div class="jnotify-item-close"><span><i class="fa fa-times" aria-hidden="true"></i></span></div>')
                                    .prependTo(notifyItem)
                                    .click(function() { remove(notifyItem) });

            // IEsucks
            if (navigator.userAgent.match(/MSIE (\d+\.\d+);/)) {
                notifyWrapper.css({ top: document.documentElement.scrollTop });
                //http://groups.google.com/group/jquery-dev/browse_thread/thread/ba38e6474e3e9a41
                notifyWrapper.removeClass('IEsucks');
            }
            // ------

            if (!options.permanent) {
                setTimeout(function() { remove(notifyItem); }, options.disappearTime);
            }
        }

        function remove(obj) {
            obj.animate({ opacity: '0' }, 600, function() {
                obj.parent().animate({ height: '0px' }, 300,
                      function() {
                          obj.parent().remove();
                          // IEsucks
                          if (navigator.userAgent.match(/MSIE (\d+\.\d+);/)) {
                              //http://groups.google.com/group/jquery-dev/browse_thread/thread/ba38e6474e3e9a41
                              obj.parent().parent().removeClass('IEsucks');
                          }
                          // -------
                      });
            });
        }
    };
//})(jQuery);
}));