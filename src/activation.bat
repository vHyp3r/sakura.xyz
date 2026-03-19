Administrative Rights: You must run this script as an Administrator.
Appx/Msix Package: Have the .appx or .msixbundle file ready.
Dependencies: Ensure you have the required dependency packages (usually Microsoft.VCLibs and Microsoft.UI.Xaml) that come with the main app package, or install them via PowerShell if necessary.
Developer Mode: Enable Developer Mode in Windows 11 Settings to install custom packages. 

@echo off
:: Check for administrative permissions
net session >nul 2>&1
if %errorLevel% == 0 (
    echo Administrative permissions confirmed.
) else (
    echo.
    echo ###### ERROR: PLEASE RUN AS ADMINISTRATOR ######
    echo.
    pause
    exit /b
)

echo Installing Minecraft Windows Edition...

:: Get the directory of the batch script
set "scriptDir=%~dp0"
pushd "%scriptDir%"

:: Install the package using PowerShell
:: Replace 'Minecraft.appx' with your actual filename
powershell -Command "Add-AppxPackage -Path '.\Minecraft.appx'"

if %errorLevel% == 0 (
    echo Minecraft installed successfully.
) else (
    echo.
    echo ###### ERROR: Installation Failed ######
    echo Ensure the file name in the script matches your file.
    echo Make sure Developer Mode is enabled.
    echo.
)

popd
pause
