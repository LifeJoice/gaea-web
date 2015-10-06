package org.gaea.framework.web.schema.domain;

import java.util.ArrayList;
import java.util.List;

/**
 * Created by Iverson on 2015/6/26.
 */
public class SchemaData {
    private List<DataSet> dataSetList = new ArrayList<DataSet>();

    public List<DataSet> getDataSetList() {
        return dataSetList;
    }

    public void setDataSetList(List<DataSet> dataSetList) {
        this.dataSetList = dataSetList;
    }
}
