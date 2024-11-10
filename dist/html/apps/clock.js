/*
	SPATIAL SHELL APP
	simple (44 triangles) clock
*/
export default {
	props:{
	},
	template: `
		<a-entity scale=".08 .08 .08" position="0 .2 0">
		<a-octahedron radius=.2 position="0 3.1 0" color="white" ss-clock=SS></a-octahedron>
		<a-entity  ss-clock=H>
			<a-box width=0.5 height=2 depth=0.1 position="0 0.7 0" color=red ></a-box>
		 </a-entity>
		<a-entity  ss-clock=M>
			<a-box width=0.4 height=3 depth=0.2 position="0 0.8 0" color=green ></a-box>
		 </a-entity>
		<a-entity ss-clock=S>
			<a-box width=0.2 height=4 depth=0.3 position="0 1 0" color=blue ></a-box>
		 </a-entity>
	</a-entity>`
}
if(AFRAME.components['ss-clock']) delete AFRAME.components['ss-clock']
AFRAME.registerComponent('ss-clock',{
	schema:{
		type:"string"
	},
	init:function() {
	},
	update:function(old) {
	},
	tick:function(time,dur) {
		const t = new Date() 
		let r = {x:0,y:0,z:0}
		if(this.data=="H") r.z = t.getHours()%12/12 + Math.floor(t.getMinutes()/12)/60
		else if(this.data=="M") r.z = t.getMinutes()/60
		else if(this.data=="S") r.z = t.getSeconds()/60
		else if(this.data="SS") r.y = Math.cos(t.getMilliseconds()/1000*Math.PI*2)*0.5
		this.el.object3D.rotation.set(0,Math.PI*2*r.y,-Math.PI*2*r.z)
	},
})