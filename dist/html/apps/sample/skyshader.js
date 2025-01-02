/*
	SPATIAL SHELL APP
	sky shader sample 
*/  
// Vue component definition
export default {  
	props:{  
		pscale:Number,
		speed:{
			type:Number,
			default:30
		}
	},  
	methods:{

	},
	template: 	// A-Frame template 
	'<a-entity  position="0 .06 0" > \
		<a-sky  :material="`shader:skyshader;mmode:3;s:${speed/10000}`" radius="100" segments-height="60" segments-width="120" rotation="0 -90 0"></a-sky> \
	</a-entity>'
}

// A-Frame component (user wrapper function)
SPSHELL.registerShader('skyshader', {
	schema: {
		timestamp: {type:'time', is:'uniform', default:0},
		mmode: {type:'number', is:'uniform', default:3},
		m: {type:'number', is:'uniform', default:0.01},
		s: {type:'number', is:'uniform', default:0.002},
		sd: {type:'number', is:'uniform', default:0.5},
		vm: {type:'number', is:'uniform', default:20},
	},
	raw: false,
	vertexShader:`
out vec2 tuv ;
out vec3 vpos ;

uniform float timestamp;

const float PI = 3.141592654 ;
void main() {
	tuv = vec2((uv.x-0.5)*2.,uv.y-0.5) ;
	vec3 tpos = position ;
	vpos = (modelMatrix * vec4( tpos,1.0)).xyz ;
	gl_Position = projectionMatrix * modelViewMatrix * vec4( tpos, 1.0 );
}
`,
	fragmentShader: `

uniform float timestamp ;
uniform float m ; // density .001-.01
uniform float s ; // speed +-0.001-0.05
uniform float sd ; // dense 0.03-0.5
uniform float vm  ; //h mag 0.5-2.
uniform int mmode ; //mirror mode
		
in vec2 tuv ;

float PI = 3.14159265358979;
float PI2 = 3.14159265358979*2. ;

vec3 hsv(float h, float s, float v){
		vec4 t = vec4(1.0, 2.0 / 3.0, 1.0 / 3.0, 3.0);
		vec3 p = abs(fract(vec3(h) + t.xyz) * 6.0 - vec3(t.w));
		return v * mix(vec3(t.x), clamp(p - vec3(t.x), 0.0, 1.0), s);
}
float random(vec2 v){
	return fract(sin(dot(v, vec2(12.9898, 78.233))) * 43758.5453);
}
float interpolation(float f){
	return f * f * (3.0 - 2.0 * f);
}
float n(float m,vec2 p,vec2 o) {
		vec2 pn = (p+o)/m ;
		vec2 pd = fract(pn) ;
		vec2 pv = floor(pn) ;
		 float r1 = random(pv) ;
		 float r2 = random(vec2(pv.x+1.,pv.y)) ;
		 float r3 = random(vec2(pv.x,pv.y+1.)) ;
		 float r4 = random(vec2(pv.x+1.,pv.y+1.)) ;
		 float v = mix(mix(r1,r2,interpolation(pd.x)),mix(r3,r4,interpolation(pd.x)),interpolation(pd.y)) ;
		 return v; 
}

void main(){
		vec2 ss = vec2(0.5-sd,0.5+sd);
		float t = 1. ;
		vec2 uv = tuv ;
		if(mmode == 3 ) {
			float sq32 = sqrt(3.)/2. ;
			uv.x = abs(uv.x) ;
			float tan = uv.y/uv.x ;
			if(tan > 1./sqrt(3.)) {
			} else if(tan > -1./sqrt(3.)) {
				mat2 mat = mat2(0.5,sq32,
					sq32,-0.5) ;
				uv = mat * uv;
			} else {
				mat2 mat = mat2(-0.5,sq32,
					-sq32,-0.5) ;
				uv = mat * uv ;
			}
		} else if(mmode == 4) {
			uv=vec2(abs(tuv.x),abs(tuv.y));
			if(uv.x<uv.y) { uv = vec2(uv.y,uv.x);}
		} else if(mmode == 2){
			uv=vec2(abs(tuv.x),tuv.y);			
		}
		float v = n(m,uv.xy,-vec2((timestamp)/210.*s,(timestamp)/200.*s)) ;
		v = smoothstep(ss.x,ss.y,fract(v*t));
		vec3 col = vec3(pow(sin(v*vm*6.),0.5))*vec3((sin(timestamp/5000.*PI2)+1.)*0.5,.0,.5) ;	
		gl_FragColor = vec4(col, 1.0);
	}
`
})

