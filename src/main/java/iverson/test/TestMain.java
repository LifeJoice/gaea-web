package iverson.test;

import org.gaea.db.ibatis.jdbc.SQL;
import org.gaea.framework.web.data.GaeaDefaultDsContext;
import org.gaea.framework.web.data.GaeaSqlParserContext;
import org.gaea.security.domain.User;
import org.springframework.expression.EvaluationContext;
import org.springframework.expression.Expression;
import org.springframework.expression.ExpressionParser;
import org.springframework.expression.ParserContext;
import org.springframework.expression.spel.standard.SpelExpressionParser;
import org.springframework.expression.spel.support.StandardEvaluationContext;

import java.util.HashMap;
import java.util.Map;

/**
 * Created by iverson on 2017/9/27.
 */
public class TestMain {
    public static void main(String[] args) {

//        System.out.println(System.currentTimeMillis() - 2937600000L);

        // -------------------------------------------------------------- Test Enum --------------------------------------------------------------
//        System.out.println(TestEnum.STATUS_OK);
        // -------------------------------------------------------------- Test paramName --------------------------------------------------------------
        String gaea$value = "hello";
        String $gaea_value = "hello";
        System.out.println(gaea$value + "  、  " + $gaea_value);
        // -------------------------------------------------------------- Test SPEL --------------------------------------------------------------
        ExpressionParser parser = new SpelExpressionParser();
        ParserContext parserContext = new GaeaSqlParserContext();
        User user = new User();
        user.setName("IVerson");
        Map contextMap = new HashMap();
        contextMap.put("gaea_value", 2);
//        contextMap.put("abc", "");
        StandardEvaluationContext context = new StandardEvaluationContext(user);
        context.setVariables(contextMap);
        Expression expression =
                parser.parseExpression("#{#gaea_value-1} and #{name} and #{'hi,'.concat(#abc==null?'man': #abc)}", parserContext);
        String parseResult = expression.getValue(context).toString();
        System.out.println("Spring EL解析结果：" + parseResult);

        // -------------------------------------------------------------- Test SQL --------------------------------------------------------------
        SQL sq = new SQL().SELECT("*").FROM("Test").WHERE("name='iverson'").ORDER_BY("id,name").GROUP_BY("price,age");
        System.out.println("SQL:\n" + sq.toString());
    }

    enum TestEnum {
        STATUS_OK(200);
        private int status;

        private TestEnum(int status) {
            this.status = status;
        }

        @Override
        public String toString() {
            return String.valueOf(status);
        }
    }
}
