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
const appPath = "/apps/"


// ssl用秘密鍵と証明書の読み込み
const options = {
		key: Fs.readFileSync(Path.join(staticDir, '../key.pem')),
		cert: Fs.readFileSync(Path.join(staticDir, '../cert.pem'))
};

// サーバルーティング

// カスタムログミドルウェア
app.use((req, res, next) => {
	console.log(`[${new Date().toISOString()}] ${req.ip} ${req.method} ${req.url}`);
	next();
});

// 追加のヘッダ
app.use((req, res, next) => {
	if (/\.js$/.test(req.path)) {  //header for plyload 
		//将来的にはconfigに追い出すのがいいかも
		res.setHeader('Cross-Origin-Embedder-Policy', 'require-corp')
		res.setHeader('Cross-Origin-Opener-Policy', 'same-origin')
	}
	next();
});

// 静的ファイルを提供
app.use(Express.static(staticDir));

// プロセス管理
let pid = 1 	//プロセスid(連番)
let procs = [] //プロセスリスト

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
app.get('/api/:command', (req, res) => {
	const command = req.params.command
	const param = req.query.commandopt
	req.query.commandopt = undefined  
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
				console.log(`app not found ${fpath}`)
				ret.stat = "cannot open app error"
				res.json(ret);
				break 
			}
			if(command=="edit") {// editの場合はファイル更新を監視
				console.log("watch "+fpath)
				watcher.add(fpath)
			}
			// workspaceにopenコマンド送信
			sendToAllClients({
					'cmd':"open",'pid':pid,'path':path,'param':req.query
				})
			ret.pid = pid 
			//プロセスリストに追加
			procs.push({
				'pid':pid++,
				'app':app,
				'path':path,
				'fpath':fpath,
				'param':req.query 
			})
			res.json(ret);
			break 
		// プロセス消去
		case "kill":
			const kpid = parseInt(param) 
			procs = procs.filter(p=>{
				if(p.pid == kpid) {
					// workspaceにkillコマンド送信
					sendToAllClients({
						'cmd':"kill",'pid':kpid
					})	
					return false 
				}
				return true 
			})
			res.json(ret);
			break ;
		//パラメータ送信
		case "param":
			const ppid = parseInt(param) 
			procs.forEach(p=>{
				if(p.pid == ppid) {
					for(k in req.query) p.param[k] = req.query[k]
					// workspaceにparamコマンド送信
					sendToAllClients({
						'cmd':"param",'pid':ppid,'param':req.query
					})			
				}
			})
			res.json(ret);
			break ;
		// 環境設定
		case "env":
			sendToAllClients({
				'cmd':"env",'param':req.query 
			})		
			break ;
		// 全プロセス消去
		case "clear":
			sendToAllClients({
				'cmd':"clear"
			})
			procs.length = 0 
			res.json(ret);
			break 	
		// プロセス一覧取得
		case "procs":
			ret.procs = procs
			if(param=="pp") res.send(JSON.stringify(procs,null,2)) ;
			else res.json(ret) 
			break 
			
		default:
			ret.stat = "ng no command" 
			res.json(ret) 
	}

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
const server = Https.createServer(options, app).listen(PORT, () => {

		console.log(`SPATIAL SHELL Server is running on https://localhost:${PORT}`);
});
