package org.gaea.framework.web.data.authority;

import org.gaea.data.dataset.domain.ConditionSet;
import org.gaea.db.QueryCondition;

import java.io.Serializable;
import java.util.List;

/**
 * 数据集的检验结果bean。类似DTO。只是封装了结果信息。
 * Created by iverson on 2016-12-29 18:52:24.
 */
public class DsAuthorityResult implements Serializable {
    //    private List<QueryCondition> queryConditions;
    private ConditionSet conditionSet;
    private int result = 1;
    public static final int RESULT_NO_ROLE = 1; // 检查不到对应的角色和数据集权限角色关联
    public static final int RESULT_WITH_ROLE_NO_CONDITIONS = 2; // 检查到对应的角色和数据集权限角色关联, 但解析后没有对应的sql条件过滤语句
    public static final int RESULT_WITH_ROLE_AND_CONDITIONS = 3; // 检查到对应的角色和数据集权限角色关联, 且有sql条件过滤语句

    public ConditionSet getConditionSet() {
        return conditionSet;
    }

    public void setConditionSet(ConditionSet conditionSet) {
        this.conditionSet = conditionSet;
    }

    public int getResult() {
        return result;
    }

    public void setResult(int result) {
        this.result = result;
    }
}
