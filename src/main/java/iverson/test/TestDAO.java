package iverson.test;

import java.sql.ResultSet;
import java.sql.SQLException;
import java.util.List;
import javax.sql.DataSource;
import org.hibernate.SessionFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.jdbc.core.RowMapper;
import org.springframework.stereotype.Repository;

/**
 *
 * @author Iverson
 */
@Repository
public class TestDAO {

    private JdbcTemplate jdbcTemplate;
    
    @Autowired
    private SessionFactory sessionFactory;

    @Autowired
    public void setDataSource(DataSource dataSource) {
        this.jdbcTemplate = new JdbcTemplate(dataSource);
    }

    public List<Users> query() {
        List<Users> users = this.jdbcTemplate.query(
                "select * from users",
                new RowMapper<Users>() {
                    public Users mapRow(ResultSet rs, int rowNum) throws SQLException {
                        Users user = new Users();
                        user.setId(rs.getLong("id"));
                        user.setName(rs.getString("name"));
                        user.setAddress(rs.getString("address"));
                        return user;
                    }
                });
        return users;
    }
    
    public void save(Department dept){
        sessionFactory.getCurrentSession().save(dept);
    }
}
