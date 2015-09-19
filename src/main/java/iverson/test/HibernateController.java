package iverson.test;

import java.util.List;
import javax.servlet.http.HttpServletRequest;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Controller;
import org.springframework.web.bind.annotation.RequestMapping;

/**
 *
 * @author Iverson
 */
@Controller
public class HibernateController {
    
    @Autowired
    HibernateService hibernateService;
    
    @RequestMapping("/hibernate/list-all-users.do")
    public String listUsers(HttpServletRequest request) {
        System.out.println("--------->>>Hello Iverson.");
        List<Users> list = hibernateService.query();
        request.setAttribute("USERS", list);
        return "user_list";
    }
    
    @RequestMapping("/hibernate/add-user.do")
    public String save(HttpServletRequest request,Users user) {
        System.out.println("-------->>>>name: "+user.getName());
        hibernateService.save(user);
        return "forward:list-all-users.do";
    }
}
