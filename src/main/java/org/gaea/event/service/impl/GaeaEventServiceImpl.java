package org.gaea.event.service.impl;

import org.gaea.event.CommonEventDefinition;
import org.gaea.event.GaeaEvent;
import org.gaea.event.GaeaSimpleEvent;
import org.gaea.event.service.GaeaEventService;
import org.gaea.framework.web.data.service.SystemDataSetService;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

/**
 * Gaea事件处理的服务类。
 * Created by iverson on 2017/1/9.
 */
@Service
public class GaeaEventServiceImpl implements GaeaEventService {
    private final Logger logger = LoggerFactory.getLogger(GaeaEventServiceImpl.class);
    @Autowired
    private SystemDataSetService systemDataSetService;

    /**
     * 所有事件的处理入口
     *
     * @param gaeaEvent
     */
    @Override
    public void resolve(GaeaEvent gaeaEvent) {
        if (gaeaEvent instanceof GaeaSimpleEvent) {
            GaeaSimpleEvent event = (GaeaSimpleEvent) gaeaEvent;
            logger.trace("---------------------->>>>\n触发事件:{}\n---------------------->>>>\n", event.getEventCode());
            if (CommonEventDefinition.EVENT_CODE_XML_DATASET_LOAD_FINISHED.equalsIgnoreCase(event.getEventCode())) {
                /**
                 * 解析XML数据集完成事件
                 *
                 * 初始化数据集系统。
                 */
                systemDataSetService.initDataSetSystem();
            }
        }
    }
}
