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
		},
		axis:{
			default:"Y"
		}
	},  
	methods:{
		scale() {
			return `${this.pscale} ${this.pscale} ${this.pscale}` 
		}
	},
	template: 	// A-Frame template 
	'<a-entity :scale="scale()"  position="0 .06 0" > \
		<a-box visible=true scale=".1 .1 .1" position="0 0.05 0" \
			:color="color" :ss-move="`speed:${speed};axis:${axis}`"></a-box> \
	</a-entity>'
}

// A-Frame component (user wrapper function)
SPSHELL.registerComponent('ss-move',{
	schema: {
		speed:{type:"number",default:60},
		axis:{default:"Y"}
	},
	init:function() {
		this.move = {x:0,y:0,z:0}
	},
	tick:function(time, timeDelta) {
		if(this.data.axis=="X") this.move.x = (Math.sin(time/this.data.speed)+1)*0.01
		if(this.data.axis=="Y") this.move.y = (Math.sin(time/this.data.speed)+1)*0.01
		if(this.data.axis=="Z") this.move.z = (Math.sin(time/this.data.speed)+1)*0.01
		this.el.object3D.position.set(this.move.x,this.move.y,this.move.z)
	}
})

