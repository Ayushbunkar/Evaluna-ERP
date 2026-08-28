$path = 'D:\Evaluna ERP\turbo.json'
$t = [char]9
$lines = [System.IO.File]::ReadAllLines($path)
# replace lines 6-11 inclusive (indices 6-11)
$newLines = @(
    "$($t*3)\"env\": [",
    "$($t*4)\"DATABASE_URL\",",
    "$($t*4)\"BETTER_AUTH_SECRET\",",
    "$($t*4)\"BETTER_AUTH_URL\",",
    "$($t*4)\"NEXT_PUBLIC_APP_URL\",",
    "$($t*4)\"BASE_URL\",",
    "$($t*4)\"NODE_ENV\",",
    "$($t*4)\"FIREBASE_PROJECT_ID\",",
    "$($t*4)\"FIREBASE_CLIENT_EMAIL\",",
    "$($t*4)\"FIREBASE_PRIVATE_KEY\",",
    "$($t*3)],"
)
$lines = $lines[0..5] + $newLines + $lines[12..($lines.Length-1)]
[System.IO.File]::WriteAllLines($path, $lines)