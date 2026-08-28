$path = 'D:\Evaluna ERP\apps\web\src\lib\trpc\routers\customer.ts'
$lines = [System.IO.File]::ReadAllLines($path)
$idx = 395 # zero-based index of line 396
$lines[$idx] = $lines[$idx].TrimEnd() + ','
[System.IO.File]::WriteAllLines($path, $lines)