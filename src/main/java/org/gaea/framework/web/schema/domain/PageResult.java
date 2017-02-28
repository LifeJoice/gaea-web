package org.gaea.framework.web.schema.domain;

import org.gaea.framework.web.schema.domain.view.SchemaGrid;

import java.util.List;

/**
 * 分页结果信息。参考Spring Data的Page。
 * Created by Iverson on 2015/10/15.
 */
public class PageResult<T> {
    private int totalPages;
    private long totalElements;
    private int page = 1;
    private int size = SchemaGrid.DEFAULT_PAGE_SIZE;
    private List<T> content;

    public int getTotalPages() {
        return totalPages;
    }

    public void setTotalPages(int totalPages) {
        this.totalPages = totalPages;
    }

    public long getTotalElements() {
        return totalElements;
    }

    public void setTotalElements(long totalElements) {
        this.totalElements = totalElements;
    }

    public int getPage() {
        return page;
    }

    public void setPage(int page) {
        this.page = page;
    }

    public int getSize() {
        return size;
    }

    public void setSize(int size) {
        this.size = size;
    }

    public List<T> getContent() {
        return content;
    }

    public void setContent(List<T> content) {
        this.content = content;
    }
}
