package org.gaea.framework.web.method.annotation;

import org.apache.commons.collections.comparators.ComparableComparator;
import org.apache.commons.lang3.StringUtils;
import org.gaea.exception.ValidationFailedException;
import org.gaea.framework.web.bind.annotation.RequestBean;

import java.lang.annotation.Annotation;
import java.lang.reflect.Field;
import java.lang.reflect.ParameterizedType;
import java.lang.reflect.Type;
import java.text.MessageFormat;
import java.util.*;

import org.springframework.beans.BeanUtils;
import org.springframework.beans.PropertyValue;
import org.springframework.beans.PropertyValues;
import org.springframework.core.MethodParameter;
import org.springframework.stereotype.Component;
import org.springframework.web.bind.ServletRequestParameterPropertyValues;
import org.springframework.web.bind.WebDataBinder;
import org.springframework.web.bind.support.WebDataBinderFactory;
import org.springframework.web.context.request.NativeWebRequest;
import org.springframework.web.method.support.HandlerMethodArgumentResolver;
import org.springframework.web.method.support.ModelAndViewContainer;

import javax.servlet.ServletRequest;

/**
 * 自定义的Controller的参数转换类。配合@RequestBean。负责实现把页面请求属性值映射到Entity。
 * <p>
 *     可以根据属性名，把同样的值注入不同的对象。例如：user.name就是进入user对象，product.name就是product对象。
 * </p>
 * <p>
 *     cars=Ford,cars=TOYOTA... 这种多个同名的请求键值对，当成无序数组注入
 *     cars[]=Ford,cars[]=TOYOTA... 这种没有下标的，当成无序数组注入
 *     cars[0]=Ford,cars[1]=TOYOTA... 这种有下标的，当成有序数组注入，且会根据下标排序
 * </p>
 * <p>
 *     还支持List中对象的嵌套注入。
 * </p>
 * <p><b>未能实现对Map的注入。不知道为什么触发不了map类型。</b></p>
 * @author Iverson 2014-5-20 星期二
 */
@Component
public class GaeaRequestParamMethodArgumentResolver implements HandlerMethodArgumentResolver {

    protected final String SEPARATOR = ".";
    protected final String PRE_SQUARE_BRACKETS = "[";       // 表示List的命名方式。不能把这个理解成左中括号！
    protected final String SFX_SQUARE_BRACKETS = "]";       // 表示List的命名方式。不能把这个理解成右中括号！
    /* request parameter命名类型 */
    private final int ISINDEXABLE_NONE = 0;
    private final int ISINDEXABLE_EMPTY_SQUARE_BRACKETS = 1;
    private final int ISINDEXABLE_YES = 2;

    @Override
    public boolean supportsParameter(MethodParameter parameter) {
        return parameter.getParameterAnnotation(RequestBean.class) != null;
    }

    /**
     * 针对Controller的某个方法中所有注解有@RequestBean的，每个注解都会进来一次这个方法。
     * <p>手动获取、转换bean的几个关键方法：</p>
     * <p>
     * <b>webRequest.getParameterNames()</b><br/><br/>
     * 获取请求的所有参数名。例如：<br/>
     * 0 = {String@7679} "dept.id"<br/>
     * 1 = {String@7680} "dept.name"<br/>
     * 2 = {String@7681} "usr.id"<br/>
     * 3 = {String@7682} "usr.name"<br/>
     * </p>
     * <p>
     * <b>parameter.getParameterType().getDeclaredFields()</b><br/><br/>
     * 获取RequestBean注解的参数类的所有属性（field）。例如：@RequestBean("dept") Department department，即获取Department.class的所有属性。
     * </p>
     *
     * @param parameter
     * @param mavContainer
     * @param webRequest
     * @param binderFactory
     * @return
     * @throws Exception
     */
    @Override
    public Object resolveArgument(MethodParameter parameter, ModelAndViewContainer mavContainer, NativeWebRequest webRequest, WebDataBinderFactory binderFactory) throws Exception {
        String prefix = getPrefix(parameter);
        Class paramClass = parameter.getParameterType();
        // 获取RequestBean注解的参数类的所有属性（field）。例如：@RequestBean("dept") Department department，即获取Department.class的所有属性。
        Object requestBean = injectBeanValue(paramClass, parameter.getGenericParameterType(), prefix, webRequest);
        return requestBean;
    }

    // 这个是手动获取值注入的。暂时不用。但如果是涉及到对象的子对象，还是可以用的。
    private Object injectBeanValue(Class paramClass, Type genericType, String prefix, NativeWebRequest webRequest) throws ValidationFailedException {
        Object requestBean = null;
        try {
            if (Collection.class.isAssignableFrom(paramClass) || paramClass.isArray()) {
                requestBean = requestToList(paramClass, genericType, webRequest, prefix);
//            } else if (Map.class.isAssignableFrom(paramClass)) {      // 预留。写好了逻辑，无奈测试时候，对Map的注解无法触发进入。
//                requestBean = requestToMap(paramClass, genericType, webRequest, prefix);
            } else {
                requestBean = BeanUtils.instantiate(paramClass);
                WebDataBinder binder = new WebDataBinder(requestBean, prefix);      // binder应该可以共用
                // 使用Spring自己的类处理，免得自己一个个转换那么复杂。
                PropertyValues pvs = new ServletRequestParameterPropertyValues((ServletRequest) webRequest.getNativeRequest(), prefix, SEPARATOR);
                // bind后，request的值注入到bean中
                binder.bind(pvs);
            }
        } catch (Exception e) {
            throw new ValidationFailedException(MessageFormat.format("页面请求值转换为bean时出错。可能值与对应的Bean属性的类型不匹配。inject to param name: {0}",prefix).toString(), e);
        }
        return requestBean;
    }

    /**
     * 如果@RequestBean注解在List上，把请求的属性值注入List中。
     * <p>
     *     cars=Ford,cars=TOYOTA... 这种多个同名的请求键值对，当成无序数组注入
     *     cars[]=Ford,cars[]=TOYOTA... 这种没有下标的，当成无序数组注入
     * </p>
     * @param paramClass    要注入对象的类。如果该类带有泛型，例如：List<User>，这里就只会有List。
     * @param genericType   要注入对象的类，包含泛型信息。比上面的多了泛型信息。
     * @param webRequest
     * @param prefix        要注入对象的对象名，或泛型中的value。这个是用于区分页面请求的不同对象。
     * @return
     * @throws ValidationFailedException
     * @throws IllegalAccessException
     */
    private List requestToList(Class paramClass, Type genericType, NativeWebRequest webRequest, String prefix) throws ValidationFailedException, IllegalAccessException {
        Iterator<String> parameterNames = webRequest.getParameterNames();
        ServletRequest servletRequest = (ServletRequest) webRequest.getNativeRequest();
        List result = new ArrayList();
        // 获取是否有下标可循环。暂时三种可能：没有下标，有下标格式但为空([]), 有下标([0],[1])
        int indexable = isIndexable(prefix, parameterNames);
        /**
         * if 没有下标 或 下标为空
         *      都当无下标逻辑处理.但getParameterValues需要把paramName补上[]
         * else
         *      有下标的处理
         */
        if (indexable==ISINDEXABLE_EMPTY_SQUARE_BRACKETS || indexable==ISINDEXABLE_NONE) {
            // 不可排序，也不用排序，等于所有变量名都一样。直接拿前缀把值转成List即可。
            // 对于自嵌套的类，可能会多循环一次导致这里获取不到值，则会返回null。例如：folder[0].folder[0]
            String paramName = prefix;
            // 如果是空下标, paramName得加上[],例如: users[], 这样才能从request获取值.
            if (indexable==ISINDEXABLE_EMPTY_SQUARE_BRACKETS) {
                paramName = prefix+PRE_SQUARE_BRACKETS+SFX_SQUARE_BRACKETS;
            }
            String[] paramValues = webRequest.getParameterValues(paramName);
            if (paramValues != null) {
                for (String val : paramValues) {
                    result.add(val);
                }
            }
        } else {
            Class beanClass = null;
            // 这部分是处理泛型的，genericClass即List<User>中的泛型对象类型User。
            if (paramClass.isArray()) {     // 数组
                beanClass = paramClass.getComponentType();
            } else {
                // 获取泛型类
                if (genericType instanceof ParameterizedType) {
                    ParameterizedType pt = (ParameterizedType) genericType;
                    beanClass = (Class<?>) pt.getActualTypeArguments()[0];
                }
            }
            // 获取请求中的List的下标并排序。即：users[0],users[1]...等的0,1等下标。
            List<Integer> indexList = getSortedList(servletRequest, prefix);

            if (beanClass == null) {        // 非泛型List，只需按页面请求参数名的顺序组成List即可。
                for (Integer i : indexList) {
                    String paramName = prefix + PRE_SQUARE_BRACKETS + i + SFX_SQUARE_BRACKETS;
                    String[] paramValues = webRequest.getParameterValues(paramName);
                    result.add(paramValues[0]);
                }
            } else {                        // List是泛型的。需要把List元素转为对象。而且还可能存在对象内的List递归。
                for (Integer i : indexList) {
                    String paramName = prefix + PRE_SQUARE_BRACKETS + i + SFX_SQUARE_BRACKETS;
                    Object requestBean = BeanUtils.instantiate(beanClass);
                    // pvs负责把request的请求各值分解后变成值对象列表
                    ServletRequestParameterPropertyValues pvs = new ServletRequestParameterPropertyValues(servletRequest, paramName, SEPARATOR);
                    // 如果值是多重嵌套数组，需要剔除并进一步递归。否则像roles[0].name注入bean的时候会出错。
                    PropertyValue[] values = pvs.getPropertyValues();
                    for (PropertyValue v : values) {
                        // 如果属性名还有中括号，该值先剔除。
                        if (StringUtils.contains(v.getName(), PRE_SQUARE_BRACKETS)) {
                            pvs.removePropertyValue(v);
                        }
                    }
                    WebDataBinder binder = new WebDataBinder(requestBean, paramName);
                    binder.bind(pvs);
                    // 检查List<User>中，User属性是否还有List或对象的，需要进一步递归处理。
                    List<Field> unbindFields = unbindFields(beanClass);
                    for (Field field : unbindFields) {
                        field.setAccessible(true);
                        field.getGenericType();
                        // 递归调用
                        Object bean = injectBeanValue(field.getType(), field.getGenericType(), paramName + SEPARATOR + field.getName(), webRequest);
                        field.set(requestBean, bean);
                    }
                    result.add(requestBean);
                }
            }
        }
        return result;
    }

    // 预留。写好了逻辑，无奈测试时候，对Map的注解无法触发进入本类。
//    private Map requestToMap(Class paramClass, Type genericType, NativeWebRequest webRequest, String prefix) throws ValidationFailedException, IllegalAccessException {
//        Iterator<String> parameterNames = webRequest.getParameterNames();
//        ServletRequest servletRequest = (ServletRequest) webRequest.getNativeRequest();
////        List result = new ArrayList();
//        Map result = new HashMap();
////        // 获取是否有下标可循环。
////        boolean indexable = isIndexable(prefix, parameterNames);
////        if (!indexable) {
////            // 不可排序，也不用排序，等于所有变量名都一样。直接拿前缀把值转成List即可。
////            // 对于自嵌套的类，可能会多循环一次导致这里获取不到值，则会返回null。例如：folder[0].folder[0]
////            String[] paramValues = webRequest.getParameterValues(prefix);
////            if(paramValues!=null) {
////                for (String val : paramValues) {
////                    result.add(val);
////                }
////            }
////        } else {
//        Class beanClass = null;
//        // 这部分是处理泛型的，genericClass即List<User>中的泛型对象类型User。
////            if (paramClass.isArray()) {     // 数组
////                beanClass = paramClass.getComponentType();
////            } else {
//        // 获取泛型类
//        if (genericType instanceof ParameterizedType) {
//            ParameterizedType pt = (ParameterizedType) genericType;
//            beanClass = (Class<?>) pt.getActualTypeArguments()[1];
//        }
////            }
//        // 获取请求中的List的下标并排序。即：users[0],users[1]...等的0,1等下标。
////            List<Integer> indexList = getSortedList(servletRequest, prefix);
//        // 非泛型List，只需按页面请求参数名的顺序组成List即可。
//        Iterator<String> names = webRequest.getParameterNames();
//        if (beanClass == null) {
//
//            while (names.hasNext()) {
//                String name = names.next();
//                if (name.indexOf(prefix + PRE_SQUARE_BRACKETS) >= 0) {
//                    String key = StringUtils.substringBetween(name, PRE_SQUARE_BRACKETS, SFX_SQUARE_BRACKETS);
//                    result.put(key, webRequest.getParameterValues(name)[0]);
//                }
//            }
////                for (Integer i : indexList) {
////                    String paramName = prefix + PRE_SQUARE_BRACKETS + i + SFX_SQUARE_BRACKETS;
////                    String[] paramValues = webRequest.getParameterValues(paramName);
////                    result.add(paramValues[0]);
////                }
//        } else {
////                for (Integer i : indexList) {
////                    String paramName = prefix + PRE_SQUARE_BRACKETS + i + SFX_SQUARE_BRACKETS;
//            Object requestBean = BeanUtils.instantiate(beanClass);
//            while (names.hasNext()) {
//                String name = names.next();
//                if (name.indexOf(prefix + PRE_SQUARE_BRACKETS) >= 0) {
//                    String key = StringUtils.substringBetween(name, PRE_SQUARE_BRACKETS, SFX_SQUARE_BRACKETS);
//                    String mixPrefix = prefix+PRE_SQUARE_BRACKETS+key+SFX_SQUARE_BRACKETS;
//                    // pvs负责把request的请求各值分解后变成值对象列表
//                    ServletRequestParameterPropertyValues pvs = new ServletRequestParameterPropertyValues(servletRequest, mixPrefix, SEPARATOR);
//                    // 如果值是多重嵌套数组，需要剔除并进一步递归。否则像roles[0].name注入bean的时候会出错。
////                        PropertyValue[] values = pvs.getPropertyValues();
////                        for (PropertyValue v : values) {
////                            // 如果属性名还有中括号，该值先剔除。
////                            if (StringUtils.contains(v.getName(), PRE_SQUARE_BRACKETS)) {
////                                pvs.removePropertyValue(v);
////                            }
////                        }
//                    WebDataBinder binder = new WebDataBinder(requestBean, name);
//                    binder.bind(pvs);
//                    // 检查List<User>中，User属性是否还有List或对象的，需要进一步递归处理。
////                        List<Field> unbindFields = unbindFields(beanClass);
////                        for (Field field : unbindFields) {
////                            field.setAccessible(true);
////                            field.getGenericType();
////                            Object bean = injectBeanValue(field.getType(), field.getGenericType(), paramName + SEPARATOR + field.getName(), webRequest);
////                            field.set(requestBean, bean);
////                        }
//                    result.put(key, requestBean);
//                }
////                }
//            }
//        }
////        }
//        return result;
//    }

    /**
     * 获得Request中请求值的匹配的前缀。如果在Controller的注解RequestBean有值，优先按注解的值作为前缀；否则以变量名为前缀。
     *
     * @param parameter
     * @return
     */
    private String getPrefix(MethodParameter parameter) {
        String prefix = "";
        for (Annotation annotation : parameter.getParameterAnnotations()) {
            if (annotation instanceof RequestBean) {
                // ParameterName,其实是指Java传入参数的变量名。例如：xxx(@RequestBean("dept") Department department) 这个例子中，parameter.getParameterName()指的就是department，而不是dept
                String annotationValue = ((RequestBean) annotation).value();
                prefix = StringUtils.isBlank(annotationValue) ? parameter.getParameterName() : annotationValue;
                return prefix;
            }
        }
        return "";
    }

    /**
     * 判断要被转换为List的变量们，是否可排序。只要变量名有左中括号"["即因为可排序。
     * <p>
     * 依据就是：如果变量的命名方式是order[0] , order[1]这样带有中括号的（无视里面的值），就是可排序的。剩下的交给转换时处理。
     * </p>
     * <p>
     * <b>【重要】</b>
     * 这个还涉及控制类属性自嵌套问题。
     * 例如：
     * Folder类有个List<Folder> folders属性，由于我们是从类属性去反查request中是否有对应值，就会去找folders[0].folders[0]...
     * 而sortable会遍历所有request属性，如果没有对应的folders[0].folders[0]，就会终止。
     * 所以如果没有这个sortable，就会死循环一直递归下去。
     * </p>
     *
     * @param prefix
     * @param parameterNames
     * @return 暂时三种可能：没有下标，有下标格式但为空([]), 有下标([0],[1])
     */
    private int isIndexable(String prefix, Iterator<String> parameterNames) {
        String mixPrefix = prefix + PRE_SQUARE_BRACKETS;
        while (parameterNames.hasNext()) {
            String paramName = parameterNames.next();// request的parameter的name, 例如: user[0]
            /**
             * if request的参数名中, 和要注入的对象（假如users）有这种匹配：paramName contains 'users['
             *      if 虽然包含users[ 但是 users[] (即里面没有下标)
             *          那就当无序List了，返回false
             *      else 有下标
             *          返回true
             */
            if (StringUtils.contains(paramName, mixPrefix)) {
                // 获取第一个[]中间的值
                String paramIndex = StringUtils.substringBetween(paramName,PRE_SQUARE_BRACKETS,SFX_SQUARE_BRACKETS);
                if(StringUtils.isEmpty(paramIndex)){
                    return ISINDEXABLE_EMPTY_SQUARE_BRACKETS;// 空下标
                }
                return ISINDEXABLE_YES;// 有下标
            }
        }
        return ISINDEXABLE_NONE;// 没下标
    }

    /**
     * 提取请求的属性键值对中，属性名的数组下标。
     * 例如：
     * users[0].name,users[1].name,提取出List(0,1,2...)
     *
     * @param request
     * @param prefix
     * @return
     */
    private List<Integer> getSortedList(ServletRequest request, String prefix) {
        String mixPrefix = prefix + PRE_SQUARE_BRACKETS;
        Enumeration<String> paramNames = request.getParameterNames();
        Set<Integer> keySet = new HashSet<Integer>();   // 用set去掉重复的
        List<Integer> keys = new ArrayList<Integer>();
        while (paramNames != null && paramNames.hasMoreElements()) {
            String paramName = paramNames.nextElement();
            if (paramName.startsWith(mixPrefix) && StringUtils.contains(paramName, SFX_SQUARE_BRACKETS)) {
                // 去掉中括号左边所有内容。例如：user[0]，就是去掉"user["
                paramName = StringUtils.removeStart(paramName, mixPrefix);
                // 根据中括号右边拆分并获取第一段。即等价于获取了中括号中内容
                String key = StringUtils.split(paramName, SFX_SQUARE_BRACKETS)[0];
                if (StringUtils.isNumeric(key)) {
                    keySet.add(Integer.parseInt(key));
                }
            }
        }
        keys.addAll(keySet);
        // 排序
        Comparator comparator = ComparableComparator.getInstance();
        Collections.sort(keys, comparator);
        return keys;
    }

    /**
     * 把Class中，集合类型的属性，例如List、Map、数组等，找出来。这些值不能直接用WebDataBinder从request中转换提取。
     *
     * @param beanClass
     * @return
     */
    private List<Field> unbindFields(Class beanClass) {
        List<Field> result = new ArrayList<Field>();
        Field[] fields = beanClass.getDeclaredFields();
        for (Field field : fields) {
            Class fieldClass = field.getType();
            if (Collection.class.isAssignableFrom(fieldClass) || fieldClass.isArray()) {
                result.add(field);
            }
        }
        return result;
    }
}
