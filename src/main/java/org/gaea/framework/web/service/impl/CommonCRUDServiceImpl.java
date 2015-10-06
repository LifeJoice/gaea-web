package org.gaea.framework.web.service.impl;

import org.gaea.framework.common.exception.SysLogicalException;
import org.gaea.framework.common.exception.ValidationFailedException;
import org.gaea.framework.web.repository.CommonCRUDRepository;
import org.gaea.framework.web.schema.GaeaSchemaCache;
import org.gaea.framework.web.schema.domain.GaeaXmlSchema;
import org.gaea.framework.web.service.CommonCRUDService;
import org.gaea.workflow.service.WorkflowRuntimeService;
import org.apache.commons.lang3.StringUtils;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

/**
 * Created by Iverson on 2015/8/11.
 */
@Service
public class CommonCRUDServiceImpl implements CommonCRUDService {
    private final Logger logger = LoggerFactory.getLogger(getClass());
    @Autowired
    private CommonCRUDRepository commonCRUDRepository;
    @Autowired
    private GaeaSchemaCache gaeaSchemaCache;
    @Autowired
    private WorkflowRuntimeService workflowRuntimeService;
    @Override
    @Transactional
    public void deleteById(String urSchemaId, String gridId, Long recordId, String wfProcInstId,
                           String deleteReason) throws ValidationFailedException, SysLogicalException {
        if(StringUtils.isBlank(urSchemaId)){
            throw new ValidationFailedException("未能获取Schema id.无法删除操作！");
        }
        if(StringUtils.isBlank(gridId)){
            throw new ValidationFailedException("未能获取列表的grid id.无法删除操作！");
        }
        // 从缓存获取XML SCHEMA对象
        GaeaXmlSchema gaeaXmlSchema = gaeaSchemaCache.get(urSchemaId);
        if(gaeaXmlSchema ==null){
            throw new SysLogicalException("未能从缓存获取对应的Schema对象。请检查逻辑关系！");
        }
        // 这里得获取Grid，不能获取GridDTO
        String tableName = gaeaXmlSchema.getSchemaViews().getGrid().getDsPrimaryTable();
        if(!StringUtils.isBlank(tableName)) {
            logger.debug("系统通用删除操作. Delete table: "+tableName+" record id: "+recordId);
            int result = commonCRUDRepository.deleteById(tableName, recordId);
        }
        // 如果有工作流程ID，删除工作流的流程实例
        if(!StringUtils.isBlank(wfProcInstId)){
            workflowRuntimeService.delProcessInstance(wfProcInstId,deleteReason);
        }
    }
}
