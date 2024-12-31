// SPATIAL SHELL client 
// wakufactory 

// scene vue app
export const APP = Vue.createApp({
	created() {
		this.procs = [] 
	},
	data() {
		return {
			bg:{
				kind:"default",
				mix:1
			},
			light:{
				default:true
			},
			posx:0,
			stat_calls:0,
			stat_poly:0,
			base_element:null,
		}
	},
	methods:{
		// create new app instance
		async addobj(appdata) {
			console.log(appdata)
			const app2 = Vue.createApp({
				data() {
					return {
						cscale:1,
						hcolor:"#ccc",
						param:{'basescale':1},
						grabbable:true,
						issetpos:false,
						sposition:{'x':0,'y':0,'z':0},
						srotation:{'x':0,'y':0,'z':0},
						key:0,
						comppath:	 ".."+appdata.path,
						ccompo: null,
						pid: appdata.pid,
						compoel:null		
					}
				},
				created() {

				},
				methods:{
					setparam(param) {
						if(!param) return 
						for(let k in param) {
							let v = param[k] 
							if(v=="true") v= true 
							else if(v=="false") v=false 
							else if(typeof v=="string" && v.match(/^[e0-9.\-+]+$/) && parseFloat(v)!==NaN) { v = parseFloat(v)}
							this.param[k] = v ;
							console.log(`set ${k} to ${param[k]}`)
							if(k=="cscale") this.cscale = param.cscale
							if(k=="grabbable") this.grabbable = param.grabbable=='false'?false:true 
							if(k=="posX") this.sposition.x = param.posX,this.issetpos=true
							if(k=="posY") this.sposition.y = param.posY,this.issetpos=true
							if(k=="posZ") this.sposition.z = param.posZ,this.issetpos=true
							if(k=="rotX") this.srotation.x = param.rotX,this.issetpos=true
							if(k=="rotY") this.srotation.y = param.rotY,this.issetpos=true
							if(k=="rotZ") this.srotation.z = param.rotZ,this.issetpos=true
							if(k=="issetpos") this.issetpos = param.issetpos=='false'?false:true 
						}
					},
					async loadComponent() {
						const timestamp = new Date().getTime();
						// 動的にコンポーネントをインポートし、キャッシュを避ける
						const module = await import(`${this.comppath}?${timestamp}`);
						this.ccompo = Vue.shallowRef(module.default); //warning避け
//						console.log(this.ccompo) 
					},
					async reloadComponent() {
						await this.loadComponent();
						this.componentKey += 1; // キーを更新して再描画をトリガー
					},
					setpos() {
//						console.log("setpos "+`${this.sposition.x} ${this.sposition.y} ${this.sposition.z}`)
						return `${this.sposition.x} ${this.sposition.y} ${this.sposition.z}` 
					},
					setrot() {
						return `${this.srotation.x} ${this.srotation.y} ${this.srotation.z}` 
					}		
				},
				mounted() {
					if(this.grabbable) {
						this.$refs.gbox.setAttribute("ss_grabbase","pid:"+this.pid)
//					console.log(this.$refs.gbox.innerHTML) 
					}
					this.compoel = this.$refs.ccompo 
					this.loadComponent(); // コンポーネントの初期ロード
				},
				template: `
				<a-entity  v-if="grabbable">
					<a-box ref="gbox" :position="setpos()" width=0.02 height=0.02 depth=0.02 material="transparent:true;opacity:0.7;color:#ccc"  grabbable2="distance:.04" ss_grabbase>
					<a-entity ref="base"  >
						<component ref="ccompo" :key=key :is=ccompo :pscale="cscale*param.basescale" v-bind="param" />
					</a-entity>
				</a-box>
				</a-entity>
				<a-entity v-else>
					<a-entity ref="base" :position="setpos()" :rotation="setrot()" >
						<component ref="ccompo" :key=key :is=ccompo :pscale="cscale*param.basescale" v-bind="param" />
					</a-entity>				
				</a-entity>
				`
			})

			const el = document.createElement('a-entity')
			this.base_element.appendChild(el)
			const appinst = app2.mount(el)	//アプリマウント
			appinst.el = el 
			appinst.setparam(appdata.param) //初期パラメータセット		
			//初期位置決め
			if(!appinst.issetpos&&appinst.grabbable) {

				let posy = document.querySelector("[camera]").object3D.position.y	
				if(posy==0) posy=1
				appinst.sposition.x = this.posx;
				appinst.sposition.y = posy
				appinst.sposition.z = -0.3 +this.posx * 0.01
				console.log(`initpos ${appinst.sposition.x} ${appinst.sposition.y} ${appinst.sposition.z}`)
				this.posx += 0.1 
				if(this.posx > 0.3) this.posx -= 0.58
			}

			return appinst 
		},
		// stat読み込み
		loadstat(data) {
			this.setenv(data.env) 
			// resume procs 
			data.procs.forEach(async data=>{
				const cinst = await this.addobj({'pid':data.pid,'path':data.path,'param':data.param})
				this.procs.push({'pid':data.pid,'inst':cinst,'data':data})			
			})
		},
		// 環境設定
		setenv(data) {
			console.log(data) 
			for(let k in data) {
				const p = data[k] 
				for(let pp in p) {
					switch(k) {
						case "bg":
							if(pp=="kind") this.bg.kind = p[pp]
							break 
						case "light":
							if(pp=="default") this.light.default = p[pp]==true||p[pp]=='true'
							break
					}
				}
			}
		},

		// サービス関数 AFRAME.registerComponentのラッパ
		registerComponent(name,data) {
			let update = "" 
			if(AFRAME.components[name]) {
				delete AFRAME.components[name]
				update = "update" 
			}
			AFRAME.registerComponent(name,data) 
			console.log(`register ${update} ${name}`)
		},
		registerShader(name,data) {
			let update = "" 
			if(AFRAME.shaders[name]) {
				delete AFRAME.shaders[name]
				update = "update" 
			}
			AFRAME.registerShader(name,data) 
			console.log(`register shader ${update} ${name}`)
		}		
	}
})
// API call to server 
export const SAPI = {
	get:(cmd,param={}) =>{
		const pstr = new URLSearchParams(param).toString() 
		return new Promise((resolve,reject)=>{
			const path = `/api/${cmd}?${pstr}`
			fetch( path , {
				method:"GET"
			}).then( async resp=>{
				resp.json().then(data=>{
					resolve(data) 
				})
			})
		})
	}
}

const $ = (o)=>document.querySelector(o)
// A-Frame components 
AFRAME.registerComponent('stat', {
	tick:function() {
		if(!SPSHELL) return 
		let info = this.el.sceneEl.renderer.info.render
		SPSHELL.stat_calls = info.calls 
		SPSHELL.stat_poly = info.triangles 
	}	
})
AFRAME.registerComponent('ss_grabbase', {
	schema:{
		pid:{type:"number",default:0}
	},
	init:function() {
		this.el.addEventListener("grab",ev=>{
			console.log("grabbed! "+this.data.pid)
			if(ev.detail.state=="start") {
				this.el.setAttribute("material","color","#fcc")
			} else {
				this.el.setAttribute("material","color","#ccc")  
			}
			this.el.querySelectorAll(".ssgrab").forEach(o=>{
				o.emit("ssgrab",ev.detail) 
			})
			/*
			let cp = null 
			SPSHELL.procs.forEach(p=>{
				if(p.pid==this.data.pid) cp = p  
			})
			if(!cp) return
//			console.log(cp) 
			*/
		})
	},
})
// set VR mode height
AFRAME.registerComponent('vrheight', {
	schema:{
		height:{type:"number",default:1.5}
	},
	init:function() {
		const scene = this.el.sceneEl
		const camrig = this.el 
		let objpos,camrigpos
		if(!camrig) return 
		scene.addEventListener("enter-vr", ev=>{
			camrigpos = camrig.getAttribute("position").clone()
			objpos = $('#base').getAttribute("position").clone()
			camrig.setAttribute("position", {x:camrigpos.x,y:0,z:camrigpos.z})
		})
		scene.addEventListener("exit-vr", ev=>{
			camrig.setAttribute("position",camrigpos)
			$('#base').setAttribute("position",{x:objpos.x,y:objpos.y,z:objpos.z})
		})
	}
})
// hide when AR mode 
AFRAME.registerComponent('noar',{
	init:function() {
		const sc = this.el.sceneEl
		this.el.setAttribute("visible",sc.states!="ar-mode" )
		sc.addEventListener("enter-vr", ev=>{
			if(sc.states=="vr-mode") return
			this.el.setAttribute("visible",false )
		})
		sc.addEventListener("exit-vr", ev=>{
			this.el.setAttribute("visible",true )
		})
	}
})