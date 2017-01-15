package org.gaea.framework.web.schema.view.service;

import org.apache.commons.lang3.StringUtils;
import org.gaea.exception.InvalidDataException;
import org.gaea.exception.ValidationFailedException;
import org.gaea.framework.web.schema.Action;
import org.gaea.framework.web.schema.SchemaActionDefinition;
import org.gaea.framework.web.schema.view.action.ExcelExportButtonAction;
import org.gaea.framework.web.schema.view.action.ExcelExportSimpleButtonAction;
import org.gaea.framework.web.security.GaeaWebSecuritySystem;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;

import javax.servlet.http.HttpServletRequest;
import javax.servlet.http.HttpServletResponse;
import java.io.*;

/**
 * 负责各种Action的处理。
 * Created by iverson on 2016/11/10.
 */
@Service
public class ActionsService {
    private final Logger logger = LoggerFactory.getLogger(ActionsService.class);

    /**
     * 执行Action。
     * 传入的action是通用的。会根据action的method不同，做类型转换。然后再去执行action各自的实现方法doAction。
     * <p>采用类似command设计模式。</p>
     * <p>当前未考虑返回，是因为觉得action千差万别，不确定返回的是什么类型。好像也无法用泛型去规范。</p>
     *
     * @param action
     * @param response    利用流回写文件
     * @param request     获取用户登录信息
     * @throws ValidationFailedException
     */
    public void doAction(Action action, HttpServletResponse response, HttpServletRequest request) throws ValidationFailedException {
        if (action == null) {
            logger.warn("传入参数是一个空action。无法执行！");
            return;
        }
        if (SchemaActionDefinition.METHOD_EXCEL_EXPORT_BY_TEMPLATE.equalsIgnoreCase(action.getMethod())) { // method=导出excel
            /**
             * 转换成ExcepExportButtonAction，执行Action本身的逻辑。
             * 转换成ExcepExportButtonAction，就可以获得返回的File。通用Action执行方法，没有明确返回的类型。
             */
            String loginName = GaeaWebSecuritySystem.getUserName(request);
            File file = ((ExcelExportButtonAction) action).doAction(loginName);
            writeFileToResponse(file, response);
//            response.reset();
//            response.setCharacterEncoding("utf-8");
//            response.setContentType("application/vnd.ms-excel");
//            // 这个可能有助于服务器和客户端直接分块传输
//            response.setHeader("Content-Length", String.valueOf(file.length()));
//            BufferedInputStream bis = null;
//            BufferedOutputStream bos = null;
//            try {
//                bis = new BufferedInputStream(new FileInputStream(file));
//                bos = new BufferedOutputStream(response.getOutputStream());
//
//
//                byte[] buff = new byte[4096];
//                int bytesRead;
//                while (-1 != (bytesRead = bis.read(buff, 0, buff.length))) {
//                    bos.write(buff, 0, bytesRead);
//                }
//            } catch (FileNotFoundException e) {
//                logger.debug("读取缓存excel文件失败！");
//            } catch (IOException e) {
//                logger.debug("获取输出流失败！");
//            } finally {
//                try {
//                    bis.close();
//                    bos.close();
//                } catch (IOException e) {
//                    logger.error("输入输出流关闭失败！", e);
//                }
//            }
        }
    }

    /**
     * 普通action的处理。
     * <p>普通action，即一般是XML定义中，没有定义< button-action >的。</p>
     *
     * @param action
     * @param response    利用流回写文件
     * @param request     获取用户登录信息
     * @throws ValidationFailedException
     */
    public void doSimpleAction(Action action, HttpServletResponse response, HttpServletRequest request) throws ValidationFailedException, InvalidDataException {
        if (action == null) {
            logger.warn("传入参数是一个空action。无法执行！");
            return;
        }
        if (StringUtils.isEmpty(action.getName())) {
            logger.warn("传入参数action name为空。无法执行doSimpleAction！");
            return;
        }
        if (SchemaActionDefinition.ACTION_NAME_EXPORT_EXCEL.equalsIgnoreCase(action.getName())) { // method=导出excel
            String loginName = GaeaWebSecuritySystem.getUserName(request);
            /**
             * 转换成ExcepExportButtonAction，执行Action本身的逻辑。
             * 转换成ExcepExportButtonAction，就可以获得返回的File。通用Action执行方法，没有明确返回的类型。
             */
//        ExcelExportSimpleButtonAction exportAction = (ExcelExportSimpleButtonAction)action;


            File file = ((ExcelExportSimpleButtonAction) action).doAction(loginName);
            writeFileToResponse(file, response);

        }
    }

    private void writeFileToResponse(File file, HttpServletResponse response) {
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
