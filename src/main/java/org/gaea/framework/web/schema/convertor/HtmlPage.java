package org.gaea.framework.web.schema.convertor;

import org.apache.commons.lang3.StringUtils;

/**
 * Created by Iverson on 2015/7/25.
 */
public class HtmlPage {

    public HtmlPage(String htmlContent) {
        this.content = htmlContent;
    }

    protected String content;

    public synchronized void replace(String keyword,String content){
        if(StringUtils.isBlank(keyword)){
            return;
        }
        this.content = StringUtils.replace(getContent(),keyword,content);
    }

    public synchronized String getContent() {
        return content;
    }
}
