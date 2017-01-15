package org.gaea.framework.web.data;

import org.gaea.exception.SysInitException;
import org.gaea.framework.web.GaeaWebSystem;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

import java.util.HashMap;
import java.util.Map;

/**
 * 这个是默认的SQL语句解析过程中，如果SQL中有一些表达式，例如SPEL。<br/>
 * 而表达式中，又有一些变量、方法的引用(一般的表达式都支持这样的用法, 调用某个bean的某方法, 或者调用一个bean的属性值等).<br/>
 * 这个就是负责所有需要的上下文的入口.
 * <p>
 * 只要实现了这个接口，则对应的bean属性，就可以在数据集的SQL中，以表达式的方式（目前是SPEL语法）调用。
 * </p>
 * <p>
 * 当前内置属性：<br/>
 * <ul>
 * <li>loginName - 当前的用户登录名</li>
 * <li>contextBeans - 所有实现了GaeaDsContextBean、并托管给Spring的bean. 其中key为bean的名字(spring id).</li>
 * </ul>
 * <p/>
 * </p>
 * Created by iverson on 2017-1-5 10:54:06.
 */
public class GaeaDefaultDsContext {
    private final Logger logger = LoggerFactory.getLogger(GaeaDefaultDsContext.class);
    private Map<String, GaeaDsContextBean> contextBeans = new HashMap<String, GaeaDsContextBean>();
    private String loginName;

    public GaeaDefaultDsContext() {
        init();
    }

    public GaeaDefaultDsContext(String loginName) {
        init();
        this.loginName = loginName;
    }

    /**
     * 初始化。把所有实现GaeaDsContextBean并托管给Spring的bean，放入一个map中。
     */
    public void init() {
        try {
            contextBeans = GaeaWebSystem.getBeansOfType(GaeaDsContextBean.class);
        } catch (SysInitException e) {
            logger.error("初始化GaeaDefaultDsContext的GaeaDsContextBean map失败. 或会影响需要引用到一些context变量方法等的地方, 如数据集SQL解析中表达式的context参数等. ", e);
        }
    }

    public Map<String, GaeaDsContextBean> getContextBeans() {
        return contextBeans;
    }

    public String getLoginName() {
        return loginName;
    }

    public void setLoginName(String loginName) {
        this.loginName = loginName;
    }
}
