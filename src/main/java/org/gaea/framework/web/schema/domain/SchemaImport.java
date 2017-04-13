package org.gaea.framework.web.schema.domain;

import com.fasterxml.jackson.annotation.JsonIgnore;
import org.springframework.stereotype.Component;

import java.io.Serializable;
import java.util.ArrayList;
import java.util.List;

/**
 * CSS和Javasc共用的import domain和convertor的混合体。<p/>
 * 因为HTML的"script"和"link"标签相对简单，就用一个类解决所有问题。不分domain和convertor等等。
 * Created by Iverson on 2015/7/24.
 */
@Component
public class SchemaImport implements Serializable {

    private List<Import> headFirstImportList = null;
    private List<Import> headLastImportList = null;
    private List<Import> cssImportList = null;
    private List<Import> bodyendImportList = null;
//    public static final String DEFAULT_PARENT_PATH = "/static/";

    public void addheadFirstJsImport(String src){
        Import imp = new Import(src);
        getHeadFirstImportList().add(imp);
    }

    public void addheadLastJsImport(String src){
        Import imp = new Import(src);
        getHeadLastImportList().add(imp);
    }

    public void addbodyendJsImport(String src){
        Import imp = new Import(src);
        getBodyendImportList().add(imp);
    }

    public void addCssImport(String src){
        Import imp = new Import(src);
        getCssImportList().add(imp);
    }

    @JsonIgnore
    public String getStrHeadFirstJsImport(){
        return getStrJsImport(getHeadFirstImportList());
    }

    @JsonIgnore
    public String getStrheadLastImport(){
        StringBuilder result = new StringBuilder("");
        // 把headLastList转换为js import
        result.append(getStrJsImport(getHeadLastImportList()));
        // 把cssImportList转换为css link
        result.append(getStrCssImport(getCssImportList()));
        // 汇总js和css的导入后返回
        return result.toString();
    }

    @JsonIgnore
    public String getStrBodyendImport(){
        return getStrJsImport(getBodyendImportList());
    }

    @JsonIgnore
    public String getStrCssImport(List<Import> importList){
        StringBuilder result = new StringBuilder("");
        for(Import imp: importList){
            result.append("<link rel=\"stylesheet\" type=\"text/css\" href=\"").append(imp.getSrc()).append("\" />");
        }
        return result.toString();
    }

    @JsonIgnore
    protected String getStrJsImport(List<Import> importList){
        StringBuilder result = new StringBuilder("");
        for(Import imp:importList){
            result.append("<script src=\"").append(imp.getSrc()).append("\"></script>");
        }
        return result.toString();
    }

    public List<Import> getHeadFirstImportList() {
        if(this.headFirstImportList ==null){
            this.headFirstImportList = new ArrayList<Import>();
        }
        return headFirstImportList;
    }

    public List<Import> getCssImportList() {
        if(this.cssImportList ==null){
            this.cssImportList = new ArrayList<Import>();
        }
        return cssImportList;
    }

    public List<Import> getBodyendImportList() {
        if(this.bodyendImportList ==null){
            this.bodyendImportList = new ArrayList<Import>();
        }
        return bodyendImportList;
    }

    public List<Import> getHeadLastImportList() {
        if(this.headLastImportList ==null){
            this.headLastImportList = new ArrayList<Import>();
        }
        return headLastImportList;
    }

    private class Import{
        private String src;

        public Import(String src) {
            this.src = src;
        }

        public String getSrc() {
            return src;
        }

        public void setSrc(String src) {
            this.src = src;
        }
    }
}
