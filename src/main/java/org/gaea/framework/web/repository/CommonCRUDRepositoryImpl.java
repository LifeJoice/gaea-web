package org.gaea.framework.web.repository;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Component;

import javax.persistence.EntityManager;
import javax.persistence.PersistenceContext;
import javax.persistence.Query;

/**
 * Created by Iverson on 2015/8/12.
 */
@Component
public class CommonCRUDRepositoryImpl implements CommonCRUDRepository {
    private final Logger logger = LoggerFactory.getLogger(getClass());
    @PersistenceContext
    private EntityManager em;

//    public User findUsername(String userName) {
//        User user = null;
//        //定义SQL
//        String sql = "SELECT * FROM [user] where username=:USER_NAME";
//        //创建原生SQL查询QUERY实例,指定了返回的实体类型
//        Query query = em.createNativeQuery(sql, User.class);
//        query.setParameter("USER_NAME", userName);
//        //执行查询，返回的是实体列表,
//        List<User> userList = query.getResultList();
//        if (userList != null && !userList.isEmpty()) {
//            user = userList.get(0);
//        } else {
//            logger.info("用户不存在。用户名: " + userName);
//        }
//        return user;
//    }

//    public void setEntityManager(EntityManager em) {
//        this.em = em;
//    }

    @Override
    public int deleteById(String tableName, Long id) {
        //定义SQL
        StringBuilder sql = new StringBuilder("DELETE FROM ");
        sql.append(tableName)
                .append(" WHERE id=:ID");
//        String sql = "DELETE FROM [user] where username=:USER_NAME";
        //创建原生SQL查询QUERY实例,指定了返回的实体类型
        Query query = em.createNativeQuery(sql.toString());
        query.setParameter("ID", id);
        //执行查询，返回的是实体列表,
        int result = query.executeUpdate();
        return result;
    }
}
