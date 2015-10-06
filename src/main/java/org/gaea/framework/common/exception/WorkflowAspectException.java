package org.gaea.framework.common.exception;

/**
 * 用于工作流切片时发生的异常。特殊对待。
 * Created by Iverson on 2015/7/21.
 */
public class WorkflowAspectException extends Exception {
    public WorkflowAspectException(String message) {
        super(message);
    }

    public WorkflowAspectException(String message, Throwable cause) {
        super(message, cause);
    }
}
