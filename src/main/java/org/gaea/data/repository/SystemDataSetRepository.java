package org.gaea.data.repository;

import org.gaea.data.domain.DataSet;
import org.springframework.data.repository.CrudRepository;

/**
 * Created by iverson on 2016/5/20.
 */
public interface SystemDataSetRepository extends CrudRepository<DataSet,String> {
}
