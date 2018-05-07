package org.gaea.framework.web.utils;

import org.gaea.util.ValidationUtils;
import org.joda.time.DateTime;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

import javax.servlet.http.HttpServletRequest;
import javax.servlet.http.HttpServletResponse;
import java.io.*;

/**
 * Created by iverson on 2017/5/17.
 */
public class GaeaWebUtils {
    private static final Logger logger = LoggerFactory.getLogger(GaeaWebUtils.class);

    public static void writeFileToResponse(File file, HttpServletResponse response) {
        response.reset();
        response.setCharacterEncoding("utf-8");
        response.setContentType("application/vnd.ms-excel");
        // 这个可能有助于服务器和客户端直接分块传输
        response.setHeader("Content-Length", String.valueOf(file.length()));
        // 下载Excel文件的文件名
        response.setHeader("Content-Disposition", "attachment; filename=export_" + new DateTime().toString("yyyy-MM-dd_HH:mm:ss") + ".xls");
        BufferedInputStream bis = null;
        BufferedOutputStream bos = null;
        try {
            bis = new BufferedInputStream(new FileInputStream(file));
            bos = new BufferedOutputStream(response.getOutputStream());


            byte[] buff = new byte[4096];
            int bytesRead;
            while (-1 != (bytesRead = bis.read(buff, 0, buff.length))) {
                bos.write(buff, 0, bytesRead);
            }
        } catch (FileNotFoundException e) {
            logger.debug("读取缓存excel文件失败！");
        } catch (IOException e) {
            logger.debug("获取输出流失败！");
        } finally {
            try {
                bis.close();
                bos.close();
            } catch (IOException e) {
                logger.error("输入输出流关闭失败！", e);
            }
        }
    }

    /**
     * 看一个请求是否要求返回json
     *
     * @param request
     * @return
     */
    public static boolean isJsonRequest(HttpServletRequest request) {
        /* 获取请求的头，用以判断是否JSON请求 */
        Boolean isJson = false, acceptJson = false, xReqJson = false, isMultiPart = false;
        String requestHeadType = request.getHeader("accept");
        String xRequestedWith = request.getHeader("X-Requested-With");
        String contentType = request.getContentType();
            /* 判断是否JSON请求 */
        if (!ValidationUtils.isBlank(requestHeadType)) {
            acceptJson = requestHeadType.indexOf("application/json") >= 0;
        }
        if (!ValidationUtils.isBlank(xRequestedWith)) {
            xReqJson = xRequestedWith.indexOf("XMLHttpRequest") >= 0;
        }
        return acceptJson || xReqJson;
    }
}
