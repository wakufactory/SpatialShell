// SPATIAL SHELL Server
//  V0.1 
// wakufactory 2024 

const Express = require('express');
const Https = require('https');
const Fs = require('fs');
const Path = require('path');
const Chokidar = require('chokidar');

// express server 
const app = Express();
const PORT = 3000;

// Node.js環境かバイナリ化されたpkg環境かを判定
const isPkg = typeof process.pkg !== 'undefined';

// バイナリの場所を基点に相対パスで静的ファイルのディレクトリを設定
const staticDir = isPkg
? Path.join(Path.dirname(process.execPath), 'html/') // pkgバイナリの場合
: Path.join(__dirname, 'dist/html/'); // Node.jsで起動した場合
// appの置き場所
const appPath = "./apps/"


// ssl用秘密鍵と証明書の読み込み
const options = {
		key: Fs.readFileSync(Path.join(staticDir, '../key.pem')),
		cert: Fs.readFileSync(Path.join(staticDir, '../cert.pem'))
};

// サーバルーティング

// 静的ファイルを提供
app.use(Express.static(staticDir));

// カスタムログミドルウェア
app.use((req, res, next) => {
	console.log(`[${new Date().toISOString()}] ${req.ip} ${req.method} ${req.url}`);
	next();
});

// 追加のヘッダ
app.use((req, res, next) => {
	if (/plymodel\.js$/.test(req.path)) {  //header for plyload 
		//将来的にはconfigに追い出すのがいいかも
		res.setHeader('Cross-Origin-Embedder-Policy', 'require-corp')
		res.setHeader('Cross-Origin-Opener-Policy', 'same-origin')
	}
	next();
});

// プロセス管理
let pid = 1 
let procs = [] 

// ソースファイルの監視
const watcher = Chokidar.watch([], {persistent: true});
watcher.on('change', path => {
	console.log(`File ${path} has been changed`)
	procs.forEach(p=>{
		if(p.fpath==path) {
			// ビュアーにupdateコマンド送信
			sendToAllClients({
				'cmd':"update",'pid':p.pid,'path':path
			})			
		}
	})
});


// REST API 外部コマンド
app.get('/api/:command/:param?', (req, res) => {
	const command = req.params.command
	const param = req.params.param
	const ret = {
			command: command,
			param: param,
			stat:"ok"
	}

	console.log("api "+command) ;
	switch(command) {
		// プロセス起動
		case "open":
		case "edit":
			const app = param  
			const path = appPath + app 
			const fpath = Path.join(staticDir,path)
			if(!Fs.existsSync(fpath)) {
				console.log(`command not found ${fpath}`)
				ret.stat = "error"
				break 
			}
			if(command=="edit") {// editの場合はファイル更新を監視
				console.log("watch "+fpath)
				watcher.add(fpath)
			}
			// ビュアーにopenコマンド送信
			sendToAllClients({
					'cmd':"open",'pid':pid,'path':path,'p':req.query
				})
			ret.pid = pid 
			procs.push({
				'pid':pid++,
				'app':app,
				'fpath':fpath,
				'param':req.query 
			})
			break 
		// プロセス消去
		case "kill":
			const kpid = parseInt(param) 
			procs = procs.filter(p=>{
				if(p.pid == kpid) {
					// ビュアーにkillコマンド送信
					sendToAllClients({
						'cmd':"kill",'pid':kpid
					})	
					return false 					
				}
				return true 
			})
			break ;
		//パラメータ送信
		case "param":
			const ppid = parseInt(param) 
			procs.forEach(p=>{
				if(p.pid == ppid) {
					// ビュアーにparamコマンド送信
					sendToAllClients({
						'cmd':"param",'pid':ppid,'param':req.query
					})			
				}
			})
			break ;
		// 全プロセス消去
		case "clear":
			sendToAllClients({
				'cmd':"clear"
			})
			procs.length = 0 
			break 	
		// プロセス一覧取得
		case "procs":
			ret.procs = procs  
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
		if(typeof data != 'string') data = JSON.stringify(data) 
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
Https.createServer(options, app).listen(PORT, () => {
		console.log(`HTTPS Server is running on https://localhost:${PORT}`);
});