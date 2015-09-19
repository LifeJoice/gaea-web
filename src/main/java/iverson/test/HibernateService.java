package iverson.test;

import java.util.List;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

/**
 *
 * @author Iverson
 */
@Service
@Transactional
public class HibernateService {
    @Autowired
    HibernateDAO hibernateDAO;
    
    public List<Users> query(){
        List<Users> users = hibernateDAO.query();
        if(users!=null && users.size()>0){
            System.out.println("--------->>>>Has got user datas.");
        }
        return users;
    }
    
    public void save(Users user){
        hibernateDAO.save(user);
    }
}
