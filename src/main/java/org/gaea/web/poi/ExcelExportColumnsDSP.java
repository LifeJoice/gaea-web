package org.gaea.web.poi;

import org.apache.commons.collections.CollectionUtils;
import org.apache.commons.collections.MapUtils;
import org.apache.commons.lang3.StringUtils;
import org.gaea.data.dataset.DsProcessor;
import org.gaea.data.dataset.domain.DataItem;
import org.gaea.exception.SysInitException;
import org.gaea.framework.web.schema.SystemCacheFactory;
import org.gaea.framework.web.schema.utils.GaeaExcelUtils;
import org.gaea.poi.domain.ExcelTemplate;
import org.gaea.poi.domain.Field;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Component;

import java.util.ArrayList;
import java.util.List;
import java.util.Map;

/**
 * 一个数据集的数据处理类。通过编码的方式，构造数据。
 * 自定义处理类，需要是一个spring bean。并且实现DsProcessor接口。
 * <p>
 * 功能:<br/>
 * 提供excel导出的列选择, 用户可以选择只导出部分列.
 * </p>
 * Created by iverson on 2018/4/24.
 */
@Component("excelExportColumnsDSP")
public class ExcelExportColumnsDSP implements DsProcessor {
    private final Logger logger = LoggerFactory.getLogger(ExcelExportColumnsDSP.class);
    /**
     * 执行本处理类需要的一些参数。当前主要有两个配置值。
     * <ul>
     * 参数值：
     * <li>schemaId - 从XML Schema中获取grid的列定义，供用户选择导出哪些列</li>
     * <li>excelTemplateId - 从excel模板获取列定义，供用户选择导出哪些列</li>
     * </ul>
     */
    private Map<String, Object> params;

    @Override
    public List<DataItem> dataProcess(List<Map<String, Object>> origData, Map contextParams) {
        List<DataItem> result = new ArrayList<DataItem>();

        try {
            // 获取列定义。这个看配置bean的时候的参数
            Map<String, Field> fieldsDefineMap = getFields();
            if (MapUtils.isNotEmpty(fieldsDefineMap)) {
                for (String key : fieldsDefineMap.keySet()) {
                    Field excelField = fieldsDefineMap.get(key);
                    DataItem rowItem = new DataItem();
//                    Map<String, Object> row = new HashMap<String, Object>();
//                    row.put("text", excelField.getTitle());
//                    row.put("value", excelField.getName());
                    rowItem.setText(excelField.getTitle());
                    rowItem.setValue(excelField.getName());
                    result.add(rowItem);
                }
            }
        } catch (SysInitException e) {
            logger.error("Excel自定义导出的处理类，处理失败。发现初始化异常。", e);
        }


        return result;
    }

    /**
     * 获取当前要导出的Excel字段。
     * <p>
     * 这个可以在XML配置文件中配置。有两个配置值：schemaId|excelTemplateId<br/>
     * <ul>
     * <li>如果配置了schemaId,则会以xml schema的grid的字段为准.</li>
     * <li>如果配置了excelTemplateId,则以对应的excel导出配置模板的字段为准.</li>
     * </ul>
     * </p>
     *
     * @return
     * @throws SysInitException
     */
    private Map<String, Field> getFields() throws SysInitException {
        Map<String, Field> result = null;
        if (MapUtils.isNotEmpty(this.params)) {
            if (StringUtils.isNotEmpty((CharSequence) this.params.get("schemaId"))) {
                /**
                 * 如果配置了schemaId，以schemaId的字段为准
                 -----------------------------------------------------------------*/
                String schemaId = (String) this.params.get("schemaId");
                result = GaeaExcelUtils.getFields(schemaId);
            } else if (StringUtils.isNotEmpty((CharSequence) this.params.get("excelTemplateId"))) {
                /**
                 * 如果配置了excelTemplateId，以excel模板的字段为准
                 -----------------------------------------------------------------*/
                String excelTemplateId = (String) this.params.get("excelTemplateId");
                ExcelTemplate excelTemplate = SystemCacheFactory.getExcelTemplate(excelTemplateId);
                if (CollectionUtils.isNotEmpty(excelTemplate.getExcelSheetList()) && CollectionUtils.isNotEmpty(excelTemplate.getExcelSheetList().get(0).getBlockList())) {
                    result = excelTemplate.getExcelSheetList().get(0).getBlockList().get(0).getFieldMap();
                }
            }
        }
        return result;
    }

    @Override
    public Map<String, Object> getParams() {
        return params;
    }

    @Override
    public void setParams(Map<String, Object> params) {
        this.params = params;
    }
}
