package org.gaea.framework.web.data.service.impl;

import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.apache.commons.collections.CollectionUtils;
import org.apache.commons.lang3.ArrayUtils;
import org.apache.commons.lang3.StringUtils;
import org.gaea.data.dataset.domain.ConditionSet;
import org.gaea.data.dataset.domain.DsAuthRole;
import org.gaea.data.dataset.domain.DsAuthority;
import org.gaea.data.dataset.domain.GaeaDataSet;
import org.gaea.db.GaeaSqlProcessor;
import org.gaea.db.QueryCondition;
import org.gaea.exception.SystemConfigException;
import org.gaea.exception.ValidationFailedException;
import org.gaea.framework.web.data.authority.DsAuthorityResult;
import org.gaea.framework.web.data.authority.domain.DsAuthorityImpl;
import org.gaea.framework.web.data.authority.entity.DsAuthConditionSetEntity;
import org.gaea.framework.web.data.authority.entity.DsAuthorityEntity;
import org.gaea.framework.web.data.domain.DsConditionSetEntity;
import org.gaea.framework.web.data.service.SystemDataSetAuthorityService;
import org.gaea.framework.web.data.util.GaeaDataSetUtils;
import org.gaea.security.service.SystemUsersService;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.ArrayList;
import java.util.List;

/**
 * 数据权限校验的服务类
 * Created by iverson on 2016/12/22.
 */
@Service
public class SystemDataSetAuthorityServiceImpl implements SystemDataSetAuthorityService {
    private final Logger logger = LoggerFactory.getLogger(SystemDataSetAuthorityServiceImpl.class);
    @Autowired
    private SystemUsersService systemUsersService;
    @Autowired
    private GaeaSqlProcessor gaeaSqlProcessor;
    @Autowired
    private ObjectMapper objectMapper;

    @Override
    public DsAuthorityResult authority(GaeaDataSet gaeaDataSet, String loginName) throws ValidationFailedException, SystemConfigException {
        if (StringUtils.isEmpty(loginName)) {
            throw new ValidationFailedException("登录账户名为空，无法验证数据集的权限！");
        }
        String[] roleCodes = systemUsersService.getCacheUserRoles(loginName);
        return authority(gaeaDataSet, roleCodes);
    }

    /**
     * 校验'我', 对某数据集的数据权限.
     * <p>
     * 遍历gaeaDataSet.dsAuthorities.roles, 如果和'我'的角色匹配, 则以此权限过滤条件返回.<br/>
     * 否则, 寻找下一个gaeaDataSet.dsAuthorities
     * </p>
     *
     * @param gaeaDataSet 数据集
     * @param roleCodes   我的角色列表
     * @return
     * @throws ValidationFailedException
     */
    @Transactional(readOnly = true)
    public DsAuthorityResult authority(GaeaDataSet gaeaDataSet, String[] roleCodes) throws ValidationFailedException {
        DsAuthorityResult result = new DsAuthorityResult();
        List<QueryCondition> queryConditionList = new ArrayList<QueryCondition>();
        List<DsAuthority> authorityList = gaeaDataSet.getDsAuthorities();
        if (CollectionUtils.isNotEmpty(authorityList)) {
            // 遍历数据集的权限配置
            for (DsAuthority authority : authorityList) {
                List<? extends DsAuthRole> authRoles = authority.getRoles();
                boolean hasRole = false;
                // 权限校验没有配置对应角色？忽略
                if (CollectionUtils.isEmpty(authority.getRoles())) {
                    continue;
                }
                // 遍历数据集某个权限的对应角色
                for (DsAuthRole authRole : authRoles) {
                    String roleCode = authRole.getCode();
                    // 这个权限要检查的角色,和用户的角色匹配
                    if (ArrayUtils.contains(roleCodes, roleCode)) {
                        // 算了，这里authority.dsConditionSet不抽取到公用库了。否则太复杂了。
                        DsAuthorityImpl authorityImpl = (DsAuthorityImpl) authority;
//                        queryConditionList = parseAuthority(authorityImpl);
                        ConditionSet conditionSet = authorityImpl.getConditionSet();
                        // 要用克隆的。因为authority是会缓存的。直接改对象会导致一些额外的查询条件也被缓存。
                        ConditionSet resultCondSet = GaeaDataSetUtils.clone(conditionSet);

//                        result.setQueryConditions(queryConditionList);
                        result.setConditionSet(resultCondSet);
                        hasRole = true;
                        // debug一下权限校验的过滤条件
//                        if(CollectionUtils.isNotEmpty(queryConditionList)) {
                        if (conditionSet != null && CollectionUtils.isNotEmpty(conditionSet.getConditions())) {
                            try {
                                logger.trace("用户的数据权限过滤条件\n{}", objectMapper.writeValueAsString(queryConditionList));
                            } catch (JsonProcessingException e) {
                                logger.warn("非业务相关debug代码出错. 转换对象为json失败.", e);
                            }
                        } else {
                            logger.debug("用户权限校验，发现用户配置了数据权限角色，却没有对应的数据权限过滤条件。请检查。角色: {}", roleCode);
                        }
                        /**
                         * 如果'我'的某角色,和当前authority的角色列表匹配, 则用当前authority(忽略检查authority角色列表的其他).
                         * 例如:
                         * 如果我的HR,BUYER两个角色,都在authority的角色列表中.那只需要找到一个, 无论哪个, 就不往下找了.
                         */
                        break;
                    }
                }
                /**
                 * 如果已经找到'我'的某角色和这个authority匹配，则后面的authority(权限检验配置)就略过了.
                 * 即:
                 * 用当前的authority的conditionSet构造sql条件语句
                 */
                if (hasRole) {
//                    if(CollectionUtils.isEmpty(queryConditionList)){
                    if (result.getConditionSet() == null || CollectionUtils.isEmpty(result.getConditionSet().getConditions())) {
                        result.setResult(DsAuthorityResult.RESULT_WITH_ROLE_NO_CONDITIONS);
                    } else {
                        result.setResult(DsAuthorityResult.RESULT_WITH_ROLE_AND_CONDITIONS);
                    }
                    break;
                }
            }
        }
        return result;
    }

    /**
     * 把conditionSet转换为QueryCondition list。
     *
     * @param authorityImpl
     * @return
     * @throws ValidationFailedException
     */
    private List<QueryCondition> parseAuthority(DsAuthorityImpl authorityImpl) throws ValidationFailedException {
        ConditionSet conditionSet = authorityImpl.getConditionSet();
        if (conditionSet != null && CollectionUtils.isNotEmpty(conditionSet.getConditions())) {
            List<QueryCondition> queryConditionList = gaeaSqlProcessor.getConditions(conditionSet, null);
            return queryConditionList;
        }
        return null;
    }
}
