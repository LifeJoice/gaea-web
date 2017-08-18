package org.gaea.framework.web.data.service.impl;

import com.fasterxml.jackson.core.JsonProcessingException;
import org.apache.commons.collections.CollectionUtils;
import org.apache.commons.collections.MapUtils;
import org.apache.commons.lang3.StringUtils;
import org.gaea.data.dataset.domain.ConditionSet;
import org.gaea.data.dataset.domain.GaeaDataSet;
import org.gaea.data.dataset.domain.GaeaDsResultConfig;
import org.gaea.data.dataset.service.GaeaDataSetService;
import org.gaea.data.domain.DataSetCommonQueryConditionDTO;
import org.gaea.data.system.SystemDataSetFactory;
import org.gaea.exception.*;
import org.gaea.framework.web.common.CommonDefinition;
import org.gaea.framework.web.config.SystemProperties;
import org.gaea.framework.web.data.domain.DataSetEntity;
import org.gaea.framework.web.data.domain.DsConditionSetEntity;
import org.gaea.framework.web.data.repository.SystemDataSetRepository;
import org.gaea.framework.web.data.service.SystemDataSetService;
import org.gaea.framework.web.data.util.DataSetConvertHelper;
import org.gaea.framework.web.data.util.GaeaDataSetUtils;
import org.gaea.framework.web.schema.GaeaSchemaCache;
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

import java.util.*;

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
    @Autowired
    private GaeaSchemaCache gaeaSchemaCache;

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
     * 同步数据库的数据集。<br/>
     * 读取数据库的数据集，然后清空当前缓存的所有数据集。再缓存数据库的数据集。
     * <p>
     *     {@code <columns-define>}不从数据库同步，只以XML文档为主。
     * </p>
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
                    // 不要覆盖columns，这个数据库没有存储的
                    GaeaDataSet cacheDataSet = SystemDataSetFactory.getDataSet(ds.getName());
                    if (cacheDataSet != null) {
                        gaeaDataSet.setColumns(cacheDataSet.getColumns());
                    }

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
     * 查询DataSet的数据并填充。
     * 重构。不要让XmlDataSchemaConvertor负担查询数据的功能了。
     * copy from XmlDataSchemaConvertor.sqlQuery.
     * <p>
     * 使用传入的DataSet的id，查询结果集后，往传入的DataSet填入data和totalElements，并返回。
     * </p>
     *
     * @param ds              就是输入参数ds，填充了数据即返回
     * @param strPageSize
     * @param loginName
     * @param conditionSetMap key：条件集 value：条件集的值。这个需要有序的map。查询条件组成sql的顺序，会按照map中的顺序来。
     * @return
     * @throws InvalidDataException
     * @throws SystemConfigException
     * @throws ValidationFailedException
     */
    @Override
    public DataSet queryDataAndTotalElement(DataSet ds, String strPageSize, String loginName, LinkedHashMap<ConditionSet, DataSetCommonQueryConditionDTO> conditionSetMap) throws InvalidDataException, SystemConfigException, ValidationFailedException {
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
        if (gaeaDataSet == null) {
            throw new ValidationFailedException("无法执行数据集的查询。缓存中获取不到对应的数据集。", "DataSet id: " + ds.getId() + "");
        }
        if (StringUtils.isBlank(gaeaDataSet.getSql())) {
            return ds;
        }
        PageResult pageResultSet = null;
        try {
            pageResultSet = commonViewQueryService.query(gaeaDataSet, conditionSetMap, new SchemaGridPage(1, pageSize), loginName);

            logger.debug("\n【SQL】 " + gaeaDataSet.getSql() + "\n Query results number : " + (pageResultSet.getContent() != null ? pageResultSet.getContent().size() : "null"));
            ds.setSqlResult((List<Map<String, Object>>) pageResultSet.getContent());
            ds.setTotalElements(pageResultSet.getTotalElements());
        } catch (InvalidDataException e) {
            logger.info("系统动态查询失败。" + e.getMessage());
        }
        return ds;
    }

    /**
     * 获取数据集对应的数据接口。
     *
     * @param resultConfig
     * @param schemaId
     * @param queryConditionDTO
     * @return
     * @throws ValidationFailedException
     * @throws SysLogicalException
     * @throws SysInitException
     */
    @Override
    public List<Map<String, Object>> getData(GaeaDsResultConfig resultConfig, String schemaId, DataSetCommonQueryConditionDTO queryConditionDTO) throws ValidationFailedException, SysLogicalException, SysInitException {

        // 获取数据集定义。可能从数据库读，也可能从缓存获取。
        GaeaDataSet dataSetDef = SystemDataSetFactory.getDataSet(resultConfig.getDsId());
        List<Map<String, Object>> results = null;
        // TODO 【重构】
        // 整合CommonViewQueryController和当前方法两种数据集查询方式。一个是通过SQL，一个更多是静态。
        if (StringUtils.isEmpty(dataSetDef.getSql())) {
            results = gaeaDataSetService.getCommonResults(resultConfig);
        } else {
            boolean isDsTranslate = true;
//            // 如果没有schemaId，也就没有字段定义了，转换也没意义了
//            if (StringUtils.isEmpty(schemaId)) {
//                isDsTranslate = false;
//            }
//            DataSetCommonQueryConditionDTO queryConditionDTO = null;
//            if (StringUtils.isNotEmpty(conditions)) {
//                try {
//                    queryConditionDTO = objectMapper.readValue(conditions, DataSetCommonQueryConditionDTO.class);
//                } catch (IOException e) {
//                    logger.debug("转换查询条件失败！", e);
//                    throw new ValidationFailedException("转换查询条件失败！");
//                }
//            }
            // 默认需要对结果的每个字段做数据集转换
            results = commonViewQueryService.queryByConditions(schemaId, resultConfig.getDsId(), null, queryConditionDTO, isDsTranslate);
        }
        return results;
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
        /**
         * if 数据库的DataSet.ConditionSet不为空
         *      合并新（可能是XML）的ConditionSet
         * else if 新的ConditionSet不为空（且，经过上一个if，潜台词数据库的DataSet.ConditionSet为空）
         *      直接赋值
         */
        if (CollectionUtils.isNotEmpty(dbDsEntity.getDsConditionSetEntities())) {
            // 合并XML和数据库的ConditionSet list
            // 【重要】只是合并！不处理新增的！
            DataSetConvertHelper.copyConditionSet(newDataSetEntity.getDsConditionSetEntities(), dbDsEntity.getDsConditionSetEntities());
            // 获取新增的ConditionSet
            List<DsConditionSetEntity> toAddCondSets = DataSetConvertHelper.getNewConditionSets(newDataSetEntity.getDsConditionSetEntities(), dbDsEntity);
            // 加入：XML有的，数据库没有的DataSet。
            dbDsEntity.getDsConditionSetEntities().addAll(toAddCondSets);
        } else if (CollectionUtils.isNotEmpty(newDataSetEntity.getDsConditionSetEntities())) {
            /**
             * 经过上一个if，即数据库的DataSet.ConditionSet是空
             * 而，新的（XML）的DataSet.ConditionSet不为空
             * 直接赋值！
             */
            if (dbDsEntity.getDsConditionSetEntities() == null) {
                dbDsEntity.setDsConditionSetEntities(new ArrayList<DsConditionSetEntity>());
            }
            // 获取新增的ConditionSet
            List<DsConditionSetEntity> toAddCondSets = DataSetConvertHelper.getNewConditionSets(newDataSetEntity.getDsConditionSetEntities(), dbDsEntity);
            // 加入：XML有的，数据库没有的DataSet。
            dbDsEntity.getDsConditionSetEntities().addAll(toAddCondSets);
        }
        systemDataSetRepository.save(dbDsEntity);
    }
}
