package org.gaea.framework.web.utils;

import com.fasterxml.jackson.databind.JavaType;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.apache.commons.lang3.StringUtils;
import org.gaea.data.dataset.domain.ConditionSet;
import org.gaea.data.dataset.domain.GaeaDataSet;
import org.gaea.data.domain.DataSetCommonQueryConditionDTO;
import org.gaea.db.GaeaSqlProcessor;
import org.gaea.db.QueryCondition;
import org.gaea.exception.ValidationFailedException;
import org.gaea.framework.web.data.service.SystemDataSetService;
import org.gaea.framework.web.data.util.GaeaDataSetUtils;
import org.gaea.framework.web.schema.service.GaeaXmlSchemaService;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Component;

import javax.servlet.http.HttpServletResponse;
import java.io.*;
import java.util.ArrayList;
import java.util.LinkedHashMap;
import java.util.List;

/**
 * 和查询框架的条件相关的一些转换、处理等。
 * Created by iverson on 2017-7-13 11:53:16.
 */
@Component
public class GaeaWebConditionUtils {
    private static final Logger logger = LoggerFactory.getLogger(GaeaWebConditionUtils.class);
    private static final ObjectMapper objectMapper = new ObjectMapper();
    @Autowired
    private SystemDataSetService systemDataSetService;
    @Autowired
    private GaeaSqlProcessor gaeaSqlProcessor;
    @Autowired
    private GaeaXmlSchemaService gaeaXmlSchemaService;

    public static List<DataSetCommonQueryConditionDTO> get(String conditionJsonStr) throws ValidationFailedException {
        List<DataSetCommonQueryConditionDTO> queryConditionDTOList = null;
        if (StringUtils.isNotEmpty(conditionJsonStr)) {
            try {
                JavaType javaType = objectMapper.getTypeFactory().constructParametrizedType(ArrayList.class, List.class, DataSetCommonQueryConditionDTO.class);
                queryConditionDTOList = objectMapper.readValue(conditionJsonStr, javaType);
            } catch (IOException e) {
                logger.debug("转换查询条件失败！", e);
                throw new ValidationFailedException("转换查询条件失败！");
            }
        }
        return queryConditionDTOList;
    }

    public static List<DataSetCommonQueryConditionDTO> getValues(LinkedHashMap<ConditionSet, DataSetCommonQueryConditionDTO> conditionSetMap) {
        List<DataSetCommonQueryConditionDTO> result = new ArrayList<DataSetCommonQueryConditionDTO>();
        if (conditionSetMap != null && !conditionSetMap.isEmpty()) {
            for (ConditionSet condSet : conditionSetMap.keySet()) {
                result.add(conditionSetMap.get(condSet));
            }
        }
        return result;
    }

    public List<QueryCondition> convert(String gaeaSchemaId, String strJsonConditions) throws ValidationFailedException {
        List<QueryCondition> newQueryConditions = new ArrayList<QueryCondition>();
        GaeaDataSet gaeaDataSet = null;
        try {
            gaeaDataSet = GaeaDataSetUtils.getGaeaDataSet(gaeaSchemaId);
        } catch (Exception e) {
            throw new ValidationFailedException("获取不到对应的数据集定义！请联系管理员！", e.getMessage());
        }
        try {
            List<DataSetCommonQueryConditionDTO> queryConditionDTOList = GaeaWebConditionUtils.get(strJsonConditions);
            LinkedHashMap<ConditionSet, DataSetCommonQueryConditionDTO> conditionSetMap = gaeaXmlSchemaService.getConditionSets(gaeaDataSet, queryConditionDTOList, false);
            for (ConditionSet condSet : conditionSetMap.keySet()) {
                List<QueryCondition> queryConditionList = gaeaSqlProcessor.getConditions(condSet, conditionSetMap.get(condSet));
                newQueryConditions.addAll(queryConditionList);
            }

        } catch (Exception e) {
            throw new ValidationFailedException("转换查询条件失败！请联系管理员！", e.getMessage());
        }
        return newQueryConditions;
    }
}
