package org.gaea.workflow.demo.dayoff.domain;

import org.gaea.workflow.domain.WorkflowDomain;
import org.hibernate.annotations.DynamicInsert;
import org.hibernate.annotations.DynamicUpdate;
import org.springframework.format.annotation.DateTimeFormat;

import javax.persistence.*;
import java.util.Date;

/**
 * 请假单。
 * Created by Iverson on 2015/5/18.
 */
@Entity
@DynamicInsert
@DynamicUpdate
@Table(name = "DEMO_DAYOFF_FORM")
public class DayoffForm extends WorkflowDomain<Long> {
    @Id
    @GeneratedValue(strategy=GenerationType.AUTO)
    private Long id;
    @DateTimeFormat(pattern = "yyyy-MM-dd HH:mm:ss")
    @Column(name = "BEGIN_DATETIME")
    private Date beginDatetime;
    @DateTimeFormat(pattern = "yyyy-MM-dd HH:mm:ss")
    @Column(name = "END_DATETIME")
    private Date endDatetime;
    @Column(name = "REASON")
    private String reason;

    public Date getBeginDatetime() {
        return beginDatetime;
    }

    public void setBeginDatetime(Date beginDatetime) {
        this.beginDatetime = beginDatetime;
    }

    public Date getEndDatetime() {
        return endDatetime;
    }

    public void setEndDatetime(Date endDatetime) {
        this.endDatetime = endDatetime;
    }

    public String getReason() {
        return reason;
    }

    public void setReason(String reason) {
        this.reason = reason;
    }
}
