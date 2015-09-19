package iverson.test.product;

import com.ur.framework.exception.InvalidDataException;
import com.ur.framework.util.ValidationUtils;
import java.math.BigDecimal;
import java.util.List;
import javax.validation.Valid;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.stereotype.Controller;
import org.springframework.validation.BindingResult;
import org.springframework.validation.FieldError;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.ResponseBody;

/**
 *
 * @author Iverson
 */
@Controller
public class ProductController {

    final Logger logger = LoggerFactory.getLogger(ProductController.class);

    @Autowired
    ProductService productService;

    @RequestMapping("/product/list-all.do")
    @ResponseBody
    public List<Product> listAll() {
        logger.info("--------->>>获取产品列表。");
        List<Product> products = productService.list();
        return products;
    }

    /**
     * RequestBoby注释使得可以从http请求的request payload中读取数据。否则会导致读不出数据。
     *
     * @param product
     * @throws com.ur.framework.exception.InvalidDataException
     */
    @RequestMapping("/product/save.do")
    public ResponseEntity<String> save(@Valid Product product, BindingResult result) throws InvalidDataException {
        logger.info("-------->>>>添加新产品。name: " + product.getName() + " description: " + product.getDescription() + " status: " + product.getStatus());
//        BigDecimal price = product.getLastPrice();
//        if (result.hasErrors()) {
//            List<FieldError> errorList = result.getFieldErrors();
//            StringBuilder checkErrors = new StringBuilder();
//            StringBuilder alarmMsg = new StringBuilder();
//            for (int i = 0; i < errorList.size(); i++) {
//                FieldError errField = errorList.get(i);
//                if (i == 0) {
//                    alarmMsg.append(errField.getDefaultMessage());
//                }
//                checkErrors.append("\n")
//                        .append(" [ ").append(errField.getField()).append(" ] ")
//                        .append(" = '").append(errField.getDefaultMessage()).append("'");
//            }
//            logger.warn("校验错误。" + checkErrors.toString());
//            if (!ValidationUtils.isBlank(alarmMsg)) {
//                throw new InvalidDataException(alarmMsg.toString());
//            }
//        }
//        if(price.doubleValue()<0){
//            throw new InvalidDataException("价格不允许小于0。");
//        }
        productService.save(product);
        return new ResponseEntity<String>(HttpStatus.OK);
    }

    /**
     * 返回ResponseEntity，content为中文的乱码解决，添加 produces = "plain/text;
     * charset=UTF-8"
     * <p/>
     * 解决乱码的注释：<p
     * style='color:orange'>@RequestMapping(value="/product/update.do",produces
     * = "plain/text; charset=UTF-8")</p>
     *
     * @param product
     * @return
     */
    @RequestMapping("/product/update.do")
    public ResponseEntity<String> update(Product product, BindingResult result) throws InvalidDataException {
        logger.info("-------->>>>更新新产品。id: " + product.getProductId() + " name: " + product.getName() + " description: " + product.getDescription() + " status: " + product.getStatus());
        productService.update(product);
        return new ResponseEntity<String>("{\"RESULT_MSG\":\"更新成功。\"}", HttpStatus.OK);
    }

    @RequestMapping("/product/delete.do")
    public ResponseEntity<String> delete(String productId) {
        logger.info("-------->>>>删除产品。productId: " + productId);
        Long id = null;
        if (productId != null && !"".equals(productId)) {
            id = Long.parseLong(productId);
        }
        productService.delete(id);
        return new ResponseEntity<String>("{\"RESULT_MSG\":\"删除成功。\"}", HttpStatus.OK);
    }
}
