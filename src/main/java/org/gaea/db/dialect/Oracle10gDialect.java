package org.gaea.db.dialect;

import org.apache.commons.lang3.StringUtils;
import org.apache.commons.lang3.time.DateUtils;
import org.gaea.db.QueryCondition;
import org.gaea.db.ibatis.jdbc.SQL;
import org.gaea.db.service.GaeaDataBaseCommonService;
import org.gaea.exception.InvalidDataException;
import org.gaea.util.GaeaDateTimeUtils;
import org.joda.time.DateTime;
import org.joda.time.format.DateTimeFormat;
import org.joda.time.format.DateTimeFormatter;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;

import java.text.MessageFormat;
import java.text.ParseException;
import java.util.Date;

/**
 * <b>dialect是针对特定数据库的方言的翻译器。</b>
 * <p>
 * 例如：<br/>
 * 像分页，SQL SERVER可能是用top 20。Oracle可能是用rownum。这是特定数据库都不一样的。
 * </p>
 * <p>
 * 所以，这可能会是一个比较混杂的类。因为不准备像Hibernate那样，在跨数据库上做太多。所以在数据库方言这块，目前的设计会比较简单些。
 * </p>
 * Created by Iverson on 2017年2月14日17:06:16
 */
@Service
public class Oracle10gDialect implements GaeaDataBaseCommonService {

    private final Logger logger = LoggerFactory.getLogger(Oracle10gDialect.class);
    /**
     * 获取分页的SQL。
     *
     * @param sql          基础的数据查询sql
     * @param primaryTable 分页相关的id的主表。主要用于获取id来协助分页。
     * @param startPos     开始位置。获取数据从startPos+1那条开始。
     * @param pageSize
     * @return
     * @throws InvalidDataException
     */
    @Override
    public String getPageSql(final String sql, String primaryTable, int startPos, int pageSize) throws InvalidDataException {
//        if(StringUtils.isEmpty(primaryTable)){
//            throw new InvalidDataException("主表为空，无法构造分页SQL。可能情况：数据集的配置缺失等。");
//        }
        if (startPos < 0 || pageSize <= 0) {
            throw new InvalidDataException(MessageFormat.format("分页的起始数和页记录数不允许小于0. start:{0} page size:{1}", startPos, pageSize).toString());
        }
        int endPos = startPos + pageSize;
        // MySQL的分页子查询，先获取id
//        SQL selectIdSql = new SQL();
//        selectIdSql.SELECT("id").FROM(primaryTable).ORDER_BY("id limit :START_ROWNUM,1");

        String sql1 = new SQL()
                .SELECT("pageRs1.*,ROWNUM as rnum")
                .FROM(sql, "pageRs1")
                .WHERE("rownum<=" + String.valueOf(endPos))
                .toString();
        String newSql = new SQL()
                .SELECT("*")
                .FROM(sql1, "pageRs2")
                .WHERE("pageRs2.rnum>" + startPos).toString();
        return newSql;
    }

    /**
     * 转换日期类的条件的SQL。因为日期类的，不能简单的用 xxx>xxx这样。像Oracle还需要结合to_date函数。
     *
     * @param condition
     * @return
     */
    @Override
    public String parseDateTimeCondition(QueryCondition condition) {
        String whereCase = "";
        if (condition == null || StringUtils.isEmpty(condition.getPropValue())) {
            return "";
        }
        DateTime begin;
        String beginDT = "", endDT = "";
        // 开始时间
        try {
            // 例如：2018-1-25 15:41:37
            // 如果是2018-1这种，会变成2018-01-01 00:00:00
            Date condDate = DateUtils.parseDate(condition.getPropValue(), GaeaDateTimeUtils.getDefaultConvertPatterns());
            begin = new DateTime(condDate);
            // 格式化为：2018-1-25 00:00:00
            beginDT = begin.dayOfMonth().roundFloorCopy().toString("yyyy-MM-dd HH:mm:ss");
            // 格式化为：2018-1-25 23:59:59
            endDT = begin.plusDays(1).dayOfMonth().roundFloorCopy().plusSeconds(-1).toString("yyyy-MM-dd HH:mm:ss");
            // 拼凑SQL
            String dateMoreThan = MessageFormat.format("{0} >= to_date({1},{2})", condition.getPropName().toUpperCase(), "'" + beginDT + "'", "'yyyy-mm-dd hh24:mi:ss'");
            String dateLessThan = MessageFormat.format("{0} <= to_date({1},{2})", condition.getPropName().toUpperCase(), "'" + endDT + "'", "'yyyy-mm-dd hh24:mi:ss'");
            whereCase = dateMoreThan + " AND " + dateLessThan;
        } catch (ParseException e) {
            logger.error("转换Oracle的日期类的查询条件失败！condition value: " + condition.getPropValue(), e);
        }
        return whereCase;
    }

//    public static void main(String[] args) throws ParseException {
//        QueryCondition cond = new QueryCondition();
//        Oracle10gDialect oracle10gDialect = new Oracle10gDialect();
//
//        cond.setDataType("date");
//        cond.setPropValue("2018-1-25 16:26:14");
//        cond.setPropName("CREATE_TIME");
//
//        System.out.println(oracle10gDialect.parseDateTimeCondition(cond));
//
//
////        DateTimeFormatter format = DateTimeFormat.forPattern("yyyy-MM-dd HH:mm:ss");
//
//        //时间解析
//        DateTime formatDt = new DateTime(DateUtils.parseDate("2018-01-25 23:59:59", GaeaDateTimeUtils.getDefaultConvertPatterns()));
//        System.out.println("begin: "+formatDt.dayOfMonth().roundFloorCopy().toString("yyyy-MM-dd HH:mm:ss"));
//        System.out.println("end: "+formatDt.plusDays(1).dayOfMonth().roundFloorCopy().plusSeconds(-1).toString("yyyy-MM-dd HH:mm:ss"));
//        System.out.println(formatDt.toString("yyyy-MM-dd HH:mm:ss"));
//    }
}
