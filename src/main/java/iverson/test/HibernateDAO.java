package iverson.test;

import java.util.List;
import org.hibernate.Query;
import org.hibernate.Session;
import org.hibernate.SessionFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Repository;

/**
 *
 * @author Iverson
 */
@Repository
public class HibernateDAO {
    @Autowired(required = false)
    private SessionFactory sessionFactory;
    
    public List<Users> query(){
        if(sessionFactory==null){
            System.out.println("-------->>>>数据源未配置好。需要用Hibernate的sessionFactory。");
        }
//        Session session = sessionFactory.openSession();
        // 必须处在事务中，getCurrentSession()才不会出错
        Query query  = sessionFactory.getCurrentSession().createQuery("from Users u");
        List<Users> list = query.list();
        return list;
    }
    
    public void save(Users user){
        if(sessionFactory==null){
            System.out.println("-------->>>>数据源未配置好。需要用Hibernate的sessionFactory。");
        }
        // 必须处在事务中，getCurrentSession()才不会出错
        sessionFactory.getCurrentSession().save(user);
    }
}
