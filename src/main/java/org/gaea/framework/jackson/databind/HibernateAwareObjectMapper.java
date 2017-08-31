/*
 * 来源网络。对于Hibernate的级联对象，注释为lazy的，在Jackson序列化的时候不需要强行加载。
 * 特别在Controller层做的时候，因为没有session，很容易出错。
 * @author Iverson
 * 2014年7月17日 星期四
 */
package org.gaea.framework.jackson.databind;

import com.fasterxml.jackson.databind.Module;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.databind.SerializationFeature;
import com.fasterxml.jackson.databind.module.SimpleModule;
import com.fasterxml.jackson.databind.ser.std.ToStringSerializer;
import com.fasterxml.jackson.datatype.hibernate4.Hibernate4Module;

import java.math.BigDecimal;

/**
 * Jackson JSON processor which handles Hibernate
 * <a
 * href="http://blog.pastelstudios.com/2012/03/12/spring-3-1-hibernate-4-jackson-module-hibernate/">
 * Spring 3.1, Hibernate 4 and Jackson-Module-Hibernate</a>
 *
 * @author ihoneymon
 *
 */
public class HibernateAwareObjectMapper extends ObjectMapper {

    private static final long serialVersionUID = -8821453185971012130L;

    public HibernateAwareObjectMapper() {
        configure(SerializationFeature.FAIL_ON_EMPTY_BEANS, false);
        /**
         * 如果开启了以下的转换，则会把date的毫秒数转换成timestamp。例如： 1404144000000 会转换为
         * 2014-06-30T16:00:00.000+0000
         */
//        configure(SerializationFeature.WRITE_DATES_AS_TIMESTAMPS, false);
        registerModule(getHibernate4Module());
        // 解决Long以数值传到前端，JavaScript精度丢失问题
        registerModule(getLongParseModule());
    }

    private Module getHibernate4Module() {
        Hibernate4Module hibernateModule = new Hibernate4Module();
        hibernateModule.disable(Hibernate4Module.Feature.FORCE_LAZY_LOADING);
        hibernateModule.enable(Hibernate4Module.Feature.SERIALIZE_IDENTIFIER_FOR_LAZY_NOT_LOADED_OBJECTS);
//        hibernateModule.disable(Hibernate4Module.Feature.FORCE_LAZY_LOADING);
        return hibernateModule;
    }

    /**
     * 创建一个处理Long的数值的处理模块。
     * 解决Long以数值传到前端，JavaScript精度丢失问题
     *
     * @return
     */
    private Module getLongParseModule() {
        // 普通ObjectMapper初始化
        // 针对Long和BigDecimal的，转换为String。因为太长的大数，前端JavaScript会精度丢失
        SimpleModule simpleModule = new SimpleModule();
        simpleModule.addSerializer(Long.class, ToStringSerializer.instance); // ToStringSerializer线程安全
        simpleModule.addSerializer(BigDecimal.class, ToStringSerializer.instance);
        return simpleModule;
    }
}
