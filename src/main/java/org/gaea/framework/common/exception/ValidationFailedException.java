package org.gaea.framework.common.exception;

/**
 * Created by Iverson on 2015/6/28.
 */
public class ValidationFailedException extends Exception {

    public ValidationFailedException(String message) {
        super(message);
    }

    public ValidationFailedException(String message, Throwable cause) {
        super(message, cause);
    }
}
