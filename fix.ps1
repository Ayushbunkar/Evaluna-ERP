$path = 'D:\Evaluna ERP\apps\web\src\lib\trpc\routers\customer.ts'
$lines = Get-Content $path
$lines[182] = $lines[182].TrimEnd() + ','
Set-Content -Path $path -Value ($lines -join "`n")