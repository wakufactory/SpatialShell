/*
	SPATIAL SHELL APP
	basic boilerplate
*/  
// Vue component definition
export default {  
	props:{  
		pscale:Number,
		color:{
			type:String,
			default:"#fff" 
		},
		speed:{
			type:Number,
			default:60
		}
	},  
	methods:{
		scale() {
			return `${this.pscale} ${this.pscale} ${this.pscale}` 
		}
	},
	template: 	// A-Frame template 
	'<a-entity :scale="scale()"  position="0 .06 0" > \
		<a-box visible=true scale=".1 .1 .1" position="0 0.05 0"  :color="color" :ss-rot="`speed:${speed}`"></a-box> \
	</a-entity>'
}

// A-Frame component (user wrapper function)
SPSHELL.registerComponent('ss-rot',{
	schema: {
		speed:{type:"number",default:60},
		axis:{default:"Y"}
	},
	init:function() {
		this.rot = {x:0,y:0,z:0}
	},
	tick:function(time, timeDelta) {
		if(this.data.axis=="X") this.rot.x = THREE.MathUtils.degToRad(time/this.data.speed)
		if(this.data.axis=="Y") this.rot.y = THREE.MathUtils.degToRad(time/this.data.speed)
		if(this.data.axis=="Z") this.rot.z = THREE.MathUtils.degToRad(time/this.data.speed)
		this.el.object3D.rotation.set(this.rot.x,this.rot.y,this.rot.z)
	}
})

