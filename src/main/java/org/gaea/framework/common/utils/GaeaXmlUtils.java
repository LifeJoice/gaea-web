package org.gaea.framework.common.utils;

import org.apache.commons.beanutils.BeanUtils;
import org.apache.commons.lang3.ArrayUtils;
import org.w3c.dom.NamedNodeMap;
import org.w3c.dom.Node;

import java.lang.reflect.InvocationTargetException;
import java.util.HashMap;
import java.util.Map;

/**
 * Created by Iverson on 2015/7/6.
 */
public class GaeaXmlUtils {
    public static Map<String,String> getAttributes(Node node){
        Map<String,String> attributes = new HashMap<String, String>();
        NamedNodeMap namedNodeMap = node.getAttributes();
        if(namedNodeMap!=null) {
            for (int i = 0; i < namedNodeMap.getLength(); i++) {
                Node n = namedNodeMap.item(i);
                attributes.put(n.getNodeName(), n.getNodeValue());
            }
        }
        return attributes;
    }

    public static <T>T copyAttributesToBean(Node orig, T destObj, Class<T> destClass) throws InvocationTargetException, IllegalAccessException {
        if (destObj == null) {
            return null;
        }
        // bean的属性列表。用来与XML SCHEMA属性做无关大小写匹配
        Map<String, String> beanPropNames = GaeaBeanUtils.getPropNames(destClass);    // key：属性的全小写 value：属性名。和Java类中命名一致。
        String[] beanPropNamesArray = beanPropNames.keySet().toArray(new String[0]);
        // 获取node的属性列表
        Map<String, String> attributes = GaeaXmlUtils.getAttributes(orig);
        // 遍历node的属性名
        for (String attrName : attributes.keySet()) {
            // 清理XML中属性名中的下划线or中划线
            String cleanAttrName = GaeaStringUtils.removeHyphenAndUnderline(attrName);
            // 写入bean值的时候，因为属性名必须严格大小写一致，所以必须把xml属性名转为全小写后，去columnPropNames获取真正的严格大小写的bean属性名
            if(ArrayUtils.contains(beanPropNamesArray,cleanAttrName.toLowerCase())) {      // 检查要写入的字段是否在目标对象存在，才可以写入
                BeanUtils.setProperty(destObj, beanPropNames.get(cleanAttrName.toLowerCase()), attributes.get(attrName));
            }
        }
        return destObj;
    }
}
