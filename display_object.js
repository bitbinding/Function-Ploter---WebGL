
var mouseX=0,mouseY=0;//网页全局鼠标坐标（通过手动绑定或调用updateMouseXY事件响应函数来更新）
var webkitVersion=String(navigator.appVersion).indexOf("WebKit/")>=0?
parseInt(navigator.appVersion.substring(navigator.appVersion.indexOf("WebKit/")+7)):600;//webkit版本
var oldWebKit=webkitVersion<535;//是否为老版本的webkit
var ieMode=window.addEventListener==null;//是否为ie8或以下版本的ie
var isFirefox=navigator.userAgent.indexOf("Firefox")>=0;//是否为火狐浏览器
var $nameToSymbol=null;//元件名称到元件引用的映射表
var $classToSymbol=null;//元件类名到元件引用的映射表
var $labelToSymbol=null;//元件标识符到元件引用的映射表
var $transformMode=true;//是否用css的transform来表示位移
var $KeyInfo=new Array(1000);//按键信息（通过在有关事件里调用updateKeyInfo函数
var $draggingObject=null;//正在拖动的影片剪辑
var $draggingMatrix=null;//正在拖动的影片剪辑与全局坐标的对应矩阵
//（第一个参数为事件对象event的引用，第二个参数设置是否按下）来更新）
var Key={//相关键码常量和获取是否按下的函数
isDown:function(keyCode){
	return (keyCode>=0 && keyCode<$KeyInfo.length)?$KeyInfo[keyCode]===true:false;
},
BACKSPACE:8,
CAPSLOCK:20,
CONTROL:17,
DELETEKEY:46,
DOWN:40,
END:35,
ENTER:13,
ESCAPE:27,
HOME:36,
INSERT:45,
LEFT:37,
PGDN:34,
PGUP:33,
RIGHT:39,
SHIFT:16,
SPACE:32,
TAB:9,
UP:38
};

function $initSectorObj(obj){
	if(obj==null){
		return null;
	}
	var children=obj.children;
	for(var i=0;i<children.length;i++){
		var item=children[i];
		var idstr=item.getAttribute("id");
		if(idstr!=null && (item.tagName.toLowerCase()=="input"||
		(item.getAttribute("class")||item.className)=="symbol")){
			if(obj[idstr]==null){
				obj[idstr]=item;
			}
		}
		if((item.getAttribute("class")||item.className)=="symbol" && 
		(item.getAttribute("symboltype")=="graphic" || item.getAttribute("symboltype")=="button")){
			$initSectorObj(item);
		}
	}
	return obj;
}



function $initSymbolIndex(){
	if(typeof($symbols)=="undefined")return;
	$nameToSymbol={};
	$classToSymbol={};
	$labelToSymbol={};
	for(var i=0;i<$symbols.length;i++){
		if($symbols[i].name!=null){
			$nameToSymbol[String($symbols[i].name)]=$symbols[i];
		}
		if($symbols[i].linkageClassName!=null){
			$classToSymbol[String($symbols[i].linkageClassName)]=$symbols[i];
		}
	}
}

function $getMovieFromSymbolItem(symbolItem,idstr){
	if(symbolItem.item){
		var node=symbolItem.item.cloneNode(true);
		$updateFrame(node,true);
		if(symbolItem.code)symbolItem.code(node);
		return node;
	}
	var div=document.createElement("div");
	div.setAttribute("class","symbol");
	if(idstr!=null){
		div.setAttribute("id",idstr);
	}
	div.style.position="absolute";
	div.style.display="inline";
	var datastr=symbolItem.data.slice(1,symbolItem.data.length-1).join("");
	div.innerHTML=datastr;
	div.setAttribute("symboltype",String(symbolItem.symbolType||"movieclip").toLowerCase());
	$updateFrame(div,true);
	symbolItem.item=div.cloneNode(true);
	if(symbolItem.code)symbolItem.code(div);
	return div;
}

function $getMovieFromName(name,idstr){
	if($nameToSymbol==null)$initSymbolIndex();
	return $nameToSymbol[name]!=null?$getMovieFromSymbolItem($nameToSymbol[name]):null;
}

function $getMovieFromClass(name,idstr){
	if($classToSymbol==null)$initSymbolIndex();
	return $classToSymbol[name]!=null?$getMovieFromSymbolItem($classToSymbol[name]):null;
}

function $getMovieFromLabel(name,idstr){
	if($labelToSymbol==null)$initSymbolIndex();
	return $labelToSymbol[name]!=null?$getMovieFromSymbolItem($labelToSymbol[name]):null;
}

function int(value){
	return parseInt(value);
}

function random(value){
	return parseInt(Math.random()*value);
}

function trace(){
	if(console && console.log && console.log.apply){
		console.log.apply(console,arguments);
	}
}

function presetStyles(obj){
	if(obj.style.opacity==null)obj.style.opacity=1;
}

function addChild(obj,parent){
	//注：在设置了timeline.js中的hasZIndex为true后，
	//需要在事先指定style.zIndex属性，
	//内建的zIndex值在[1,图层总数]之间，若有多个场景，
	//则这里的图层总数为各场景的图层数之和。
	obj.style.position="absolute";
	presetStyles(obj);
	parent.appendChild(obj);
}

function addChildOnce(obj,parent){
	obj.style.position="absolute";
	var arr=parent.children;
	var length=arr.length;
	for(i=0;i<length;i++){
		if(arr[i]==obj){
			break;
		}
	}
	presetStyles(obj);
	if(i>=length){
		parent.appendChild(obj);
	}
}

function addChildAt(obj,parent,n){
	presetStyles(obj);
	if(n>=parent.childNodes.length){
		obj.style.position="absolute";
		parent.appendChild(column);
	}else if(n>=0){
		obj.style.position="absolute";
		parent.insertBefore(parent.childNodes[n]);
	}
}

function getChildById(item,id0){
	if(item.querySelector && item.id){
		var element0=item.querySelector("#"+item.id+" > #"+id0);
		if(element0)return element0;
	}
	var children=item.children||item.childNodes;
	var child=null;
	var i;
	var length=children.length;
	for(i=0;i<length;i++){
		child=children[i];
		if(child==null || child.tagName==null){
			continue;
		}
		if(child.id==id0){
			break;
		}
	}
	return i<length?child:null;
	//return i<length?children[i]:null;
}

function removeChild(obj,parent){
	if(obj.getAttribute("buildin") || obj.className=="shape"){
		obj.style.display="none";
	}
	if(arguments.length<=1)parent=obj.parentElement||obj.parentNode;
	if(parent==null){
		return;
	}
	var arr=parent.children;
	var length=arr.length;
	for(i=0;i<length;i++){
		if(arr[i]==obj){
			break;
		}
	}
	if(i<length){
		parent.removeChild(obj);
	}
}

function removeChildIfContains(obj,parent){
	removeChild(obj,parent);
}

function Handler(caller,func,args){
	return function(event){
		this.run=function(){this(event);};
		func.apply(caller,[event].concat(args||[]));
	};
}
Handler.create=function(caller,func,args){
	return new Handler(caller,func,args||[]);
};

function drawEllipse(context,x0,y0,width0,height0,segCount,powerCount){
	if(arguments.length<6)segCount=4;
	if(arguments.length<7)powerCount=3;
	
	if(context==null){
		return;
	}
	
	var theta,rate;
	var t,sint,cost,sintprev,costprev;
	var px,py,pxprev,pyprev;
	var i;
	
	theta=2*Math.PI/segCount;	
	if(powerCount==1){
		rate=1;
	}else if(powerCount==2){
		rate=Math.tan(theta*0.5);
	}else if(powerCount==3){
		rate=Math.tan(theta*0.25)/0.75;
	}
	
	t=theta;
	costprev=1.0;
	sintprev=0.0;
	pxprev=x0+width0;
	pyprev=y0+0.5*height0;
	context.moveTo(pxprev,pyprev);
	for(i=0;i<segCount;i++){
		cost=Math.cos(t);
		sint=Math.sin(t);
		px=x0+0.5*width0*(1+cost);
		py=y0+0.5*height0*(1+sint);
		if(powerCount==1){
			context.lineTo(px,py);
		}else if(powerCount==2){
			context.quadraticCurveTo(pxprev-0.5*width0*rate*sintprev,pyprev+0.5*height0*rate*costprev,px,py);
		}else if(powerCount==3){
			context.bezierCurveTo(pxprev-0.5*width0*rate*sintprev,pyprev+0.5*height0*rate*costprev,px+0.5*width0*rate*sint,py-0.5*height0*rate*cost,px,py);
		}
		t=i+2<segCount?t+theta:0;
		costprev=cost;
		sintprev=sint;
		pxprev=px;
		pyprev=py;
	}
}

function clearCanvas(canvas,context){
	if(arguments.length==1)context=canvas.getContext("2d");
	context.clearRect(0,0,parseInt(canvas.width),parseInt(canvas.height));
}

function toColorString(color){
	var str=color.toString(16);
	var l0=str.length;
	switch(l0){
		case 6:str="#"+str;break;
		case 5:str="#0"+str;break;
		case 4:str="#00"+str;break;
		case 3:str="#000"+str;break;
		case 2:str="#0000"+str;break;
		case 1:str="#00000"+str;break;
	}
	return str;
}

function updateMouseXY(event){
	if(event && event.targetTouches && event.targetTouches.length>0){
		updateMouseXY(event.targetTouches[0]);
		return;
	}
	event=event||window.event;
	if(event.pageX || event.pageY){ 
		mouseX=event.pageX;
		mouseY=event.pageY;
	}else{
		mouseX=event.clientX + document.body.scrollLeft - document.body.clientLeft;
		mouseY=event.clientY + document.body.scrollTop - document.body.clientTop;
	}
	if($draggingObject){
		$updateDraggingObject();
	}
}
function updateKeyInfo(event,isOn){
	var keyCode=event.keyCode||event.which;
	if(keyCode>=0 && keyCode<$KeyInfo.length){
		$KeyInfo[keyCode]=isOn;
	}
}

function resetKeyInfo(){
	$KeyInfo=new Array(1000);
}

function startDrag(target,toCenter){
	stopDrag();
	if(target==null)return;
	$draggingObject=target;
	$draggingObject.ondragstartPrev=$draggingObject.ondragstart;
	$draggingObject.ondragstart=function(event){event.preventDefault();return false;};
	
	var matrix=new Matrix();
	var container=target.offsetParent;
	while(container!=null && 
	container!=document.body){
		matrix.translate(
		(container.scrollX!=null?-container.scrollX:0),
		(container.scrollY!=null?-container.scrollY:0));
		matrix.concat(new Matrix(getMatrixArray(container,true)));
		container=container.offsetParent;
	}
	matrix.invert();
	if(!toCenter){
		var point=matrix.transformPoint(new Point(mouseX,mouseY));
		var matrix0=new Matrix(getMatrixArray(target,true));
		matrix.translate(matrix0.tx-point.x,matrix0.ty-point.y);
	}
	console.log(matrix.toArray());
	$draggingMatrix=matrix;
}

function stopDrag(){
	if($draggingObject && $draggingObject.ondragstartPrev){
		$draggingObject.ondragstart=$draggingObject.ondragstartPrev;
	}
	$draggingObject=null;
	$draggingMatrix=null;
}

function $updateDraggingObject(){
	if($draggingObject && $draggingMatrix){
		var point=$draggingMatrix.transformPoint(new Point(mouseX,mouseY));
		$draggingObject.x=point.x;
		$draggingObject.y=point.y;
	}
}

function Point(x0,y0){
	this.fromData=function(x0,y0){
		var arguments_length=arguments.length;
		if(arguments_length<=1)y0=0;
		if(arguments_length<=0)x0=0;
		this.x=x0;
		this.y=y0;
	}
	this.fromArray=function(arr){
		this.fromData.apply(this,arr);
	}
	if(arguments.length==1 && typeof(arguments[0].length)!="undefined"){
		this.fromArray(arguments[0]);
	}else{
		this.fromArray(arguments);
	}
	
	this.clone=function(){
		return new Point(this.x,this.y);
	}
	
	this.toArray=function(){
		return [this.x,this.y];
	}
	
	Point.distance=function(p1,p2){
		var dx=p2.x-p1.x;
		var dy=p2.y-p1.y;
		return Math.sqrt(dx*dx+dy*dy);
	}
}

function Rectangle(x0,y0,w0,h0){
	this.fromData=function(x0,y0,w0,h0){
		var arguments_length=arguments.length;
		if(arguments_length<=3)h0=0;
		if(arguments_length<=2)w0=0;
		if(arguments_length<=1)y0=0;
		if(arguments_length<=0)x0=0;
		this.x=x0;
		this.y=y0;
		this.width=w0;
		this.height=h0;
	}
	this.fromArray=function(arr){
		this.fromData.apply(this,arr);
	}
	
	if(arguments.length==1 && typeof(arguments[0].length)!="undefined"){
		this.fromArray(arguments[0]);
	}else{
		this.fromArray(arguments);
	}
	
	
	this.clone=function(){
		return new Rectangle(this.x,this.y,this.width,this.height);
	}
	
	this.toArray=function(){
		return [this.x,this.y,this.width,this.height];
	}
	
	this.contains=function(x1,y1){
		return x1>=this.x && x1<this.x+this.width && y1>=this.y && y1<this.y+this.height;
	}
	
	this.containsPoint=function(p1){
		return this.contains(p1.x,p1.y);
	}
	
	this.intersects=function(r1){
		return r1.x<this.x+this.width && this.x<r1.x+r1.width && r1.y<this.y+this.height && this.y<r1.y+r1.height;
	}
}

function Matrix(a0,b0,c0,d0,tx0,ty0){
	this.fromData=function(a0,b0,c0,d0,tx0,ty0){
		var arguments_length=arguments.length;
		if(arguments_length<=5)ty0=0;
		if(arguments_length<=4)tx0=0;
		if(arguments_length<=3)d0=1;
		if(arguments_length<=2)c0=0;
		if(arguments_length<=1)b0=0;
		if(arguments_length<=0)a0=1;
		this.a=a0;
		this.b=b0;
		this.c=c0;
		this.d=d0;
		this.tx=tx0;
		this.ty=ty0;
	}
	this.fromArray=function(arr){
		this.fromData.apply(this,arr);
	}
	
	if(arguments.length==1 && typeof(arguments[0].length)!="undefined"){
		this.fromArray(arguments[0]);
	}else{
		this.fromArray(arguments);
	}
	
	this.concat=this.append=function(m0){
		var a0=this.a*m0.a+this.b*m0.c;
		var b0=this.a*m0.b+this.b*m0.d;
		var c0=this.c*m0.a+this.d*m0.c;
		var d0=this.c*m0.b+this.d*m0.d;
		var tx0=this.tx*m0.a+this.ty*m0.c+m0.tx;
		var ty0=this.tx*m0.b+this.ty*m0.d+m0.ty;
		this.a=a0;
		this.b=b0;
		this.c=c0;
		this.d=d0;
		this.tx=tx0;
		this.ty=ty0;
	}
	
	this.prepend=function(m0){
		var a0=m0.a*this.a+m0.b*this.c;
		var b0=m0.a*this.b+m0.b*this.d;
		var c0=m0.c*this.a+m0.d*this.c;
		var d0=m0.c*this.b+m0.d*this.d;
		var tx0=m0.tx*this.a+m0.ty*this.c+this.tx;
		var ty0=m0.tx*this.b+m0.ty*this.d+this.ty;
		this.a=a0;
		this.b=b0;
		this.c=c0;
		this.d=d0;
		this.tx=tx0;
		this.ty=ty0;
	}
	
	this.clone=function(){
		return (new Matrix(this.a,this.b,this.c,this.d,this.tx,this.ty));
	}
	
	this.toArray=function(){
		return [this.a,this.b,this.c,this.d,this.tx,this.ty];
	}
	
	this.identity=function(){
		this.a=1;
		this.b=0;
		this.c=0;
		this.d=1;
		this.tx=0;
		this.ty=0;
	}
	
	this.invert=function(){
		var div=this.a*this.d-this.b*this.c;
		var a0=this.d/div;
		var b0=-this.b/div;
		var c0=-this.c/div;
		var d0=this.a/div;
		var tx0=-this.tx;
		var ty0=-this.ty;
		this.a=a0;
		this.b=b0;
		this.c=c0;
		this.d=d0;
		this.tx=a0*tx0+c0*ty0;
		this.ty=b0*tx0+d0*ty0;
	}
	
	this.rotate=function(angle){
		var ca=Math.cos(angle);
		var sa=Math.sin(angle);
		var mt=new Matrix(ca,sa,-sa,ca,0,0);
		this.concat(mt);
	}
	
	this.scale=function(sx,sy){
		var mt=new Matrix(sx,0,0,sy,0,0);
		this.concat(mt);
	}
	
	this.translate=function(tx0,ty0){
		this.tx+=tx0;
		this.ty+=ty0;
	}
	
	this.transformPoint=function(point){
		return new Point(point.x*this.a+point.y*this.c+this.tx,point.x*this.b+point.y*this.d+this.ty);
	}
	
	this.deltaTransformPoint=function(point){
		return new Point(point.x*this.a+point.y*this.c,point.x*this.b+point.y*this.d);
	}
}

function localToGlobalByOffset(p1,container,overrideMode){
	//暂未考虑到css3的transform
	if(arguments.length<=2)overrideMode=false;
	var p2=overrideMode?p1:p1.clone();
	var containert=container;	
	while(containert!=null && containert!=document.body){
		p2.x+=containert.offsetLeft;
		p2.y+=containert.offsetTop;
		containert=containert.offsetParent;
	}
	return p2;
}

function globalToLocalByOffset(p1,container,overrideMode){
	//暂未考虑到css3的transform
	if(arguments.length<=2)overrideMode=false;
	var p2=overrideMode?p1:p1.clone();
	var containert=container;
	while(containert!=null && containert!=document.body){
		p2.x-=containert.offsetLeft;
		p2.y-=containert.offsetTop;
		containert=containert.offsetParent;
	}
	return p2;
}

function hitTestObjectByOffset(element2,element1){
	var p1=new Point(element1.offsetLeft,element1.offsetTop);
	var p2=new Point(element2.offsetLeft,element2.offsetTop);
	if(element2.parentNode!=element1.parentNode){
		localToGlobal(p1,element1.offsetParent,true);
		localToGlobal(p2,element2.offsetParent,true);
	}
	var r1=new Rectangle(p1.x,p1.y,element1.offsetWidth,element1.offsetHeight);
	var r2=new Rectangle(p2.x,p2.y,element2.offsetWidth,element2.offsetHeight);
	return r1.intersects(r2);
}

function hitTestPointByOffset(x0,y0,element1){
	var r1=new Rectangle(element1.offsetLeft,element1.offsetTop,element1.offsetWidth,element1.offsetHeight);
	return r1.contains(x0,y0);
}

function hitTestGlobalPointByOffset(x0,y0,element1){
	var p1=new Point(element1.offsetLeft,element1.offsetTop);
	localToGlobal(p1,element1.offsetParent,true);
	var r1=new Rectangle(p1.x,p1.y,element1.offsetWidth,element1.offsetHeight);
	return r1.containsPoint(p1);
}
function hitTestObject(element1,element2){
	if(element1.parentNode!=element2.parentNode){
		return false;
	}
	var r1=new Rectangle(element1.x,element1.y,element1.widthData,element1.heightData);
	var r2=new Rectangle(element2.x,element2.y,element2.widthData,element2.heightData);
	return r1.intersects(r2);
}
function hitTestPoint(x0,y0,element1){
	var r1=new Rectangle(element1.x,element1.y,element1.widthData,element1.heightData);
	return r1.contains(x0,y0);
}

function playSound(src,volume){
	var audioElement=document.createElement("audio");
	audioElement.src=src;
	if(volume!=null){
		audioElement.volume=volume;
	}
	if(audioElement.play)audioElement.play();
	return audioElement;
}

function $getAudioFromSrc(src,volume,onLoadFunc){
	var audioElement=document.createElement("audio");
	if(volume!=null){
		audioElement.volume=volume;
	}
	if(onLoadFunc)audioElement.onload=onLoadFunc;
	audioElement.src=src;
	return audioElement;
}

function $getAudioFromClassName(className){
	var res=document.getElementById("media_resources");
	if(res==null)return null;
	var children=res.children;
	for(var i=0;i<children.length;i++){
		var item=children[i];
		if(item.tagName.toLowerCase()=="audio" && item.getAttribute("linkageclassname")==className){
			return getSoundFromSrc(item.getAttribute("src"));
		}
	}
	return null;
}

function $getImageFromSrc(src,width,height,onLoadFunc){
	var imgElement=document.createElement("img");
	if(width && height){
		imgElement.width=width;
		imgElement.height=height;
	}
	if(onLoadFunc)imgElement.onload=onLoadFunc;
	//imgElement.style.position="absolute";
	imgElement.src=src;
	return imgElement;
}

function $getImageFromClassName(className){
	var res=document.getElementById("media_resources");
	if(res==null)return null;
	var children=res.children;
	for(var i=0;i<children.length;i++){
		var item=children[i];
		if(item.tagName.toLowerCase()=="img" && item.getAttribute("linkageclassname")==className){
			var width=item.getAttribute("width")?
			Number(item.getAttribute("width")):
			Number(item.getAttribute("frameright"))/20;
			var height=item.getAttribute("height")?
			Number(item.getAttribute("height")):
			Number(item.getAttribute("framebottom"))/20;
			return getImageFromSrc(item.getAttribute("src"),width,height);
		}
	}
	return null;
}

function getOriRectAuto(item){
	var tagName=item.tagName.toLowerCase();
	var rect=null;
	if(item.style.width!=null && item.style.width!="" && 
			item.style.height!=null && item.style.height!=""){
		var style_width=Number(item.style.width.replace("px",""));
		var style_height=Number(item.style.height.replace("px",""));
		if(!isNaN(style_width) && !isNaN(style_height) && style_width>0 && style_height>0){
			rect=new Rectangle(0,0,Number(style_width),Number(style_width));
		}
	}
	if(rect==null){
		if(tagName=="img" || tagName=="canvas" || tagName=="svg" || 
		tagName=="table" || tagName=="td" || tagName=="th" || tagName=="iframe"){
			rect=new Rectangle(0,0,Number(item.getAttribute("width")||item.width),Number(item.getAttribute("height")||item.height));
		}else if(item.offsetWidth!=0 && item.offsetHeight!=0){
			rect=new Rectangle(0,0,Number(item.offsetWidth),Number(item.offsetHeight));
		}
	}
	var i;
	var matrix;
	var xmin,ymin,xmax,ymax;
	var hasRange=false;
	if(rect){
		matrix=getMatrixArray(item);
		if(matrix[1]==0 && matrix[2]==0){
			rect.width*=matrix[0];
			rect.height*=matrix[3];
			rect.x+=matrix[4];
			rect.y+=matrix[5];
			return rect;
		}else{
			var points=[rect.x,rect.y,rect.x+rect.width,rect.y,rect.x+rect.width,rect.y+rect.height,rect.x,rect.y+rect.height];
			var xt,yt;
			for(i=0;i+1<points.length;i+=2){
				xt=points[i]*matrix[0]+points[i+1]*matrix[2]+matrix[4];
				yt=points[i]*matrix[1]+points[i+1]*matrix[3]+matrix[5];
				if(!hasRange){
					xmin=xt;
					ymin=yt;
					xmax=xt;
					ymax=yt;
					hasRange=true;
				}else{
					if(xmin>xt)xmin=xt;
					if(ymin>yt)ymin=yt;
					if(xmax<xt)xmax=xt;
					if(ymax<yt)ymax=yt;
				}
			}
			return new Rectangle(xmin,ymin,xmax-xmin,ymax-ymin);
		}
	}

	
	var children=item.children;
	if(children==null){
		return null;
	}
	hasRange=false;
	var rect=null;
	for(i=0;i<children.length;i++){
		rect=getOriRectAuto(children[i]);		
		
		if(rect==null){
			continue;
		}
		if(!hasRange){
			xmin=rect.x;
			ymin=rect.y;
			xmax=rect.width+rect.x;
			ymax=rect.height+rect.y;
			hasRange=true;
		}else{
			if(xmin>rect.x)xmin=rect.x;
			if(ymin>rect.y)ymin=rect.y;
			if(xmax<rect.width+rect.x)xmax=rect.width+rect.x;
			if(ymax<rect.height+rect.y)ymax=rect.height+rect.y;
		}
	}
	if(!hasRange){
		return null;
	}
	rect=new Rectangle(xmin,ymin,xmax-xmin,ymax-ymin);
	matrix=getMatrixArray(item);
	points=[rect.x,rect.y,rect.x+rect.width,rect.y,rect.x+rect.width,rect.y+rect.height,rect.x,rect.y+rect.height];
	hasRange=false;
	for(i=0;i+1<points.length;i+=2){
		xt=points[i]*matrix[0]+points[i+1]*matrix[2]+matrix[4];
		yt=points[i]*matrix[1]+points[i+1]*matrix[3]+matrix[5];
		if(!hasRange){
			xmin=xt;
			ymin=yt;
			xmax=xt;
			ymax=yt;
			hasRange=true;
		}else{
			if(xmin>xt)xmin=xt;
			if(ymin>yt)ymin=yt;
			if(xmax<xt)xmax=xt;
			if(ymax<yt)ymax=yt;
		}
	}
	return new Rectangle(xmin,ymin,xmax-xmin,ymax-ymin);
}

function getOriRect(item){
	return item.oriRect||getOriRectAuto(item);
}

function setOriRect(item,x0,y0,width0,height0){
	item.oriRect=new Rectangle(x0,y0,width0,height0);
}

function setItemWidthWithScale(item,width0){
	if(item.oriRect==null)item.oriRect=getOriRectAuto(item);
	item.oriRect.width=width0/Math.abs(item.scaleX);
}

function setItemHeightWithScale(item,height0){
	if(item.oriRect==null)item.oriRect=getOriRectAuto(item);
	item.oriRect.height=height0/Math.abs(item.scaleY);
}


function initDivBounds(itemarray,offset){
	if(arguments.length==1)offset=0;
	var i;
	var rect;
	for(i=0;i<itemarray.length;i++){
		if(itemarray[i].offsetWidth!=0 && itemarray[i].offsetHeight!=0){
			continue;
		}
		rect=getOriRectAuto(itemarray[i]);
		if(rect==null || rect.width==0 || rect.height==0){
			continue;
		}
		rect.width+=offset;
		rect.height+=offset;
		itemarray[i].style.width=rect.width+"px";
		itemarray[i].style.height=rect.height+"px";
		itemarray[i].width=rect.width;
		itemarray[i].height=rect.height;
		presetStyles(itemarray[i]);
	}
}

function setMatrixArray(item,matrixt){
	if(item==null || matrixt==null || matrixt.length<6){
		return;
	}
	item.transformMatrix=matrixt;
	var matrixstr="";
	if($transformMode){
		if(item.style.left==""){
			item.style.left="0px";
			item.style.top="0px";
		}
		matrixstr="matrix("+matrixt.join(",")+")";
		item.style.transform=matrixstr;
		item.style.webkitTransform=matrixstr;
	}else{
		matrixstr="matrix("+matrixt.slice(0,4).join(",")+",0,0)";
		item.style.transform=matrixstr;
		item.style.webkitTransform=matrixstr;
		item.style.left=matrixt[4]+"px";
		item.style.top=matrixt[5]+"px";
		/*if(oldWebKit){
			//兼容早期webkit浏览器
			var mtx0=matrixt.length>4?matrixt[4]:item.offsetLeft;
			var mty0=matrixt.length>5?matrixt[5]:item.offsetTop;
			var offsetLeft=item.offsetLeft;
			var offsetTop=item.offsetTop;
			item.style.left=offsetLeft+"px";
			item.style.top=offsetTop+"px";
			item.style.transform="matrix("+matrixt.slice(0,4).concat([mtx0-offsetLeft,mty0-offsetTop]).join(",")+")";
			item.style.webkitTransform=item.style.transform;
		}*/
	}
}

function getMatrixArray(item,ignoreCache){
	if(!ignoreCache && item.transformMatrix!=null && item.transformMatrix.length==6){
		return item.transformMatrix;
	}
	var str=item.style.transform;
	if(str==null)str="";
	var i=str.indexOf("matrix(");
	var j=i>=0?str.indexOf(")",i+7):-1;
	var matrixstr;
	var matrix;
	if(i>=0 && j>=0){
		matrixstr=str.substring(i+7,j);
		matrix=matrixstr.split(",");
		matrix.length=6;
		for(i=0;i<matrix.length;i++){
			matrix[i]=Number(matrix[i]);
		}
	}else{
		matrix=[1,0,0,1,0,0];
	}
	matrix[4]+=item.offsetLeft!=null?item.offsetLeft:0;
	matrix[5]+=item.offsetTop!=null?item.offsetTop:0;
	if(!ignoreCache){
		item.transformMatrix=matrix;
	}
	return matrix;
}

(function(){
	function getTranslateX(item){
		return getMatrixArray(item)[4];
	}

	function getTranslateY(item){
		return getMatrixArray(item)[5];
	}

	function setTranslateX(item,x0){
		var matrix=getMatrixArray(item);
		matrix[4]=x0;
		setMatrixArray(item,matrix);
	}

	function setTranslateY(item,y0){
		var matrix=getMatrixArray(item);
		matrix[5]=y0;
		setMatrixArray(item,matrix);
	}

	function getWidth(item){
		if(item.oriRect==null)item.oriRect=getOriRectAuto(item);
		return item.oriRect.width*getScaleX(item);
	}

	function getHeight(item){
		if(item.oriRect==null)item.oriRect=getOriRectAuto(item);
		return item.oriRect.height*getScaleY(item);
	}

	function setWidth(item){
		if(item.oriRect==null)item.oriRect=getOriRectAuto(item);
		return item.oriRect.width*getScaleX(item);
	}

	function setHeight(item){
		if(item.oriRect==null)item.oriRect=getOriRectAuto(item);
		return item.oriRect.height*getScaleY(item);
	}

	function setScaleX(item,scaleX){
		var matrix=getMatrixArray(item);
		var scaleX0=getScaleX(item);
		if(scaleX0==0){
			matrix[0]=scaleX;
			matrix[1]=0;
		}else{
			var rate=scaleX/scaleX0
			matrix[0]*=rate;
			matrix[1]*=rate;
		}
		item.negativeScale=scaleX<0;
		setMatrixArray(item,matrix);
	}

	function getScaleX(item){
		var matrix=getMatrixArray(item);
		var scaleX=Math.sqrt(matrix[0]*matrix[0]+matrix[1]*matrix[1]);
		if(item.negativeScale){
			scaleX=-scaleX;
		}
		return scaleX;
	}

	function setScaleY(item,scaleY){
		var matrix=getMatrixArray(item);
		var scaleY0=getScaleY(item);
		if(scaleY0==0){
			matrix[2]=0;
			matrix[3]=scaleY;
		}else{
			var rate=scaleY/scaleY0;
			matrix[2]*=rate;
			matrix[3]*=rate;
		}
		setMatrixArray(item,matrix);
	}

	function getScaleY(item){
		var matrix=getMatrixArray(item);
		var scaleY=Math.sqrt(matrix[2]*matrix[2]+matrix[3]*matrix[3]);
		return scaleY;
	}

	function setRotation(item,rotation){
		if(item.negativeScale)rotation+=180;
		var matrix=getMatrixArray(item);
		var r0=Math.atan2(matrix[1],matrix[0]);
		var rt=rotation*Math.PI/180;
		var cos0=Math.cos(r0);
		var sin0=Math.sin(r0);
		var s=[matrix[0]*cos0+matrix[1]*sin0,-matrix[0]*sin0+matrix[1]*cos0,
		matrix[2]*cos0+matrix[3]*sin0,-matrix[2]*sin0+matrix[3]*cos0];
		var cost=Math.cos(rt);
		var sint=Math.sin(rt);
		setMatrixArray(item,[s[0]*cost-s[1]*sint,s[0]*sint+s[1]*cost,s[2]*cost-s[3]*sint,s[2]*sint+s[3]*cost,matrix[4],matrix[5]]);
	}

	function getRotation(item){
		var matrix=getMatrixArray(item);
		var rotation=Math.atan2(matrix[1],matrix[0])*180/Math.PI;
		if(item.negativeScale){
			rotation+=180;
			if(rotation>180){
				rotation-=360;
			}
		}
		return rotation;
	}

	function setAlpha(item,alpha0){
		item.style.opacity=alpha0;
	}

	function getAlpha(item){
		var stralpha0=item.style.opacity;
		var alpha0=1;
		if(stralpha0!=null || stralpha0!=""){
			alpha0=Number(stralpha0);
			if(isNaN(alpha0)){
				alpha0=1;
			}
		}
		return alpha0;
	}
	

	function getVisible(item){
		return window.getComputedStyle(item, null)['display']!="none";
	}
	
	function setVisible(item,vis){
		item.style.display=vis?"inline":"none";
	}
	HTMLElement.prototype.__defineGetter__("x",function(){return getTranslateX(this);});
	HTMLElement.prototype.__defineGetter__("y",function(){return getTranslateY(this);});
	HTMLElement.prototype.__defineSetter__("x",function(value){setTranslateX(this,value);});
	HTMLElement.prototype.__defineSetter__("y",function(value){setTranslateY(this,value);});
	HTMLElement.prototype.__defineGetter__("scaleX",function(){return getScaleX(this);});
	HTMLElement.prototype.__defineGetter__("scaleY",function(){return getScaleY(this);});
	HTMLElement.prototype.__defineSetter__("scaleX",function(value){setScaleX(this,value);});
	HTMLElement.prototype.__defineSetter__("scaleY",function(value){setScaleY(this,value);});
	HTMLElement.prototype.__defineGetter__("rotation",function(){return getRotation(this);});
	HTMLElement.prototype.__defineSetter__("rotation",function(value){return setRotation(this,value);});
	HTMLElement.prototype.__defineGetter__("alpha",function(){return getAlpha(this);});
	HTMLElement.prototype.__defineSetter__("alpha",function(value){setAlpha(this,value);});
	HTMLElement.prototype.__defineGetter__("visible",function(){return getVisible(this);});
	HTMLElement.prototype.__defineSetter__("visible",function(value){setVisible(this,value);});
	
	HTMLElement.prototype.__defineGetter__("_xscale",function(){return 100*getScaleX(this);});
	HTMLElement.prototype.__defineGetter__("_yscale",function(){return 100*getScaleY(this);});
	HTMLElement.prototype.__defineSetter__("_xscale",function(value){setScaleX(this,value/100);});
	HTMLElement.prototype.__defineSetter__("_yscale",function(value){setScaleY(this,value/100);});
	HTMLElement.prototype.__defineGetter__("_alpha",function(){return 100*getAlpha(this);});
	HTMLElement.prototype.__defineSetter__("_alpha",function(value){setAlpha(this,value/100);});
	
	HTMLElement.prototype.__defineGetter__("widthData",function(){return getWidth(this);});
	HTMLElement.prototype.__defineGetter__("heightData",function(){return getHeight(this);});
	HTMLElement.prototype.__defineSetter__("widthData",function(value){setWidth(this,value);});
	HTMLElement.prototype.__defineSetter__("heightData",function(value){setHeight(this,value);});
	
	
	HTMLElement.prototype.hitTestObject=function(element2){
		return hitTestObject(this,element2);
	}
	HTMLElement.prototype.hitTestPoint=function(x0,y0){
		return hitTestObject(x0,y0,this);
	}
	HTMLElement.prototype.hitTest=function(){
		if(arguments.length==1){
			return hitTestObject(this,arguments[0]);
		}else if(arguments.length==2){
			return hitTestObject(arguments[0],arguments[1],this);
		}else{
			return null;
		}
	}
	
	HTMLElement.prototype.transform={
	get matrix(){
		var matrixarr=getMatrixArray(this);
        return new Matrix(matrixarr[0],matrixarr[1],matrixarr[2],matrixarr[3],matrixarr[4],matrixarr[5]);
    },
    set matrix(value){
        if(value==null){
			value=new Matrix();
		}
		var matrixarr=[value.a,value.b,value.c,value.d,value.tx,value.ty];
		setMatrixArray(this,matrixarr);
    }};
	
	HTMLElement.prototype.startDrag=function(toCenter){
		startDrag(this,toCenter);
	};
	HTMLElement.prototype.stopDrag=function(){
		stopDrag(this);
	};
	HTMLElement.prototype.addChild=function(obj){
		addChild(obj,this);
	};
	HTMLElement.prototype.addChildAt=function(obj,index){
		addChildAt(obj,this,index);
	};
	
	HTMLElement.prototype.removeChildIfNotBuildIn=function(obj){
		removeChild(obj);
	};
	
	HTMLElement.prototype.getChildById=function(idstr0){
		return getChildById(this,idstr0);
	};
	
	HTMLElement.prototype.__defineGetter__("numChildren",function(){return this.children.length;});
	
	HTMLInputElement.prototype.__defineGetter__("text",function(){return this.value});
	HTMLInputElement.prototype.__defineSetter__("text",function(value0){this.value=value0});
	
})();




