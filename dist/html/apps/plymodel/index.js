
/*
	SPATIAL SHELL APP
	gaussian splatting viewer 
*/
export default {
	config:{
		zoom:true
	},
	props:{
		pscale:Number,
		psrc:String,
		ppos:{
			type:String,
			default:"0 0 0"
		}
	},
	methods:{
	},
	template: '<a-entity :scale="`${pscale} ${pscale} ${pscale}`" :position="ppos"><a-entity :splats="`src:${psrc};scale:1;stream:false;`"></a-entity></a-entity>'
}
const $ = (o) => document.querySelector(o) 
import * as GaussianSplats3D from './gaussian-splats-3d.module.js';

if(AFRAME.components['splats']) delete AFRAME.components['splats']
AFRAME.registerComponent('splats', {
schema:{
	src:{type:"model",default:""},
	stream:{default:true},
	scale:{default:1},
	position:{type:"vec3",default:{x:0,y:0,z:0}}
},
init:function() {
	this.viewer = new GaussianSplats3D.DropInViewer({
		'antialiased':true,
		'focalAdjustment':5.0
	})
	this.viewer.renderOrder = 100 
	this.el.object3D.add(this.viewer)
	this.loadf = false 
	console.log(this.viewer)
},
update:async function(old) {
	if(this.data.src=="" || this.data.src==old.src) return 
	if(this.viewer.getSceneCount()>0) {
		await this.viewer.removeSplatScene(0)
	}
	this.loadf = false 
	const type = this.data.src.match(/spz$/)?3:2
	const ss = type==3?1:-1 
	this.viewer.addSplatScene(this.data.src, {
		'format':type ,
		'streamView':this.data.stream,
		'rotation': new THREE.Quaternion().setFromUnitVectors(new THREE.Vector3(0., -0., -0.).normalize(), new THREE.Vector3(0, 1, 0)).toArray(),
		'scale': [this.data.scale, ss*this.data.scale, ss*this.data.scale],
		'position': [this.data.position.x, this.data.position.y, this.data.position.z]
	})
	 .then(() => {
		 console.log("loaded")
		 this.loadf = true 
	});	   
},
tick:function(dt) {
	if(this.loadf) this.viewer?.viewer?.runSplatSort(true);
}
})