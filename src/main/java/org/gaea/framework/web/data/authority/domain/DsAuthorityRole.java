package org.gaea.framework.web.data.authority.domain;

import org.gaea.data.dataset.domain.DsAuthRole;
import org.hibernate.annotations.GenericGenerator;

import javax.persistence.*;
import java.io.Serializable;

/**
 * Created by iverson on 2016/12/5.
 */
public class DsAuthorityRole implements Serializable, DsAuthRole {
    private String name;
    private String code;

    public String getName() {
        return name;
    }

    public void setName(String name) {
        this.name = name;
    }

    @Override
    public String getCode() {
        return code;
    }

    public void setCode(String code) {
        this.code = code;
    }
}
