param (
    [string]$cmd,           # 第一引数: コマンド名
    [string]$commandopt    # 第二引数: 単一の値
)


# POST先URL
$endpoint = "https://localhost:8080/api/$cmd"

# フォームデータを構築
$formData = @{
    "commandopt" = $commandopt  # 第二引数を"commandopt"として追加
}

# 第3引数以降を key=value 形式で処理
foreach ($arg in $args) {
    if ($arg -match "^([^=]+)=(.+)$") {
        $key = $matches[1]
        $value = $matches[2]
        # keyとvalueをフォームデータに追加
        $formData[$key] = $value
    } else {
        Write-Host "Invalid argument format: $arg" -ForegroundColor Red
        exit 1
    }
}

# フォームデータをURLエンコードしてcurl用の文字列を作成
$formDataString = ($formData.GetEnumerator() | ForEach-Object { 
    "$($_.Key)=$([uri]::EscapeDataString($_.Value))" 
}) -join "&"

# curl.exeコマンドを使用してPOSTリクエストを送信
$curlCommand = "curl.exe -k -X POST `"$endpoint`" -H `"Content-Type: application/x-www-form-urlencoded`" -d `"$formDataString`""

# 実行するcurlコマンドを表示（デバッグ用）
#Write-Host "Executing curl command: $curlCommand"

# curlコマンドを実行
Invoke-Expression $curlCommand


