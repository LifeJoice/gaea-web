package org.gaea.framework.web.common;

/**
 * 定义一些Gaea框架自己用的http status
 * Created by iverson on 2017年12月15日 星期五
 */
public interface GaeaHttpStatus {
    /* 普通的消息体。即不成功、也不失败的一些信息，用这个返回，然后前端会显示出来并且不自动关闭消息框。 */
    public static final int MESSAGE = 270;
}
