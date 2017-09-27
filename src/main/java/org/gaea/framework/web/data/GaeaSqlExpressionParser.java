package org.gaea.framework.web.data;

import org.apache.commons.lang3.StringUtils;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.expression.Expression;
import org.springframework.expression.ExpressionParser;
import org.springframework.expression.ParserContext;
import org.springframework.expression.spel.standard.SpelExpressionParser;
import org.springframework.stereotype.Component;

/**
 * 负责对数据集的SQL里面的表达式进行处理。
 * Created by iverson
 * 2017年1月5日 星期四
 */
@Component
public class GaeaSqlExpressionParser {
    private final Logger logger = LoggerFactory.getLogger(GaeaSqlExpressionParser.class);
    // 可以重用且线程安全
    private ExpressionParser parser = new SpelExpressionParser();
    private ParserContext parserContext = new GaeaSqlParserContext();

    /**
     * 对sql里的表达式进行处理。表达式，必须包含在#{}里面。<br/>
     * 当前支持的是SPEL表达式.
     * <p>
     * 参考:<br/>
     * SELECT *,'#{contextBeans['testContext'].sayHello}' FROM gaea_sys_ds_conditions WHERE CONDITION_SET_ID
     * IN (SELECT id FROM gaea_sys_ds_condition_set WHERE login_name='#{loginName}' AND DATASET_ID=:DATASET_ID)
     * </p>
     * <p>
     * 内置的表达式可调用的上下文对象: GaeaDefaultDsContext
     * </p>
     *
     * @param sql
     * @param defaultDsContext
     * @return
     */
    public String parse(String sql, GaeaDefaultDsContext defaultDsContext) {
        String newSql = sql;
        if (defaultDsContext == null) {
            defaultDsContext = new GaeaDefaultDsContext();
        }
        logger.trace("准备对sql里的表达式进行处理。处理前：\n{}", sql);
        Expression expression =
                parser.parseExpression(sql, parserContext);
//        EvaluationContext context = new StandardEvaluationContext();
//        GaeaDefaultDsContext dsContext = new GaeaDefaultDsContext("Iverson");
//        context.setVariable("gaeaDsContext",dsContext);
        if (defaultDsContext != null) {
            newSql = expression.getValue(defaultDsContext).toString();
        } else {
            newSql = expression.getValue().toString();
        }
        logger.trace("准备对sql里的表达式进行处理。处理后：\n{}", newSql);
//        System.out.println(expression.getValue(dsContext));
        return newSql;
    }

    /**
     * 检查一个字符串，是否包含有表达式。目前只能检查SPEL表达式。
     * <p>
     * 目前检查是否含有：
     * <ul>
     * <li>#{}</li>
     * </ul>
     * </p>
     *
     * @param str
     * @return
     */
    public boolean hasExpression(String str) {
        if (StringUtils.isEmpty(str)) {
            return false;
        }
        if (StringUtils.contains(str, parserContext.getExpressionPrefix()) && StringUtils.contains(str, parserContext.getExpressionSuffix())) {
            return true;
        }
        return false;
    }
}
