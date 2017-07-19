package org.gaea.framework.web.data.service.impl;

import com.fasterxml.jackson.databind.ObjectMapper;
import org.apache.commons.collections.CollectionUtils;
import org.apache.commons.lang3.StringUtils;
import org.gaea.data.dataset.domain.DataItem;
import org.gaea.exception.ProcessFailedException;
import org.gaea.exception.ValidationFailedException;
import org.gaea.framework.web.data.authority.entity.DsAuthConditionEntity;
import org.gaea.framework.web.data.authority.entity.DsAuthorityEntity;
import org.gaea.framework.web.data.authority.jo.DsAuthConditionJO;
import org.gaea.framework.web.data.domain.DataSetEntity;
import org.gaea.framework.web.data.repository.SystemDataSetRepository;
import org.gaea.framework.web.data.repository.SystemDsAuthorityRepository;
import org.gaea.framework.web.data.service.SystemDsAuthorityMgrService;
import org.gaea.util.BeanUtils;
import org.gaea.util.GaeaJacksonUtils;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

/**
 * Created by iverson on 2017/7/3.
 */
@Service
public class SystemDsAuthorityMgrServiceImpl implements SystemDsAuthorityMgrService {
    private final Logger logger = LoggerFactory.getLogger(SystemDataSetServiceImpl.class);
    @Autowired
    private ObjectMapper objectMapper;
    @Autowired
    private SystemDsAuthorityRepository systemDsAuthorityRepository;
    @Autowired
    private SystemDataSetRepository systemDataSetRepository;

    /**
     * 编辑功能，获取编辑的数据。
     *
     * @param dsAuthorityId
     * @return
     * @throws ProcessFailedException
     */
    @Override
    @Transactional(readOnly = true)
    public Map loadEditData(String dsAuthorityId) throws ProcessFailedException {
        if (StringUtils.isEmpty(dsAuthorityId)) {
            throw new IllegalArgumentException("数据权限id为空，无法加载编辑数据！");
        }
        Map<String, Object> result = new HashMap<String, Object>();
        DsAuthorityEntity dsAuthorityEntity = systemDsAuthorityRepository.findWithAuthCondSets(dsAuthorityId);
        if (dsAuthorityEntity == null) {
            throw new ProcessFailedException("找不到对应的数据集的权限，无法编辑！");
        }
        // 转换为map，因为后面还要附加DsData转换的list
        result.put("dsAuthority.id", dsAuthorityEntity.getId());
        result.put("dsAuthority.name", dsAuthorityEntity.getName());
        result.put("dsAuthority.description", dsAuthorityEntity.getDescription());
        if (dsAuthorityEntity.getDsAuthConditionSetEntity() != null) {
            result.put("dsAuthCondSet.id", dsAuthorityEntity.getDsAuthConditionSetEntity().getId());
            result.put("dsAuthCondSet.name", dsAuthorityEntity.getDsAuthConditionSetEntity().getName());
            result.put("dsAuthCondSet.appendSql", dsAuthorityEntity.getDsAuthConditionSetEntity().getAppendSql());

            List<DsAuthConditionJO> dsAuthConditionJOList = new ArrayList<DsAuthConditionJO>();
            for (DsAuthConditionEntity conditionEntity : dsAuthorityEntity.getDsAuthConditionSetEntity().getDsAuthConditionEntities()) {
                DsAuthConditionJO conditionJO = new DsAuthConditionJO();
                BeanUtils.copyProperties(conditionEntity, conditionJO);
                dsAuthConditionJOList.add(conditionJO);
            }

            result.put("authConditionList", dsAuthConditionJOList);
        }
        return result;
    }


    @Override
    @Transactional
    public void saveDsAuthority(DsAuthorityEntity dsAuthority) throws ValidationFailedException {
        if (dsAuthority == null) {
            throw new ValidationFailedException("数据集权限对象为空，无法保存！");
        }
        if (dsAuthority.getDataSetEntity() == null || StringUtils.isEmpty(dsAuthority.getDataSetEntity().getId())) {
            throw new ValidationFailedException("获取不到数据集id，无法新增数据集权限。");
        }
        DataSetEntity newDataSet = systemDataSetRepository.findOne(dsAuthority.getDataSetEntity().getId());
        if (newDataSet == null) {
            throw new ValidationFailedException("提交的数据集id在数据库中查找不到！DataSetId=" + dsAuthority.getDataSetEntity().getId());
        }
        // 双向绑定DsAuthority和DataSet的关系
        dsAuthority.setDataSetEntity(newDataSet);
        // 双向绑定DsAuthCondition和DsAuthConditionSet的关系
        for (DsAuthConditionEntity cond : dsAuthority.getDsAuthConditionSetEntity().getDsAuthConditionEntities()) {
            cond.setDsAuthConditionSetEntity(dsAuthority.getDsAuthConditionSetEntity());
        }
        // 双向绑定DsAuthority和DsAuthConditionSet的关系
        dsAuthority.getDsAuthConditionSetEntity().setDsAuthorityEntity(dsAuthority);

        // 双向绑定DataSet和DsAuthority的关系
        if (newDataSet.getDsAuthorities() == null) {
            newDataSet.setDsAuthorities(new ArrayList<DsAuthorityEntity>());
        }
        newDataSet.getDsAuthorities().add(dsAuthority);

        systemDsAuthorityRepository.save(dsAuthority);
    }

    @Override
    @Transactional
    public void updateDsAuthority(DsAuthorityEntity dsAuthority) throws ValidationFailedException {
        if (dsAuthority == null || StringUtils.isEmpty(dsAuthority.getId())) {
            throw new ValidationFailedException("数据集权限对象为空，无法保存！");
        }
        if (dsAuthority.getDataSetEntity() == null || StringUtils.isEmpty(dsAuthority.getDataSetEntity().getId())) {
            throw new ValidationFailedException("获取不到数据集id，无法新增数据集权限。");
        }
        // find dataset
        DataSetEntity newDataSet = systemDataSetRepository.findOne(dsAuthority.getDataSetEntity().getId());
        if (newDataSet == null) {
            throw new ValidationFailedException("提交的数据集id在数据库中查找不到！DataSetId=" + dsAuthority.getDataSetEntity().getId());
        }

        // 双向绑定DsAuthority和DataSet的关系
        dsAuthority.setDataSetEntity(newDataSet);

        // 双向绑定DsAuthCondition和DsAuthConditionSet的关系
        // condition -> conditionSet
        for (DsAuthConditionEntity cond : dsAuthority.getDsAuthConditionSetEntity().getDsAuthConditionEntities()) {
            cond.setDsAuthConditionSetEntity(dsAuthority.getDsAuthConditionSetEntity());
        }

        // 双向绑定DsAuthority和DsAuthConditionSet的关系
        // authority conditionSet -> authority
        dsAuthority.getDsAuthConditionSetEntity().setDsAuthorityEntity(dsAuthority);

        // 双向绑定DataSet和DsAuthority的关系
        if (newDataSet.getDsAuthorities() == null) {
            newDataSet.setDsAuthorities(new ArrayList<DsAuthorityEntity>());
        }
        newDataSet.getDsAuthorities().add(dsAuthority);

        systemDsAuthorityRepository.save(dsAuthority);
    }

    @Override
    @Transactional
    public void delete(List<DsAuthorityEntity> deleteAuthorityList) throws ValidationFailedException {
        if (CollectionUtils.isEmpty(deleteAuthorityList)) {
            return;
        }
        for (DsAuthorityEntity inAuthority : deleteAuthorityList) {
            if (StringUtils.isEmpty(inAuthority.getId())) {
                throw new ValidationFailedException("要删除的数据集权限id为空！删除失败！");
            }
        }
        systemDsAuthorityRepository.delete(deleteAuthorityList);
    }
}
