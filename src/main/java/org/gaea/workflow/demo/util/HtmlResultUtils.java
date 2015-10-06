package org.gaea.workflow.demo.util;

/**
 * 用于页面显示时，给内容加点样式。
 * Created by Iverson on 2015/5/18.
 */
public class HtmlResultUtils {

    private static String STYLE_IMPORTANT_SUCCESS = " style='margin-top:200px;margin-left:300px;font-family: \"Arial\",\"Microsoft YaHei\",\"黑体\",\"宋体\",sans-serif;' ";

    private static String STYLE_IMPORTANT_WARN = " style='margin-top:200px;margin-left:300px;color:red;font-family: \"Arial\",\"Microsoft YaHei\",\"黑体\",\"宋体\",sans-serif;' ";

    public static String success(String strContent){
        return "<div"+STYLE_IMPORTANT_SUCCESS+">"+strContent+"</div>";
    }
    public static String warn(String strContent){
        return "<div"+STYLE_IMPORTANT_WARN+">"+strContent+"</div>";
    }
}
