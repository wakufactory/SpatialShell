// SPATIAL SHELL Server
//  V1.0
// wakufactory 2024 

const Express = require('express');
const Https = require('https');
const Http = require('http');
const Fs = require('fs');
const Path = require('path');
const Chokidar = require('chokidar');

// express server 
const app = Express();
const PORT = 8080;

// Node.js環境かバイナリ化されたpkg環境かを判定
const isPkg = typeof process.pkg !== 'undefined';

// バイナリの場所を基点に相対パスで静的ファイルのディレクトリを設定
const staticDir = isPkg
? Path.join(Path.dirname(process.execPath), 'html/') // pkgバイナリの場合
: Path.join(__dirname, 'dist/html/'); // Node.jsで起動した場合
// appの置き場所
const appPath = "/apps/"
const getfpath = (path)=> {
	return Path.join(staticDir,path) 
}

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
	if (/\.(ply|js|html)$/.test(req.path)) {  //header for plyload 
		//将来的にはconfigに追い出すのがいいかも
		res.setHeader('Cross-Origin-Embedder-Policy', 'require-corp')
		res.setHeader('Cross-Origin-Opener-Policy', 'same-origin')
	}
	next();
});

// 静的ファイルを提供
app.use(Express.static(staticDir));

// 環境状態 
let env = {
	bg:{kind:"default"},
	light:{default:true}
}
// プロセス管理
let pid = 1 	//プロセスid(連番)
let procs = [] //プロセスリスト

// ソースファイルの監視
const watcher = Chokidar.watch([], {persistent: true});
const watchfile = {} 
watcher.on('change', path => {
	console.log(`File ${path} has been changed`)
	procs.forEach(p=>{
		if(getfpath(p.path)==path) {
			// ビュアーにupdateコマンド送信
			sendToAllClients({
				'cmd':"update",'pid':p.pid,'path':p.path
			})			
		}
	})
});
const watchadd = (path)=> {
	if(watchfile[path]==undefined) watchfile[path] = 1
	else watchfile[path]++ ;
	watcher.add(path)
	console.log(watchfile) 
}
const watchrm = (path)=> {
	if(watchfile[path]==undefined) return 
	if(--watchfile[path]==0) {
		delete watchfile[path] 
		watcher.unwatch(path)
	}
	console.log(watchfile) 
}

// URLエンコードされたデータを解析するミドルウェア
app.use(Express.urlencoded({ extended: true })); // これで req.body にデータが格納される

// REST API 外部コマンド
// GET 
app.get('/api/:command', (req, res) => {
	const command = req.params.command
	const param = req.query.commandopt
	req.body.commandopt = undefined 
	const aparam = req.query  
	const ret = {
			command: command,
			param: param,
			stat:"ok"
	}
	console.log("api get "+command) ;
	switch(command) {
		// プロセス一覧取得
		case "procs":
			ret.procs = procs
			res.json(ret) 
			break 
		// 環境設定取得
		case "getenv":
			ret.env = env
			res.json(ret) 
			break
		// 状態全部取得
		case "getstat":
			ret.stat = {'env':env,'procs':procs}
			res.json(ret) 
			break 	
		default:
			ret.stat = "ng no command" 
			res.json(ret) 
	}
})
// POST 
app.post('/api/:command', (req, res) => {
	const command = req.params.command
	const commandopt = req.body.commandopt
	delete req.body.commandopt
	const aparam = req.body  
	const ret = {
			command: command,
			commandopt: commandopt,
			stat:"ok"
	}

//	console.log("api post "+command) ;
	switch(command) {
		// プロセス起動
		case "open":
		case "edit":
			let app = commandopt 
			let path = appPath + app 
			let fpath = getfpath(path) 
			if(!Fs.existsSync(fpath) ) {
				if(Fs.existsSync(fpath+".js")) {
					path = path + ".js" 
					fpath = fpath + ".js" 				
				} else {
					console.log(`app not found ${fpath}`)
					ret.stat = "cannot open app error"
					res.json(ret);
					break 	
				}		
			}
			const stats = Fs.statSync(fpath);
			if (stats.isDirectory()) {	//ディレクトリならindex.jsを開く
				path = path + "/index.js"
				fpath = fpath + "/index.js"
			}

			if(command=="edit") {// editの場合はファイル更新を監視
				console.log("watch "+fpath)
				watchadd(fpath)
			}
			// workspaceにopenコマンド送信
			sendToAllClients({
					'cmd':"open",'pid':pid,'path':path,'param':aparam
				})
			ret.pid = pid 
			//プロセスリストに追加
			procs.push({
				'pid':pid++,
				'app':app,
				'path':path,
//				'fpath':fpath,
				'param':aparam 
			})
			res.json(ret);
			break 
		// プロセス消去
		case "kill":
			const kpid = parseInt(commandopt) 
			procs = procs.filter(p=>{
				if(p.pid == kpid) {
					// workspaceにkillコマンド送信
					sendToAllClients({
						'cmd':"kill",'pid':kpid
					})	
					watchrm(getfpath(p.path)) 
					return false 
				}
				return true 
			})
			res.json(ret);
			break ;
		//パラメータ送信
		case "param":
			const ppid = parseInt(commandopt)
			procs.forEach(p=>{
				if(p.pid == ppid) {
					for(k in aparam) p.param[k] = aparam[k]
					// workspaceにparamコマンド送信
					sendToAllClients({
						'cmd':"param",'pid':ppid,'param':aparam
					})			
				}
			})
			res.json(ret);
			break ;
		// 環境設定
		case "env":
			if(env[commandopt]) {
				for(k in aparam) env[commandopt][k] = aparam[k]
				sendToAllClients({
					'cmd':"env",'commandopt':commandopt,'param':aparam
				})
				console.log(env) 
			}
			res.json(ret);
			break ;
		// 全プロセス消去
		case "clear":
			sendToAllClients({
				'cmd':"clear"
			})
			procs.forEach(p=>{
				watchrm(getfpath(p.path)) 
			})
			procs.length = 0 
			env.bg.kind="default"
			sendToAllClients({
				'cmd':"env",'commandopt':"bg",'param':{'kind':"default"}
			})
			res.json(ret);
			break 
		case "reload":
			sendToAllClients({
				'cmd':"reload",'commandopt':"",'param':{}
			})
			res.json(ret);
			break 			
		// プロセス一覧取得
		case "procs":
			ret.procs = procs
			if(commandopt=="pp") res.send(JSON.stringify(procs,null,2)) ;
			else res.json(ret) 
			break 
		// 環境設定取得
		case "getenv":
			ret.env = env
			if(commandopt=="pp") res.send(JSON.stringify(env,null,2)) ;
			else res.json(ret) 
			break
		//状態保存
		case "savestat":
			const sd = JSON.stringify({'env':env,'procs':procs},null,2) 
			Fs.writeFile(Path.join(staticDir, '../savestat/',commandopt), sd, (err) => {
				if (err) {
					console.error("ファイルの保存中にエラーが発生しました:", err);
					ret.stat ="NG" 
					res.json(ret) 
				} else {
					console.log("データをJSONファイルに保存しました。");
					ret.stat ="OK" 
					res.json(ret) 
				}
			});
			break ;
		//状態読み込み
		case "loadstat":
			Fs.readFile(Path.join(staticDir, '../savestat/',commandopt), 'utf8', (err, jsonData) => {
				if (err) {
					console.error("ファイルの読み込み中にエラーが発生しました:", err);
					ret.stat ="NG file open" 
					res.json(ret) 
				} else {
					let data 
					try {	// JSON文字列をオブジェクトに変換
						data = JSON.parse(jsonData);
					} catch (parseErr) {
						console.error("JSONの解析中にエラーが発生しました:", parseErr);
						ret.stat ="NG json error" 
						res.json(ret) 
						return 
					}
//						console.log("読み込んだデータ:", data);
						const clear = (aparam.noclear!="true")
						if(clear) {//置き換えの場合環境読み込む
							// 環境の設定
							for(let e in data.env) {
								sendToAllClients({
									'cmd':"env",'commandopt':e,'param':data.env[e]
									})
							}
							env = data.env
						}
						// apps の起動
						let ps = procs 
						if(clear) {	//置き換えの場合全procs消去
							procs.forEach(p=>{
								watchrm(getfpath(p.path)) 
							})
							ps = []
							sendToAllClients({
								'cmd':"clear"
							})
						}
						data.procs.forEach(p=>{
							if(!Fs.existsSync(getfpath(p.path))) {
								console.log(`app not found ${getfpath(p.path)}`)
								return
							}
							if(clear) {
								if(pid<p.pid) pid = p.pid 
							} else p.pid = pid++
							ps.push(p)
							// workspaceにopenコマンド送信
							sendToAllClients({
									'cmd':"open",'pid':p.pid,'path':p.path,'param':p.param
								})							
						})
						procs = ps 
						if(clear) pid++		
						ret.stat ="OK" 
						res.json(ret) 
				}
			});
			break ;
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

// HTTPサーバーを起動
//const httpServer = Http.createServer(app);
//httpServer.listen(80, () => {
//		console.log('HTTP Server running on port 80');
//});

// HTTPSサーバの起動
const server = Https.createServer(options, app).listen(PORT,'0.0.0.0', () => {
		console.log(`SPATIAL SHELL Server is running on https://localhost:${PORT}`);
});
