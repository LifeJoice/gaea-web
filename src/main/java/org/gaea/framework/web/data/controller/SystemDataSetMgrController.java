package org.gaea.framework.web.data.controller;

import org.apache.commons.collections.CollectionUtils;
import org.gaea.data.dataset.domain.DataItem;
import org.gaea.exception.ProcessFailedException;
import org.gaea.framework.web.bind.annotation.RequestBean;
import org.gaea.framework.web.data.domain.DataSetEntity;
import org.gaea.framework.web.data.service.SystemDataSetMgrService;
import org.gaea.framework.web.data.service.SystemDataSetService;
import org.gaea.security.domain.User;
import org.gaea.security.service.SystemUsersService;
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
        return "/gaea/security/dataset/crud-form.html";
    }

    @RequestMapping(value = "/add", produces = "plain/text; charset=UTF-8")
    @ResponseBody
    public void save(@RequestBean DataSetEntity dataSet, HttpServletRequest request, @RequestBean("dsDataList") List<DataItem> dsDataList) throws ProcessFailedException {
        systemDataSetMgrService.saveOrUpdate(dataSet, dsDataList);
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
    /**
     * 权限资源关系编辑页
     *
     * @return
     */
//    @RequestMapping(value = "/showUserRoles", produces = "plain/text; charset=UTF-8")
//    public String showRoleUsers() {
//        return "/gaea/security/user/user-roles-form.html";
//    }

//    @RequestMapping(value = "/add", produces = "plain/text; charset=UTF-8")
//    @ResponseBody
//    public String save(User user) {
//        systemUsersService.save(user);
//        return "";
//    }

//    @RequestMapping(value = "/saveUserRoles", produces = "plain/text; charset=UTF-8")
//    @ResponseBody
//    public String saveUserRoles(User user, @RequestBean List<String> roleIds) {
////        systemRolesService.save(authority);
//        return "";
//    }
}
