package org.gaea.security.service;

import org.gaea.exception.ProcessFailedException;
import org.gaea.exception.ValidationFailedException;
import org.gaea.security.domain.Resource;

import java.io.IOException;
import java.util.List;

/**
 * Created by Iverson on 2015/11/22.
 */
public interface SystemResourcesService {
    public List<String> findByAuthorityCode(String authority);

    void save(Resource resource) throws ValidationFailedException;

    void update(Resource newResource) throws ValidationFailedException;

    String loadEditData(String id) throws ProcessFailedException, IOException;
}
