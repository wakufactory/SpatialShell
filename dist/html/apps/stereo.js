/*
	SPATIAL SHELL APP
	stereo image viewer 
*/
export default {
	props:{
		psrc:String,
		pscale:Number
	},
	template: `
		<a-entity :scale="pscale+' '+pscale+' '+pscale" :st_imgload="psrc">
			<a-plane  width="0" position="0 0 0" eye="r"  material="shader:stereoflat;lr:1" ></a-plane>
			<a-plane  width="0" position="0 0 0" eye="l" material="shader:stereoflat;lr:0" ></a-plane>
		</a-entity>`,
	help:"help text "
}
// image loader for stereo SBS
SPSHELL.registerComponent('st_imgload', {
	schema:{
		type:"string"
	},
	init:function() {
			console.log("init") 
			console.log(this.el.components) 
			this.assets = document.querySelector("a-assets")
			this.planes = this.el.querySelectorAll("a-plane")
			this.cam = document.querySelector("[camera]")
			if(!this.cam.components.eye) this.cam.setAttribute("eye","")
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
					this.planes[0].setAttribute("width",0.01)
					this.planes[0].setAttribute("height",0.01)
					this.planes[1].setAttribute("width",0.01)
					this.planes[1].setAttribute("height",0.01)
					im1.onload = ()=>{
						const as=(im1.height/im1.width*2)
						console.log(as)
						const bsize = 0.5
						const w = (as>1?1/as:1)*bsize
						const h = (as>1?1:as)*bsize
						this.planes[0].setAttribute("width",w)
						this.planes[0].setAttribute("height",h)
						this.planes[0].setAttribute("position",{x:0,y:h/2,z:0})
						this.planes[0].setAttribute("material","src","#"+id)
						this.planes[1].setAttribute("width",w)
						this.planes[1].setAttribute("height",h)
						this.planes[1].setAttribute("position",{x:0,y:h/2,z:0})
						this.planes[1].setAttribute("material","src","#"+id)
						resolve(im1)
					}
					im1.src = src
					this.assets.appendChild(im1) 
					this.imgdom = im1 			
				})
			}
	})
// eye left and right 
SPSHELL.registerComponent('eye',{
		schema: {
			default:""
		},
		init:function() {
		},
		update:function(old) {
			if(this.el.object3DMap.camera) {
				if(this.data=="l"||this.data=="")
					this.el.object3DMap.camera.layers.enable(1) 
				if(this.data=="r"||this.data=="")
					this.el.object3DMap.camera.layers.enable(2) 
			} else 
				this.el.object3DMap.mesh.layers.set(this.data==""?0:(this.data=="l"?1:2))
		}
	})
// flat shader for stereo photo 
SPSHELL.registerShader('stereoflat',{
		schema:{
			src:{type:'map',is:'uniform'},
			lr:{type:'int',is:'uniform'}
		},
		row:false,
		vertexShader:`
	out vec2 vuv ;
	out vec3 vpos ;
	uniform int lr;
	
	const float PI = 3.141592654 ;
	void main() {
		vuv = uv;
		vuv.x=(lr==0)?vuv.x/2.:vuv.x/2.+.5;
		vec3 tpos = position ;
		vpos = (modelMatrix * vec4( tpos,1.0)).xyz ;
		gl_Position = projectionMatrix * modelViewMatrix * vec4( tpos, 1.0 );
	}
	`,
		fragmentShader:`
		precision highp float;
		in vec2 vuv ;
		in vec3 vpos ;
		uniform sampler2D src ;
		void main () {
			vec4 color = texture(src,vuv) ;
			gl_FragColor = vec4(color);
		}
	`
	})