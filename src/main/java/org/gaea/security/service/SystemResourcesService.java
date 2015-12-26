package org.gaea.security.service;

import java.util.List;

/**
 * Created by Iverson on 2015/11/22.
 */
public interface SystemResourcesService {
    public List<String> findByAuthorityCode(String authority);
}
