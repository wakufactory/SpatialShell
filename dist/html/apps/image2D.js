/*
	SPATIAL SHELL APP
	2D image viewer 
*/
export default {
	props:{
		psrc:String,
		pscale:Number
	},
	template: `
		<a-entity :scale="pscale+' '+pscale+' '+pscale" >
		<a-plane width=0.2 height=.2  position="0 0.2 0"  material="shader:flat" :ss_imgload="psrc"></a-plane>
		</a-entity>
`
}
if(AFRAME.components['ss_imgload']) delete AFRAME.components['ss_imgload']
AFRAME.registerComponent('ss_imgload', {
	schema:{
		type:"string"
	},
	init:function() {
			console.log("init") 
			console.log(this.el.components) 
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
						const as=(im1.height/im1.width)
						console.log(as)
						const bsize = 0.5
						const w = (as>1?1/as:1)*bsize
						const h = (as>1?1:as)*bsize
						this.el.setAttribute("width",w)
						this.el.setAttribute("height",h)
						this.el.setAttribute("position",{x:0,y:h/2,z:0})
						this.el.removeAttribute('material'); 
						this.el.setAttribute("material",{"shader":"flat","src":"#"+id})
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