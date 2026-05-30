$js = Get-Content .\docs\assets\index-KvOBfLJp.js -Raw
$css = Get-Content .\docs\assets\index-Cj8s34Vd.css -Raw
$indexContent = @"
<!doctype html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>Sol RNG - Quantum Horizons</title>
    <base href="./" />
    <style>
$css
    </style>
  </head>
  <body>
    <div id="root"></div>
    <script type="module">
$js
    </script>
  </body>
</html>
"@
Set-Content .\index.html $indexContent -NoNewline
Set-Content .\docs\index.html $indexContent -NoNewline
Write-Host "Updated index.html and docs/index.html with inlined bundle."