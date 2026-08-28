$path = 'D:\Evaluna ERP\apps\web\src\app\api\trpc\[trpc]\route.ts'
$lines = [System.IO.File]::ReadAllLines($path)
# Remove lines 13 to 17 inclusive (1-indexed)
# zero-based indices: start = 12, end = 16
$newLines = $lines[0..11] + $lines[17..($lines.Length-1)]
[System.IO.File]::WriteAllLines($path, $newLines)