package org.gaea.workflow.demo.dayoff.repository;

import org.gaea.workflow.demo.dayoff.domain.DayoffForm;
import org.springframework.data.repository.CrudRepository;

/**
 * Created by Iverson on 2015/5/18.
 */
public interface DayoffRepository  extends CrudRepository<DayoffForm, Long> {
}
