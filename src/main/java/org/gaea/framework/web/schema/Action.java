package org.gaea.framework.web.schema;

import org.gaea.exception.InvalidDataException;
import org.gaea.exception.ProcessFailedException;
import org.gaea.exception.ValidationFailedException;
import org.gaea.framework.web.schema.view.action.ActionParam;

import java.util.Map;

/**
 * 定义所有Action类，例如ButtonAction的一些行为
 * Created by iverson on 2016/11/4.
 */
public interface Action<T> {
    /**
     * 获取Action对应的方法。只是和特定方法名的一种绑定。可以当成是个code。
     *
     * @return
     */
    public String getMethod();

    /**
     * Action的方法执行参数。不是指上面那个方法。
     * 当前应该由XML SCHEMA传入。
     *
     * @return
     */
    Map<String, ActionParam> getActionParamMap();

    /**
     * Action的name。对于一般的一些Action，不需要method等复杂方法和参数。就需要一个name去匹配。
     * 主要在ActionService.doSimpleAction中使用。
     *
     * @return
     */
    String getName();

    /**
     * Action对应的处理方法。
     *
     * @return
     * @param loginName
     */
    T doAction(String loginName) throws ValidationFailedException, InvalidDataException, ProcessFailedException;
}
