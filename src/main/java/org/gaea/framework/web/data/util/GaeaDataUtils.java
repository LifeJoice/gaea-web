package org.gaea.framework.web.data.util;

import org.apache.commons.collections.CollectionUtils;
import org.gaea.data.dataset.domain.DataItem;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.util.LinkedCaseInsensitiveMap;

import java.util.HashMap;
import java.util.List;
import java.util.Map;

/**
 * 数据工具。
 * Created by iverson on 2017年11月28日09:48:29
 */
public class GaeaDataUtils {
    private static final Logger logger = LoggerFactory.getLogger(GaeaDataUtils.class);

    /**
     * 把DataItem对象列表转换为map。其中key为dataItem.value，value为dataItem.text。
     * 才能给GaeaStringUtils把value转为text。
     *
     * @param dataItemList
     * @param isInsensitive 是否map的key大小写不敏感
     * @return
     */
    public static Map<String, String> toMap(List<DataItem> dataItemList, boolean isInsensitive) {
        Map<String, String> result = isInsensitive ? new LinkedCaseInsensitiveMap<String>() : new HashMap<String, String>(); // 根据需要，初始化是否大小写不敏感的map
        if (CollectionUtils.isEmpty(dataItemList)) {
            return result;
        }
        for (DataItem dataItem : dataItemList) {
            if (dataItem == null || dataItem.getValue() == null) {
                continue;
            }
            // 反过来，才能用value转text
            result.put(dataItem.getValue(), dataItem.getText());
        }
        return result;
    }


}
