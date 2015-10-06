package org.gaea.workflow.demo.dayoff.service;

import org.gaea.workflow.demo.dayoff.domain.DayoffForm;

/**
 * Created by Iverson on 2015/5/18.
 */
public interface DayoffService {
    String save(DayoffForm dayoffForm);

    String saveAndWFStartProcess(DayoffForm dayoffForm);

    void completeTask(DayoffForm form, Long id);
}
