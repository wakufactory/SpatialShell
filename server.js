// SPATIAL SHELL Server
//   wakufactory 2024 

const express = require('express');
const https = require('https');
const fs = require('fs');
const path = require('path');

// express server 
const app = express();
const PORT = 3000;

//ファイル監視
const chokidar = require('chokidar');

// 秘密鍵と証明書の読み込み
const options = {
		key: fs.readFileSync(path.join(__dirname, 'key.pem')),
		cert: fs.readFileSync(path.join(__dirname, 'cert.pem'))
};

// Node.js環境かバイナリ化されたpkg環境かを判定
const isPkg = typeof process.pkg !== 'undefined';

// バイナリの場所を基点に相対パスで静的ファイルのディレクトリを設定
const staticDir = isPkg
? path.join(path.dirname(process.execPath), 'html') // pkgバイナリの場合
: path.join(__dirname, 'dist/html'); // Node.jsで起動した場合

// 静的ファイルを提供
app.use(express.static(staticDir));

// REST API 外部コマンド
app.get('/api/:command', (req, res) => {
	const command = req.params.command;
	const ret = {
			command: command,
			param: req.query,
			timestamp: new Date()
	}
	console.log("api "+command) ;
	switch(command) {
		case "open":
			const path = staticDir+"/"+ req.query.path 
			// 監視するディレクトリやファイルを指定
			console.log("watch "+path)
			const watcher = chokidar.watch(path, {persistent: true});
			watcher.on('change', path => {
				console.log(`File ${path} has been changed`)
				sendToAllClients(JSON.stringify({'cmd':"update",'p':req.query}))
				console.log(watcher.getWatched()) 
			});
			
			sendToAllClients(JSON.stringify({'cmd':"open",'p':req.query}))
			break 
	}
	res.json(ret);
});





// SSE push
let clients = [];  // 接続中のクライアントを格納するリスト

// クライアントを追加する関数
const addClient = (res) => {
		clients.push(res);
		console.log(`New client connected. Total clients: ${clients.length}`);
};

// クライアントにメッセージを送信する関数
const sendToAllClients = (data) => {
		clients.forEach((client) => {
				client.write(`data: ${data}\n\n`);
		});
};

// クライアントが切断されたときに削除する関数
const removeClient = (res) => {
		clients = clients.filter(client => client !== res);
		console.log(`Client disconnected. Total clients: ${clients.length}`);
};

// SSEエンドポイント
app.get('/events', (req, res) => {
		// レスポンスヘッダーを設定
		res.setHeader('Content-Type', 'text/event-stream');
		res.setHeader('Cache-Control', 'no-cache');
		res.setHeader('Connection', 'keep-alive');
		
		// クライアントを追加
		addClient(res);

		// クライアントが切断された場合の処理
		req.on('close', () => {
				removeClient(res);
				res.end();
		});
});


// HTTPSサーバの起動
https.createServer(options, app).listen(PORT, () => {
		console.log(`HTTPS Server is running on https://localhost:${PORT}`);
});
