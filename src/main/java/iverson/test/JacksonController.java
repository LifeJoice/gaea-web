package iverson.test;

import com.fasterxml.jackson.databind.ObjectMapper;
import java.io.IOException;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import javax.servlet.http.HttpServletResponse;
import org.springframework.stereotype.Controller;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.ResponseBody;

/**
 *
 * @author Iverson
 */
@Controller
public class JacksonController {

    /**
     * 目前测试结果：<br/>
     * 1. 直接返回对象不行。Spring不会自动转换。估计还是Spring和Jackson配置的问题。<br/>
     * 2. 可以直接返回的：字符串，字符串json格式<br/>
     * 3. 对象需要用ObjectMapper进行转换，用response返回即可。<br/>
     * <p>
     * 注意：
     * 1. 这个例子里，“@ResponseBody”是可以不要的。why？
     * </p>
     * @param response
     * @return 
     */
    @RequestMapping("/jackson/test.do")
    public @ResponseBody
    void listUsers(HttpServletResponse response) {
        ObjectMapper mapper = new ObjectMapper();
        System.out.println("--------->>>JacksonController.");
        Map<String,String> map = new HashMap<String,String>();
        map.put("name", "Iverson chan");
        map.put("msg", "success you!");
        Users users = new Users();
        users.setId(123456L);
        users.setName("Iverson Chan");
        users.setAddress("xxoo,xxxooo");
        try {
            mapper.writeValue(response.getWriter(), map);
        } catch (IOException ex) {
            ex.printStackTrace();
        }
    }
    
    /**
     * 返回字符串式的Json结果。
     * "@ResponseBody"不可以省略。否则页面无法解析。
     * @param response
     * @return 
     */
    @RequestMapping("/jackson/string_test.do")
    public @ResponseBody String listUsers2(HttpServletResponse response) {
        System.out.println("--------->>>direct return string json results.");
//        return "hello";
        return "{'age':12,'name':'Iverson Chan'}";
    }
    
    @RequestMapping(value = "/jackson/entity_test.do")
    public @ResponseBody List<Users> listUsers3(HttpServletResponse response) {
        System.out.println("--------->>>direct return entity, let framework to convert");
        List<Users> users = new ArrayList<Users>();
        Users u1 = new Users();
        Users u2 = new Users();
        u1.setId(123456L);
        u1.setName("陈川子");
        u1.setAddress("xxoo,xxxooo");
        u2.setId(100002L);
        u2.setName("郭炎其");
        u2.setAddress("白云区");
        users.add(u1);
        users.add(u2);
        return users;
    }
}
