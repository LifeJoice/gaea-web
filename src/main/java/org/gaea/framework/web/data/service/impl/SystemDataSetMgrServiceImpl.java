package org.gaea.framework.web.data.service.impl;

import org.apache.commons.collections.CollectionUtils;
import org.gaea.data.dataset.domain.DataItem;
import org.gaea.exception.ProcessFailedException;
import org.gaea.framework.web.data.domain.DataSetEntity;
import org.gaea.framework.web.data.repository.SystemDataSetRepository;
import org.gaea.framework.web.data.service.SystemDataSetMgrService;
import org.gaea.util.GaeaJacksonUtils;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.io.IOException;
import java.util.List;

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

    @Override
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
}
