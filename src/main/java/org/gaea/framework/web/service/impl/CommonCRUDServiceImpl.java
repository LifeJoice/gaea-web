package org.gaea.framework.web.service.impl;

import org.apache.commons.lang3.StringUtils;
import org.gaea.data.dataset.domain.GaeaDataSet;
import org.gaea.data.system.SystemDataSetFactory;
import org.gaea.db.ibatis.jdbc.SQL;
import org.gaea.exception.SysInitException;
import org.gaea.exception.SysLogicalException;
import org.gaea.exception.SystemConfigException;
import org.gaea.exception.ValidationFailedException;
import org.gaea.framework.web.repository.CommonCRUDRepository;
import org.gaea.framework.web.schema.GaeaSchemaCache;
import org.gaea.framework.web.schema.domain.GaeaXmlSchema;
import org.gaea.framework.web.service.CommonCRUDService;
import org.gaea.util.GaeaPropertiesReader;
import org.gaea.workflow.service.WorkflowRuntimeService;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Qualifier;
import org.springframework.jdbc.core.namedparam.MapSqlParameterSource;
import org.springframework.jdbc.core.namedparam.NamedParameterJdbcTemplate;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

/**
 * Created by Iverson on 2015/8/11.
 */
@Service
public class CommonCRUDServiceImpl implements CommonCRUDService {
    private final Logger logger = LoggerFactory.getLogger(CommonCRUDServiceImpl.class);
    @Autowired
    private CommonCRUDRepository commonCRUDRepository;
    @Autowired
    private GaeaSchemaCache gaeaSchemaCache;
    @Autowired
    private WorkflowRuntimeService workflowRuntimeService;
    @Autowired
    private NamedParameterJdbcTemplate namedParameterJdbcTemplate;
    @Autowired(required = false)
    @Qualifier("systemPropertiesReader")
    private GaeaPropertiesReader systemProperties;
    // 默认的删除状态.只有在读不到系统配置时才生效.
    private final String DELETE_STATUS = "0";
    // 删除的类型
    private final int DELETE_TYPE_REAL = 0;// 真删除
    private final int DELETE_TYPE_PSEUDO = 1;// 伪删除

    /**
     * 重构.把当前方法作为真删除的入口。原有方法拆分成3个方法:
     * commonDeleteById 通用删除，包含校验和工作流删除
     * delete 真删除
     * pseudoDelete 伪删除
     * by Iverson 2016-8-7 18:54:23
     *
     * @param urSchemaId
     * @param gridId
     * @param recordId
     * @param wfProcInstId
     * @param deleteReason
     * @throws ValidationFailedException
     * @throws SysLogicalException
     * @throws SystemConfigException
     */
    @Override
    @Transactional
    public void deleteById(String urSchemaId, String gridId, String recordId, String wfProcInstId,
                           String deleteReason) throws ValidationFailedException, SysLogicalException, SystemConfigException, SysInitException {

        // 真删除
        commonDeleteById(urSchemaId, gridId, recordId, wfProcInstId, deleteReason, DELETE_TYPE_REAL);


//        if (StringUtils.isBlank(urSchemaId)) {
//            throw new ValidationFailedException("未能获取Schema id.无法删除操作！");
//        }
//        if(StringUtils.isBlank(gridId)){
//            throw new ValidationFailedException("未能获取列表的grid id.无法删除操作！");
//        }
//        // 从缓存获取XML SCHEMA对象
//        GaeaXmlSchema gaeaXmlSchema = gaeaSchemaCache.get(urSchemaId);
//        if(gaeaXmlSchema ==null){
//            throw new SysLogicalException("未能从缓存获取对应的Schema对象。请检查逻辑关系！");
//        }
//        // 这里得获取Grid，不能获取GridDTO
//        String tableName = gaeaXmlSchema.getSchemaViews().getGrid().getDsPrimaryTable();
//        if(!StringUtils.isBlank(tableName)) {
//            logger.debug("系统通用删除操作. Delete table: "+tableName+" record id: "+recordId);
//            MapSqlParameterSource params = new MapSqlParameterSource();
//            params.addValue("ID",recordId);
//            //定义SQL
//            StringBuilder sql = new StringBuilder("DELETE FROM ");
//            sql.append(tableName)
//                    .append(" WHERE id=:ID");
//            //创建原生SQL查询QUERY实例,指定了返回的实体类型
//            int result = namedParameterJdbcTemplate.update(sql.toString(),params);
////            query.setParameter("ID", id);
//            //执行查询，返回的是实体列表,
////            int result = query.executeUpdate();
////            int result = commonCRUDRepository.deleteById(tableName, recordId);
//        }
//        // 如果有工作流程ID，删除工作流的流程实例
//        if (!StringUtils.isBlank(wfProcInstId)) {
//            workflowRuntimeService.delProcessInstance(wfProcInstId, deleteReason);
//        }
    }

    /**
     * 伪删除。
     *
     * @param urSchemaId
     * @param gridId
     * @param recordId
     * @param wfProcInstId
     * @param deleteReason
     * @throws ValidationFailedException
     * @throws SysLogicalException
     * @throws SystemConfigException
     */
    @Override
    @Transactional
    public void pseudoDeleteById(String urSchemaId, String gridId, String recordId, String wfProcInstId,
                                 String deleteReason) throws ValidationFailedException, SysLogicalException, SystemConfigException, SysInitException {
        // 伪删除
        commonDeleteById(urSchemaId, gridId, recordId, wfProcInstId, deleteReason, DELETE_TYPE_PSEUDO);
    }

    /**
     * 通用删除。主要是兼容真删除和伪删除。负责两者通用的检查部分。
     * copy from deleteById 2016-8-7 18:57:59
     *
     * @param urSchemaId
     * @param gridId
     * @param recordId
     * @param wfProcInstId
     * @param deleteReason
     * @param deleteType
     * @throws ValidationFailedException
     * @throws SysLogicalException
     * @throws SystemConfigException
     */
    @Transactional
    private void commonDeleteById(String urSchemaId, String gridId, String recordId, String wfProcInstId,
                                  String deleteReason, int deleteType) throws ValidationFailedException, SysLogicalException, SystemConfigException, SysInitException {
        if (StringUtils.isBlank(urSchemaId)) {
            throw new ValidationFailedException("未能获取Schema id.无法删除操作！");
        }
        if (StringUtils.isBlank(gridId)) {
            throw new ValidationFailedException("未能获取列表的grid id.无法删除操作！");
        }
        // 从缓存获取XML SCHEMA对象
        GaeaXmlSchema gaeaXmlSchema = gaeaSchemaCache.get(urSchemaId);
        if (gaeaXmlSchema == null) {
            throw new SysLogicalException("未能从缓存获取对应的Schema对象。请检查逻辑关系！");
        }
        // 获取要删除的对应的table
        // 这里得获取Grid，不能获取GridDTO
        // TODO 获取要删除的table。这里有个问题，不应该写死从当前schema拿，应该从DataSet缓存拿
//        String tableName = gaeaXmlSchema.getSchemaViews().getGrid().getDsPrimaryTable();
        String tableName = "";
        if (StringUtils.isNotEmpty(gaeaXmlSchema.getSchemaData().getDataSetList().get(0).getPrimaryTable())) {
            tableName = gaeaXmlSchema.getSchemaData().getDataSetList().get(0).getPrimaryTable();
        } else {
            String primaryDS = gaeaXmlSchema.getSchemaViews().getGrid().getDatasetId();
            GaeaDataSet ds = SystemDataSetFactory.getDataSet(primaryDS);
            tableName = ds.getPrimaryTable();
        }

        /**
         * 根据deleteType确定是真删除，还是伪删除
         */
        if (deleteType == DELETE_TYPE_REAL) {
            delete(tableName, recordId);
        } else if (deleteType == DELETE_TYPE_PSEUDO) {
            pseudoDelete(tableName, recordId);
        }
//        if (!StringUtils.isBlank(tableName)) {
//            logger.debug("系统通用删除操作. Delete table: " + tableName + " record id: " + recordId);
//            MapSqlParameterSource params = new MapSqlParameterSource();
//            params.addValue("ID", recordId);
//            //定义SQL
//            StringBuilder sql = new StringBuilder("DELETE FROM ");
//            sql.append(tableName)
//                    .append(" WHERE id=:ID");
//            //创建原生SQL查询QUERY实例,指定了返回的实体类型
//            int result = namedParameterJdbcTemplate.update(sql.toString(), params);
////            query.setParameter("ID", id);
//            //执行查询，返回的是实体列表,
////            int result = query.executeUpdate();
////            int result = commonCRUDRepository.deleteById(tableName, recordId);
//        }
        // 如果有工作流程ID，删除工作流的流程实例
        if (!StringUtils.isBlank(wfProcInstId)) {
            workflowRuntimeService.delProcessInstance(wfProcInstId, deleteReason);
        }
    }

    /**
     * 真删除。
     *
     * @param tableName
     * @param recordId
     * @throws SystemConfigException
     * @throws ValidationFailedException
     */
    private void delete(String tableName, String recordId) throws SystemConfigException, ValidationFailedException {
        if (StringUtils.isEmpty(tableName)) {
            throw new SystemConfigException("删除失败！", "找不到数据集配置的对应的主表.");
        }
        if (StringUtils.isEmpty(tableName)) {
            throw new ValidationFailedException("缺少要删除的记录id.");
        }
        logger.debug("系统通用删除操作. Delete table: " + tableName + " record id: " + recordId);
        MapSqlParameterSource params = new MapSqlParameterSource();
        params.addValue("ID", recordId);
        //定义SQL
        SQL deleteSql = new SQL();
        deleteSql.DELETE_FROM(tableName).WHERE("id=:ID");
        //创建原生SQL查询QUERY实例,指定了返回的实体类型
        int result = namedParameterJdbcTemplate.update(deleteSql.toString(), params);
        logger.debug("delete SQL: {}\n params:{} delete count:{} ", deleteSql.toString(), params.getValues(), result);
    }

    /**
     * 伪删除操作。
     *
     * @param tableName
     * @param recordId
     * @throws SystemConfigException
     * @throws ValidationFailedException
     */
    private void pseudoDelete(String tableName, String recordId) throws SystemConfigException, ValidationFailedException {
        if (StringUtils.isEmpty(tableName)) {
            throw new SystemConfigException("删除失败！", "找不到数据集配置的对应的主表.");
        }
        if (StringUtils.isEmpty(tableName)) {
            throw new ValidationFailedException("缺少要删除的记录id.");
        }
        // 获取删除的状态（从配置文件，没有就代码默认）
        String deleteStatus = StringUtils.isEmpty(systemProperties.get("system.crud.pseudo_deleted_status")) ? DELETE_STATUS : systemProperties.get("system.crud.pseudo_deleted_status");
        logger.debug("系统通用伪删除操作. Delete table: " + tableName + " record id: " + recordId);
        MapSqlParameterSource params = new MapSqlParameterSource();
        params.addValue("ID", recordId);
        params.addValue("STATUS", deleteStatus);
        //定义SQL
        SQL deleteSql = new SQL();
        deleteSql.UPDATE(tableName).SET("STATUS=:STATUS").WHERE("ID=:ID");
        //创建原生SQL查询QUERY实例,指定了返回的实体类型
        int result = namedParameterJdbcTemplate.update(deleteSql.toString(), params);
        logger.debug("delete SQL: {}\n params:{} delete count:{} ", deleteSql.toString(), params.getValues(), result);
    }
}
