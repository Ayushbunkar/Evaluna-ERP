$path = 'D:\Evaluna ERP\turbo.json'
$lines = [System.IO.File]::ReadAllLines($path)
# lines are 0-indexed
# replace lines 6-11 inclusive (indices 6,7,8,9,10,11)
$newLines = @(
    "`t`t`t\"env\": [",
    "`t`t`t`t\"DATABASE_URL\",",
    "`t`t`t`t\"BETTER_AUTH_SECRET\",",
    "`t`t`t`t\"BETTER_AUTH_URL\",",
    "`t`t`t`t\"NEXT_PUBLIC_APP_URL\",",
    "`t`t`t`t\"BASE_URL\",",
    "`t`t`t`t\"NODE_ENV\",",
    "`t`t`t`t\"FIREBASE_PROJECT_ID\",",
    "`t`t`t`t\"FIREBASE_CLIENT_EMAIL\",",
    "`t`t`t`t\"FIREBASE_PRIVATE_KEY\",",
    "`t`t`t],"
)
$lines = $lines[0..5] + $newLines + $lines[12..($lines.Length-1)]
[System.IO.File]::WriteAllLines($path, $lines)