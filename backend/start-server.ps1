Set-Location "D:\Project\EdTech\Yakinlulus.id\backend"
$p = Start-Process -FilePath "D:\Project\EdTech\Yakinlulus.id\backend\yakinlulus-api.exe" -WorkingDirectory "D:\Project\EdTech\Yakinlulus.id\backend" -WindowStyle Hidden -RedirectStandardOutput "server_out.log" -RedirectStandardError "server_err.log" -PassThru
Write-Output "PID=$($p.Id)"
