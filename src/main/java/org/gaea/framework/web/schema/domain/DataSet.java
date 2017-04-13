package org.gaea.framework.web.schema.domain;

import org.gaea.data.dataset.domain.Where;

import java.io.Serializable;
import java.util.List;
import java.util.Map;

/**
 * Created by Iverson on 2015/6/26.
 */
public class DataSet implements Serializable {
    private String id;
    private String sql;
    private String code;
    private String beanRef;
    private List<Map<String,Object>> sqlResult;
    private String jsonData;
    private long totalElements;
    private Where where;
    private String primaryTable;

    public String getId() {
        return id;
    }

    public void setId(String id) {
        this.id = id;
    }

    public String getSql() {
        return sql;
    }

    public void setSql(String sql) {
        this.sql = sql;
    }

    public void setCode(String code) {
        this.code = code;
    }

    public String getCode() {
        return code;
    }

    public List<Map<String, Object>> getSqlResult() {
        return sqlResult;
    }

    public void setSqlResult(List<Map<String, Object>> sqlResult) {
        this.sqlResult = sqlResult;
    }

    /**
     * 如果jsonData为空，转换生成jsonData；否则直接返回该对象。<p/>
     * <b>这个方法直接使用已转换过的jsonData对象（类似缓存），会存在数据过期的问题。使用时要注意。</b>
     * @return
     */
//    public String getJsonData() throws IOException {
//        if(StringUtils.isBlank(this.jsonData)){
//            this.jsonData = convertToJson(this.getSqlResult());
//        }
//        return jsonData;
//    }
//
//    public void setJsonData(String jsonData) {
//        this.jsonData = jsonData;
//    }

//    private String convertToJson(List<Map<String, Object>> queryData) throws IOException {
////        Page<?> result = (Page<?>)inResult;
////        // 获取SQL查询后的结果
////        List<Map<String, Object>> queryData = (List<Map<String, Object>>) result.getContent();
//        Map<String,Object> rootMap = new HashMap<String, Object>();
//        rootMap.put("data",queryData);
//        // 遍历结果，每一行
////        for (Map<String, Object> row : queryData) {
////            // 遍历每一列
////            for (Map.Entry<String, Object> dbColumn : row.entrySet()) {
////                String dbColumnName = dbColumn.getKey();
////
////            }
////        }
////        StringWriter sw = new StringWriter();
////        ObjectMapper objectMapper = new ObjectMapper();
////        try {
////            JsonGenerator jsonGenerator = objectMapper.getFactory().createGenerator(System.out, JsonEncoding.UTF8);
////            jsonGenerator.writeObject(queryData);
////            JsonGenerator jsonGenerator = objectMapper.getFactory().createGenerator(sw);
////            objectMapper.writeValue(jsonGenerator,rootMap);
////            System.out.println("\n"+sw.toString());
////        } catch (IOException e) {
////            e.printStackTrace();
////        }
//        return GaeaJacksonUtils.parse(rootMap);
//    }

    public String getBeanRef() {
        return beanRef;
    }

    public void setBeanRef(String beanRef) {
        this.beanRef = beanRef;
    }

    public long getTotalElements() {
        return totalElements;
    }

    public void setTotalElements(long totalElements) {
        this.totalElements = totalElements;
    }

    public Where getWhere() {
        return where;
    }

    public void setWhere(Where where) {
        this.where = where;
    }

    public String getPrimaryTable() {
        return primaryTable;
    }

    public void setPrimaryTable(String primaryTable) {
        this.primaryTable = primaryTable;
    }
}
