@echo off
setlocal

set DIRNAME=%~dp0
if "%DIRNAME%"=="" set DIRNAME=.

set MAVEN_WRAPPER_JAR=%DIRNAME%.mvn\wrapper\maven-wrapper.jar
set MAVEN_WRAPPER_PROPS=%DIRNAME%.mvn\wrapper\maven-wrapper.properties

for /F "usebackq tokens=1,2 delims==" %%A in ("%MAVEN_WRAPPER_PROPS%") do (
  if "%%A"=="distributionUrl" set DISTRIBUTION_URL=%%B
)

if not exist "%MAVEN_WRAPPER_JAR%" (
  echo Downloading Maven Wrapper...
  powershell -Command ^
    "$webclient = New-Object System.Net.WebClient;" ^
    "$webclient.DownloadFile('https://repo.maven.apache.org/maven2/io/takari/maven-wrapper/0.5.6/maven-wrapper-0.5.6.jar','%MAVEN_WRAPPER_JAR%')"
  echo Done.
)

set JAVA_EXE=java.exe
if not "%JAVA_HOME%"=="" set JAVA_EXE=%JAVA_HOME%\bin\java.exe

"%JAVA_EXE%" -cp "%MAVEN_WRAPPER_JAR%" "-Dmaven.multiModuleProjectDirectory=%DIRNAME%" org.apache.maven.wrapper.MavenWrapperMain %*
