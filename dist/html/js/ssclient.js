// scene vue app

export const APP = Vue.createApp({
	created() {
	},
	data() {
		return {
			bg_kind:"space",
			bg_mix:1,
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
						key:0,
						comppath:	 appdata.path,
						ccompo: null,
						pid: appdata.pid 		
					}
				},
				created() {
					this.loadComponent(); // コンポーネントの初期ロード
				},
				methods:{
					setparam(param) {
						for(let k in param) {
							const v = param[k] 
							this.param[k] = isNaN(parseFloat(v))?v:parseFloat(v) ;
							console.log(`set ${k} to ${param[k]}`)
						}						
					},
					async loadComponent() {
						const timestamp = new Date().getTime();
						// 動的にコンポーネントをインポートし、キャッシュを避ける
						const module = await import(`${this.comppath}?${timestamp}`);
						this.ccompo = Vue.shallowRef(module.default); //warning避け
						console.log(this.ccompo) 
					},
					async reloadComponent() {
						await this.loadComponent();
						this.componentKey += 1; // キーを更新して再描画をトリガー
					}		
				},
				mounted() {
					this.$refs.gbox.setAttribute("ss_grabbase","pid:"+this.pid)
//					console.log(this.$refs.gbox.innerHTML) 
				},
				template: `<a-box ref="gbox" width=0.02 height=0.02 depth=0.02  :color="hcolor" opacity=0.8  grabbable2="distance:.06" ss_grabbase>
					<a-entity position="0 0.01 0" >
						<component :key=key :is=ccompo :pscale="cscale*param.basescale" v-bind="param" />
					</a-entity>
				</a-box>`
			})
			
			//初期位置決め
			const el = document.createElement("a-entity")
			let posy = document.querySelector("[camera]").object3D.position.y	
			if(posy==0) posy=1
			el.setAttribute("position",`${this.posx} ${posy} 0`)
			this.posx += 0.1 
			if(this.posx > 0.3) this.posx -= 0.58

			const appinst = app2.mount(el)	//アプリマウント
			appinst.setparam(appdata.param) //初期パラメータセット
			this.base_element.appendChild(el) // DOMにappend
			return {id:appdata.id,app:appinst,el:el,time:new Date().getTime()}
		},
		// サービス関数 AFRAME.registerComponentのラッパ
		registerComponent(name,data) {
			if(AFRAME.components[name]) delete AFRAME.components[name]
			AFRAME.registerComponent(name,data) 
		}		
	}
})

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
			console.log(ev.detail) 
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
		sc.addEventListener("enter-vr", ev=>{
			if(sc.states=="vr-mode") return
			this.el.setAttribute("visible",false )
		})
		sc.addEventListener("exit-vr", ev=>{
			this.el.setAttribute("visible",true )
		})
	}
})