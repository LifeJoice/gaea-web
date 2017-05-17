package org.gaea.framework.web.utils;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

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
}
