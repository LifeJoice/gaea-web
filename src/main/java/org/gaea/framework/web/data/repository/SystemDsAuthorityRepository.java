package org.gaea.framework.web.data.repository;

import org.gaea.framework.web.data.authority.entity.DsAuthorityEntity;
import org.gaea.framework.web.data.domain.DataSetEntity;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.CrudRepository;

import java.util.List;

/**
 * Created by iverson on 2017/1/12.
 */
public interface SystemDsAuthorityRepository extends CrudRepository<DsAuthorityEntity, String> {
    List<DsAuthorityEntity> findByDataSetEntity(DataSetEntity dataSetEntity);

    @Query(value = "select dsAuth from DsAuthorityEntity dsAuth left join fetch dsAuth.dsAuthConditionSetEntity where dsAuth.id=?1")
    DsAuthorityEntity findWithAuthCondSets(String id);
}
