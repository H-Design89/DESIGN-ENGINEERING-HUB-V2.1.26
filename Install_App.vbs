' Tự động lấy thư mục hiện tại của file chạy
Set objFSO = CreateObject("Scripting.FileSystemObject")
Set objShell = CreateObject("WScript.Shell")

currentDir = objFSO.GetParentFolderName(WScript.ScriptFullName)

' Cấu hình ứng dụng
appName = "DESIGN HUB"
appUrl = "https://h-design89.github.io/DESIGN-ENGINEERING-HUB-V2.1.26/"
iconFileName = "GT-CM.ico"

' Tạo thư mục an toàn trong C:\Users\Public
publicPath = objShell.ExpandEnvironmentStrings("%PUBLIC%")
safeFolder = publicPath & "\" & appName

If Not objFSO.FolderExists(safeFolder) Then
    objFSO.CreateFolder(safeFolder)
End If

' Copy file icon vào thư mục an toàn
iconSource = currentDir & "\" & iconFileName
iconDest = safeFolder & "\" & iconFileName

If objFSO.FileExists(iconSource) Then
    objFSO.CopyFile iconSource, iconDest, True
Else
    MsgBox "Không tìm thấy file icon (" & iconFileName & ") trong thư mục cài đặt! Lối tắt vẫn sẽ được tạo nhưng sẽ thiếu icon.", 48, "Cảnh báo Icon"
End If

' Lấy đường dẫn ra màn hình Desktop
desktopPath = objShell.SpecialFolders("Desktop")
shortcutPath = desktopPath & "\" & appName & ".lnk"

' Tìm đường dẫn trình duyệt (ưu tiên Chrome, sau đó Edge)
browserPath = "C:\Program Files\Google\Chrome\Application\chrome.exe"
If Not objFSO.FileExists(browserPath) Then
    browserPath = "C:\Program Files (x86)\Google\Chrome\Application\chrome.exe"
End If

If Not objFSO.FileExists(browserPath) Then
    browserPath = "C:\Program Files (x86)\Microsoft\Edge\Application\msedge.exe"
End If

' Tạo Shortcut
Set objShortcut = objShell.CreateShortcut(shortcutPath)
objShortcut.TargetPath = browserPath
objShortcut.Arguments = "--app=""" & appUrl & """"
objShortcut.WindowStyle = 1

' Gán icon nếu đã copy thành công
If objFSO.FileExists(iconDest) Then
    objShortcut.IconLocation = iconDest
End If

objShortcut.Save

' Hiển thị thông báo thành công
MsgBox "Completed", 64, "Completed"
