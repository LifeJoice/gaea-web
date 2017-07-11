package org.gaea.framework.web.data.controller;

import org.gaea.data.dataset.domain.DataItem;
import org.gaea.data.domain.DataSetCommonQueryConditionDTO;
import org.gaea.data.domain.DataSetCommonQueryConditionValueDTO;
import org.gaea.exception.ProcessFailedException;
import org.gaea.exception.ValidationFailedException;
import org.gaea.framework.web.bind.annotation.RequestBean;
import org.gaea.framework.web.common.CommonDefinition;
import org.gaea.framework.web.data.authority.entity.DsAuthConditionEntity;
import org.gaea.framework.web.data.authority.entity.DsAuthConditionSetEntity;
import org.gaea.framework.web.data.authority.entity.DsAuthorityEntity;
import org.gaea.framework.web.data.domain.DataSetEntity;
import org.gaea.framework.web.data.service.SystemDataSetMgrService;
import org.gaea.framework.web.data.service.SystemDataSetService;
import org.gaea.security.domain.Role;
import org.gaea.util.GaeaJacksonUtils;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Controller;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.ResponseBody;

import javax.servlet.http.HttpServletRequest;
import java.io.IOException;
import java.util.ArrayList;
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

//    // 数据集权限管理
//    @RequestMapping(value = "/showDsAuthForm", produces = "plain/text; charset=UTF-8")
//    public String showDsAuthForm() throws ProcessFailedException, IOException {
//        return "/gaea/security/dataset/ds-authority-form.html";
//    }

//    // 数据集权限管理 -> 权限条件管理
//    @RequestMapping(value = "/showDsAuthConditionSetForm", produces = "plain/text; charset=UTF-8")
//    public String showDsAuthConditionSetForm() throws ProcessFailedException, IOException {
//        return "/gaea/security/dataset/ds-auth-conditionSet-form.html";
//    }

//    @RequestMapping("/show-dsAuthority-mgr")
//    public String showDsAuthorityMgr(@RequestBean("selectedRow") DataSetEntity dataSet, HttpServletRequest request) throws ValidationFailedException {
//        if(dataSet==null){
//            throw new ValidationFailedException("必须选择某行记录，进行权限配置！");
//        }
//
//
//
////        List<QueryCondition> conditions = new ArrayList<QueryCondition>();
////        QueryCondition condition = new QueryCondition();
////        condition.setCondOp(QueryCondition.COND_OP_AND);
////        // gaea_sys_ds_authorities.dataset_id
////        condition.setPropName("DATASET_ID");
////        // 等于
////        condition.setOp(QueryCondition.FIELD_OP_EQ);
////        // value = 页面选择的数据集id
////        condition.setPropValue(dataSet.getId());
////        conditions.add(condition);
//
//
//        List<DataSetCommonQueryConditionDTO> queryConditionDTOList = new ArrayList<DataSetCommonQueryConditionDTO>();
//        DataSetCommonQueryConditionDTO queryConditionDTO = new DataSetCommonQueryConditionDTO();
//        queryConditionDTO.setId("byDataSetId");
//        DataSetCommonQueryConditionValueDTO value = new DataSetCommonQueryConditionValueDTO();
//        value.setValue(dataSet.getId());
//        queryConditionDTO.getValues().add(value);
//        queryConditionDTOList.add(queryConditionDTO);
//
//        request.setAttribute(CommonDefinition.PARAM_NAME_QUERY_CONDITIONSETS,queryConditionDTOList);
//        return "system/data/ds_authority_management.xml";
//    }


    @RequestMapping(value = "/add", produces = "plain/text; charset=UTF-8")
    @ResponseBody
    public void save(@RequestBean DataSetEntity dataSet, HttpServletRequest request, @RequestBean("dsDataList") List<DataItem> dsDataList) throws ProcessFailedException {
        systemDataSetMgrService.saveOrUpdate(dataSet, dsDataList);
    }

    // 新增数据集权限
//    @RequestMapping(value = "/add-ds-authority", produces = "plain/text; charset=UTF-8")
//    @ResponseBody
//    public void saveDsAuthority(@RequestBean("selectedRow") DataSetEntity dataSet,
//                                @RequestBean DsAuthorityEntity dsAuthority, @RequestBean DsAuthConditionSetEntity dsAuthCondSet,
//                                @RequestBean List<String> dsAuthRoleIds,
//                                @RequestBean("authConditionList") List<DsAuthConditionEntity> dsAuthConditionList) throws ProcessFailedException, ValidationFailedException {
//        if (dataSet == null) {
//            throw new ValidationFailedException("获取不到对应的数据集信息，无法新增数据集权限。");
//        }
//        if (dsAuthority == null) {
//            throw new ValidationFailedException("数据集权限对象为空，无法保存！");
//        }
//        dsAuthority.setDataSetEntity(dataSet);
//        dsAuthCondSet.setDsAuthConditionEntities(dsAuthConditionList);
//        dsAuthority.setDsAuthConditionSetEntity(dsAuthCondSet);
//        if (dsAuthRoleIds != null) {
//            List<Role> roleList = new ArrayList<Role>();
//            for (String roleId : dsAuthRoleIds) {
//                Role role = new Role();
//                role.setId(roleId);
//                roleList.add(role);
//            }
//            dsAuthority.setRoles(roleList);
//        }
//        systemDataSetMgrService.saveDsAuthority(dsAuthority);
//    }

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

//    // 加载数据，编辑数据集权限
//    @RequestMapping(value = "/load-dsAuth-edit-data", produces = "plain/text; charset=UTF-8")
//    @ResponseBody
//    public String loadDsAuthEditData(@RequestBean("selectedRow") DataSetEntity dataSet) throws ProcessFailedException, IOException {
//        Map result = systemDataSetMgrService.loadEditData(dataSet);
//        if (result != null) {
//            return GaeaJacksonUtils.parse(result);
//        }
//        return "";
//    }

    /**
     * 同步数据库的数据集到缓存中。等同刷新缓存至最新。
     */
    @RequestMapping(value = "/synchronize-db-dataset", produces = "plain/text; charset=UTF-8")
    @ResponseBody
    public void synchronizeDBDataSet() {
        systemDataSetService.synchronizeDBDataSet();
    }
}
