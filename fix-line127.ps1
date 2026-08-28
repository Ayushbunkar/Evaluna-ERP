$path = 'D:\Evaluna ERP\apps\web\src\lib\trpc\routers\customer.ts'
$lines = [System.IO.File]::ReadAllLines($path)
$idx = 126 # zero-based index of line 127
$lines[$idx] = "`t`t`t});"
[System.IO.File]::WriteAllLines($path, $lines)