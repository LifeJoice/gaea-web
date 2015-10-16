package org.gaea.framework.web.schema.domain;

/**
 * 针对XML Schema Grid的分页对象。也可用于一般的分页。实现Pageable是为了和Spring Data的分页兼容。
 * Created by Iverson on 2015/10/13.
 */
public class SchemaGridPage {

    public SchemaGridPage() {
    }

    public SchemaGridPage(int page, int size) {
        this.size = size;
        this.page = page;
    }

    private int size = 20;          // 默认一页20条
    private int page = 1;           // 默认第一页。从1开始。
    private int rowCount = 85;
    private int pageCount = 0;

    public int getSize() {
        return size;
    }

    public void setSize(int size) {
        this.size = size;
    }

    public int getPage() {
        return page;
    }

    public void setPage(int page) {
        this.page = page;
    }

    public int getRowCount() {
        return rowCount;
    }

    public void setRowCount(int rowCount) {
        this.rowCount = rowCount;
    }

    public int getPageCount() {
        return pageCount;
    }

    public void setPageCount(int pageCount) {
        this.pageCount = pageCount;
    }
}
