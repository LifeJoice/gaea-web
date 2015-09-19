package iverson.test;

import java.util.ArrayList;
import java.util.List;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

/**
 *
 * @author Iverson
 */
@Transactional
@Service
public class TestService {

    @Autowired
    TestDAO testDAO;

    public List<Users> query() {
        List<Users> users = testDAO.query();
        if(users!=null && users.size()>0){
            System.out.println("--------->>>>Has got user datas.");
        }
        return users;
    }
    
    public void saveDepartment(Department dept,Users user){
//        Department department = new Department();
//        department.setName("应用管理部");
//        Users userA = new Users();
//        userA.setName("Yan");
//        userA.setAddress("Guangzhou");
//        userA.setDepartment(department);
        testDAO.save(dept);
    }
}
