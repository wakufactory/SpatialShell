

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