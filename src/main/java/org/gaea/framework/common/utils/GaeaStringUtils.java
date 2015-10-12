package org.gaea.framework.common.utils;

import org.apache.commons.lang3.StringUtils;

/**
 * Created by Iverson on 2015/6/28.
 */
public class GaeaStringUtils {

    public static final String DEFAULT_NEW_LINES = "\\n";
    public static final String DEFAULT_ENTER = "\\r";
    public static final String DEFAULT_TAB = "\\t";
    protected final String PRE_SQUARE_BRACKETS = "[";
    protected final String SFX_SQUARE_BRACKETS = "]";

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
     *
     * @param inStr
     * @return
     */
    public static String removeHyphenAndUnderline(String inStr) {
        if (StringUtils.isBlank(inStr)) {
            return inStr;
        }
        inStr = StringUtils.remove(inStr, "-");
        inStr = StringUtils.remove(inStr, "_");
        return inStr;
    }

    /**
     * 抽取特定字符之间的内容。<p/>
     * 很多时候对于一些属性名，或者表达式，都是这样的格式：user[0], user[name], {#name}等。<br/>
     * 这个时候我们就需要获取大括号间，或中括号间的内容。
     * <p>
     *     和Apache StringUtils.substringBetween的区别：</br>
     *     这个方法可以检查中括号的缺少。自动忽略掉一个长串中缺失的中括号项，并跳到下一个中括号项。
     * </p>
     * <p>
     *     例如：<br/>
     *     像 a[.user[0].role[manager].[.[x].[
     *     <br/>本方法就可以提取出：0,manager,x
     * </p>
     * @param content 要检索的字符串
     * @param begin   要抽取内容的左边匹配项
     * @param end     要抽取内容的右边匹配项
     * @return 每个begin和end之间的值的列表
     */
    public static String[] extractSpecPartsIn(String content, String begin, String end) {
        if (StringUtils.isBlank(begin) || StringUtils.isBlank(end)) {
            return new String[]{};
        }
        StringBuilder sb = new StringBuilder();
        while (!StringUtils.isBlank(content)) {
            // 检查是否会漏了右中括号。左中括号可以不检查，因为目前这种处理方式会自动处理。
            String str1 = StringUtils.substringBetween(content, begin, begin);
            // 如果两个左中括号间没有右中括号。
            if(!StringUtils.isBlank(str1) && str1.indexOf(end)<0){
                content = StringUtils.substringAfter(content, begin);
                continue;
            }else if(StringUtils.isBlank(str1) && content.indexOf(end)<0){
                content = StringUtils.substringAfter(content, begin);
                continue;
            }
            content = StringUtils.substringAfter(content, begin);
            if (content.indexOf(end) >= 0) {
                String value = StringUtils.substring(content, 0, content.indexOf(end));
                sb.append(value).append(",");
                content = StringUtils.substringAfter(content, end);
            }
        }
        String[] result = StringUtils.splitByWholeSeparatorPreserveAllTokens(StringUtils.removeEnd(sb.toString(), ","), ",");
        return result;
    }

//    public static void main(String[] args) {
//        String testStr = "a[.user[0].role[manager].[.[x].[";
//        String[] ss = extractSpecPartsIn(testStr, "[", "]");
//        for (String s : ss) {
//            System.out.println("'" + s + "'");
//        }
//        System.out.println("---------- 2 -------------");
//        String[] ss2 = StringUtils.substringsBetween(testStr, "[", "]");
//        for (String s : ss2) {
//            System.out.println("'" + s + "'");
//        }
//        System.out.println("---------- 3 -------------");
//        System.out.println(StringUtils.substringBetween(testStr,"[","]"));
//    }
}
