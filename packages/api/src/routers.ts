 = Get-ChildItem .\packages\api\src -Filter *.ts | Where-Object {.Name -ne "index.ts"}
 = foreach( in ) {
     = .BaseName
    "export { Router } from './';"
}
 -join "
"
