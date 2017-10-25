package org.gaea.framework.web.common;

import java.util.HashMap;
import java.util.Map;

/**
 * 前端和后端交互过程中，成功/失败信息的domain。
 * Created by iverson on 2017/10/25.
 */
public class ResponseJsonMessage {
    // http status
    private int status;
    // 前端给用户看的提示信息
    private String message;
    // 前端方便debug的信息
    private String debugMessage;

    public ResponseJsonMessage() {
    }

    public ResponseJsonMessage(int status, String message, String debugMessage) {
        this.status = status;
        this.message = message;
        this.debugMessage = debugMessage;
    }

    public Map<String, Object> toMap() {
        Map<String, Object> errorMsg = new HashMap<String, Object>();
        errorMsg.put("status", status);
        errorMsg.put("message", message);
        errorMsg.put("debugMessage", debugMessage);
        return errorMsg;
    }

    public int getStatus() {
        return status;
    }

    public void setStatus(int status) {
        this.status = status;
    }

    public String getMessage() {
        return message;
    }

    public void setMessage(String message) {
        this.message = message;
    }

    public String getDebugMessage() {
        return debugMessage;
    }

    public void setDebugMessage(String debugMessage) {
        this.debugMessage = debugMessage;
    }
}
