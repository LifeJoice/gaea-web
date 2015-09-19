package iverson.test.product;

import java.util.List;
import org.hibernate.Query;
import org.hibernate.SessionFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Repository;

/**
 *
 * @author Iverson
 */
@Repository
public class ProductDAO {
    @Autowired
    private SessionFactory sessionFactory;
    
    public List<Product> query(){
        Query query  = sessionFactory.getCurrentSession().createQuery("from Product p");
        List<Product> list = query.list();
        return list;
    }
    
    public void save(Product product){
        sessionFactory.getCurrentSession().save(product);
    }
    
    public void update(Product product){
        sessionFactory.getCurrentSession().update(product);
    }

    public void delete(Long productId) {
        Product product = new Product(productId);
        sessionFactory.getCurrentSession().delete(product);
    }
}
