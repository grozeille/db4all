package fr.grozeille.db4all2.utils;

import lombok.Data;

import java.util.List;

@Data
public class PageResult<T> {

    private List<T> content;

    private boolean first;
    private boolean last;

    private Long totalElements;
    private Integer totalPages;
}
