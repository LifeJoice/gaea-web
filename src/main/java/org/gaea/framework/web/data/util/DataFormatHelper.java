package org.gaea.framework.web.data.util;

import org.apache.commons.collections.CollectionUtils;
import org.apache.commons.collections.MapUtils;
import org.apache.commons.lang3.StringUtils;
import org.gaea.data.convertor.DataConvertor;
import org.gaea.data.dataset.format.domain.GaeaDataFormat;
import org.gaea.data.dataset.format.domain.GaeaFormatNode;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.util.LinkedCaseInsensitiveMap;

import java.util.*;
import java.util.regex.Pattern;

/**
 * DataSet的数据格式化{@code <data-format}.
 * 可以把SQL查询结果，直接转换成某种自定义的json的数据结构并返回。
 * Created by iverson on 2017/9/6.
 */
public class DataFormatHelper {
    private final Logger logger = LoggerFactory.getLogger(DataFormatHelper.class);
    public static final String PATH_SEPARATOR = "-";

    /**
     * 把SQL查出来的结果集dataList，根据XML定义的{@code <data-format>}（对应GaeaDataFormat对象）转换成树状结构，以便直接变成json返回。
     *
     * @param dataList
     * @param dataFormat
     * @return
     */
    public static List<Map<String, Object>> dataFormat(List<Map<String, Object>> dataList, GaeaDataFormat dataFormat) {
        if (dataList == null || dataFormat == null || dataFormat.getNode() == null) {
            return dataList;
        }
        List<Map<String, Object>> results;
        LinkedCaseInsensitiveMap<Object> preSortDatas = new LinkedCaseInsensitiveMap<Object>();
        Map<String, String> listNodeNameMap = new LinkedHashMap<String, String>(); // 带有子级的节点。key：预处理数据里的key value：节点node定义的name
        String prePath = "";
        GaeaFormatNode dataNode = dataFormat.getNode();
        if (CollectionUtils.isEmpty(dataNode.getNodes())) {
            return dataList;
        }
        // 遍历每一行数据, 生成预处理数据
        for (Map<String, Object> rowData : dataList) {
            LinkedCaseInsensitiveMap<Object> newData = new LinkedCaseInsensitiveMap<Object>();
            dataFormatRow(rowData, newData, dataNode, preSortDatas, prePath, listNodeNameMap);
        }
        // 预处理数据转换成最终结果
        results = combineListNode(preSortDatas, listNodeNameMap);
        return results;
    }

    /**
     * 把数据库读出的数据（origRowData），根据数据结构定义（node），转换成对应节点的数据（nodeData），并计算树路径（prePath），然后放到预处理数据列表中（preSortDatas）。
     *
     * @param origRowData     从数据库查出来的原始行数据
     * @param nodeData
     * @param node            XML定义的节点
     * @param preSortDatas    key：梳理过后的路径（例如：服装-上装） value：对应节点的数据map
     * @param prePath
     * @param listNodeNameMap （某个）列表节点对应的json key。
     */
    private static void dataFormatRow(Map<String, Object> origRowData, Map<String, Object> nodeData, GaeaFormatNode node, LinkedCaseInsensitiveMap<Object> preSortDatas, String prePath, Map<String, String> listNodeNameMap) {
        // 获取某个节点的对应的key。key即为SQL行数据对应列的值。
        // key为所有子节点的primary组成
        String key = getKey(origRowData, node.getNodes());
        if (StringUtils.isEmpty(prePath)) {
            prePath = key;
        } else {
            // 构造层级关系
            prePath = prePath + PATH_SEPARATOR + key;
        }
        // 遍历XML定义的子节点
        for (GaeaFormatNode subNode : node.getNodes()) {
            if (CollectionUtils.isNotEmpty(subNode.getNodes())) {
                // 记录有子节点的节点。
                // 这种节点的值,是List
                listNodeNameMap.put(prePath, subNode.getName());

                LinkedCaseInsensitiveMap<Object> nodeData2 = new LinkedCaseInsensitiveMap<Object>();
                dataFormatRow(origRowData, nodeData2, subNode, preSortDatas, prePath, listNodeNameMap);
            } else {
                // 返回的是对象. 即：{id:1, name:'abc'}
                // 由于当前数据集接口还是统一返回List，所以还不兼容这个功能；先把转换后的对象放在list中。但后面一旦兼容了，直接返回对象即可。
                nodeData = dataConvert(origRowData, nodeData, subNode.getDataConvertor());
            }
        }
        preSortDatas.put(prePath, nodeData);
    }

    /**
     * 把预处理过的数据（preSortDatas），转换成json格式。
     * 涉及根据preSortDatas的key解析出树结构。
     * <p>
     * preSortDatas的key是这样的结构：<br/>
     * 服装<br/>
     * 服装-上装<br/>
     * 美妆-香水<br/>
     * 服装-下装<br/>
     * </p>
     * <p>
     * 然后统一只拿第一层递归处理，处理完的放在donePath。所以不会把整个preSortDatas每个值都处理一遍。<br/>
     * 如果某个key的第一层已经处理过，就略过。
     * </p>
     *
     * @param preSortDatas
     * @param listNodeNameMap
     * @return
     */
    private static List combineListNode(LinkedCaseInsensitiveMap<Object> preSortDatas, Map<String, String> listNodeNameMap) {
        LinkedCaseInsensitiveMap result = new LinkedCaseInsensitiveMap();
        List listResult = new ArrayList();
        if (MapUtils.isNotEmpty(preSortDatas)) {
            // 维护已完成的key的集合（所有，包括子节点）
            Set<String> donePath = new HashSet<String>();
            // 对preSortDatas做双层循环遍历
            for (String key : preSortDatas.keySet()) {
                String[] keys = key.split(PATH_SEPARATOR);
                // path的第一层级。永远都只处理第一层级（因为会递归下挖）。
                String rootKey = keys[0];
//                Map newValue = (Map) preSortDatas.get(key);
                // 还没处理过，就处理
                if (result.get(rootKey) == null) {
                    Map n = createNodeData(preSortDatas, listNodeNameMap, rootKey, donePath);
                    if (n != null) {
                        result.put(rootKey, n);
                        donePath.add(rootKey);
                    }
                }
            }
            // 把map转成list。一般前端要list
            for (Object k : result.keySet()) {
                listResult.add(result.get(k));
            }
        }
        return listResult;
    }

    /**
     * 根据预处理数据（preSortDatas），处理某个节点（key）下的数据。
     * <b style='color:red'>
     * 会递归处理子节点、子子节点、子子子节点等。直到传入的第一个节点的所有下节点处理完。
     * </b>
     *
     * @param preSortDatas
     * @param listNodeNameMap
     * @param key
     * @param donePath
     * @return
     */
    private static Map createNodeData(LinkedCaseInsensitiveMap<Object> preSortDatas, Map<String, String> listNodeNameMap, String key, Set<String> donePath) {
        // 从初步整理过的列表中，获取对应的直接节点数据
        Map newValue = (Map) preSortDatas.get(key);
        List list = new ArrayList();
        // 匹配直接下级的正则表达式
        String pattern = key + PATH_SEPARATOR + "[^" + PATH_SEPARATOR + "]+";

        /**
         * 遍历预处理数据，找到当前key对应的直接下级
         */
        for (String keyJ : preSortDatas.keySet()) {
            // 根据正则表达式，符合是直接下级的
            if (Pattern.matches(pattern, keyJ)) {
                // 是否处理过了？是则略过。
                if (donePath.contains(keyJ)) {
                    continue;
                }
                // 直接丢去递归找子子节点。没有返回是null
                Map n = createNodeData(preSortDatas, listNodeNameMap, keyJ, donePath);
                // 如果子子节点有值，直接假设当前节点是list，把值放入list
                // TODO 后面这得扩展一下，可能下级有值是对象，不一定全是list。可以通过node type确定。
                if (n != null) {
                    String nodeName = listNodeNameMap.get(key);
                    if (newValue.get(nodeName) == null) {
                        newValue.put(nodeName, list);
                    }
                    list.add(n);
                }
                // key加入已处理集合
                donePath.add(keyJ);
            }
        }
        return newValue;
    }

    /**
     * 从origRowData中获取dataConvertor指定的数据，并放入processingData中。
     *
     * @param origRowData    从数据库查出来的原始行数据
     * @param processingData 处理中的数据。这表示会填充新的数据进去，并返回。
     * @param dataConvertor
     * @return
     */
    private static Map<String, Object> dataConvert(Map<String, Object> origRowData, Map<String, Object> processingData, DataConvertor dataConvertor) {
        if (dataConvertor == null) {
            return processingData;
        }
        if (origRowData.get(dataConvertor.getFromName()) != null) {
            Object value = origRowData.get(dataConvertor.getFromName());
            processingData.put(dataConvertor.getToName(), value);
        }
        return processingData;
    }

    /**
     * 获取某些节点的对应的key。<b>这些节点必须是同个父的子节点。</b>
     * <p>key即为SQL行数据对应列的值。例如：name='美妆'的，就是用'美妆'作key。</p>
     * <p>因为，这主要针对'组合主键'这种场景，需要多个组成复合的唯一键！</p>
     * <p>
     * 例如：<br/>
     * 像name=美妆，可能同名，所以会加上id，则形成的key=1001美妆、1012美妆……
     * </p>
     *
     * @param origRowData 从数据库查出来的原始行数据
     * @param nodes       XML定义的节点
     * @return
     */
    private static String getKey(Map<String, Object> origRowData, List<GaeaFormatNode> nodes) {
        String key = "";
        for (GaeaFormatNode subNode : nodes) {
            if (subNode.isPrimary()) {
                DataConvertor dataConvertor = subNode.getDataConvertor();
                if (dataConvertor == null) {
                    continue;
                }
                if (origRowData.get(dataConvertor.getFromName()) != null) {
                    Object value = origRowData.get(dataConvertor.getFromName());
                    if (value != null) {
                        key += String.valueOf(value);
                    }
                }
            }
        }
        return key;
    }
}
