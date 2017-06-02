package org.gaea.framework.web.schema.service;

import org.gaea.exception.SysInitException;
import org.gaea.exception.SysLogicalException;
import org.gaea.exception.ValidationFailedException;
import org.gaea.framework.web.schema.domain.view.SchemaGrid;

import java.util.List;
import java.util.Map;

/**
 * 基于XML SCHEMA的DATA内容，提供的对外接口和服务。
 * Created by Iverson on 2015/10/16.
 */
public interface SchemaDataService {
    /**
     * 把根据SCHEMA DATA配置的DATA-SET，根据SCHEMA其他配置，转换为页面显示的数据结果。
     *
     * @param origResults
     * @param grid
     * @param isDsTranslate    是否需要对列进行数据集转换。例如是列表页之类的，可能是需要的；但如果是表单编辑的，那就不需要。否则填充值的时候会比较麻烦。
     * @return
     * @throws SysLogicalException
     */
    public List<Map<String, Object>> transformViewData(List<Map<String, Object>> origResults, SchemaGrid grid, boolean isDsTranslate) throws SysLogicalException, ValidationFailedException;

    List<Map<String, Object>> transformViewData(List<Map<String, Object>> origResults, String excelTemplateId) throws SysLogicalException, ValidationFailedException, SysInitException;
}
