package org.gaea.framework.web.config;

import com.fasterxml.jackson.databind.DeserializationFeature;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

/**
 * 一些通用工具类的配置。
 * 因为需要设定一些初始值，不方便在xml里面配置。
 * Created by iverson on 2017年5月9日09:49:02
 */
@Configuration
public class CommonUtilsConfiguration {

    @Bean
    public ObjectMapper objectMapper() {
        ObjectMapper mapper = new ObjectMapper();
        // 配置遇到不存在的字段属性，忽略，而不是抛出异常！
        mapper.configure(DeserializationFeature.FAIL_ON_UNKNOWN_PROPERTIES, false);
        return mapper;
    }
}
