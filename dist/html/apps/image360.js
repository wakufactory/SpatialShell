/*
	SPATIAL SHELL APP
	360deg image viewer 
*/
export default {
	props:{
		psrc:String,
		pscale:Number,
		bg_mix:Number
	},
	template: ' \
		<a-entity :scale="`${this.pscale} ${this.pscale} ${this.pscale}`"> \
		<a-sky material="shader:flat;transparent:true;opacity:1;src:;repeat:1 1" radius="100" segments-height="20" segments-width="40" rotation="0 -90 0" \
			:ss_imgload360="psrc"></a-sky> \
		</a-entity>'
}
if(AFRAME.components['ss_imgload360']) delete AFRAME.components['ss_imgload360']
AFRAME.registerComponent('ss_imgload360', {
	schema:{
		type:"string"
	},
	init:function() {
			this.assets = document.querySelector("a-assets")
		},
	update:function() {
		this.id = crypto.randomUUID() 
		this.setimg(this.data,this.id) 
	},
	remove:function() {
		this.imgdom.remove() 	
	},
	setimg:function(src,id) {
		console.log(src) 
				return new Promise((resolve,reject)=>{
					const im1 = document.createElement("img")
					im1.id = id
					im1.setAttribute("crossorigin","anonymous")
					im1.onload = ()=>{
						this.el.removeAttribute('material'); 
						this.el.setAttribute("material",{"shader":"flat","side":"back","src":"#"+id})
						resolve(im1)
					}
					im1.src = src
					this.assets.appendChild(im1) 
					this.imgdom = im1 			
				})
			},
	tick:function() {
	}
	})