
/*
	SPATIAL SHELL APP
	glb viewer 
*/
export default {
	props:{
		pscale:Number,
		psrc:String,
		ppos:{
			type:String,
			default:"0 0 0"
		}
	},
	methods:{
		scale() {
			return `${this.pscale} ${this.pscale} ${this.pscale}`
		}
	},
	template: `<a-entity  >
	  <a-sphere radius=0.01 color=white opacity=0.5></a-sphere>
		<a-gltf-model :src="psrc" :scale="scale()" :position="ppos"></a-gltf-model>
	</a-entity>`
}