/*
	SPATIAL SHELL APP
	plane mesh graph
*/  
// Vue component definition
export default {  
	props:{  
		pscale:Number,
		speed:{
			type:Number,
			default:1
		}
	},  
	methods:{
		scale() {
			return `${this.pscale} ${this.pscale} ${this.pscale}` 
		}
	},
	template: 	// A-Frame template 
	'<a-entity :scale="scale()"  position="0 .06 0" rotation="-90 0 0"> \
		<a-entity scale=".2 .2 .2" position="0 0.05 0" :dynamic-graph="`speed:${speed}`"></a-entity> \
	</a-entity>'
}

// A-Frame component (user wrapper function)
SPSHELL.registerComponent('dynamic-graph', {
		schema: {
				speed: {default:1},
				width: {type: 'number', default: 1},
				height: {type: 'number', default: 1},
				widthSegments: {type: 'int', default: 50},
				heightSegments: {type: 'int', default: 50}
		},
		
		init: function () {
				// シーンからThree.jsのオブジェクトを取得
				this.sceneEl = this.el.sceneEl.object3D;

				// パラメータの初期化
				this.time = 0;

				// PlaneBufferGeometryの作成
				this.geometry = new THREE.PlaneGeometry(
						this.data.width,
						this.data.height,
						this.data.widthSegments,
						this.data.heightSegments
				);

				// カラー属性の追加
				const colorArray = new Float32Array(this.geometry.attributes.position.count * 3); // RGBの3要素
				this.geometry.setAttribute('color', new THREE.BufferAttribute(colorArray, 3));
				
				// 頂点の位置を更新する関数
				this.updateVertices = (geometry, t) => {
						const position = geometry.attributes.position;
						const color = geometry.attributes.color;
						const zf = (x, y, t) => {
							return (Math.sin(x*25 + t*1.7) * Math.cos(y*10 + t*1.5)) * 0.1;
						}
						const cf = (x, y, z, t) =>{
								// 色を設定する関数
								const r =  Math.abs(Math.sin(x*y*y*50 + t)+1)*0.5;
								const g =  Math.abs(Math.cos(x*x*y*70 + t)+1)*0.5;
								const b = Math.abs(Math.sin(z*6 + t));
								return [r,g,b]				
						}
				
						for (let i = 0; i < position.count; i++) {
								const x = position.getX(i);
								const y = position.getY(i);
								const z = zf(x, y, t);
								position.setZ(i, z);
								color.setXYZ(i, ...cf(x,y,z,t)); // RGBそれぞれに値を設定
						}
				
						// 更新を通知
						position.needsUpdate = true;
						color.needsUpdate = true;
						geometry.computeVertexNormals();
				};
				
				// 頂点カラー対応のマテリアルとメッシュの設定
				const material = new THREE.MeshStandardMaterial({ 
						vertexColors: true, // 頂点ごとの色を有効化
						side: THREE.DoubleSide,
						wireframe:false,
						flatShading:true,
						metalness:0.6,
						roughness:0.5
				});
				this.mesh = new THREE.Mesh(this.geometry, material);

				// メッシュをシーンに追加
				this.el.setObject3D('mesh', this.mesh);
		},

		tick: function (time, timeDelta) {
				// 時間変数を更新
				this.time = time * this.data.speed / 1000; // 秒単位に変換

				// 頂点の位置を毎フレーム更新
				try {	//エラーで止まるとresumeできないことがあるのでcatchする
					this.updateVertices(this.geometry, this.time);
				}	catch(err) {
					console.log(err) 
				}
				
		}
});