package org.gaea.framework.web.data.service.impl;

import com.fasterxml.jackson.databind.ObjectMapper;
import org.apache.commons.collections.CollectionUtils;
import org.apache.commons.lang3.StringUtils;
import org.gaea.data.dataset.domain.DataItem;
import org.gaea.exception.InvalidDataException;
import org.gaea.exception.ProcessFailedException;
import org.gaea.exception.ValidationFailedException;
import org.gaea.framework.web.data.authority.entity.DsAuthConditionEntity;
import org.gaea.framework.web.data.authority.entity.DsAuthorityEntity;
import org.gaea.framework.web.data.domain.DataSetEntity;
import org.gaea.framework.web.data.repository.SystemDataSetRepository;
import org.gaea.framework.web.data.repository.SystemDsAuthorityRepository;
import org.gaea.framework.web.data.service.SystemDataSetMgrService;
import org.gaea.util.GaeaJacksonUtils;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.io.IOException;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

/**
 * 数据集的管理功能Service。
 * 例如：增删改什么的。
 * 框架的数据集功能，放在SystemDataSetService，不放在这里！
 * Created by iverson on 2017/6/1.
 */
@Service
public class SystemDataSetMgrServiceImpl implements SystemDataSetMgrService {

    private final Logger logger = LoggerFactory.getLogger(SystemDataSetServiceImpl.class);
    @Autowired
    private SystemDataSetRepository systemDataSetRepository;
    @Autowired
    private SystemDsAuthorityRepository systemDsAuthorityRepository;

    @Override
    @Transactional
    public void saveOrUpdate(DataSetEntity dataSetEntity, List<DataItem> dsDataList) throws ProcessFailedException {
        if (dataSetEntity == null) {
            throw new IllegalArgumentException("数据集为空，无法保存！");
        }
        // 如果有定义dsDataList，表示该数据集有静态数据。转换成json字符串保存。
        if (CollectionUtils.isNotEmpty(dsDataList)) {
            try {
                String dsData = GaeaJacksonUtils.parse(dsDataList);
                dataSetEntity.setDsData(dsData);
            } catch (IOException e) {
                logger.error("转换数据集静态数据失败！" + e.getMessage(), e);
                throw new ProcessFailedException("转换数据集静态数据失败！");
            }
        }
        // save
        systemDataSetRepository.save(dataSetEntity);
    }

    /**
     * 编辑功能，获取编辑的数据。
     *
     * @param inDataSet
     * @return
     * @throws ProcessFailedException
     */
    @Override
    public Map loadEditData(DataSetEntity inDataSet) throws ProcessFailedException {
        if (inDataSet == null || StringUtils.isEmpty(inDataSet.getId())) {
            throw new IllegalArgumentException("数据集或数据集id为空，无法加载编辑数据！");
        }
        Map<String, Object> result = new HashMap<String, Object>();
        DataSetEntity dataSet = systemDataSetRepository.findOne(inDataSet.getId());
        // 转换为map，因为后面还要附加DsData转换的list
        result.put("dataSet.name", dataSet.getName());
        result.put("dataSet.primaryTable", dataSet.getPrimaryTable());
        result.put("dataSet.authorityType", dataSet.getAuthorityType());
        result.put("dataSet.cacheType", dataSet.getCacheType());
        result.put("dataSet.sql", dataSet.getSql());
        // 如果静态数据非空
        if (StringUtils.isNotEmpty(dataSet.getDsData())) {
            try {
//                result = objectMapper.convertValue(dataSet, Map.class);
                // 转换DsData静态数据json
                List<DataItem> dataItemList = GaeaJacksonUtils.parseList(dataSet.getDsData(), ArrayList.class, DataItem.class);
                result.put("dsDataList", dataItemList);
            } catch (Exception e) {
                logger.error(e.getMessage(), e);
                throw new ProcessFailedException("数据集json数据转换失败！");
            }
        }
        return result;
    }

    @Override
    public void delete(List<DataSetEntity> inDataSetList) throws ValidationFailedException {
        if (CollectionUtils.isEmpty(inDataSetList)) {
            return;
        }
        for (DataSetEntity inDataSet : inDataSetList) {
            if (StringUtils.isEmpty(inDataSet.getId())) {
                throw new ValidationFailedException("要删除的数据集id为空！删除失败！");
            }
        }
        systemDataSetRepository.delete(inDataSetList);
    }
//
//    @Override
//    @Transactional
//    public void saveDsAuthority(DsAuthorityEntity dsAuthority) throws ValidationFailedException {
//        if (dsAuthority == null) {
//            throw new ValidationFailedException("数据集权限对象为空，无法保存！");
//        }
//        if (dsAuthority.getDataSetEntity() == null || StringUtils.isEmpty(dsAuthority.getDataSetEntity().getId())) {
//            throw new ValidationFailedException("获取不到数据集id，无法新增数据集权限。");
//        }
//        DataSetEntity newDataSet = systemDataSetRepository.findOne(dsAuthority.getDataSetEntity().getId());
//        if (newDataSet == null) {
//            throw new ValidationFailedException("提交的数据集id在数据库中查找不到！DataSetId=" + dsAuthority.getDataSetEntity().getId());
//        }
//        // 双向绑定DsAuthority和DataSet的关系
//        dsAuthority.setDataSetEntity(newDataSet);
//        // 双向绑定DsAuthCondition和DsAuthConditionSet的关系
//        for (DsAuthConditionEntity cond : dsAuthority.getDsAuthConditionSetEntity().getDsAuthConditionEntities()) {
//            cond.setDsAuthConditionSetEntity(dsAuthority.getDsAuthConditionSetEntity());
//        }
//        // 双向绑定DsAuthority和DsAuthConditionSet的关系
//        dsAuthority.getDsAuthConditionSetEntity().setDsAuthorityEntity(dsAuthority);
//
//        // 双向绑定DataSet和DsAuthority的关系
//        if (newDataSet.getDsAuthorities() == null) {
//            newDataSet.setDsAuthorities(new ArrayList<DsAuthorityEntity>());
//        }
//        newDataSet.getDsAuthorities().add(dsAuthority);
//
//        systemDsAuthorityRepository.save(dsAuthority);
//    }
//
//    @Override
//    @Transactional
//    public void updateDsAuthority(DsAuthorityEntity dsAuthority) throws ValidationFailedException {
//        if (dsAuthority == null || StringUtils.isEmpty(dsAuthority.getId())) {
//            throw new ValidationFailedException("数据集权限对象为空，无法保存！");
//        }
//        if (dsAuthority.getDataSetEntity() == null || StringUtils.isEmpty(dsAuthority.getDataSetEntity().getId())) {
//            throw new ValidationFailedException("获取不到数据集id，无法新增数据集权限。");
//        }
//        // find dataset
//        DataSetEntity newDataSet = systemDataSetRepository.findOne(dsAuthority.getDataSetEntity().getId());
//        if (newDataSet == null) {
//            throw new ValidationFailedException("提交的数据集id在数据库中查找不到！DataSetId=" + dsAuthority.getDataSetEntity().getId());
//        }
//
//        // 双向绑定DsAuthority和DataSet的关系
//        dsAuthority.setDataSetEntity(newDataSet);
//
//        // 双向绑定DsAuthCondition和DsAuthConditionSet的关系
//        // condition -> conditionSet
//        for (DsAuthConditionEntity cond : dsAuthority.getDsAuthConditionSetEntity().getDsAuthConditionEntities()) {
//            cond.setDsAuthConditionSetEntity(dsAuthority.getDsAuthConditionSetEntity());
//        }
//
//        // 双向绑定DsAuthority和DsAuthConditionSet的关系
//        // authority conditionSet -> authority
//        dsAuthority.getDsAuthConditionSetEntity().setDsAuthorityEntity(dsAuthority);
//
//        // 双向绑定DataSet和DsAuthority的关系
//        if (newDataSet.getDsAuthorities() == null) {
//            newDataSet.setDsAuthorities(new ArrayList<DsAuthorityEntity>());
//        }
//        newDataSet.getDsAuthorities().add(dsAuthority);
//
//        systemDsAuthorityRepository.save(dsAuthority);
//    }
}
