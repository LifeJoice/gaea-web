package org.gaea.framework.web.data.authority.domain;

import org.gaea.data.dataset.domain.ConditionSet;
import org.gaea.data.dataset.domain.DsAuthority;
import org.gaea.framework.web.data.domain.DsConditionSet;

import java.util.List;

/**
 * TODO 以后等把gaea.common.db合并到web项目来，就可以把DsAuthority接口删掉，留一个即可。
 * Created by iverson on 2017/1/2.
 */
public class DsAuthorityImpl implements DsAuthority {
    private ConditionSet conditionSet;
    private List<DsAuthorityRole> roles;

    public ConditionSet getConditionSet() {
        return conditionSet;
    }

    public void setConditionSet(ConditionSet conditionSet) {
        this.conditionSet = conditionSet;
    }

    @Override
    public List<DsAuthorityRole> getRoles() {
        return roles;
    }

    public void setRoles(List<DsAuthorityRole> roles) {
        this.roles = roles;
    }
}
