package org.gaea.framework.web.data.controller;

import org.apache.commons.lang3.StringUtils;
import org.gaea.data.domain.DataSetCommonQueryConditionDTO;
import org.gaea.data.domain.DataSetCommonQueryConditionValueDTO;
import org.gaea.exception.ProcessFailedException;
import org.gaea.exception.ValidationFailedException;
import org.gaea.framework.web.bind.annotation.RequestBean;
import org.gaea.framework.web.bind.annotation.RequestBeanDataType;
import org.gaea.framework.web.common.CommonDefinition;
import org.gaea.framework.web.data.authority.entity.DsAuthConditionEntity;
import org.gaea.framework.web.data.authority.entity.DsAuthConditionSetEntity;
import org.gaea.framework.web.data.authority.entity.DsAuthorityEntity;
import org.gaea.framework.web.data.domain.DataSetEntity;
import org.gaea.framework.web.data.service.SystemDataSetMgrService;
import org.gaea.framework.web.data.service.SystemDsAuthorityMgrService;
import org.gaea.framework.web.schema.domain.DataSet;
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
 * Created by iverson on 2017/6/30.
 */
@Controller
@RequestMapping("/gaea/data/dataset/auth")
public class SystemDsAuthorityMgrController {
    private final Logger logger = LoggerFactory.getLogger(SystemDataSetMgrController.class);
    @Autowired
    private SystemDataSetMgrService systemDataSetMgrService;
    @Autowired
    private SystemDsAuthorityMgrService systemDsAuthorityMgrService;

    @RequestMapping("/management")
    public String showDsAuthorityMgr(@RequestBean("selectedRow") DataSetEntity dataSet, HttpServletRequest request) throws ValidationFailedException {
        if (dataSet == null) {
            throw new ValidationFailedException("必须选择某行记录，进行权限配置！");
        }


//        List<QueryCondition> conditions = new ArrayList<QueryCondition>();
//        QueryCondition condition = new QueryCondition();
//        condition.setCondOp(QueryCondition.COND_OP_AND);
//        // gaea_sys_ds_authorities.dataset_id
//        condition.setPropName("DATASET_ID");
//        // 等于
//        condition.setOp(QueryCondition.FIELD_OP_EQ);
//        // value = 页面选择的数据集id
//        condition.setPropValue(dataSet.getId());
//        conditions.add(condition);


        List<DataSetCommonQueryConditionDTO> queryConditionDTOList = new ArrayList<DataSetCommonQueryConditionDTO>();
        DataSetCommonQueryConditionDTO queryConditionDTO = new DataSetCommonQueryConditionDTO();
        queryConditionDTO.setId("byDataSetId");
        DataSetCommonQueryConditionValueDTO value = new DataSetCommonQueryConditionValueDTO();
        value.setValue(dataSet.getId());
        queryConditionDTO.getValues().add(value);
        queryConditionDTOList.add(queryConditionDTO);

        request.setAttribute(CommonDefinition.PARAM_NAME_QUERY_CONDITIONSETS, queryConditionDTOList);
        return "system/data/ds_authority_management.xml";
    }

    // 数据集权限管理
    @RequestMapping(value = "/showDsAuthForm", produces = "plain/text; charset=UTF-8")
    public String showDsAuthForm() throws ProcessFailedException, IOException {
        return "/gaea/security/dataset/ds-authority-form.html";
    }

    // 数据集权限管理 -> 权限条件管理
    @RequestMapping(value = "/showDsAuthConditionSetForm", produces = "plain/text; charset=UTF-8")
    public String showDsAuthConditionSetForm() throws ProcessFailedException, IOException {
        return "/gaea/security/dataset/ds-auth-conditionSet-form.html";
    }

    // 新增数据集权限
    @RequestMapping(value = "/add", produces = "plain/text; charset=UTF-8")
    @ResponseBody
    public void saveDsAuthority(@RequestBean(value = CommonDefinition.PARAM_NAME_VIEW_CHAIN, dataType = RequestBeanDataType.JSON) List viewChain,
                                @RequestBean DsAuthorityEntity dsAuthority, @RequestBean DsAuthConditionSetEntity dsAuthCondSet,
                                @RequestBean List<String> dsAuthRoleIds,
                                @RequestBean("authConditionList") List<DsAuthConditionEntity> dsAuthConditionList) throws ProcessFailedException, ValidationFailedException {

        if (viewChain == null || viewChain.isEmpty()) {
            throw new ValidationFailedException("获取不到页面操作的整个链条，无法新增数据集权限。");
        }
        Map<String, Object> parentView = (Map<String, Object>) viewChain.get(0);
        Map<String, Object> selectedRowMap = (Map<String, Object>) parentView.get(CommonDefinition.PARAM_NAME_SELECTED_ROW);
        String dataSetId = String.valueOf(selectedRowMap.get("id"));
        if (StringUtils.isEmpty(dataSetId)) {
            throw new ValidationFailedException("获取不到对应的数据集信息，无法新增数据集权限。");
        }
        DataSetEntity dataSet = new DataSetEntity();
        dataSet.setId(dataSetId);
        if (dsAuthority == null) {
            throw new ValidationFailedException("数据集权限对象为空，无法保存！");
        }
        dsAuthority.setDataSetEntity(dataSet);
        dsAuthCondSet.setDsAuthConditionEntities(dsAuthConditionList);
        dsAuthority.setDsAuthConditionSetEntity(dsAuthCondSet);
        if (dsAuthRoleIds != null) {
            List<Role> roleList = new ArrayList<Role>();
            for (String roleId : dsAuthRoleIds) {
                Role role = new Role();
                role.setId(roleId);
                roleList.add(role);
            }
            dsAuthority.setRoles(roleList);
        }
        systemDsAuthorityMgrService.saveDsAuthority(dsAuthority);
    }

    // 更新数据集权限
    @RequestMapping(value = "/update", produces = "plain/text; charset=UTF-8")
    @ResponseBody
    public void updateDsAuthority(@RequestBean(value = CommonDefinition.PARAM_NAME_VIEW_CHAIN, dataType = RequestBeanDataType.JSON) List viewChain,
                                  @RequestBean DsAuthorityEntity dsAuthority, @RequestBean DsAuthConditionSetEntity dsAuthCondSet,
                                  @RequestBean List<String> dsAuthRoleIds,
                                  @RequestBean("authConditionList") List<DsAuthConditionEntity> dsAuthConditionList) throws ProcessFailedException, ValidationFailedException {

        if (viewChain == null || viewChain.isEmpty()) {
            throw new ValidationFailedException("获取不到页面操作的整个链条，无法新增数据集权限。");
        }
        Map<String, Object> parentView = (Map<String, Object>) viewChain.get(0);
        Map<String, Object> selectedRowMap = (Map<String, Object>) parentView.get(CommonDefinition.PARAM_NAME_SELECTED_ROW);
        String dataSetId = String.valueOf(selectedRowMap.get("id"));
        if (StringUtils.isEmpty(dataSetId)) {
            throw new ValidationFailedException("获取不到对应的数据集信息，无法新增数据集权限。");
        }
        DataSetEntity dataSet = new DataSetEntity();
        dataSet.setId(dataSetId);
        if (dsAuthority == null) {
            throw new ValidationFailedException("数据集权限对象为空，无法保存！");
        }
        dsAuthority.setDataSetEntity(dataSet);

        // Authorities ConditionSet
        if (dsAuthCondSet == null) {
            dsAuthCondSet = new DsAuthConditionSetEntity();
        }
        dsAuthCondSet.setDsAuthConditionEntities(dsAuthConditionList);
        dsAuthority.setDsAuthConditionSetEntity(dsAuthCondSet);

        // authority roles
        if (dsAuthRoleIds != null) {
            List<Role> roleList = new ArrayList<Role>();
            for (String roleId : dsAuthRoleIds) {
                Role role = new Role();
                role.setId(roleId);
                roleList.add(role);
            }
            dsAuthority.setRoles(roleList);
        }
        systemDsAuthorityMgrService.updateDsAuthority(dsAuthority);
    }


    // 加载数据，编辑数据集权限
    @RequestMapping(value = "/load-edit-data", produces = "plain/text; charset=UTF-8")
    @ResponseBody
    public String loadDsAuthEditData(@RequestBean(CommonDefinition.PARAM_NAME_SELECTED_ROW) DsAuthorityEntity dsAuthority) throws ProcessFailedException, IOException {
        Map result = systemDsAuthorityMgrService.loadEditData(dsAuthority.getId());
        if (result != null) {
            return GaeaJacksonUtils.parse(result);
        }
        return "";
    }
}
