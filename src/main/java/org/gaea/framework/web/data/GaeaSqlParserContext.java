package org.gaea.framework.web.data;

import org.springframework.expression.ParserContext;

/**
 * 定义，只对SQL里面的#{}的内容进行表达式转换。则#{}外面的其他文字不会受影响。
 * Created by iverson
 * 2017年1月5日 星期四
 */
public class GaeaSqlParserContext implements ParserContext {
    @Override
    public boolean isTemplate() {
        return true;
    }

    @Override
    public String getExpressionPrefix() {
        return "#{";
    }

    @Override
    public String getExpressionSuffix() {
        return "}";
    }
}
