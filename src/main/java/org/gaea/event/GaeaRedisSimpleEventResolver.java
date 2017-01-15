package org.gaea.event;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.redis.connection.Message;
import org.springframework.data.redis.connection.MessageListener;
import org.springframework.data.redis.core.RedisTemplate;

import java.text.MessageFormat;

/**
 * <p><b style='color: red'>
 * 这个暂时不作为系统的通用分布式事件框架使用。
 * </b></p>
 * 这个是基于Redis的pub/sub为基础，做的事件机制的事件处理类、监听器。
 * <p>
 * 这个在applicationContext-cache里面配置。不用注解初始化。
 * </p>
 * <p>
 * 2017-1-9
 * <br/>
 * 这个无法当做系统的通用事件框架. 因为Redis的事件订阅, 是即发即抛, 不符合当前系统需求.
 * <br/>
 * 当然这个要用是可以用的, 测试通过.
 * <br/>
 * 分布式事件框架, 估计还得是用Kafka之类的.
 * </p>
 * Created by iverson on 2016/12/9.
 */
public class GaeaRedisSimpleEventResolver implements MessageListener {
    private final Logger logger = LoggerFactory.getLogger(GaeaRedisSimpleEventResolver.class);
    @Autowired
    private RedisTemplate redisTemplate;

    @Override
    public void onMessage(Message message, byte[] pattern) {
        byte[] body = message.getBody();//请使用valueSerializer
        byte[] channel = message.getChannel();
        //请参考配置文件，本例中key，value的序列化方式均为string。
        //其中key必须为stringSerializer。和redisTemplate.convertAndSend对应
        String itemValue = (String) redisTemplate.getValueSerializer().deserialize(body);
        String topic = (String) redisTemplate.getStringSerializer().deserialize(channel);
        logger.trace(MessageFormat.format("\n---------------------->>>>触发 redis事件\nchannel:{0}\nvalue:{1}\n---------------------->>>>\n", topic, itemValue).toString());
    }
}
