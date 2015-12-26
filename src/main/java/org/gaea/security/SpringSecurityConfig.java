package org.gaea.security;

import org.gaea.security.extend.GaeaAccessDecisionManager;
import org.gaea.security.extend.GaeaFilterInvocationSecurityMetadataSource;
import org.gaea.security.extend.GaeaFilterSecurityInterceptor;
import org.gaea.security.extend.GaeaUserDetailsService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.security.access.AccessDecisionManager;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.config.annotation.authentication.builders.AuthenticationManagerBuilder;
import org.springframework.security.config.annotation.method.configuration.EnableGlobalMethodSecurity;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.annotation.web.configuration.EnableWebSecurity;
import org.springframework.security.config.annotation.web.configuration.WebSecurityConfigurerAdapter;
import org.springframework.security.web.access.intercept.FilterSecurityInterceptor;

/**
 * Spring Security的配置。（对应以前传统的XML配置）
 * Created by Iverson on 2015/10/29.
 */
//@Configuration
//@EnableWebSecurity
//@EnableGlobalMethodSecurity(prePostEnabled=true, jsr250Enabled=true)
public class SpringSecurityConfig extends WebSecurityConfigurerAdapter {

    private final String[] PERMIT_ALL_RESOURCES  = new String[]{"/js/thirdparty/jquery/jquery.js", "/resources/images/system/*.jpg","/login"};
    private AuthenticationManager authenticationManager;

    @Autowired
    public void configureGlobal(AuthenticationManagerBuilder auth) throws Exception {
        auth
                .inMemoryAuthentication()
                .withUser("iverson").password("123456").roles("USER");
    }

    @Override
    protected void configure(HttpSecurity http) throws Exception {
        http.addFilterBefore(gaeaFilterSecurityInterceptor(), FilterSecurityInterceptor.class);
        http
                .userDetailsService(userDetailsService())
                .authorizeRequests().accessDecisionManager(accessDecisionManager())
                .antMatchers(PERMIT_ALL_RESOURCES).permitAll()
//                .anyRequest().hasRole("USER")
                .and()
                .formLogin()
                .loginPage("/login")
                .usernameParameter("username").passwordParameter("password")
//                .defaultSuccessUrl("/system/main.html")
                .permitAll()
                .and()
                .logout()
                .permitAll();
    }

    @Bean
    public GaeaFilterSecurityInterceptor gaeaFilterSecurityInterceptor() {
        GaeaFilterSecurityInterceptor gaeaFilterSecurityInterceptor = new GaeaFilterSecurityInterceptor();
        gaeaFilterSecurityInterceptor.setAuthenticationManager(authenticationManager);
        gaeaFilterSecurityInterceptor.setAccessDecisionManager(accessDecisionManager());
        gaeaFilterSecurityInterceptor.setSecurityMetadataSource(gaeaFilterInvocationSecurityMetadataSource());
        return gaeaFilterSecurityInterceptor;
    }

    @Autowired
    public void configAuthentication(AuthenticationManagerBuilder auth) throws Exception {
//        auth
    }

    @Bean
    public GaeaFilterInvocationSecurityMetadataSource gaeaFilterInvocationSecurityMetadataSource() {
        GaeaFilterInvocationSecurityMetadataSource gaeaFilterInvocationSecurityMetadataSource = new GaeaFilterInvocationSecurityMetadataSource();
        return gaeaFilterInvocationSecurityMetadataSource;
    }

    @Bean
    public GaeaUserDetailsService userDetailsService() {
        GaeaUserDetailsService userDetailsService = new GaeaUserDetailsService();
        return userDetailsService;
    }

    @Bean
    public AccessDecisionManager accessDecisionManager() {
//        List<AccessDecisionVoter> decisionVoters = new ArrayList<AccessDecisionVoter>();
//        decisionVoters.add(new RoleVoter());
//        decisionVoters.add(new AuthenticatedVoter());
//        decisionVoters.add(webExpressionVoter());// 启用表达式投票器

        GaeaAccessDecisionManager accessDecisionManager = new GaeaAccessDecisionManager();
        return accessDecisionManager;
    }

//    @Bean
//    public MessageService messageService() {
//        return new HelloWorldMessageService();
//    }
}
