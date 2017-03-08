package org.gaea.framework.web.schema.view.action;

import com.fasterxml.jackson.annotation.JsonIgnore;
import org.apache.commons.lang3.BooleanUtils;
import org.apache.commons.lang3.StringUtils;
import org.gaea.exception.ProcessFailedException;
import org.gaea.exception.SysInitException;
import org.gaea.exception.SysLogicalException;
import org.gaea.exception.ValidationFailedException;
import org.gaea.framework.web.GaeaWebSystem;
import org.gaea.framework.web.common.CommonDefinition;
import org.gaea.framework.web.config.SystemProperties;
import org.gaea.framework.web.data.GaeaDefaultDsContext;
import org.gaea.framework.web.schema.Action;
import org.gaea.framework.web.service.ExcelService;
import org.gaea.poi.export.ExcelExport;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

import java.io.File;
import java.util.List;
import java.util.Map;

/**
 * 按钮的action。
 * <p>
 * 现在比较简单，所以这个类还暂时兼着JSON对象的功能。<br/>
 * actionParam暂时不需要同步到前端去。因为现在还不能用表达式，动态的方式。param都暂时还是写死的。不需要前端回传。
 * </p>
 * <p>
 * 我什么这不是一个Spring Bean？因为这个需要根据不同的参数new出来。不能用Spring托管的方式。
 * </p>
 * Created by iverson on 2016/11/4.
 */
public class ExcelExportButtonAction implements Action<File> {
    private final Logger logger = LoggerFactory.getLogger(ExcelExportButtonAction.class);

    private String method;
    @JsonIgnore
    private Map<String, ActionParam> actionParamMap; // Map< param.name , param obj >
    @JsonIgnore
    private String name;

    @Override
    public String getMethod() {
        return method;
    }

    public void setMethod(String method) {
        this.method = method;
    }

    @Override
    public String getName() {
        return name;
    }

    public void setName(String name) {
        this.name = name;
    }

    @Override
    public Map<String, ActionParam> getActionParamMap() {
        return actionParamMap;
    }

    @Override
    public File doAction(String loginName) throws ValidationFailedException {
        File file = null;
        Map<String, ActionParam> actionParamMap = getActionParamMap();
        ActionParam<String> dataSetParam = actionParamMap.get("dataSetId");
        ActionParam<String> excelTemplateParam = actionParamMap.get("excelTemplateId");
        ActionParam<String> withDataParam = actionParamMap.get("withData");
        if (StringUtils.isEmpty(dataSetParam.getValue())) {
            throw new ValidationFailedException("无法获取button action的dataSetId。无法导出操作！");
        }
        try {
            // 这个本身不是一个托管给Spring的bean。所以需要通过静态方法获取上下文的bean。
            ExcelService excelService = GaeaWebSystem.getBean(ExcelService.class);
            ExcelExport excelExport = GaeaWebSystem.getBean(ExcelExport.class);
            List<Map<String, Object>> data = null;
            /**
             * if <param name="withData" value="true" /> 没有 | value不能转成Boolean | value=true
             * 就查询data
             * 其实就是，除非withData=false，否则都会查询data
             */
            if (withDataParam == null || BooleanUtils.toBooleanObject(withDataParam.getValue()) == null || BooleanUtils.toBooleanObject(withDataParam.getValue())) {
                GaeaDefaultDsContext defaultDsContext = new GaeaDefaultDsContext(loginName);
                data = excelService.queryByConditions(null, dataSetParam.getValue().toString(), excelTemplateParam.getValue(), defaultDsContext); // 默认导出1000条
            }
            file = excelExport.export(excelTemplateParam.getValue(), data, SystemProperties.get(CommonDefinition.PROP_KEY_EXCEL_BASE_DIR));
        } catch (SysLogicalException e) {
            logger.debug(e.getMessage(), e);
            throw new ValidationFailedException("系统逻辑错误！请联系管理员处理。");
        } catch (SysInitException e) {
            logger.error("系统初始化异常！", e);
        } catch (ProcessFailedException e) {
            logger.error(e.getMessage(), e);
        }
        return file;
    }

    public void setActionParamMap(Map<String, ActionParam> actionParamMap) {
        this.actionParamMap = actionParamMap;
    }
}
