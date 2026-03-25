@echo off
title SECWATCH -- Video Converter
color 0A

echo.
echo  +==============================================+
echo  ^|   S E C W A T C H   v2.11b                 ^|
echo  ^|   Video Processing Utility                  ^|
echo  +==============================================+
echo.

:: ── GET INPUT FILE ─────────────────────────────────────
set /p INFILE= Enter filename (with extension, e.g. cam7.mp4):
echo.

if not exist "%INFILE%" (
    echo  ERROR: File not found -- %INFILE%
    echo  Make sure the file is in the same folder as this batch file.
    echo.
    pause
    exit /b
)

:: ── GET CAMERA TYPE ────────────────────────────────────
echo  Select camera type:
echo.
echo    [1]  Hargrove Interior  (CAM1-5)
echo    [2]  CAM6 Floor 3 / Event clip
echo    [3]  LKCO Exterior      (CAM7-8)
echo    [4]  CAM9 East Wall     (darkest)
echo    [5]  CAM9 Event clip    (darkest + signal loss ready)
echo.
set /p CAMTYPE= Enter number (1-5):
echo.

:: ── GET OUTPUT NAME ────────────────────────────────────
set /p OUTFILE= Enter output filename (without extension, e.g. cam7_trailer_loop):
echo.

:: ── CONFIRM ────────────────────────────────────────────
echo  -----------------------------------------------
echo   Input   : %INFILE%
echo   Output  : %OUTFILE%.webm
echo  -----------------------------------------------
echo.
set /p CONFIRM= Looks good? (Y/N):
echo.
if /i not "%CONFIRM%"=="Y" (
    echo  Cancelled.
    pause
    exit /b
)

echo  Processing... (this may take a minute)
echo.

:: ── RUN FFMPEG ─────────────────────────────────────────
:: Note: encoder is libvpx-vp9  (not libvp9)

if "%CAMTYPE%"=="1" ffmpeg -i "%INFILE%" -vf "scale=320:240,eq=brightness=-0.05:contrast=1.12:saturation=0.15,hue=s=0.22:h=93,noise=alls=13:allf=t+u" -c:v libvpx-vp9 -b:v 155k -an "%OUTFILE%.webm"

if "%CAMTYPE%"=="2" ffmpeg -i "%INFILE%" -vf "scale=320:240,eq=brightness=-0.09:contrast=1.20:saturation=0.10,hue=s=0.22:h=93,noise=alls=20:allf=t+u" -c:v libvpx-vp9 -b:v 120k -an "%OUTFILE%.webm"

if "%CAMTYPE%"=="3" ffmpeg -i "%INFILE%" -vf "scale=320:240,eq=brightness=-0.07:contrast=1.15:saturation=0.08,hue=s=0.22:h=93,noise=alls=22:allf=t+u" -c:v libvpx-vp9 -b:v 130k -an "%OUTFILE%.webm"

if "%CAMTYPE%"=="4" ffmpeg -i "%INFILE%" -vf "scale=320:240,eq=brightness=-0.13:contrast=1.28:saturation=0.08,hue=s=0.10:h=95,noise=alls=20:allf=t+u,curves=all='0/0 0.3/0.18 0.7/0.55 1/0.82'" -c:v libvpx-vp9 -b:v 90k -an "%OUTFILE%.webm"

if "%CAMTYPE%"=="5" ffmpeg -i "%INFILE%" -vf "scale=320:240,eq=brightness=-0.13:contrast=1.28:saturation=0.08,hue=s=0.10:h=95,noise=alls=20:allf=t+u,curves=all='0/0 0.3/0.18 0.7/0.55 1/0.82'" -c:v libvpx-vp9 -b:v 90k -an "%OUTFILE%.webm"

:: ── RESULT ─────────────────────────────────────────────
echo.
if exist "%OUTFILE%.webm" (
    echo  +==============================================+
    echo  ^|   DONE  --  %OUTFILE%.webm
    echo  ^|   Drop it in /img/ and uncomment the       ^|
    echo  ^|   vid: line in secwatch.html                ^|
    echo  +==============================================+
) else (
    echo  ERROR: Something went wrong. Check the output above.
)

echo.
pause
