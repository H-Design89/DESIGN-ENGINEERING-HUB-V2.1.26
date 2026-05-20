$content = Get-Content -Path "app.backup.js" -Encoding UTF8
$security = $content[0..141] + $content[1664..($content.Length-1)]
Set-Content -Path "security.js" -Value $security -Encoding UTF8
$admin = $content[1123..1453]
Set-Content -Path "admin.js" -Value $admin -Encoding UTF8
$history = $content[1454..1663]
Set-Content -Path "history.js" -Value $history -Encoding UTF8
$calculations = $content[240..286] + $content[518..1122]
Set-Content -Path "calculations.js" -Value $calculations -Encoding UTF8
$app = $content[142..239] + $content[287..517]
Set-Content -Path "app.js" -Value $app -Encoding UTF8
