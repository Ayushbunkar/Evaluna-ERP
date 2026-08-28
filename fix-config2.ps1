$path = 'D:/Evaluna ERP/apps/web/src/app/api/trpc/[trpc]/route.ts'
$lines = Get-Content $path
# Remove lines 13 to 17 inclusive (1-indexed)
$newLines = $lines[0..11] + $lines[17..($lines.Length-1)]
Set-Content -Path $path -Value ($newLines -join "`n")