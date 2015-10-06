package org.gaea.framework.common.exception;

/**
 * ur系统逻辑错误异常。逻辑上不合理的数据，操作等。<p/>
 * 例如：<br/>
 * 计算费用的时候出现负数金额，非空字段出现空的数值,按id删除却发现返回结果不止删了一条，等等。
 * Created by Iverson on 2015/8/14.
 */
public class SysLogicalException extends Exception {

    public SysLogicalException(String message) {
        super(message);
    }

    public SysLogicalException(String message, Throwable cause) {
        super(message, cause);
    }
}
