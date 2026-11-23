@echo off
setlocal EnableExtensions
title NouTube APK builder
echo ============================================================
echo  NouTube Android APK builder  (fullDebug / arm64-v8a)
echo ============================================================

rem ---------- config (edit here if paths change) ----------
set "SRC=E:\player\NouTube"
set "BUILD=E:\nt"
set "ANDROID=%BUILD%\android"
set "APK_SRC=%ANDROID%\app\build\outputs\apk\full\debug\app-full-arm64-v8a-debug.apk"
set "APK_DST=%SRC%\NouTube-interactive-subtitles-debug.apk"
set "LOG=%SRC%\build-apk.log"
set "JAVA_HOME=C:\Program Files\Android\Android Studio\jbr"
set "ANDROID_HOME=C:\Users\jerry\AppData\Local\Android\Sdk"
set "ANDROID_SDK_ROOT=%ANDROID_HOME%"
set "PATH=%JAVA_HOME%\bin;%ANDROID_HOME%\platform-tools;%PATH%"

echo [%date% %time%] === BUILD START === >> "%LOG%"

rem ---------- 0. sanity checks ----------
for %%P in ("%SRC%" "%BUILD%" "%ANDROID%\gradlew.bat" "%JAVA_HOME%\bin\java.exe" "%ANDROID_HOME%\platform-tools\adb.exe") do (
  if not exist %%~P (
    echo [ERROR] Missing path: %%~P
    goto :fail
  )
)

rem ---------- 1. locate bun ----------
set "BUN="
for %%P in ("%USERPROFILE%\.bun\bin\bun.exe") do if exist %%~P set "BUN=%%~P"
if not defined BUN for /d %%V in ("%USERPROFILE%\.workbuddy\binaries\node\versions\*") do (
  if exist "%%V\node_modules\bun\bin\bun.exe" set "BUN=%%V\node_modules\bun\bin\bun.exe"
)
if not defined BUN for /f "delims=" %%P in ('where bun.cmd 2^>nul') do (
  if not defined BUN set "BUN=%%~P"
)
if not defined BUN (
  echo [ERROR] bun.exe not found. Install bun or edit BUN in this script.
  goto :fail
)
echo [1/5] bun = %BUN%

rem ---------- 2. sync source into short-path build copy ----------
rem      E:\nt is a copy with special codegen / autolinking fixes.
rem      Never overwrite its gradle.properties (newArchEnabled=false) or build outputs.
echo [2/5] Syncing sources to %BUILD% ...
for %%D in (app assets components content lib locales modules plugins scripts states test tests desktop extension) do (
  if exist "%SRC%\%%D" robocopy "%SRC%\%%D" "%BUILD%\%%D" /E /NFL /NDL /NJH /NJS /NP /R:1 /W:1 >nul
)
for %%F in (index.js metro.config.js babel.config.js tsconfig.json tailwind.config.js app.config.ts nativewind-env.d.ts bunfig.toml package.json bun.lock .prettierrc .editorconfig eslint.config.js) do (
  if exist "%SRC%\%%F" copy /Y "%SRC%\%%F" "%BUILD%\%%F" >nul
)
robocopy "%SRC%\android" "%ANDROID%" /E /XD build .gradle .cxx /XF gradle.properties local.properties /NFL /NDL /NJH /NJS /NP /R:1 /W:1 >nul

rem ---------- 3. rebuild injected content script ----------
echo [3/5] Building assets\scripts\main.bjs ...
pushd "%SRC%"
call "%BUN%" run bundle
set "BUN_RC=%ERRORLEVEL%"
popd
if not "%BUN_RC%"=="0" (
  echo [ERROR] bun run bundle failed, code=%BUN_RC%
  goto :fail
)
copy /Y "%SRC%\assets\scripts\main.bjs" "%BUILD%\assets\scripts\main.bjs" >nul

rem ---------- 4. Gradle build with clang-stall watchdog ----------
echo [4/5] Gradle assembleFullDebug (this takes a few minutes) ...
for /f "tokens=1 delims=:" %%N in ('findstr /n /c:"@@NOU_PS_START@@" "%~f0"') do set "PSSTART=%%N"
if not defined PSSTART (
  echo [ERROR] PowerShell watchdog marker not found in this bat file.
  goto :fail
)
set "WATCHPS=%TEMP%\nou_apk_watch.ps1"
more +%PSSTART% "%~f0" > "%WATCHPS%"

set "NOU_ANDROID=%ANDROID%"
set "NOU_LOG=%LOG%"
set "NOU_OUT=%BUILD%\build_stdout.log"
set "NOU_ERR=%BUILD%\build_stderr.log"
powershell -NoProfile -ExecutionPolicy Bypass -File "%WATCHPS%"
set "BUILD_RC=%ERRORLEVEL%"
if not "%BUILD_RC%"=="0" (
  echo [ERROR] Gradle build failed, code=%BUILD_RC%
  echo         Details: %LOG%
  echo         stdout : %NOU_OUT%
  echo         stderr : %NOU_ERR%
  goto :fail
)

rem ---------- 5. deliver APK ----------
if not exist "%APK_SRC%" (
  echo [ERROR] APK not found: %APK_SRC%
  goto :fail
)
copy /Y "%APK_SRC%" "%APK_DST%" >nul
echo [5/5] DONE
for %%A in ("%APK_DST%") do echo         %%~fA  (%%~zA bytes)
echo         log: %LOG%
echo [%date% %time%] === BUILD OK: %APK_DST% === >> "%LOG%"
if /i "%~1"=="/nopause" exit /b 0
pause
exit /b 0

:fail
echo [%date% %time%] === BUILD FAILED === >> "%LOG%"
echo BUILD FAILED. See %LOG%
if /i "%~1"=="/nopause" exit /b 1
pause
exit /b 1

rem ============================================================
rem  PowerShell watchdog starts here. It is extracted by "more".
rem  It retries up to 3 times; if clang++ CPU stays unchanged for
rem  60s it kills the stuck compilers and restarts Gradle.
rem ============================================================
@@NOU_PS_START@@
$ErrorActionPreference = 'SilentlyContinue'
$env:JAVA_HOME = 'C:\Program Files\Android\Android Studio\jbr'
$env:ANDROID_HOME = 'C:\Users\jerry\AppData\Local\Android\Sdk'
$env:ANDROID_SDK_ROOT = $env:ANDROID_HOME
Set-Location -LiteralPath $env:NOU_ANDROID

function Log($msg) {
  $line = (Get-Date -Format 'HH:mm:ss') + ' ' + $msg
  Write-Output $line
  Add-Content -LiteralPath $env:NOU_LOG -Value $line
}

function ClangSig {
  $list = @(Get-Process -Name 'clang++' -ErrorAction SilentlyContinue)
  if ($list.Count -eq 0) { return '' }
  $parts = @()
  foreach ($p in $list) { $parts += ('{0}:{1:N3}' -f $p.Id, $p.CPU) }
  return ($parts -join ',')
}

function Stop-StuckBuild {
  foreach ($name in @('clang++', 'clang', 'ninja', 'cmake')) {
    Get-Process -Name $name -ErrorAction SilentlyContinue | Stop-Process -Force -ErrorAction SilentlyContinue
  }
  Get-CimInstance Win32_Process -Filter "Name = 'java.exe'" -ErrorAction SilentlyContinue |
    Where-Object { $_.CommandLine -match 'Gradle|gradle' } |
    ForEach-Object { Stop-Process -Id $_.ProcessId -Force -ErrorAction SilentlyContinue }
}

for ($try = 1; $try -le 3; $try++) {
  Log "=== TRY $try START ==="
  $out = $env:NOU_OUT
  $err = $env:NOU_ERR
  Remove-Item -LiteralPath $out, $err -Force -ErrorAction SilentlyContinue

  $gradlew = Join-Path $env:NOU_ANDROID 'gradlew.bat'
  # Start-Process cannot launch a .bat directly with redirected streams; cmd
  # must own the redirection, otherwise Gradle never starts and the log stays
  # empty while the watchdog waits forever.
  $cmdline = "/c `"`"$gradlew`" assembleFullDebug --no-daemon > `"$out`" 2> `"$err`"`""
  $proc = Start-Process -FilePath 'cmd.exe' -ArgumentList $cmdline -WorkingDirectory $env:NOU_ANDROID -PassThru -WindowStyle Hidden

  $lastSig = ''
  $stuckSamples = 0
  $lastSize = -1
  $idleSamples = 0

  while (-not $proc.HasExited) {
    Start-Sleep -Seconds 15
    $text = ''
    if (Test-Path $out) { $text = Get-Content -LiteralPath $out -Raw -ErrorAction SilentlyContinue }
    if ($text -match 'BUILD SUCCESSFUL') { Log 'BUILD SUCCESSFUL'; exit 0 }
    if ($text -match 'BUILD FAILED') { Log 'BUILD FAILED'; exit 2 }

    $sig = ClangSig
    if ($sig -ne '' -and $sig -eq $lastSig) {
      $stuckSamples++
      if ($stuckSamples -ge 4) {
        Log 'clang++ CPU unchanged for 60s: killing stuck compilers, retrying'
        Stop-StuckBuild
        break
      }
    } else {
      $stuckSamples = 0
      $lastSig = $sig
    }

    $len = 0
    if (Test-Path $out) { $len = (Get-Item -LiteralPath $out).Length }
    if ($len -eq $lastSize) { $idleSamples++ } else { $idleSamples = 0; $lastSize = $len }
    if ($idleSamples -ge 60 -and $sig -eq '') {
      Log 'no build output for 900s: killing stuck build, retrying'
      Stop-StuckBuild
      break
    }
  }

  if (-not $proc.HasExited) { Stop-Process -Id $proc.Id -Force -ErrorAction SilentlyContinue }
  Start-Sleep -Seconds 2
  $text = ''
  if (Test-Path $out) { $text = Get-Content -LiteralPath $out -Raw -ErrorAction SilentlyContinue }
  if ($text -match 'BUILD SUCCESSFUL') { Log 'BUILD SUCCESSFUL'; exit 0 }
  if ($text -match 'BUILD FAILED') { Log 'BUILD FAILED'; exit 2 }
  Log "TRY $try ended, retrying"
}

Log 'ALL TRIES FAILED'
exit 4
