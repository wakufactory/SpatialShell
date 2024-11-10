// scene vue app
const $ = (o)=>document.querySelector(o)
export const APP = Vue.createApp({
	created() {
	},
	data() {
		return {
			bg_kind:"passthru",
			bg_mix:1,
			posx:0,
			stat_calls:0,
			stat_poly:0
		}
	},
	methods:{
		// create new app instance
		async addobj(param) {
			console.log(param)
			const prop = {
				scale:1,
				basescale:param.param.basescale?param.param.basescale:1, 
				hcolor:"#ccc"
			}
			console.log(prop)
			const propstr = [':pscale="scale*basescale"']
			for(let k in param.param) {
//				if(prop[k]) continue 
				prop[k] = param.param[k] ;
				propstr.push(parseFloat(prop[k])!=NaN?`:${k}=${k}`:`:${k}="${k}"`)
			}
			console.log(propstr) 
			const app2 = Vue.createApp({
				data() {
					prop.key = 0
					prop.comppath = param.path
					prop.ccompo = null
					return prop
				},
				created() {
					this.loadComponent(); // コンポーネントの初期ロード
				},
				methods:{
					async loadComponent() {
						// 現在時刻をクエリパラメータとして付加し、キャッシュを防止
						const timestamp = new Date().getTime();
					
						// 動的にコンポーネントをインポートし、キャッシュを避ける
						const module = await import(`${this.comppath}?${timestamp}`);
						console.log(module.default)
						this.ccompo = module.default;
					},
					async reloadComponent() {
						await this.loadComponent();
						this.componentKey += 1; // キーを更新して再描画をトリガー
					}					
				},
				template: `<a-box width=0.02 height=0.02 depth=0.02  :color="hcolor" opacity=0.8  grabbable2="distance:.04" ss_grabbase>
					<a-entity position="0 0.01 0" >
						<component :key=key :is=ccompo ${propstr.join(" ")} />
					</a-entity>
				</a-box>`
			})
			const el = document.createElement("a-entity")
			let posy = document.querySelector("[camera]").object3D.position.y	
			if(posy==0) posy=1
			el.setAttribute("position",`${this.posx} ${posy} 0`)
			this.posx += 0.1 
			if(this.posx > 0.3) this.posx -= 0.58

			const appinst = app2.mount(el)
			$('#base').appendChild(el) 
			return {id:param.id,app:appinst,el:el,time:new Date().getTime()}
		}
	}
})

// A-Frame components 
AFRAME.registerComponent('stat', {
	tick:function() {
		if(!APP) return 
		let info = this.el.sceneEl.renderer.info.render
		APP.stat_calls = info.calls 
		APP.stat_poly = info.triangles 
	}	
})
AFRAME.registerComponent('ss_grabbase', {
	init:function() {
		this.el.addEventListener("grab",ev=>{
			console.log("grabbed!")
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