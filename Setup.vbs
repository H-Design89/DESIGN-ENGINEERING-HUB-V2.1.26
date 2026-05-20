Set oWS = WScript.CreateObject("WScript.Shell")
Set fso = CreateObject("Scripting.FileSystemObject")

' Lấy đường dẫn thư mục hiện tại đang chứa file Setup
currentDir = fso.GetParentFolderName(WScript.ScriptFullName)

' Tạo lối tắt ngoài Desktop (Tên hiển thị ngoài Desktop là GT-CoilMaster)
sLinkFile = oWS.SpecialFolders("Desktop") & "\CoilMaster V1.7.26.lnk"
Set oLink = oWS.CreateShortcut(sLinkFile)

' Cấu hình đường dẫn chạy file H DESIGN.bat thay vì index.html
oLink.TargetPath = currentDir & "\H DESIGN.bat"
oLink.WorkingDirectory = currentDir
oLink.IconLocation = currentDir & "\GT-CM.ico"
oLink.Save

' Hiển thị bảng thông báo của Windows
MsgBox "Setup Complete!", vbInformation, "H-DESIGN"