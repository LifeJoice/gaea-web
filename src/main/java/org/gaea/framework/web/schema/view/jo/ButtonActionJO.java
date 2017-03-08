package org.gaea.framework.web.schema.view.jo;

import com.fasterxml.jackson.annotation.JsonIgnore;
import org.gaea.framework.web.schema.view.action.ActionParam;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

import java.util.List;

/**
 * copy from ButtonAction
 * Created by iverson on 2017年3月1日10:19:16
 */
public class ButtonActionJO {
    private final Logger logger = LoggerFactory.getLogger(ButtonActionJO.class);

    private String method;
    /**
     * 这个就是（ExcelExportButtonAction等的）actionParamMap; // Map< param.name , param obj >
     */
    private List<ActionParam> params;
    @JsonIgnore
    private String name;

    public String getMethod() {
        return method;
    }

    public void setMethod(String method) {
        this.method = method;
    }

    public String getName() {
        return name;
    }

    public void setName(String name) {
        this.name = name;
    }

    public List<ActionParam> getParams() {
        return params;
    }

    public void setParams(List<ActionParam> params) {
        this.params = params;
    }
}
