/*
	SPATIAL SHELL APP
	instancing object 1
*/  
export default {  
	props:{  
		pscale:Number,
	},  
	methods:{
		scale() {
			return `${this.pscale} ${this.pscale} ${this.pscale}` 
		}
	},
	template: `<a-entity :scale="scale()"  position="0 .02 0" >
		<a-sphere visible=true segments-height=24 segments-width=48 scale=".01 .01 .01" rotation="0 0 0" position="0 0 0" color="#fff" instancing="count:64"></a-sphere>
	</a-entity>`
}

SPSHELL.registerComponent('instancing',{
	schema: {
		count:{default:10}
	},
	init:function() {
		const o3d = this.el.object3D
		console.log(o3d)
		const mesh = o3d.children[0]
		this.mesh = new THREE.InstancedMesh( mesh.geometry, mesh.material, this.data.count )
		this.setmatrix(0)
		this.mesh.instanceMatrix.setUsage( THREE.DynamicDrawUsage )
		this.el.object3D.add(this.mesh)
		mesh.visible = false
		console.log(this.mesh)
		this.timeofs = 0
	},
	setmatrix:function(time) {
		if(this.timeofs==0) this.timeofs = time 
		const mtx = new THREE.Matrix4()
		const mtx2 = new THREE.Matrix4()
		const mtx3 = new THREE.Matrix4()
		const col = new THREE.Color() 
		for(let i=0;i<this.data.count;i++) {
			const sc = (1-(i/this.data.count)*0.4)*2
			mtx.makeRotationY((time-this.timeofs)/20000*i)
			mtx.multiply(mtx3.makeScale(sc,sc,sc))
			mtx.multiply(mtx2.makeTranslation((1-i)*0.1*(2+Math.sin(time/300)*0.2),i*0.02,0))
			this.mesh.setMatrixAt( i, mtx )
			col.setRGB(i/this.data.count,1-i/this.data.count,(Math.sin(time/3000)+1)/2)
			this.mesh.setColorAt(i,col)
		}
		this.mesh.instanceMatrix.needsUpdate = true;
		this.mesh.instanceColor.needsUpdate = true;
	},
	update:function(old) {
	},
	tick:function(time,dur) {
		this.setmatrix(time)
	},
})

