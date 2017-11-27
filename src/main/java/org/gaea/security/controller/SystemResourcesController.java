package org.gaea.security.controller;

import org.gaea.exception.ProcessFailedException;
import org.gaea.exception.ValidationFailedException;
import org.gaea.framework.web.bind.annotation.RequestBean;
import org.gaea.framework.web.bind.annotation.RequestBeanDataType;
import org.gaea.framework.web.common.WebCommonDefinition;
import org.gaea.framework.web.schema.view.jo.SchemaColumnJO;
import org.gaea.poi.ExcelReader;
import org.gaea.poi.reader.ExcelImportProcessor;
import org.gaea.security.domain.Resource;
import org.gaea.security.service.SystemResourcesService;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.config.ConfigurableListableBeanFactory;
import org.springframework.context.ApplicationContext;
import org.springframework.context.ConfigurableApplicationContext;
import org.springframework.stereotype.Controller;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.ResponseBody;
import org.springframework.web.multipart.MultipartFile;

import javax.servlet.http.HttpServletRequest;
import javax.servlet.http.HttpServletResponse;
import java.io.IOException;
import java.io.InputStream;
import java.util.*;

/**
 * 系统资源（菜单等）控制器。
 * Created by iverson on 2016/1/3.
 */
@Controller
@RequestMapping("/gaea/security/resource")
public class SystemResourcesController {

    private final Logger logger = LoggerFactory.getLogger(SystemResourcesController.class);
    @Autowired
    private ApplicationContext context;
    @Autowired
    private SystemResourcesService systemResourcesService;
    @Autowired
    private ExcelReader excelReader;
    @Autowired
    private ExcelImportProcessor excelImportProcessor;

    @RequestMapping("/management")
    public String list() {
        return "system/security/resource_management.xml";
    }

    @RequestMapping(value = "/showCreateUpdateForm", produces = "plain/text; charset=UTF-8")
    public String showCreateUpdateForm() {
        return "/gaea-system/security/resource/create-update-form.html";
    }

    @RequestMapping(value = "/add", produces = "plain/text; charset=UTF-8")
    @ResponseBody
    public void save(Resource resource) throws ValidationFailedException {
        systemResourcesService.save(resource);
    }

    @RequestMapping(value = "/update", produces = "plain/text; charset=UTF-8")
    @ResponseBody
    public void update(Resource resource) throws ValidationFailedException {
        systemResourcesService.update(resource);
    }

    // 加载编辑数据
    @RequestMapping(value = "/load-edit-data", produces = "plain/text; charset=UTF-8")
    @ResponseBody
    public String loadDsAuthEditData(@RequestBean(WebCommonDefinition.PARAM_NAME_SELECTED_ROW) Resource resource) throws ProcessFailedException, IOException {
        String result = systemResourcesService.loadEditData(resource.getId());
//        if (result != null) {
//            return GaeaJacksonUtils.parse(result);
//        }
        return result;
    }

    @RequestMapping(value = "/delete", produces = "plain/text; charset=UTF-8")
    @ResponseBody
    public void delete(@RequestBean("selectedRows") List<Resource> roleList) throws ValidationFailedException {
        systemResourcesService.delete(roleList);
    }

    @RequestMapping(value = "/test", produces = "plain/text; charset=UTF-8")
    public void testImportExcel() {
        String xlsFilePath = "/WEB-INF/static/view_schema/demo/test_3月份法本考勤.xlsx";// TODO 改为在配置文件里配置。
        org.springframework.core.io.Resource fileResource = context.getResource(xlsFilePath);
        ApplicationContext parentContext = context.getParent();
        ConfigurableListableBeanFactory beanFactory = ((ConfigurableApplicationContext) context).getBeanFactory();
//        beanFactory.registerSingleton("springMvcContextPromotionHttpInvokerProxyFactory",springMvcContextPromotionProxyFactory);
        try {
            InputStream is = fileResource.getInputStream();
//            GaeaPoiResultGroup result = excelReader.getData(is, Attendance.class);
            // test2 ok
//            List<Map<String,String>> result2 = excelReader.getData(is);
            // test 3
//            org.gaea.poi.domain.Workbook workbook = excelReader.getWorkbook(is);
            // test 4
//            excelReader.getDataTest(is,Attendance.class);
            // test 5
            excelImportProcessor.importDB(is);
            /* DEMO 1 */
//            //根据上述创建的输入流 创建工作簿对象ZA
//            Workbook wb = WorkbookFactory.create(is);
//            //得到第一页 sheet
//            //页Sheet是从0开始索引的
//            Sheet sheet = wb.getSheetAt(0);
//            //利用foreach循环 遍历sheet中的所有行
//            for (Row row : sheet) {
//                //遍历row中的所有方格
//                for (Cell cell : row) {
//                    //输出方格中的内容，以空格间隔
//                    System.out.print(String.format("cellComment:%s cellType:%s columnIndex:%s rowIndex:%s",cell.getCellComment().getString().getString(),cell.getCellType(),cell.getColumnIndex(),cell.getRowIndex()).toString());
//                    System.out.print(cell.toString() + "  ");
//                }
//                //每一个行输出之后换行
//                System.out.println();
//            }
//            //关闭输入流
//            is.close();
        } catch (IOException e) {
            e.printStackTrace();
        } catch (ValidationFailedException e) {
            e.printStackTrace();
        } catch (Exception e) {
            e.printStackTrace();
        }
    }

    @RequestMapping(value = "/upload")
    public void testImportExcel(@RequestParam("file") MultipartFile[] files, HttpServletRequest request, HttpServletResponse response,
                                @RequestBean(value = "testJsonData", dataType = RequestBeanDataType.JSON) List<SchemaColumnJO> testJsonData) {
        //上传文件过程
        String test = "";
        if (files == null) {
            System.out.println("file is null.");
        } else {
//            try {
//                List<Attendance> datas = excelReader.getData(files[0].getInputStream(),Attendance.class);
////                Workbook workbook = excelReader.getWorkbook(files[0].getInputStream());
////                List<Attendance> datas = workbook.getBlockList().get(0).getData();
//                Calendar c = Calendar.getInstance();
//                FastDateFormat df = FastDateFormat.getInstance("yyyy-MM-dd HH:mm:ss");
//                FastDateFormat dateDf = FastDateFormat.getInstance("yyyy-MM-dd");
//                FastDateFormat timeDf = FastDateFormat.getInstance("HH:mm:ss");
//                DurationFormatUtils durationFormatUtils = new DurationFormatUtils();
//                GaeaDateTimeUtils dateTimeUtils = GaeaDateTimeUtils.getInstance();
//                    System.out.println("已加载数据："+datas.size());
//                    Map<String,Map<String,Attendance>> usersMap = new HashMap<String, Map<String, Attendance>>();
//                    for (int i = 0; i < datas.size(); i++) {
//                        Attendance atd = datas.get(i);
//                        String username = atd.getUsername();
//                        Map<String,Attendance> attendanceMap = usersMap.get(username);
//                        if(attendanceMap==null){
//                            attendanceMap = new HashMap<String, Attendance>();
//                        }
//                        String strDate = atd.getClockdate();
//                        String strTime = atd.getClocktime();
//                        Attendance attendance = attendanceMap.get(strDate);
//                        if(attendance==null){
//                            attendance = atd;
//                            attendanceMap.put(strDate,attendance);
//                            usersMap.put(username,attendanceMap);
//                        }
//                        Date entryTime = attendance.getEntryTime();
//                        Date offTime = attendance.getOffTime();
//                        String clockTime = dateDf.format(df.parse(strDate))+" "+timeDf.format(df.parse(strTime));
//                        // 如果没有上班打卡时间
//                        if(entryTime==null){
//                            attendance.setEntryTime(df.parse(clockTime));
//                        }
//                        // 有上班打卡，没有下班打卡
//                        else if(offTime==null){
//                            String datetime2 = df.format(entryTime);
//                            // 打卡时间是在上班卡之后
//                            if(dateTimeUtils.isLarger(clockTime,datetime2)){
//                                attendance.setOffTime(df.parse(clockTime));
//                            }
//                            // 打卡时间在上班卡之前,互换上下班打卡时间
//                            else{
//                                attendance.setOffTime(entryTime);
//                                attendance.setEntryTime(df.parse(clockTime));
//                            }
//                        }else{// 上下班卡时间都有
//                            String strEntryTime = df.format(entryTime);
//                            String strOffTime = df.format(offTime);
//                            // 打卡时间在上班卡之前
//                            if(!dateTimeUtils.isLarger(clockTime,strEntryTime)){
//                                attendance.setEntryTime(df.parse(clockTime));
//                            }
//                            // 打卡时间在下班卡之后
//                            else if(dateTimeUtils.isLarger(clockTime,strOffTime)){
//                                attendance.setOffTime(df.parse(clockTime));
//                            }
//                        }
////                        attendanceMap.put(strDate,attendance);
////                        usersMap.put(username,attendanceMap);
////                        String entryTime =
//                    }
//                // 计算汇总后的各个用户的打卡记录（已合并）
//                for(String username:usersMap.keySet()) {
//                    Map<String,Attendance> attendanceMap = usersMap.get(username);
//                    for(String date:attendanceMap.keySet()){
//                        Attendance atd = attendanceMap.get(date);
//                        if(atd.getOffTime()==null){
//                            continue;
//                        }
//                        String strDatetime = dateDf.format(df.parse(date));
//                        String baseDateTime = strDatetime+" 18:00:00"; // 设置加班开始时间
//                        String strCheckTime = strDatetime + " 18:59:59"; // 起算时间
//                        String otCount = "";
//                        c.setTime(df.parse(baseDateTime));
//                        // 离开时间比标准加班开始时间早，略过
//                        if(!(c.get(Calendar.DAY_OF_WEEK)==1 || c.get(Calendar.DAY_OF_WEEK)==7) && df.parse(strCheckTime).getTime()>atd.getOffTime().getTime()){
//                            continue;
//                        }
//                        // 处理周末
//                        if(c.get(Calendar.DAY_OF_WEEK)==1 || c.get(Calendar.DAY_OF_WEEK)==7){
//                            baseDateTime = df.format(atd.getEntryTime());
//                            otCount = "周末. ";
//                        }
//                        String otHour = DurationFormatUtils.formatPeriod(df.parse(baseDateTime).getTime(),atd.getOffTime().getTime(),"H");
//                        String otMin = DurationFormatUtils.formatPeriod(df.parse(baseDateTime).getTime(),atd.getOffTime().getTime(),"m");
//                        int intOtMin = Integer.parseInt(otMin);
//                        if(intOtMin>0){
//                            int intOtHour = Integer.parseInt(otHour);
//                            intOtMin = intOtMin-(intOtHour*60);
//                            if(intOtMin>=30 && intOtMin<60){
//                                otMin = "30";
//                            }else{
//                                otMin = "0";
//                            }
////                            otMin = String.valueOf(intOtMin);
//                        }
//                        otCount += DurationFormatUtils.formatPeriod(df.parse(baseDateTime).getTime(),atd.getOffTime().getTime(),"H 小时 m 分钟 s 秒");
//                        atd.setOtHour(otHour);
//                        atd.setOtMin(otMin);
//                        atd.setOtDesc(otCount);
//                    }
//                    attendanceRepository.save(attendanceMap.values());
//                }
//            } catch (ValidationFailedException e) {
//                e.printStackTrace();
//            } catch (IOException e) {
//                e.printStackTrace();
//            } catch (ParseException e) {
//                e.printStackTrace();
//            }
        }
//        for (MultipartFile file : files) {
//            String suffix = file.getOriginalFilename().substring(file.getOriginalFilename().lastIndexOf(".") + 1);
////            int length = getAllowSuffix().indexOf(suffix);
////            if (length == -1) {
////                throw new Exception("请上传允许格式的文件");
////            }
////            destDir = "staticResource/user/picture/" + user.getId();
////            File destFile = new File(uploadPath + destDir);
////            if (!destFile.exists()) {
////                destFile.mkdirs();
////            }
////            String fileNameNew = getFileNameNew() + "." + suffix;//
////            File f = new File(destFile.getAbsoluteFile() + File.separator + fileNameNew);
////            //如果当前文件已经存在了，就跳过。
////            if(f.exists()){
////                continue;
////            }
////            file.transferTo(f);
////            f.createNewFile();
////            fileNames[index++] = basePath + destDir + fileNameNew;
//        }
    }
}
