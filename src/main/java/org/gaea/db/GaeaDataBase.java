package org.gaea.db;

import org.gaea.db.dialect.MySQL56InnoDBDialect;
import org.gaea.db.dialect.Oracle10gDialect;
import org.gaea.db.dialect.SQLServer2008Dialect;
import org.gaea.exception.InvalidDataException;
import org.gaea.framework.web.common.CommonDefinition;
import org.gaea.framework.web.config.SystemProperties;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

/**
 * 这个是跨数据库的工厂类。提供一些通用的功能，特别涉及跨数据库，例如：
 * 拼凑分页SQL等。
 * Created by iverson on 2017年2月14日17:07:55
 */
@Service
public class GaeaDataBase {
    private final Logger logger = LoggerFactory.getLogger(GaeaDataBase.class);

    public static final String DATABASE_NAME_ORACLE = "oracle";
    public static final String DATABASE_NAME_MYSQL = "mysql";
    public static final String DATABASE_NAME_SQL_SERVER = "sqlserver";

    @Autowired
    private Oracle10gDialect oracle10gDialect;
    @Autowired
    private MySQL56InnoDBDialect mySQL56InnoDBDialect;
    @Autowired
    private SQLServer2008Dialect sqlServer2008Dialect;

    /**
     * 获取分页的SQL。
     *
     * @param sql          基础的数据查询sql
     * @param primaryTable 分页相关的id的主表。主要用于获取id来协助分页。MySql有用，Oracle/SQLServer可以为空
     * @param startPos     开始位置。获取数据从startPos+1那条开始。
     * @param pageSize
     * @return
     * @throws InvalidDataException
     */
    public String getPageSql(final String sql, String primaryTable, int startPos, int pageSize) throws InvalidDataException {
        String dataBaseName = SystemProperties.get(CommonDefinition.PROP_KEY_SYSTEM_DATABASE);
        if (DATABASE_NAME_ORACLE.equalsIgnoreCase(dataBaseName)) {
            return oracle10gDialect.getPageSql(sql, primaryTable, startPos, pageSize);
        } else if (DATABASE_NAME_MYSQL.equalsIgnoreCase(dataBaseName)) {
            return mySQL56InnoDBDialect.getPageSql(sql, primaryTable, startPos, pageSize);
        } else if (DATABASE_NAME_SQL_SERVER.equalsIgnoreCase(dataBaseName)) {
            return sqlServer2008Dialect.getPageSql(sql, primaryTable, startPos, pageSize);
        }
        return null;
    }
}
