#!/bin/bash
cmd=$1 
opt=$2
shift 2
params=("$@")  # 全ての引数を配列として取得

curl_cmd=(curl -k -X POST "https://localhost:8080/api/$cmd" )
curl_cmd+=(-d "commandopt=$opt")
if [[ ${#} -ge 1 ]]; then
	# 各パラメータを --data-urlencode として追加
	for param in "${params[@]}"; do
		curl_cmd+=(-d "$param")
	done
fi

# 実行
#echo ${curl_cmd[@]}
"${curl_cmd[@]}"
