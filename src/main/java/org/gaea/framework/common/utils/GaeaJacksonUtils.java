package org.gaea.framework.common.utils;

import com.fasterxml.jackson.core.JsonGenerator;
import com.fasterxml.jackson.databind.ObjectMapper;

import java.io.IOException;
import java.io.StringWriter;
import java.util.Map;

/**
 * 用Jackson包把特定的map转换成json工具
 * Created by Iverson on 2015/7/2.
 */
public class GaeaJacksonUtils {

    public static String parse(Map<String,Object> inObj) throws IOException {
        if(inObj==null){
            return null;
        }
        ObjectMapper objectMapper = new ObjectMapper();
        StringWriter stringWriter = new StringWriter();
        JsonGenerator jsonGenerator = objectMapper.getFactory().createGenerator(stringWriter);
        jsonGenerator.writeObject(inObj);
        return stringWriter.toString();
    }
}
