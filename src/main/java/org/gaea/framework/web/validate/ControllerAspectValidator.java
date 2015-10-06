package org.gaea.framework.web.validate;

import com.ur.framework.exception.InvalidDataException;
import com.ur.framework.util.ValidationUtils;
import java.util.List;
import org.aspectj.lang.annotation.Aspect;
import org.aspectj.lang.annotation.Before;
import org.aspectj.lang.annotation.Pointcut;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Component;
import org.springframework.validation.BindingResult;
import org.springframework.validation.FieldError;

/**
 * 统一的针对Spring MVC的Controller层的输入参数进行校验。<p/>
 * 通过Spring AOP进行切面。所有注释了@Valid的参数，并且方法签名带有BindingResult的都会触发校验。
 * <p/>
 * DEPENDENCE: <br/>
 * <b>Hibernate Validator</b>
 *
 * @author Iverson 2014-7-9
 */
@Component
@Aspect
public class ControllerAspectValidator {

    final Logger logger = LoggerFactory.getLogger(ControllerAspectValidator.class);

    @Pointcut("execution (* iverson.test..*Controller.*(..)) || execution (* org.gaea..controller.*.*(..)) || execution (* org.gaea..*Controller.*(..))")
    public void anyMethod() {

    }

    @Before("anyMethod() && args(..,result)")
    public void before(BindingResult result) throws Throwable {
        logger.info("    BEFORE >>>> 切片校验Controller中...");
//        System.out.println("\n我\n切\n切\n切\n切");
        if (result.hasErrors()) {
            List<FieldError> errorList = result.getFieldErrors();
            StringBuilder checkErrors = new StringBuilder();
            StringBuilder alarmMsg = new StringBuilder();
            for (int i = 0; i < errorList.size(); i++) {
                FieldError errField = errorList.get(i);
                if (i == 0) {
                    alarmMsg.append(errField.getDefaultMessage());
                }
                checkErrors.append("\n")
                        .append(" [ ").append(errField.getField()).append(" ] ")
                        .append(" = '").append(errField.getDefaultMessage()).append("'");
            }
            logger.info("---------->>>>校验错误。" + checkErrors.toString());
            if (!ValidationUtils.isBlank(alarmMsg)) {
                throw new InvalidDataException(alarmMsg.toString());
            }
        }
//        System.out.println("------- BEFORE >>>切片完成！");
    }
}
