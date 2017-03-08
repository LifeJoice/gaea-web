package org.gaea.framework.web.schema.view.action;

import com.fasterxml.jackson.annotation.JsonIgnore;
import org.gaea.exception.ValidationFailedException;
import org.gaea.framework.web.schema.Action;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

import java.util.Map;

/**
 * 一个通用的action。不是特定功能的（类似'ExcelExportButtonAction'那种）
 * <p/>
 * Created by iverson on 2017年3月1日19:05:03
 */
public class SimpleButtonAction implements Action {
    private final Logger logger = LoggerFactory.getLogger(SimpleButtonAction.class);

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
    public String doAction(String loginName) throws ValidationFailedException {
        return null;
    }

    public void setActionParamMap(Map<String, ActionParam> actionParamMap) {
        this.actionParamMap = actionParamMap;
    }
}
