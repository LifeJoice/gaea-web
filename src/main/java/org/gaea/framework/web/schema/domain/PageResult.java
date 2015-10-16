package org.gaea.framework.web.schema.domain;

import java.util.List;

/**
 * 分页结果信息。参考Spring Data的Page。
 * Created by Iverson on 2015/10/15.
 */
public class PageResult<T> {
    private int totalPages;
    private long totalElements;
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

    public List<T> getContent() {
        return content;
    }

    public void setContent(List<T> content) {
        this.content = content;
    }
}
