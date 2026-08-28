$path = 'D:\Evaluna ERP\turbo.json'
$content = Get-Content $path -Raw
$old = '"env": [' + [char]10 + '\t\t\t\t"DATABASE_URL",' + [char]10 + '\t\t\t\t"BETTER_AUTH_SECRET",' + [char]10 + '\t\t\t\t"BETTER_AUTH_URL",' + [char]10 + '\t\t\t\t"NEXT_PUBLIC_APP_URL"' + [char]10 + '\t\t\t],'
$new = '"env": [' + [char]10 + '\t\t\t\t"DATABASE_URL",' + [char]10 + '\t\t\t\t"BETTER_AUTH_SECRET",' + [char]10 + '\t\t\t\t"BETTER_AUTH_URL",' + [char]10 + '\t\t\t\t"NEXT_PUBLIC_APP_URL",' + [char]10 + '\t\t\t\t"BASE_URL",' + [char]10 + '\t\t\t\t"NODE_ENV",' + [char]10 + '\t\t\t\t"FIREBASE_PROJECT_ID",' + [char]10 + '\t\t\t\t"FIREBASE_CLIENT_EMAIL",' + [char]10 + '\t\t\t\t"FIREBASE_PRIVATE_KEY",' + [char]10 + '\t\t\t],'
$newContent = $content -replace [regex]::Escape($old), $new
Set-Content -Path $path -Value $newContent