package org.gaea.demo.controller;

import org.apache.commons.lang3.StringUtils;
import org.gaea.db.QueryCondition;
import org.gaea.demo.dto.DemoClassDTO;
import org.gaea.demo.entity.DemoClassEntity;
import org.gaea.demo.entity.DemoStudentEntity;
import org.gaea.demo.repository.DemoClassRepository;
import org.gaea.demo.service.DemoClassService;
import org.gaea.exception.*;
import org.gaea.framework.web.bind.annotation.RequestBean;
import org.gaea.framework.web.common.WebCommonDefinition;
import org.gaea.config.SystemProperties;
import org.gaea.framework.web.data.GaeaDefaultDsContext;
import org.gaea.framework.web.schema.utils.GaeaExcelUtils;
import org.gaea.framework.web.security.GaeaWebSecuritySystem;
import org.gaea.framework.web.service.CommonViewQueryService;
import org.gaea.framework.web.service.ExcelService;
import org.gaea.poi.ExcelReader;
import org.gaea.poi.domain.Field;
import org.gaea.poi.export.ExcelExport;
import org.gaea.poi.reader.ExcelImportProcessor;
import org.gaea.security.service.SystemResourcesService;
import org.gaea.util.BeanUtils;
import org.gaea.util.GaeaJacksonUtils;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.config.ConfigurableListableBeanFactory;
import org.springframework.context.ApplicationContext;
import org.springframework.context.ConfigurableApplicationContext;
import org.springframework.stereotype.Controller;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestMethod;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.ResponseBody;
import org.springframework.web.multipart.MultipartFile;

import javax.servlet.http.HttpServletRequest;
import javax.servlet.http.HttpServletResponse;
import java.io.*;
import java.util.*;

/**
 * 系统各种通用样例的controller。
 * Created by iverson on 2016-10-8 09:41:22.
 */
@Controller
@RequestMapping("/gaea/demo")
public class DemosController {

    private final Logger logger = LoggerFactory.getLogger(DemosController.class);
    @Autowired
    private ApplicationContext context;
    @Autowired
    private SystemResourcesService systemResourcesService;
    @Autowired
    private ExcelReader excelReader;
    @Autowired
    private ExcelImportProcessor excelImportProcessor;
    @Autowired
    private CommonViewQueryService commonViewQueryService;
    @Autowired
    private ExcelExport excelExport;
    @Autowired
    private ExcelService excelService;
    @Autowired
    private DemoClassService demoClassService;
    @Autowired
    private DemoClassRepository demoClassRepository;

    @RequestMapping("/management")
    public String list() {
        return "demo/demo_management.xml";
    }

    /**
     * 多tab的示例
     *
     * @return
     */
    @RequestMapping(value = "/tabs-crud-form", produces = "plain/text; charset=UTF-8")
    public String showCreateUpdateForm() {
        return "/demo/tabs-crud-form.html";
    }

    @RequestMapping(value = "/class-crud-form", produces = "plain/text; charset=UTF-8")
    public String showAddClassForm() {
        return "/demo/class-crud-form.html";
    }

    /**
     * class-crud-form-<数字>这是嵌套dialog测试
     *
     * @return
     */
    @RequestMapping(value = "/class-crud-form-2", produces = "plain/text; charset=UTF-8")
    public String showAddClassForm2() {
        return "/demo/class-crud-form-2.html";
    }

    @RequestMapping(value = "/class-crud-form-3", produces = "plain/text; charset=UTF-8")
    public String showAddClassForm3() {
        return "/demo/class-crud-form-3.html";
    }

    @RequestMapping(value = "/class-crud-form-2-1", produces = "plain/text; charset=UTF-8")
    public String showAddClassForm21() {
        return "/demo/class-crud-form-2-1.html";
    }

    @RequestMapping(value = "/class-crud-form-3-1", produces = "plain/text; charset=UTF-8")
    public String showAddClassForm31() {
        return "/demo/class-crud-form-3-1.html";
    }

    /**
     * 班级学生同时编辑管理页面
     *
     * @return
     */
    @RequestMapping(value = "/class-student-crud-form", produces = "plain/text; charset=UTF-8")
    public String showAddClassStudentForm() {
        return "/demo/class-student-crud-form.html";
    }

    /**
     * 班级学生同时编辑管理页面 TAB 2
     *
     * @return
     */
    @RequestMapping(value = "/class-student-crud-form/tab2", produces = "plain/text; charset=UTF-8")
    public String showAddClassStudentFormTab2() {
        return "/demo/class-student-crud-form-tab2.html";
    }

    // 文件上传完后的数据刷新
    @RequestMapping(value = "/class-student-crud-form/tab2/load-data", produces = "plain/text; charset=UTF-8")
    @ResponseBody
    public String addClassStudentFormTab2LoadData() throws IOException {
        Map result = new HashMap();
        List stuHeadImgList = new ArrayList();
        Map stuHeadImg1 = new HashMap();
        stuHeadImg1.put("id", "1");
        stuHeadImg1.put("imgUrl", "<img src='/img/pictures/B_74/1000007457/887167010178_1497506095022.jpg'>" +
                "<img src='/img/pictures/B_74/1000007457/1_n_n_1501482761321.jpg'>" +
                "<img src='/img/pictures/B_74/1000007457/5-prdl_887167010178_(4)_n.jpg'>");
        stuHeadImgList.add(stuHeadImg1);
        Map stuHeadImg2 = new HashMap();
        stuHeadImg2.put("id", "2");
        stuHeadImg2.put("imgUrl", "<img src='/img/pictures/B_100000862/1000069489/prdl_15238181005_900_1_1501135385635.jpg'>");
        stuHeadImgList.add(stuHeadImg2);
        result.put("stuHeadImgList", stuHeadImgList);
        return GaeaJacksonUtils.parse(result);
    }

    /**
     * action, method=submit的处理。
     *
     * @return
     */
    @RequestMapping(value = "/submitAction", produces = "plain/text; charset=UTF-8", method = RequestMethod.POST)
    @ResponseBody
    public void submitAction(@RequestBean("selectedRows") List<DemoClassEntity> classEntityList) {
        if (classEntityList != null) {
            for (DemoClassEntity classEntity : classEntityList) {
                System.out.println("id: " + classEntity.getId() + "class name: " + classEntity.getClassName());
            }
        }
    }

    /**
     * 编辑班级的数据加载。
     *
     * @param id
     * @param request
     * @return
     */
    @RequestMapping(value = "/get-class", method = RequestMethod.POST)
    @ResponseBody
    public DemoClassDTO loadClass(String id, HttpServletRequest request) {
        DemoClassEntity classEntity = demoClassRepository.findOne(id);
        DemoClassDTO demoClassDTO = new DemoClassDTO();
        BeanUtils.copyProperties(classEntity, demoClassDTO, "students", "classRoles");
        demoClassDTO.setClassRolesList(Arrays.asList(classEntity.getClassRoles().split(",")));
        return demoClassDTO;
    }

    @RequestMapping(value = "/add-class", produces = "plain/text; charset=UTF-8")
    @ResponseBody
    public void saveClass(@RequestBean DemoClassEntity classEntity, HttpServletRequest request, @RequestBean("classRolesList") List<String> classRolesList, @RequestBean("students") List<DemoStudentEntity> studentList) {
        classEntity.setClassRoles(StringUtils.join(classRolesList, ","));
//        demoClassService.save(classEntity, GaeaWebSecuritySystem.getUserName(request));
    }

    @RequestMapping(value = "/add-class-student", produces = "plain/text; charset=UTF-8")
    @ResponseBody
    public void addClassStudent(@RequestBean DemoClassEntity classEntity, String pageId, @RequestBean("classRolesList") List<String> classRolesList, @RequestBean("students") List<DemoStudentEntity> studentList) {
        System.out.println("------------>>>> save class students.");
        // 未完成
//        classEntity.setClassRoles(StringUtils.join(classRolesList, ","));
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


    /**
     * 上传学生头像图片
     *
     * @param files    这个@RequestParam的file，是前端写死的默认约定
     * @param pageId
     * @param request
     * @param response
     * @throws IOException
     */
    @RequestMapping(value = "/upload-head-img")
    @ResponseBody
    public String uploadStudentHeadImg(@RequestParam("file") MultipartFile[] files, String pageId, @RequestBean DemoClassEntity classEntity, HttpServletRequest request, HttpServletResponse response) throws IOException, ValidationFailedException {
        // 可以对文件上传前做验证
        if (classEntity == null || StringUtils.isEmpty(classEntity.getClassName())) {
            throw new ValidationFailedException("班级名称不允许为空！");
        }
        if (files != null) {
            for (MultipartFile file : files) {
                System.out.println(file.getName());
                FileOutputStream fos = new FileOutputStream("D:\\temp\\uploadImgTest" + System.currentTimeMillis() + ".jpg");
                fos.write(file.getBytes());
                fos.close();
            }
        }
        return "";
    }

    @RequestMapping(value = "/excel-import")
    @ResponseBody
    public String excelImport(@RequestParam("file") MultipartFile[] files, String pageId, @RequestBean DemoClassEntity classEntity, HttpServletRequest request, HttpServletResponse response) throws IOException, ValidationFailedException {
        // 可以对文件上传前做验证
//        if (classEntity == null || StringUtils.isEmpty(classEntity.getClassName())) {
//            throw new ValidationFailedException("班级名称不允许为空！");
//        }
        if (files != null) {
            for (MultipartFile file : files) {
                System.out.println(file.getName());
                List<Map<String, String>> data = excelReader.getData(file.getInputStream());
                List<DemoStudentEntity> studentEntityList = excelReader.getData(file.getInputStream(), DemoStudentEntity.class);
                System.out.println("--------->>>> data size: " + data.size());
            }
        }
        return "";
    }

    /**
     * 对应"测试上传文件"按钮
     *
     * @param files
     * @param pageId
     * @param request
     * @param response
     * @throws IOException
     */
    @RequestMapping(value = "/upload-to-somewhere")
    public void uploadToSomewhere(@RequestParam("file") MultipartFile[] files, String pageId, HttpServletRequest request, HttpServletResponse response) throws IOException {
        if (files != null) {
            for (MultipartFile file : files) {
                System.out.println("------------>>>>测试随便上传文件到Controller。file name: " + file.getName());
            }
        }
    }

//    @RequestMapping(value = "/upload")
//    public void testImportExcel(@RequestParam("file") MultipartFile[] files, HttpServletRequest request, HttpServletResponse response) {
//        //上传文件过程
//        String test = "";
//        if(files==null){
//            System.out.println("file is null.");
//        }else{
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
//        }
////        for (MultipartFile file : files) {
////            String suffix = file.getOriginalFilename().substring(file.getOriginalFilename().lastIndexOf(".") + 1);
//////            int length = getAllowSuffix().indexOf(suffix);
//////            if (length == -1) {
//////                throw new Exception("请上传允许格式的文件");
//////            }
//////            destDir = "staticResource/user/picture/" + user.getId();
//////            File destFile = new File(uploadPath + destDir);
//////            if (!destFile.exists()) {
//////                destFile.mkdirs();
//////            }
//////            String fileNameNew = getFileNameNew() + "." + suffix;//
//////            File f = new File(destFile.getAbsoluteFile() + File.separator + fileNameNew);
//////            //如果当前文件已经存在了，就跳过。
//////            if(f.exists()){
//////                continue;
//////            }
//////            file.transferTo(f);
//////            f.createNewFile();
//////            fileNames[index++] = basePath + destDir + fileNameNew;
////        }
//    }

//    @RequestMapping(value = "/button-group-hello1", produces = "plain/text; charset=UTF-8")
//    @ResponseBody
//    public void test1(Resource resource) {
//        System.out.println("------------------------------------------\n test 1 \n------------------------------------------\n");
//    }

    @RequestMapping(value = "/export-excel", produces = "plain/text; charset=UTF-8")
    @ResponseBody
    public void exportExcel(String schemaId, String conditions, @RequestBean("filters") List<QueryCondition> filters, HttpServletRequest request) throws ValidationFailedException {
        logger.info("------------------------------------------\n export excel demo \n------------------------------------------\n");
//        ObjectMapper mapper = new ObjectMapper();
//        DataSetCommonQueryConditionDTO queryConditionDTO = null;
//        if (StringUtils.isNotEmpty(conditions)) {
//            try {
//                queryConditionDTO = mapper.readValue(conditions, DataSetCommonQueryConditionDTO.class);
//            } catch (IOException e) {
//                logger.debug("转换查询条件失败！", e);
//                throw new ValidationFailedException("转换查询条件失败！");
//            }
//        }
        // 数据集ID（dsId）和SCHEMA ID（schemaId）必须要有其一
        if (StringUtils.isEmpty(schemaId)) {
            throw new ValidationFailedException("无法获取页面的SchemaId。无法导出操作！");
        }
        try {
//            List<Map<String, Object>> result = commonViewQueryService.queryByConditions(schemaId, dsId, queryConditionDTO);

//            PageResult result = commonViewQueryService.query(schemaId, filters, new SchemaGridPage(1,1000), true); // 默认导出1000条
            /**
             * *********************************************************** TEST 2 利用模板导出任意dataset
             */
            GaeaDefaultDsContext defaultDsContext = new GaeaDefaultDsContext(GaeaWebSecuritySystem.getUserName(request));
            List<Map<String, Object>> data = excelService.queryByConditions(null, "DS_EXCEL_EXPORT_DEMO", "EXCEL_EXPORT_DEMO", defaultDsContext); // 默认导出1000条
            Map<String, Field> fieldsMap = GaeaExcelUtils.getFields(schemaId);
            //test
            Field field = fieldsMap.get("level");
            field.setCellValueTransferBy(Field.TRANSFER_BY_DS_TEXT);
            fieldsMap.put("level", field);
            // test end
//            excelExport.export("EXCEL_EXPORT_DEMO",result.getContent()); // 利用模板导出
            excelExport.export("EXCEL_EXPORT_DEMO", data, SystemProperties.get(WebCommonDefinition.PROP_KEY_EXCEL_BASE_DIR)); // 利用模板导出
//            excelExport.export(result.getContent(),"Iverson测试excel导出",fieldsMap,null); // 一般性导出(可以用于通用导出)
//            return result;
        } catch (SysLogicalException e) {
            logger.debug(e.getMessage(), e);
            throw new ValidationFailedException("系统逻辑错误！请联系管理员处理。");
        } catch (SysInitException e) {
            logger.error("系统初始化异常！", e);
        } catch (ProcessFailedException e) {
            logger.error(e.getMessage(), e);
        }
    }


//    @RequestMapping(value = "/upload")
//    public void testImportExcel(@RequestParam("file") MultipartFile[] files, HttpServletRequest request, HttpServletResponse response) {
//        //上传文件过程
//        String test = "";
//        if(files==null){
//            System.out.println("file is null.");
//        }else{
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
//        }
////        for (MultipartFile file : files) {
////            String suffix = file.getOriginalFilename().substring(file.getOriginalFilename().lastIndexOf(".") + 1);
//////            int length = getAllowSuffix().indexOf(suffix);
//////            if (length == -1) {
//////                throw new Exception("请上传允许格式的文件");
//////            }
//////            destDir = "staticResource/user/picture/" + user.getId();
//////            File destFile = new File(uploadPath + destDir);
//////            if (!destFile.exists()) {
//////                destFile.mkdirs();
//////            }
//////            String fileNameNew = getFileNameNew() + "." + suffix;//
//////            File f = new File(destFile.getAbsoluteFile() + File.separator + fileNameNew);
//////            //如果当前文件已经存在了，就跳过。
//////            if(f.exists()){
//////                continue;
//////            }
//////            file.transferTo(f);
//////            f.createNewFile();
//////            fileNames[index++] = basePath + destDir + fileNameNew;
////        }
//    }
}
