/*
	SPATIAL SHELL APP
	2D video viewer 
*/
export default {
	props:{
		psrc:String,
		pscale:Number,
		play:Boolean,
		seek:Number
	},
	template: '<a-entity :scale="`${pscale} ${pscale} ${pscale}`"> \
		<a-plane class="ssgrab" width=0.2 height=.2 position="0 0.2 0" material="shader:flat"  :ss-video="`psrc:${psrc};play:${play};seek:${seek}`" ></a-plane> \
	</a-entity>'
}
if(AFRAME.components['ss-video']) delete AFRAME.components['ss-video']
AFRAME.registerComponent('ss-video', {
	schema:{
		psrc:{type:"string"},
		play:{default:true},
		seek:{default:0}
},
init:function() {
		console.log("init") 
		console.log(this.el.components) 
		this.assets = document.querySelector("a-assets") 
		this.el.addEventListener("ssgrab",(ev)=>{
			console.log("grab") 
		})
	},
update:function(old) {
	console.log(this.data) 
	if(this.data.psrc != old.psrc) {
		this.imgdom?.pause() 
		this.id = crypto.randomUUID() 
		this.setimg(this.data.psrc,this.id)
	}
	if(this.data.play) this.imgdom.play() 
	else this.imgdom.pause() 
	if(this.data.seek!=old.seek) {
		this.imgdom.currentTime = this.data.seek
	}
},
remove:function() {
	this.imgdom.remove() 	
},
start:function() {
	this.imgdom.play()
	this.imgdom.muted = false
	console.log("vstart") 
},
setimg:function(src,id) {
	console.log(src) 
			return new Promise((resolve,reject)=>{
				const im1 = document.createElement("video")
				im1.id = id
				im1.setAttribute("crossorigin","anonymous")
				im1.setAttribute("autoplay",true)
				im1.setAttribute("loop",true)
//				im1.setAttribute("muted",true)

				im1.onloadeddata = ()=>{
					const as=(im1.videoHeight/im1.videoWidth)
					const bsize = 0.5 
					const w = (as>1?1/as:1)*bsize
					const h = (as>1?1:as)*bsize
					this.el.setAttribute("width",w)
					this.el.setAttribute("height",h)
					this.el.setAttribute("position",{x:0,y:h/2,z:0})
					this.el.setAttribute("material","src","#"+id)
//					this.el.setAttribute("sound","src","#"+id)
					resolve(im1)
				}
				im1.src = src
				this.assets.appendChild(im1) 
				this.imgdom = im1 			
			})
		},
	
})