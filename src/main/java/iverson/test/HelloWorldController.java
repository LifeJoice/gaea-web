package iverson.test;

import com.ur.framework.web.bind.annotation.UrModelAttribute;
import java.util.ArrayList;
import java.util.List;
import javax.servlet.http.HttpServletRequest;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Controller;
import org.springframework.web.bind.WebDataBinder;
import org.springframework.web.bind.annotation.InitBinder;
import org.springframework.web.bind.annotation.ModelAttribute;
import org.springframework.web.bind.annotation.RequestMapping;

/**
 *
 * @author Iverson
 */
@Controller
public class HelloWorldController {

    @Autowired
    private TestService testService;

    @RequestMapping("/list-all-users.do")
    public String helloWorld(HttpServletRequest request) {
//        model.addAttribute("message", "Hello World!");
        System.out.println("--------->>>Hello Iverson.");
        List<Users> list = testService.query();
        request.setAttribute("USERS", list);
        return "user_list";
    }

    @RequestMapping("/test.do")
    public void test(@ModelAttribute("dept") Department dept, @UrModelAttribute("usr") Users user, HttpServletRequest request) {
        List<Users> users = new ArrayList<Users>();
        users.add(user);
        dept.setUsers(users);
        user.setDepartment(dept);
//        testService.saveDepartment(dept,user);
    }

    @InitBinder("dept")
    public void initBinder2(WebDataBinder binder) {
        binder.setFieldDefaultPrefix("dept.");
    }
    
//    @InitBinder("usr")
//    public void initBinder1(WebDataBinder binder) {
//        binder.setFieldDefaultPrefix("usr.");
//    }
}
