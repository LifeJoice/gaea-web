package org.gaea.framework.common.utils;

import org.apache.commons.lang3.StringUtils;

/**
 * Created by Iverson on 2015/6/28.
 */
public class GaeaStringUtils {

    public static final String DEFAULT_NEW_LINES = "\\n";
    public static final String DEFAULT_ENTER = "\\r";
    public static final String DEFAULT_TAB = "\\t";

    /**
     * 移出字符串<b>前后</b>与内容无关的、主要是格式化的一些字符。例如：换行、空格、tab等。
     * <br/>
     * 只针对字符串的头尾操作！
     *
     * @param inStr
     * @return
     */
    public static String cleanFormatChar(String inStr) {
        String result = inStr;
        if (StringUtils.endsWith(result, DEFAULT_NEW_LINES)) {
            result = StringUtils.removeEnd(result, DEFAULT_NEW_LINES);
            cleanFormatChar(result);
        } else if (StringUtils.endsWith(result, DEFAULT_ENTER)) {
            result = StringUtils.removeEnd(result, DEFAULT_ENTER);
            cleanFormatChar(result);
        } else if (StringUtils.endsWith(result, DEFAULT_TAB)) {
            result = StringUtils.removeEnd(result, DEFAULT_TAB);
            cleanFormatChar(result);
        } else if (StringUtils.startsWith(result, DEFAULT_NEW_LINES)) {
            result = StringUtils.removeStart(result, DEFAULT_NEW_LINES);
            cleanFormatChar(result);
        } else if (StringUtils.startsWith(result, DEFAULT_ENTER)) {
            result = StringUtils.removeStart(result, DEFAULT_ENTER);
            cleanFormatChar(result);
        } else if (StringUtils.startsWith(result, DEFAULT_TAB)) {
            result = StringUtils.removeStart(result, DEFAULT_TAB);
            cleanFormatChar(result);
        }
        return result;
    }

    /**
     * 移出字符的所有下划线和中划线（减号）
     * @param inStr
     * @return
     */
    public static String removeHyphenAndUnderline(String inStr){
        if(StringUtils.isBlank(inStr)){
            return inStr;
        }
        inStr = StringUtils.remove(inStr,"-");
        inStr = StringUtils.remove(inStr,"_");
        return inStr;
    }
}
