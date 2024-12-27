/*
	SPATIAL SHELL APP
	point particle 
*/  
// Vue component definition
export default {  
	props:{  
		pscale:Number,
		speed:{
			type:Number,
			default:4000
		}
	},
	methods:{
		scale() {
			return `${this.pscale*0.02} ${this.pscale*0.02} ${this.pscale*0.02}` 
		}
	},
	template: 	// A-Frame template 
	'<a-entity :scale="scale()"  position="0 .15 0" > \
		<a-entity id=pts position="0 0 0" scale="1 1 1" :randp="`speed:${speed}`" pts_particle="size:2;pp:20" ></a-entity> \
	</a-entity>'
}

// A-Frame component (user wrapper function)
//scene init component 
SPSHELL.registerComponent('randp',{
	dependencies:['pts_particle'],
	schema: {
		speed:{default:4000},
	},
	init:function() {
		this.pc=this.el.components
		this.pshader = this.pc.pts_particle
		this.num = 5000
		this.pts = new Float32Array(this.num*3)
		this.col = new Float32Array(this.num*3)
		this.ptp = new Array(this.num*3)
		const cb=new Float32Array(this.num*3)
		for(let i=0;i<this.num*3;i+=3) {
			let y = Math.random()*10-5 

			this.ptp[i+0] = Math.random()*(Math.cos(Math.PI*y/8)+1)*5+0.5
			this.ptp[i+1] = y
			this.ptp[i+2] = (Math.random()+0.5)*(Math.random()>.5?1:1)
			this.pts[i+0] = this.ptp[i+0]*Math.sin(this.ptp[i+2]*10)
			this.pts[i+1] = this.ptp[i+1]
			this.pts[i+2] = this.ptp[i+0]*Math.cos(this.ptp[i+2]*10)
			const col=new THREE.Color(`hsl(${Math.random()*360}, 
				${Math.floor(Math.random()*30)+70}%, 
				${Math.floor(Math.random()*40)+30}%)`)
			cb[i+0]=col.r
			cb[i+1]=col.g
			cb[i+2]=col.b
		}
		this.pshader.setPosition(this.pts)
		this.pshader.setColor(cb)

		const setcolor = (bc)=>{
			if(!this.pc) return
			const bs=Math.floor(Math.random()*50)
			for(let i=0;i<this.num*3;i+=3) {
				const col=new THREE.Color(`hsl(${Math.random()*100+bc}, 
					${Math.floor(Math.random()*50)+bs}%, 
					${Math.floor(Math.random()*20)+30}%)`)
				cb[i+0]=col.r
				cb[i+1]=col.g
				cb[i+2]=col.b
			}
			this.pshader.setColor(cb)			
		}
	},
	update:function(old) {
	},
	tick:function(time,dur) {
		if(this.ss==0)return 
		for(let i=0;i<this.num*3;i+=3) {
			const t=time*this.ptp[i+2]
			const tt = t/this.data.speed+this.ptp[i+2]*6
			this.pts[i+0] = this.ptp[i+0]*Math.sin(tt)
			this.pts[i+1] = this.ptp[i+1]+Math.sin(t/1200)*.5
			this.pts[i+2] = this.ptp[i+0]*Math.cos(tt)
		}
		this.pshader.setPosition(this.pts)	
	},
})
SPSHELL.registerComponent('pts_particle', {
	schema: {
		vertices:{default:["0 0 0"]},
		size:{default:1},
		pp:{default:20},
		color:{default:"#00f"},
		map:{type:"map"}
	},
	init:function() {
		const data = this.data 
		const geometry = new THREE.BufferGeometry();
		this.geometry = geometry
		const vertices = this.data.vertices

		geometry.boundingSphere = null 
		this.position = new THREE.BufferAttribute(new Float32Array(vertices), 3)
		const cb=new Float32Array(vertices.length)
		this.color = new THREE.BufferAttribute(cb, 3)
		geometry.setAttribute('position',this.position);
		geometry.setAttribute('pcolor',this.color);
		const material = new THREE.ShaderMaterial({
			transparent:true,
	uniforms:{
		psize:{value:20},
		pp:{value:1}
	},
	vertexShader:`
attribute vec3 pcolor ;
uniform float psize ;
varying vec2 tuv ;
varying vec3 vpos ;
varying vec3 vcolor ;
void main() {

	tuv = vec2((uv.x-0.5)*2.,(uv.y-0.5)*2.) ;
	vec3 tpos = position ;
	vpos = (modelMatrix * vec4( tpos,1.0)).xyz ;
	vcolor = pcolor ;
	vec4 cpos = projectionMatrix * modelViewMatrix * vec4( tpos, 1.0 );
	gl_PointSize = max((psize/abs(cpos.z)),1.) ;  
	gl_Position =cpos;
}
`,
	fragmentShader:`precision highp float;
uniform float timestamp ;
uniform float pp ;
varying vec2 tuv ;
varying vec3 vpos ;	
varying vec3 vcolor ;
	void main() {
		float tr = clamp(1.-pow(length(gl_PointCoord-vec2(0.5))*2.,pp),0.,1.);
		if(tr<0.1)discard;
		gl_FragColor = vec4(vcolor,tr);		
	}
`
})
		this.points = new THREE.Points(geometry, material);
		this.el.setObject3D(this.attrName, this.points);
	},
	update:function(old) {
//		console.log(this.data)
		this.points.material.uniforms.psize.value = this.data.size 
			this.points.material.uniforms.pp.value = this.data.pp
	},
	setPosition:function(pos) {
		if(pos instanceof Float32Array) this.position.array = pos
		else this.position.array = new Float32Array(pos) 
		this.position.count = pos.length/3
		this.position.needsUpdate = true ;
		this.geometry.computeBoundingSphere()
//  	console.log(this.geometry.boundingSphere)
	},
	setColor:function(col) {
		if(col instanceof Float32Array) this.color.array = col
		else this.color.array = new Float32Array(col)
		this.color.needsUpdate = true ;
	}
})
