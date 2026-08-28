$path = 'D:/Evaluna ERP/apps/web/src/app/api/trpc/[trpc]/route.ts'
$content = Get-Content $path -Raw
# Remove the export const config block
$old = "`nexport const config = `{n  api: `{n    bodyParser: false,n  },n};n"
$new = "`n"
$newContent = $content -replace [regex]::Escape($old), $new
Set-Content -Path $path -Value $newContent