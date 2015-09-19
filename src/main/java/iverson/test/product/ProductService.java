package iverson.test.product;

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
public class ProductService {
    @Autowired
    ProductDAO productDAO;
    
    public List<Product> list(){
        return productDAO.query();
    }
    
    public void save(Product p){
        productDAO.save(p);
    }

    public void delete(Long productId) {
        productDAO.delete(productId);
    }

    public void update(Product product) {
        productDAO.update(product);
    }
}
