package org.gaea.security.service;

import org.gaea.exception.ProcessFailedException;
import org.gaea.exception.ValidationFailedException;
import org.gaea.security.domain.Authority;

import java.io.IOException;
import java.util.List;

/**
 * Created by Iverson on 2015/11/22.
 */
public interface SystemAuthoritiesService {
    public List<String> findCodeList();

    void save(Authority authority);

    void update(Authority authority) throws ValidationFailedException;

    void saveAuthResource(Authority authority, List<String> resourceIds) throws ValidationFailedException;

    String loadEditData(String id) throws ProcessFailedException, IOException;
}
