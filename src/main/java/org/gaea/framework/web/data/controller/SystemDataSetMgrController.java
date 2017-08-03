package org.gaea.framework.web.data.controller;

import org.gaea.data.dataset.domain.DataItem;
import org.gaea.exception.ProcessFailedException;
import org.gaea.exception.ValidationFailedException;
import org.gaea.framework.web.bind.annotation.RequestBean;
import org.gaea.framework.web.data.domain.DataSetEntity;
import org.gaea.framework.web.data.service.SystemDataSetMgrService;
import org.gaea.framework.web.data.service.SystemDataSetService;
import org.gaea.util.GaeaJacksonUtils;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Controller;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.ResponseBody;

import javax.servlet.http.HttpServletRequest;
import java.io.IOException;
import java.util.List;
import java.util.Map;

/**
 * Created by iverson on 2016/1/3.
 * 真正添加内容 2016-8-3 14:16:40
 */
@Controller
@RequestMapping("/gaea/data/dataset")
public class SystemDataSetMgrController {
    private final Logger logger = LoggerFactory.getLogger(SystemDataSetMgrController.class);
    @Autowired
    private SystemDataSetMgrService systemDataSetMgrService;
    @Autowired
    private SystemDataSetService systemDataSetService;

    @RequestMapping("/management")
    public String list() {
        return "system/data/dataset_management.xml";
    }

    @RequestMapping(value = "/showCreateUpdateForm", produces = "plain/text; charset=UTF-8")
    public String showCreateUpdateForm() {
        return "/gaea-system/security/dataset/crud-form.html";
    }

    @RequestMapping(value = "/add", produces = "plain/text; charset=UTF-8")
    @ResponseBody
    public void save(@RequestBean DataSetEntity dataSet, HttpServletRequest request, @RequestBean("dsDataList") List<DataItem> dsDataList) throws ProcessFailedException {
        systemDataSetMgrService.saveOrUpdate(dataSet, dsDataList);
    }

    @RequestMapping(value = "/delete", produces = "plain/text; charset=UTF-8")
    @ResponseBody
    public void delete(@RequestBean("selectedRows") List<DataSetEntity> dataSetList, HttpServletRequest request) throws ProcessFailedException, ValidationFailedException {
        systemDataSetMgrService.delete(dataSetList);
    }

    /**
     * 编辑功能，获取数据
     *
     * @param dataSet
     * @return
     * @throws ProcessFailedException
     * @throws IOException
     */
    @RequestMapping(value = "/load-edit-data", produces = "plain/text; charset=UTF-8")
    @ResponseBody
    public String loadEditData(@RequestBean("selectedRow") DataSetEntity dataSet) throws ProcessFailedException, IOException {
        Map result = systemDataSetMgrService.loadEditData(dataSet);
        if (result != null) {
            return GaeaJacksonUtils.parse(result);
        }
        return "";
    }

    /**
     * 同步数据库的数据集到缓存中。等同刷新缓存至最新。
     */
    @RequestMapping(value = "/synchronize-db-dataset", produces = "plain/text; charset=UTF-8")
    @ResponseBody
    public void synchronizeDBDataSet() {
        systemDataSetService.synchronizeDBDataSet();
    }
}
