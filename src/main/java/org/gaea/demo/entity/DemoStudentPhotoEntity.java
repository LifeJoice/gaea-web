package org.gaea.demo.entity;

import org.apache.commons.lang3.StringUtils;
import org.gaea.security.domain.User;
import org.hibernate.annotations.GenericGenerator;
import org.joda.time.DateTime;
import org.springframework.data.domain.Auditable;

import javax.persistence.*;
import java.util.Date;

/**
 * Created by iverson on 2017/1/16.
 */
@Entity
@Table(name = "DEMO_STUDENT_PHOTO")
public class DemoStudentPhotoEntity implements Auditable<User, String> {
    private static final long serialVersionUID = 1L;
    @Id
    @GenericGenerator(name = "gaeaDateTimeIDGenerator", strategy = "org.gaea.extend.hibernate.id.GaeaDateTimeIDGenerator")
    @GeneratedValue(generator = "gaeaDateTimeIDGenerator")
    @Column(name = "ID")
    private String id;
    @Column(name = "FILE_PATH")
    private String filePath;
    @Column(name = "FILE_NAME")
    private String fileName;
    @Column(name = "FILE_SIZE")
    private String fileSize;
    @Column(name = "FILE_URL")
    private String url;
    @Column(name = "TYPE")
    private Integer type = 1; // 图片类型。1: 大头照 2：个人生活照
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "STUDENT_ID")
    private DemoStudentEntity student;
    @Column(name = "CREATED_BY")
    private User createdBy;
    @Column(name = "CREATED_DATE")
    private DateTime createdDate;
    @Column(name = "LAST_MODIFIED_BY")
    private User lastModifiedBy;
    @Column(name = "LAST_MODIFIED_DATE")
    private DateTime lastModifiedDate;

    @Override
    public String getId() {
        return id;
    }

    @Override
    public boolean isNew() {
        return StringUtils.isEmpty(getId());
    }

    public void setId(String id) {
        this.id = id;
    }

    public String getFilePath() {
        return filePath;
    }

    public void setFilePath(String filePath) {
        this.filePath = filePath;
    }

    public String getFileName() {
        return fileName;
    }

    public void setFileName(String fileName) {
        this.fileName = fileName;
    }

    public String getFileSize() {
        return fileSize;
    }

    public void setFileSize(String fileSize) {
        this.fileSize = fileSize;
    }

    public String getUrl() {
        return url;
    }

    public void setUrl(String url) {
        this.url = url;
    }

    public Integer getType() {
        return type;
    }

    public void setType(Integer type) {
        this.type = type;
    }

    public DemoStudentEntity getStudent() {
        return student;
    }

    public void setStudent(DemoStudentEntity student) {
        this.student = student;
    }

    @Override
    public User getCreatedBy() {
        return createdBy;
    }

    @Override
    public void setCreatedBy(User createdBy) {
        this.createdBy = createdBy;
    }

    @Override
    public DateTime getCreatedDate() {
        return createdDate;
    }

    @Override
    public void setCreatedDate(DateTime createdDate) {
        this.createdDate = createdDate;
    }

    @Override
    public User getLastModifiedBy() {
        return lastModifiedBy;
    }

    @Override
    public void setLastModifiedBy(User lastModifiedBy) {
        this.lastModifiedBy = lastModifiedBy;
    }

    @Override
    public DateTime getLastModifiedDate() {
        return lastModifiedDate;
    }

    @Override
    public void setLastModifiedDate(DateTime lastModifiedDate) {
        this.lastModifiedDate = lastModifiedDate;
    }
}
