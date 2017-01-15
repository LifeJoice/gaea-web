package org.gaea.security.service;

import org.springframework.security.access.event.AuthorizedEvent;

/**
 * Created by iverson on 2017/1/9.
 */
public interface SystemLoginService {
    void resolveLoginEvent(AuthorizedEvent authorizedEvent);
}
