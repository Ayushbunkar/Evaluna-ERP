$path = 'D:\Evaluna ERP\apps\web\src\lib\trpc\routers\customer.ts'
$lines = [System.IO.File]::ReadAllLines($path)
$idx = 121 # zero-based index of line 122
$lines[$idx] = "`t`t`torderRef: `ORD-\`${o.id}`","
[System.IO.File]::WriteAllLines($path, $lines)