/*
	SPATIAL SHELL APP
	basic nocode boilerplate
*/  
// Vue component definition
export default {  
	props:{  
		pscale:Number,
		speed:{
			type:Number,
			default:2000
		}
	}, 
	template: // A-Frame template
	'<a-entity>\
	<a-mixin id="torus1"  geometry="primitive: torus;　radiusTubular: 0.1; segmentsTubular: 60"></a-mixin> \
	<a-entity :scale="`${pscale} ${pscale} ${pscale}`" position="0 .06 0" > \
	<a-icosahedron scale=".1 .1 .1" position="0 0.1 0" color="rgba(234,194,99,1)" \
		:animation="`property: rotation; easing:linear;to: 0 0 360 ; loop: true; dur:${speed};`" \
		shadow material="metalness:0.5;roughness:0.5"> \
		<a-torus arc="360" radius="1.1" mixin="torus1" position="0 0 1"  color="rgba(194,23,116,1)" \
			:animation="`property:rotation; easing:linear; to: 0 360 0 ; loop: true; dur: ${speed*1.1};`" shadow> \
			<a-torus arc="360" radius="1.5" mixin="torus1" position="0 -1 0"  color="rgba(146,194,23,1)" \
				:animation="`property:rotation; easing:linear; to: 360 0 0; loop: true; dur: ${speed*1.2};`" shadow> \
				<a-torus arc="360" radius="1.9" mixin="torus1"  position="0 1 0"  color="#2dbadd" \
					:animation="`property: rotation; easing:linear; to: 0 360 0 ; loop: true; dur: ${speed*1.3};`" shadow> \
				</a-torus> \
			</a-torus> \
		</a-torus> \
	</a-icosahedron> \
	</a-entity></a-entity>'
}


