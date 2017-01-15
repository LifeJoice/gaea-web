package org.gaea.security.service;

import org.gaea.security.domain.Authority;

import java.util.List;

/**
 * Created by Iverson on 2015/11/22.
 */
public interface SystemAuthoritiesService {
    public List<String> findCodeList();

    void save(Authority authority);

    void saveAuthResource(Authority authority, List<String> resourceIds);
}
