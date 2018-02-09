package org.gaea.framework.web.data.util;

import com.fasterxml.jackson.databind.JavaType;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.apache.commons.collections.CollectionUtils;
import org.apache.commons.lang3.StringUtils;
import org.gaea.data.dataset.domain.*;
import org.gaea.data.system.SystemDataSetFactory;
import org.gaea.exception.*;
import org.gaea.framework.web.GaeaWebSystem;
import org.gaea.framework.web.data.authority.domain.*;
import org.gaea.framework.web.data.authority.domain.DsAuthorityImpl;
import org.gaea.framework.web.data.authority.entity.DsAuthConditionEntity;
import org.gaea.framework.web.data.authority.entity.DsAuthConditionSetEntity;
import org.gaea.framework.web.data.authority.entity.DsAuthorityEntity;
import org.gaea.framework.web.data.domain.DataSetEntity;
import org.gaea.framework.web.data.domain.DsConditionEntity;
import org.gaea.framework.web.data.domain.DsConditionSetEntity;
import org.gaea.framework.web.schema.GaeaSchemaCache;
import org.gaea.framework.web.schema.domain.DataSet;
import org.gaea.framework.web.schema.domain.GaeaXmlSchema;
import org.gaea.security.domain.Role;
import org.gaea.util.BeanUtils;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

import java.io.IOException;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

/**
 * 数据集工具。
 * Created by iverson on 2016/12/20.
 */
public class GaeaDataSetUtils {
    private static final Logger logger = LoggerFactory.getLogger(GaeaDataSetUtils.class);

    /**
     * 实体转换。把数据集实体，转换为数据集vo。
     *
     * @param origDataSetEntity
     * @return
     * @throws InvalidDataException
     */
    public static GaeaDataSet convert(DataSetEntity origDataSetEntity) throws InvalidDataException {
        if (origDataSetEntity == null) {
            return null;
        }
        ObjectMapper objectMapper = null;
        try {
            objectMapper = GaeaWebSystem.getBean(ObjectMapper.class);
        } catch (SysInitException e) {
            objectMapper = new ObjectMapper();
        }
        if (objectMapper == null) {
            objectMapper = new ObjectMapper();
        }

        GaeaDataSet gaeaDataSet = new GaeaDataSet();
        GaeaDataSet cacheDataSet = SystemDataSetFactory.getDataSet(origDataSetEntity.getName());
        Where where = new Where();
        // dataFormat不覆盖。数据库没有这个定义！
        BeanUtils.copyProperties(origDataSetEntity, gaeaDataSet, "dsAuthorities", "orderBy", "groupBy");
        // 数据库的name才是缓存里的id。TODO 后面得重构。GaeaDataSet也有name。
        gaeaDataSet.setId(origDataSetEntity.getName());
        // 转换数据集的静态数据StaticResults为List
        if (StringUtils.isNotEmpty(origDataSetEntity.getDsData())) {
            JavaType javaType = objectMapper.getTypeFactory().constructParametrizedType(ArrayList.class, List.class, DataItem.class);
            try {
                List<DataItem> dataItemList = objectMapper.readValue(origDataSetEntity.getDsData(), javaType);
                gaeaDataSet.setStaticResults(dataItemList);
            } catch (IOException e) {
                throw new InvalidDataException("转换数据集的dsData为List<DataItem>失败！dsData：" + origDataSetEntity.getDsData(), e);
            }
        }
        // 复制conditionSets
        if (CollectionUtils.isNotEmpty(origDataSetEntity.getDsConditionSetEntities())) {
            Map<String, ConditionSet> conditionSetMap = new HashMap<String, ConditionSet>();
            for (DsConditionSetEntity dsCs : origDataSetEntity.getDsConditionSetEntities()) {
                ConditionSet condSet = convert(dsCs);
                conditionSetMap.put(dsCs.getName(), condSet);
            }
            where.setConditionSets(conditionSetMap);
            gaeaDataSet.setWhere(where);
        }
        // 复制dsAuthorites
        if (CollectionUtils.isNotEmpty(origDataSetEntity.getDsAuthorities())) {
            List<DsAuthorityImpl> newDsAuthorities = new ArrayList<DsAuthorityImpl>();
            for (DsAuthorityEntity authorityEntity : origDataSetEntity.getDsAuthorities()) {
                DsAuthorityImpl dsAuthorityImpl = convert(authorityEntity);
                newDsAuthorities.add(dsAuthorityImpl);
            }
            gaeaDataSet.setDsAuthorities(newDsAuthorities);
        }
        // 复制dataFormat
        if (cacheDataSet != null && cacheDataSet.getDataFormat() != null) {
            gaeaDataSet.setDataFormat(cacheDataSet.getDataFormat());
        }
        return gaeaDataSet;
    }

    /**
     * 把DsAuthorityEntity转换为DsAuthority对象。
     *
     * @param authorityEntity
     * @return
     */
    private static DsAuthorityImpl convert(DsAuthorityEntity authorityEntity) {
        if (authorityEntity == null) {
            return null;
        }
        DsAuthorityImpl dsAuthorityImpl = new DsAuthorityImpl();
        /**
         * 复制角色列表
         */
        if (CollectionUtils.isNotEmpty(authorityEntity.getRoles())) {
            List<DsAuthorityRole> newRoles = new ArrayList<DsAuthorityRole>();
            for (Role role : authorityEntity.getRoles()) {
                DsAuthorityRole newRole = new DsAuthorityRole();
                // 复制角色的属性值
                BeanUtils.copyProperties(role, newRole);
                // 把角色add到新的列表
                newRoles.add(newRole);
            }
            // 新的角色列表写入
            dsAuthorityImpl.setRoles(newRoles);
        }
        /**
         * 复制ConditionSet
         */
        if (authorityEntity.getDsAuthConditionSetEntity() != null) {
            ConditionSet condSet = convert(authorityEntity.getDsAuthConditionSetEntity());
            dsAuthorityImpl.setConditionSet(condSet);
        }
        return dsAuthorityImpl;
    }

    /**
     * 这个是转换DataSet的ConditionSet的。
     * 把Entity的ConditionSet，转换为普通的ConditionSet.
     *
     * @param dsCs
     * @return
     */
    public static ConditionSet convert(DsConditionSetEntity dsCs) {
        ConditionSet condSet = new ConditionSet();
        BeanUtils.copyProperties(dsCs, condSet);
        if (CollectionUtils.isNotEmpty(dsCs.getDsConditionEntities())) {
            condSet.setConditions(new ArrayList<Condition>());
            for (DsConditionEntity dsC : dsCs.getDsConditionEntities()) {
                Condition condition = new Condition();
                BeanUtils.copyProperties(dsC, condition);
                condSet.getConditions().add(condition);
            }
        }
        return condSet;
    }

    /**
     * 克隆一个ConditionSet。
     *
     * @param conditionSet
     * @return
     */
    public static ConditionSet clone(ConditionSet conditionSet) {
        if (conditionSet == null) {
            return null;
        }
        ConditionSet newConditionSet = new ConditionSet();
        BeanUtils.copyProperties(conditionSet, newConditionSet);
        if (CollectionUtils.isNotEmpty(conditionSet.getConditions())) {
            newConditionSet.setConditions(new ArrayList<Condition>());
            for (Condition c : conditionSet.getConditions()) {
                Condition newCondition = new Condition();
                BeanUtils.copyProperties(c, newCondition);
                newConditionSet.getConditions().add(newCondition);
            }
        }
        return newConditionSet;
    }

    /**
     * 这个是转换DsAuthorities的ConditionSet的。
     * 把Entity的AuthConditionSet，转换为普通的ConditionSet.
     *
     * @param dsCs
     * @return
     */
    public static ConditionSet convert(DsAuthConditionSetEntity dsCs) {
        ConditionSet condSet = new ConditionSet();
        BeanUtils.copyProperties(dsCs, condSet);
        if (CollectionUtils.isNotEmpty(dsCs.getDsAuthConditionEntities())) {
            condSet.setConditions(new ArrayList<Condition>());
            for (DsAuthConditionEntity dsC : dsCs.getDsAuthConditionEntities()) {
                Condition condition = new Condition();
                BeanUtils.copyProperties(dsC, condition);
                condSet.getConditions().add(condition);
            }
        }
        return condSet;
    }

    /**
     * 根据 schema id获取对应的数据集id，再从缓存的数据集中，找到数据集定义对象，返回。
     *
     * @param schemaId
     * @return
     * @throws ValidationFailedException
     * @throws SysLogicalException
     * @throws SystemConfigException
     * @throws SysInitException
     */
    public static GaeaDataSet getGaeaDataSet(String schemaId) throws ValidationFailedException, SysLogicalException, SystemConfigException, SysInitException {
        if (StringUtils.isBlank(schemaId)) {
            throw new ValidationFailedException("未能获取Schema id (in param schema id is null).无法查询！");
        }
        GaeaSchemaCache gaeaSchemaCache = GaeaWebSystem.getBean(GaeaSchemaCache.class);
        if (gaeaSchemaCache == null) {
            throw new SysInitException("获取不到缓存对象", "获取不到Spring容器中的GaeaSchemaCache对象");
        }
        GaeaXmlSchema gaeaXmlSchema = gaeaSchemaCache.get(schemaId);
        if (gaeaXmlSchema == null) {
            throw new SysLogicalException("未能从缓存获取对应的Schema对象。请检查逻辑关系！");
        }
        DataSet dataSet = gaeaXmlSchema.getSchemaData().getDataSetList().get(0);
        if (dataSet == null || StringUtils.isEmpty(dataSet.getId())) {
            throw new SystemConfigException("XML Schema的DataSet配置错误。没有配置DataSet或DataSet缺少id。SchemaId : " + schemaId);
        }
        GaeaDataSet gaeaDataSet = SystemDataSetFactory.getDataSet(dataSet.getId());
        return gaeaDataSet;
    }
}
