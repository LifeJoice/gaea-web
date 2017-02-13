package org.gaea.framework.web.data.service.impl;

import com.fasterxml.jackson.core.JsonProcessingException;
import org.apache.commons.collections.CollectionUtils;
import org.apache.commons.collections.MapUtils;
import org.apache.commons.lang3.StringUtils;
import org.gaea.data.dataset.domain.GaeaDataSet;
import org.gaea.data.dataset.service.GaeaDataSetService;
import org.gaea.data.system.SystemDataSetFactory;
import org.gaea.exception.*;
import org.gaea.framework.web.common.CommonDefinition;
import org.gaea.framework.web.config.SystemProperties;
import org.gaea.framework.web.data.domain.DataSetEntity;
import org.gaea.framework.web.data.domain.DsConditionEntity;
import org.gaea.framework.web.data.domain.DsConditionSetEntity;
import org.gaea.framework.web.data.repository.SystemDataSetRepository;
import org.gaea.framework.web.data.service.SystemDataSetService;
import org.gaea.framework.web.data.util.GaeaDataSetUtils;
import org.gaea.framework.web.schema.domain.DataSet;
import org.gaea.framework.web.schema.domain.PageResult;
import org.gaea.framework.web.schema.domain.SchemaGridPage;
import org.gaea.framework.web.service.CommonViewQueryService;
import org.gaea.util.BeanUtils;
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
 * 数据集的服务类。
 * Created by iverson on 2016-12-10 15:19:25.
 */
@Service
public class SystemDataSetServiceImpl implements SystemDataSetService {
    private final Logger logger = LoggerFactory.getLogger(SystemDataSetServiceImpl.class);
    @Autowired
    private SystemDataSetRepository systemDataSetRepository;
    @Autowired
    private GaeaDataSetService gaeaDataSetService;
    @Autowired
    private CommonViewQueryService commonViewQueryService;

    /**
     * 初始化整个数据集系统。<br/>
     * <p><b>
     * 这个一般在系统启动时运行.
     * </b></p>
     * <p><b>
     * 前提条件: 系统已经解析了XML并缓存(可能单机缓存, 也可能集群缓存).
     * </b></p>
     * <p>
     * <ol>
     * <li>首先, 从缓存读取所有数据集. 然后查询数据库, 和数据库比较, 如果配置了XML数据集为主, 则合并XML的数据集到数据库.</li>
     * <li>然后，在数据库都合并好后，重新从数据库拉取全部数据集。</li>
     * <li>清空缓存，写入新的数据集。</li>
     * </ol>
     * </p>
     */
    @Override
    @Transactional
    public void initDataSetSystem() {
        try {
            // 把系统刚启动、从XML读取到缓存的数据集，同步到数据库
            synchronizeCacheToDB();
            // 等同步完到数据库后, 再把数据库的读出, 刷新系统的缓存数据集. 从而实现两边同步.
            synchronizeDBDataSet();
        } catch (SysInitException e) {
            logger.error(e.getMessage(), e);
        } catch (JsonProcessingException e) {
            logger.error("把数据集的data转换为json数据失败！", e);
        }
    }

    /**
     * 从缓存中（可能是单机的、本地的，也可能的分布式的Redis）获取所有数据集（缓存的怎么来？系统启动时读取XML等处理完、写入缓存）。
     * <br/>
     * 然后, 遍历数据集，查询数据库是否有同名的(name). 没则新增. 有则看后面更新逻辑。
     * <p>
     * <b>更新逻辑:</b><br/>
     * <ol>
     * <li>先判断系统配置文件(可能在system.properties)里，配置的是以DB为主，还是以XML为主。<br/>
     * 如果以DB为主，则不需要管了。（现在是从cache到db）
     * </li>
     * <li>如果以XML为主<br/>
     * 则从缓存读出同名的数据集。更新数据集信息（不含ConditionSet）
     * </li>
     * <li>遍历ConditionSet list，如果同名的覆盖（不含Condition）。不存在的删除。新的新增。</li>
     * <li>针对ConditionSet中的condition list，不做更新操作。每次都全部删除，再重新插入。</li>
     * </ol>
     * </p>
     *
     * @throws SysInitException
     */
    @Override
    @Transactional
    public void synchronizeCacheToDB() throws SysInitException, JsonProcessingException {
        Map<String, GaeaDataSet> dataSetMap = SystemDataSetFactory.getAllDataSets();
        // 先查出数据库所有数据集。用于比对，没有的可以删掉
        List<DataSetEntity> dbAllDataSets = systemDataSetRepository.findAll();
        if (MapUtils.isNotEmpty(dataSetMap)) {
            for (String dsId : dataSetMap.keySet()) {
                GaeaDataSet gaeaDataSet = dataSetMap.get(dsId);
                if (gaeaDataSet != null) {
                    logger.info("查找数据库是否存在同名的数据集. name={}", gaeaDataSet.getId());
                    DataSetEntity dataSetEntity = systemDataSetRepository.findByName(gaeaDataSet.getId());
                    if (dataSetEntity == null) {
                        dataSetEntity = new DataSetEntity(gaeaDataSet);
                        systemDataSetRepository.save(dataSetEntity);
                    } else {
                        logger.info("数据库存在同名的数据集. name={}", gaeaDataSet.getId());
                        /**
                         * 如果配置项 system.dataset.init_base=xml
                         *      如果 dataSet != null
                         *          用XML 转换的 dataset 覆盖数据库的。
                         */
                        String initBase = SystemProperties.get(CommonDefinition.PROP_KEY_SYSTEM_DATASET_INIT_BASE);
                        if (CommonDefinition.PROP_VALUE_INIT_BASE_XML.equalsIgnoreCase(initBase)) {
                            logger.info("系统配置数据库存在同名的数据集, name={}, 尝试用XML的数据集覆盖.", gaeaDataSet.getId());
                            // 同步新的（gaeaDataSet）数据集到数据库并覆盖老的（dataSetEntity）
                            syncDataSetToDb(gaeaDataSet, dataSetEntity);
                        }
                    }
                }
            }
            // 移除xml没有的，数据库却有的
            removeNotExist(dataSetMap, dbAllDataSets);
        }
    }

    /**
     * 检查dsId是否在当前数据库存在，不存在就删掉！
     *
     * @param cacheAllDataSets 要检查是否存在数据库的数据集id
     * @param dbAllDataSets    数据库的所有数据集（Xml到DB覆盖之前的）
     */
    private void removeNotExist(Map<String, GaeaDataSet> cacheAllDataSets, List<DataSetEntity> dbAllDataSets) {
        /**
         * 如果XML没有，数据库有，删掉。
         */
        if (dbAllDataSets != null) {
            for (DataSetEntity ds : dbAllDataSets) {
                // 数据库有、缓存中不存在，即认为XML中已经没有了
                if (cacheAllDataSets.get(ds.getName()) == null) {
                    systemDataSetRepository.delete(ds);
                }
            }
        }
    }

    /**
     * 把cacheGaeaDataSet的内容覆盖到dbDsEntity.
     * <p></p>
     *
     * @param cacheGaeaDataSet 从缓存（Redis）中读出的GaeaDataSet
     * @param dbDsEntity       从数据库读出的和上面的cacheGaeaDataSet同名的数据集
     */
    private void syncDataSetToDb(GaeaDataSet cacheGaeaDataSet, DataSetEntity dbDsEntity) throws JsonProcessingException {
        DataSetEntity newDataSetEntity = new DataSetEntity(cacheGaeaDataSet);
        /**
         * dsAuthorities不能覆盖! 这里忽略！
         * 因为本方法不保存dsAuthorities，但newDataSetEntity的dsAuthorities是null。会覆盖DataSetEntity（虽然不会更新到数据库），导致缓存的对象是错的。
         * 后面的方法获取的时候，就会获取到一个dsAuthorities=null的DataSetEntity
         */
        BeanUtils.copyProperties(newDataSetEntity, dbDsEntity, "id", "dsConditionSetEntities", "dsAuthorities");
        if (CollectionUtils.isNotEmpty(dbDsEntity.getDsConditionSetEntities())) {
            // 合并XML和数据库的ConditionSet list
            copyConditionSet(newDataSetEntity.getDsConditionSetEntities(), dbDsEntity.getDsConditionSetEntities());
            // 获取新增的ConditionSet
            List<DsConditionSetEntity> toAddCondSets = getNewConditionSets(newDataSetEntity.getDsConditionSetEntities(), dbDsEntity);
            // 加入：XML有的，数据库没有的DataSet。
            dbDsEntity.getDsConditionSetEntities().addAll(toAddCondSets);
        }
        systemDataSetRepository.save(dbDsEntity);
    }

    /**
     * 同步数据库的数据集。<br/>
     * 读取数据库的数据集，然后清空当前缓存的所有数据集。再缓存数据库的数据集。
     */
    @Override
    @Transactional(readOnly = true)
    public void synchronizeDBDataSet() {
        List<DataSetEntity> dataSetEntityList = systemDataSetRepository.findAll();
        if (CollectionUtils.isNotEmpty(dataSetEntityList)) {
            try {
                Map<String, GaeaDataSet> gaeaDataSetMap = new HashMap<String, GaeaDataSet>();
                for (DataSetEntity ds : dataSetEntityList) {
                    /**
                     * lazy load各个属性, ConditionSet, Authority, Authority.Roles
                     */
                    ds.getDsConditionSetEntities();
                    ds.getDsAuthorities();
                    GaeaDataSet gaeaDataSet = GaeaDataSetUtils.convert(ds);
                    gaeaDataSetMap.put(gaeaDataSet.getId(), gaeaDataSet);
                }
                // 清空缓存数据集，并写入新的数据集
                gaeaDataSetService.resetDataSets(gaeaDataSetMap);
            } catch (InvalidDataException e) {
                logger.error(e.getMessage(), e);
            } catch (ProcessFailedException e) {
                logger.error("已读取数据库数据集，但刷新系统缓存数据集失败！", e);
            }
        }
    }

    /**
     * 用newDsConditionSets和parentDataSet.dsConditionSets比较，新的放在一个新的list返回。同时，由于JPA操作的关系，需要设置新的ConditionSet的父级是谁，就是parentDataSet了。
     *
     * @param newDsConditionSetEntities 新的要添加的conditionSets，但可能部分和现有的已经重复了。
     * @param parentDataSetEntity       提供两个功能：dsConditionSets作为基础比较哪些是新的，还有本身作为和新conditionSet的关联对象。
     * @return
     */
    private List<DsConditionSetEntity> getNewConditionSets(List<DsConditionSetEntity> newDsConditionSetEntities, DataSetEntity parentDataSetEntity) {
        List<DsConditionSetEntity> toAddCondSets = new ArrayList<DsConditionSetEntity>();
        if (CollectionUtils.isNotEmpty(newDsConditionSetEntities)) {
            // 遍历数据库的数据集
            for (DsConditionSetEntity newCs : newDsConditionSetEntities) {
                boolean isNewTarget = true; // 目标有没有要覆盖的对象。如果最后发现没有，就把这个对象从目标移除。
                for (DsConditionSetEntity conditionSet : parentDataSetEntity.getDsConditionSetEntities()) {

                    /**
                     * 遍历源list。毕竟是两个list，不一定一一对应。
                     * 如果对于target A，遍历了origList都没有，则把A从target list移除。
                     * 如果有，则把orig list的A，覆盖target list的A。
                     */
                    if (conditionSet.getName().equalsIgnoreCase(newCs.getName())) {
                        isNewTarget = false;
                        break;
                    }
                }
                // 如果转了一圈，数据库都没有对应的，则新增。
                if (isNewTarget) {
                    newCs.setDataSetEntity(parentDataSetEntity);
                    toAddCondSets.add(newCs);
                }
            }
        }
        return toAddCondSets;
    }

    /**
     * 合并两个ConditionSet列表. 包括:
     * - ConditionSet的name一样的, 当做同一个. 新的值覆盖旧的, 更新操作.
     * - 如果origConditionSets不包含, 则移除.
     * <p>
     * 不包括处理新增的(origConditionSets 有的而 targetConditionSets没有). 另外处理.
     * </p>
     * <p>
     * 针对ConditionSet中的condition list，不做更新操作。每次都全部删除，再重新插入。
     * </p>
     *
     * @param origConditionSets
     * @param targetConditionSets
     * @return
     */
    private List<DsConditionSetEntity> copyConditionSet(List<DsConditionSetEntity> origConditionSets, List<DsConditionSetEntity> targetConditionSets) {
        List<DsConditionSetEntity> toRemoveCSets = new ArrayList<DsConditionSetEntity>();
        List<DsConditionSetEntity> newCSs = origConditionSets;
        if (CollectionUtils.isNotEmpty(targetConditionSets)) {
            // 遍历数据库的数据集
            for (DsConditionSetEntity conditionSet : targetConditionSets) {
                boolean isInTarget = false; // 目标有没有要覆盖的对象。如果最后发现没有，就把这个对象从目标移除。
                if (CollectionUtils.isNotEmpty(newCSs)) {
                    for (DsConditionSetEntity newCs : newCSs) {
                        /**
                         * 遍历源list。毕竟是两个list，不一定一一对应。
                         * 如果对于target A，遍历了origList都没有，则把A从target list移除。
                         * 如果有，则把orig list的A，覆盖target list的A。
                         */
                        if (conditionSet.getName().equalsIgnoreCase(newCs.getName())) {
                            isInTarget = true;
                            BeanUtils.copyProperties(newCs, conditionSet, "id", "dsConditionEntities", "dataSetEntity");
                            /**
                             * 针对ConditionSet中的condition list，不做更新操作。每次都全部删除，再重新插入。
                             */
                            if (CollectionUtils.isEmpty(conditionSet.getDsConditionEntities())) {
                                conditionSet.setDsConditionEntities(new ArrayList<DsConditionEntity>());
                            }
                            // 清空ConditionSet中全部condition
                            conditionSet.getDsConditionEntities().clear();
                            // 加入新的condition
                            if (CollectionUtils.isNotEmpty(newCs.getDsConditionEntities())) {
                                for (DsConditionEntity newCondition : newCs.getDsConditionEntities()) {
                                    newCondition.setDsConditionSetEntity(conditionSet);
                                    conditionSet.getDsConditionEntities().add(newCondition);
                                }
                            }
                            break;
                        }
                    }
                }
                // 如果转了一圈，XML都没有对应的，则删掉。
                if (!isInTarget) {
                    toRemoveCSets.add(conditionSet);
                }
            }
            // 清除：XML没有，而数据库有的DataSet
            targetConditionSets.removeAll(toRemoveCSets);
        }
        return null;
    }

    /**
     * 查询DataSet的数据并填充。
     * 重构。不要让XmlDataSchemaConvertor负担查询数据的功能了。
     * copy from XmlDataSchemaConvertor.sqlQuery.
     * <p>
     * 使用传入的DataSet的id，查询结果集后，往传入的DataSet填入data和totalElements，并返回。
     * </p>
     *
     * @param ds          就是输入参数ds，填充了数据即返回
     * @param strPageSize
     * @throws InvalidDataException
     */
    @Override
    public DataSet queryDataAndTotalElement(DataSet ds, String strPageSize, String loginName) throws InvalidDataException, SystemConfigException, ValidationFailedException {
        int pageSize = 0;
        if (!StringUtils.isNumeric(strPageSize)) {
            throw new InvalidDataException("XML 定义的pageSize必须为整数.当前值：" + strPageSize);
        }
        pageSize = Integer.parseInt(strPageSize);
        if (pageSize <= 0) {
            throw new InvalidDataException("每页要显示的记录数不允许小于等于0.");
        }
        if (StringUtils.isEmpty(ds.getId())) {
            throw new InvalidDataException("数据集的id不允许为空！");
        }
        GaeaDataSet gaeaDataSet = SystemDataSetFactory.getDataSet(ds.getId());
        if (StringUtils.isBlank(gaeaDataSet.getSql())) {
            return ds;
        }
        PageResult pageResultSet = null;
        try {
            pageResultSet = commonViewQueryService.query(gaeaDataSet, null, new SchemaGridPage(1, pageSize), loginName);

            logger.debug("\n【SQL】 " + gaeaDataSet.getSql() + "\n Query results number : " + (pageResultSet.getContent() != null ? pageResultSet.getContent().size() : "null"));
            ds.setSqlResult((List<Map<String, Object>>) pageResultSet.getContent());
            ds.setTotalElements(pageResultSet.getTotalElements());
        } catch (InvalidDataException e) {
            logger.info("系统动态查询失败。" + e.getMessage());
        }
        return ds;
    }
}
