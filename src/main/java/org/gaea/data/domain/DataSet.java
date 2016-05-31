package org.gaea.data.domain;

import org.hibernate.annotations.GenericGenerator;

import javax.persistence.*;
import java.io.Serializable;

/**
 * 数据集对象。
 * Created by iverson on 2016/5/19.
 */
@Entity
@Table(name = "GAEA_SYS_DATASET")
public class DataSet implements Serializable {
    private static final long serialVersionUID = 1L;
    @Id
    @GenericGenerator(name="gaeaDateTimeIDGenerator", strategy="org.gaea.extend.hibernate.id.GaeaDateTimeIDGenerator")
    @GeneratedValue(generator = "gaeaDateTimeIDGenerator")
    @Column(name = "ID")
    private String id;
    @Column(name = "DS_ID")
    private String dsId;
    @Column(name = "NAME")
    private String name;
    @Column(name = "DATA_SQL")
    private String sql;
    @Column(name = "DS_DATA")
    private String dsData;

    public String getId() {
        return id;
    }

    public void setId(String id) {
        this.id = id;
    }

    public String getDsId() {
        return dsId;
    }

    public void setDsId(String dsId) {
        this.dsId = dsId;
    }

    public String getName() {
        return name;
    }

    public void setName(String name) {
        this.name = name;
    }

    public String getSql() {
        return sql;
    }

    public void setSql(String sql) {
        this.sql = sql;
    }

    public String getDsData() {
        return dsData;
    }

    public void setDsData(String dsData) {
        this.dsData = dsData;
    }
}
