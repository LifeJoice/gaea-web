package org.gaea.security.service;

import org.springframework.security.access.event.AuthorizedEvent;
import org.springframework.security.authentication.event.AuthenticationSuccessEvent;
import org.springframework.transaction.annotation.Transactional;

/**
 * Created by iverson on 2017/1/9.
 */
public interface SystemLoginService {
    @Transactional(readOnly = true)
    void resolveLoginEvent(AuthenticationSuccessEvent authenticationSuccessEvent);

    void resolveLoginEvent(AuthorizedEvent authorizedEvent);
}
