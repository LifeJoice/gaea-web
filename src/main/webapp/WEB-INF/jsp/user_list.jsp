<%-- 
    Document   : user_list
    Created on : 2014-4-10, 15:49:27
    Author     : Iverson
--%>

<%@page contentType="text/html" pageEncoding="UTF-8"%>
<%@taglib prefix="c" uri="http://java.sun.com/jsp/jstl/core" %>
<%@page import="java.util.List"%>
<%@page import="iverson.test.Users"%>
<!DOCTYPE html>
<html>
    <head>
        <meta http-equiv="Content-Type" content="text/html; charset=UTF-8">
        <title>JSP Page</title>
        <style>
            table,tr,th,td{
                border: 1px solid blue;
                border-collapse: collapse;
                text-align: center;
            }
        </style>
    </head>
    <body>
        <h2>用户列表</h2>
        <table>
            <tr>
                <th style="width: 100px">用户名</th>
                <th style="width: 300px">住址</th>
            </tr>
        <c:forEach items="${USERS}" var="user">
            <tr>
                <td>${user.name}</td>
                <td>${user.address}</td>
            </tr>
        </c:forEach>
            </table>
    </body>
</html>
