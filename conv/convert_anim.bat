@echo off
title SECWATCH -- Animation Converter
color 0A

echo.
echo  +==============================================+
echo  ^|   SECWATCH  --  Animation Converter         ^|
echo  ^|   Converts MP4 to Animated GIF or WebP      ^|
echo  +==============================================+
echo.

:: ── INPUT FILE ─────────────────────────────────────────
set /p INFILE= Input filename (e.g. cam7.mp4):
echo.
if not exist "%INFILE%" (
    echo  ERROR: File not found -- %INFILE%
    pause & exit /b
)

:: ── OUTPUT FORMAT ──────────────────────────────────────
echo  Output format:
echo.
echo    [1]  Animated GIF   (works everywhere, larger file)
echo    [2]  Animated WebP  (smaller, works in all modern browsers)
echo    [3]  Both
echo.
set /p FMT= Choose (1-3):
echo.

:: ── CAMERA PROFILE ─────────────────────────────────────
echo  Camera profile:
echo.
echo    [1]  Hargrove Interior  (CAM1-5)
echo    [2]  CAM6 / Event clips
echo    [3]  LKCO Exterior      (CAM7-8)
echo    [4]  CAM9 East Wall     (darkest)
echo.
set /p PROF= Choose (1-4):
echo.

:: ── OUTPUT NAME ────────────────────────────────────────
set /p OUTNAME= Output name (no extension, e.g. cam7_loop):
echo.

:: ── FILTER CHAINS PER PROFILE ──────────────────────────
:: GIF base: no noise filter (keeps file size manageable)
:: WebP full: includes noise (better compression handles it)

if "%PROF%"=="1" (
    set GIFVF=fps=10,scale=320:240,eq=brightness=-0.05:contrast=1.12:saturation=0.15,hue=s=0.22:h=93
    set WPVF=fps=12,scale=320:240,eq=brightness=-0.05:contrast=1.12:saturation=0.15,hue=s=0.22:h=93,noise=alls=13:allf=t+u
    set LABEL=Hargrove Interior
)
if "%PROF%"=="2" (
    set GIFVF=fps=10,scale=320:240,eq=brightness=-0.09:contrast=1.20:saturation=0.10,hue=s=0.22:h=93
    set WPVF=fps=12,scale=320:240,eq=brightness=-0.09:contrast=1.20:saturation=0.10,hue=s=0.22:h=93,noise=alls=20:allf=t+u
    set LABEL=CAM6 Event
)
if "%PROF%"=="3" (
    set GIFVF=fps=10,scale=320:240,eq=brightness=-0.07:contrast=1.15:saturation=0.08,hue=s=0.22:h=93
    set WPVF=fps=12,scale=320:240,eq=brightness=-0.07:contrast=1.15:saturation=0.08,hue=s=0.22:h=93,noise=alls=22:allf=t+u
    set LABEL=LKCO Exterior
)
if "%PROF%"=="4" (
    set GIFVF=fps=10,scale=320:240,eq=brightness=-0.13:contrast=1.28:saturation=0.08,hue=s=0.10:h=95
    set WPVF=fps=12,scale=320:240,eq=brightness=-0.13:contrast=1.28:saturation=0.08,hue=s=0.10:h=95,noise=alls=20:allf=t+u,curves=all='0/0 0.3/0.18 0.7/0.55 1/0.82'
    set LABEL=CAM9 East Wall
)

:: ── CONFIRM ────────────────────────────────────────────
echo  -----------------------------------------------
echo   Input   : %INFILE%
echo   Profile : %LABEL%
echo   Output  : %OUTNAME%
echo  -----------------------------------------------
echo.
set /p CONFIRM= Looks good? (Y/N):
echo.
if /i not "%CONFIRM%"=="Y" (echo  Cancelled. & pause & exit /b)

echo  Processing... (GIF two-pass takes a moment)
echo.

:: ── MAKE GIF ───────────────────────────────────────────
:: Two-pass: generate palette first, then encode
:: Better color quality than single-pass

if "%FMT%"=="2" goto SKIPGIF
    echo  Pass 1: Building palette...
    ffmpeg -i "%INFILE%" -vf "%GIFVF%,palettegen=stats_mode=full" palette_tmp.png -y -hide_banner -loglevel error
    echo  Pass 2: Encoding GIF...
    ffmpeg -i "%INFILE%" -i palette_tmp.png -filter_complex "%GIFVF%[v];[v][1:v]paletteuse=dither=bayer:bayer_scale=5" -loop 0 "%OUTNAME%.gif" -y -hide_banner -loglevel error
    if exist palette_tmp.png del palette_tmp.png
    echo  GIF complete.
    echo.
:SKIPGIF

:: ── MAKE WEBP ──────────────────────────────────────────
:: Single pass, much smaller than GIF for same quality
:: quality 72 = good balance of size vs quality

if "%FMT%"=="1" goto SKIPWEBP
    echo  Encoding WebP...
    ffmpeg -i "%INFILE%" -vf "%WPVF%" -c:v libwebp -loop 0 -lossless 0 -quality 72 -preset picture "%OUTNAME%.webp" -y -hide_banner -loglevel error
    echo  WebP complete.
    echo.
:SKIPWEBP

:: ── RESULTS ────────────────────────────────────────────
echo  -----------------------------------------------
if exist "%OUTNAME%.gif"  echo   DONE: %OUTNAME%.gif
if exist "%OUTNAME%.webp" echo   DONE: %OUTNAME%.webp
echo.
echo  Next steps:
echo    1. Drop file in /img/ folder
echo    2. In day1.html CAMS registry, add:
echo         anim:'img/%OUTNAME%.gif'  (or .webp)
echo    3. The anim field takes priority over img automatically
echo  -----------------------------------------------
echo.
pause
