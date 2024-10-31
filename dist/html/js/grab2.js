AFRAME.registerComponent('grabbable2',{
	schema: {
		active:{default:true},
		distance:{default:0.1},
		rotate:{default:true},
		move:{type:'vec3',default:{x:1,y:1,z:1}},
		constraint_x:{type:'array'},
		constraint_y:{type:'array'},
		constraint_z:{type:'array'}
	},
	init:function() {
		this.el.addEventListener('_grab',ev=>{
			if(!this.data.active) return 
			this.el.emit('grab',{'state':ev.detail.state},false)
		})
		this.el.addEventListener('setqua',ev=>{
			if(!this.data.active) return 
			if(this.data.rotate)
				this.el.object3D.setRotationFromQuaternion(ev.detail)
		})
		this.el.addEventListener('setpos',ev=>{
			if(!this.data.active) return 
			const pos=ev.detail
			const cpos=this.el.object3D.position
//			POXA.log(this.data.move.x)
			if(this.data.move.x==0) pos.setX(cpos.x)
			if(this.data.move.y==0) pos.setY(cpos.y)
			if(this.data.move.z==0) pos.setZ(cpos.z)
			if(this.data.constraint_x.length==2){
				const c=this.data.constraint_x
				if(c[0]>pos.x) pos.setX(parseFloat(c[0]))
				else if(c[1]<pos.x) pos.setX(parseFloat(c[1]))
//				POXA.log(pos.x+"/"+pos.y+"/"+pos.z)
			}
			if(this.data.constraint_y.length==2){
				const c=this.data.constraint_y
				if(c[0]>pos.y) pos.setY(parseFloat(c[0]))
				else if(c[1]<pos.y) pos.setY(parseFloat(c[1]))
			}
			if(this.data.constraint_z.length==2){
				const cx=this.data.constraint_z
				if(c[0]>pos.z) pos.setZ(parseFloat(c[0]))
				else if(c[1]<pos.z) pos.setZ(parseFloat(c[1]))
			}
			this.el.object3D.position.copy(pos)
		})
	},
	update:function(old) {
	},
	tick:function(time,dur) {
	},
})

AFRAME.registerComponent('grab2',{
	schema: {
		active:{'default':true},
		button:{'default':"grip"},
		targetel:{type:'selector',default:null},
		realhand:{'default':false}
	},
	init:function() {
		let le=false
		this.targetel = []
		// fore cont
		const evl = {'grip':"gripchanged",'trig':"triggerchanged"}
		this.el.addEventListener(evl[this.data.button],ev=>{
			if(!this.data.active || this.grip == ev.detail.pressed) return 
			this.grip = ev.detail.pressed
			this.gel=this.data.targetel?this.data.targetel:this.el
			this.grab( this.gel.object3D.getWorldPosition(new THREE.Vector3()))
			this.squa = this.gel.object3D.getWorldQuaternion(new THREE.Quaternion()).invert()
		})
		// for hand 
		this.handc = this.el.components['hand-tracking-controls']
//	  console.log(this.handc)
		this.el.addEventListener("pinchstarted",(ev)=>{
			if(!this.data.active) return
			console.log("grab")
			this.grip = true
			this.grab( this.el.object3D.localToWorld(this.handc.indexTipPosition) ) 
			const pf = this.handc.jointPoses.slice(4*16,5*16)
			const pfm = new THREE.Matrix4(...pf).transpose()
			this.squa = (new THREE.Quaternion()).setFromRotationMatrix(pfm).invert()
		})
		this.el.addEventListener("pinchended",(ev)=>{
			if(!this.data.active) return
			this.grip = false
			this.grab( this.el.object3D.localToWorld(this.handc.indexTipPosition) ) 
		})
		this.el.addEventListener("pinchmoved",(ev)=>{
//			console.log("move")
//			console.log(ev.detail)
//			console.log( this.el.object3D)
			this.el.object3D.localToWorld(ev.detail.position)
			const pf = this.handc.jointPoses.slice(4*16,5*16)
			const pfm = new THREE.Matrix4(...pf).transpose()
			const cqua = (new THREE.Quaternion()).setFromRotationMatrix(pfm)
			this.grabmove( ev.detail.position,cqua)
		})
		this.meshupdated = false 
	},
	update:function(old) {
	},
	grab:function(tpos) {
			if(this.grip) {
				this.spos = tpos.clone()
				this.targetel = document.querySelectorAll("[grabbable2]")
				this.targetel = Array.from(this.targetel).filter(el=>{
					const wpos = el.object3D.getWorldPosition(new THREE.Vector3())
					if(wpos.distanceTo(this.spos)<el.components.grabbable2.data.distance){
						el.object3D.userData.spos = el.object3D.position.clone()
						el.object3D.userData.squa = el.object3D.quaternion.clone()
						el.emit('_grab',{'state':"start"},false)
						console.log(el.object3D.userData.spos)
						return true
					} else return false
				})
			} else {
				this.targetel.forEach(el=>{
					el.emit('_grab',{'state':"end"},false)
				})
			}		
	},
	grabmove:function(cpos,cqua) {
			const dqua = cqua.clone().multiply(this.squa)
			const dx = cpos.x - this.spos.x 
			const dy = cpos.y - this.spos.y
			const dz = cpos.z - this.spos.z 
			const dp = 	new THREE.Vector3( dx,dy, dz)
//			POXA.log(dx+'/'+dy+'/'+dz)
			this.targetel.forEach(el=>{
				const tq = dqua.clone().multiply(el.object3D.userData.squa) 
				el.emit('setqua',tq,false)
				const dpp=dp.clone().applyQuaternion(tq)
				const dpo = 	new THREE.Vector3(
					el.object3D.userData.spos.x + dp.x,
					el.object3D.userData.spos.y + dp.y,
					el.object3D.userData.spos.z + dp.z)
//				console.log("setpos")
//				console.log(dpo)
				el.emit('setpos',dpo,false)
			})		
	},
	tick:function(time,dur) {
		// for cont
		if(this.el.components['oculus-touch-controls']?.controllerPresent &&
			this.data.active && this.grip) {
			const cpos = this.gel.object3D.getWorldPosition(new THREE.Vector3())
			let cqua = new THREE.Quaternion()
			this.gel.object3D.getWorldQuaternion(cqua)
			this.grabmove(cpos,cqua)
		}
		//for hand 
		if(!this.meshupdated  && this.data.realhand &&  this.handc.mesh && this.handc.mesh.children[0]) {
				const m = this.handc.mesh.children[0] 
				m.renderOrder = -1 
				m.material.colorWrite = false
				this.meshupdated = true 
		}
	},
})