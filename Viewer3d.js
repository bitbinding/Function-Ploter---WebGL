








//import flash.system.fscommand;
function Viewer3d(width0,height0,fname,hideBack0,rotationType0,useSmooth0,useSpecular0,sight0){
	if(arguments.length<8)sight0=55.00000001;
	if(arguments.length<7)useSpecular0=true;
	if(arguments.length<6)useSmooth0=false;
	if(arguments.length<5)rotationType0=0;
	if(arguments.length<4)hideBack0=0;
	if(arguments.length<3)fname="";//构造方法
	
	this.shape=null;
	this.graphics=null;
	this.gl=null;

	this.vetexBuffer=null;
	this.vetexData=null;
	this.normalBuffer=null;
	this.normalData=null;
	this.uvBuffer=null;
	this.uvData=null;
	this.programs=[];
	this.currentProgram=-1;


	this.toushiMatrix=null;//透视矩阵
	this.rootAdditionMatrix=null;//用于模型矩阵的最后叠加，与根模型的变换和旋转方式有关，modelMatrix0*rootModelMatrix=modelMatrix
	this.rotationMatrix0=null;//模型的自旋转矩阵
	this.rotationMatrix=null;//模型的旋转矩阵
	this.modelMatrix0=null;//模型的用来传递的模型变换矩阵
	this.modelMatrix=null;//模型的最终模型变换矩阵
	this.perspectiveMatrix=null;//模型的透视变换矩阵
	this.spotDistanceMatrix=null;//模型的点光源距离矩阵
	
	var tanS;//视角的一半的正切值
	this.mdx;//画面垂直线的灭点横坐标
	this.mdy;//画面垂直线的灭点纵坐标
	var sx;//站点横坐标
	var sy;//站点与画面的距离
	//var s1:Number,s2:Number;//求得的透视图的点坐标
	//var zoomy:Number;//与真实横、竖坐标的缩放比值		
	var facesMax=21000;//var fgrid:Array;
	//var ggrid:Array;
	//var board:MovieClip;
	this.spotx=275,this.spoty=0,this.spotz=0,this.spotk=true;//点光源坐标和比例系数（0和1），spotk为0时为平行光源。
	this.spotInten=0.8;//光强。
	this.ambientr=67,this.ambientg=67,this.ambientb=70;//环境光。
	this.ks=0.25,this.ns=5;//高光强度和光泽度
	this.tx=0,this.ty=0,this.tz=0;//形体的位置。
	this.rx=0;//形体的旋转角度。
	this.ry=0;
	this.rz=0;
	this.rw=NaN;//rw不为NaN时为四元数旋转，为NaN时为欧拉角旋转（先z再y然后x）
	this.scaleShape=1;//视图的缩放比例。
	//形体需手工定义部分
	this.point=new Array();//形体原始点集。
	this.coord=new Array();//形体用点下标表示的平面集。
	this.uv=new Array();//uv坐标集（二维点集），取值范围为[0,1]（可选，缺省则无贴图）。
	this.coord2=new Array();//每个平面上每点对应的uv坐标集（暂不支持，缺省则uv与point的每个元素相对应，否则与coord的元素相对应）。
	this.colour=0x00ccff;//形体的颜色。	
	this.bmpd=null;//贴图，导入完外界后自动调用createUVMatrix方法对uv进行矩阵生成，位图的大小改变时需要重新更新。

	this.texture=null;
	this.child;//子模型，使用这个模型的局部坐标
	this.comrade;//伙伴模型，使用这个模型的绝对坐标，渲染当前模型时会自动独立渲染伙伴模型。
	//形体自动生成部分
	var pointt=new Array();//形体变形后点集。
	var coordn=new Array();//平面的法向量。
	this.coordc=new Array();//平面的颜色。
	var pointn=new Array();//顶点的法向量。
	this.pointc=new Array();//顶点的颜色。
	var coorda=new Array();//用于additionalFix的附加信息
	this.uvm=new Array();//uv和位图大小对应的uv转换矩阵，与coord的元素相对应。
	this.uvm2=new Array();//uv和位图大小对应的第二个uv转换矩阵，仅用于四边形透视贴图中。
	this.planeArray=new Array();//用来排序和呈现的平面的信息集，只有前面一部分有效。
	var ul;
	//var loader=new Loader;
	this.useSpecular;//应用镜面反射。
	this.useSmooth=false;//应用平滑，想应用但之前未应用时需要将这个属性设为true后调用createN方法重新生成法向量。
	this.highSmooth=false;//应用三色之间的平滑（否则为应用二色之间的平滑）
	this.hideBack;//背面消隐，1表示消隐背面，0表示不消隐，-1表示消隐正面。
	this.trimEnabled=true;//隐藏外面模式开启。
	this.trimEnabled2=true;//裁剪模式开启（未实现）。
	this.rotationType=0;//旋转模式，分0和1两种。
	this.wid,this.hei=0;//构造方法所定义的宽高度
	this.ymins=10;//原纵坐标小于sy/ymins时视为无效坐标（裁剪式关闭时）或限制其深度（裁剪模式开启时）。
	this.ymax=Infinity;//原纵坐标大于ymax时视为无效坐标（裁剪式关闭时）或限制其深度（裁剪模式开启时）。
	var ntrim=2;//近处下限，比ymins小，原纵坐标小于sy/ymins时被切割。
	this.pxedge=50;//裁剪模式下，透视图上横坐标小于-pxedge或大于wid+pxedge时视为出界。		
	this.pyedge=50;//裁剪模式下，透视图上纵坐标大于wid+pyedge时视为出界。
	this.pyedge2=-this.mdy;//裁剪模式下，透视图上纵坐标小于mdy+pyedge2时视为出界。
	this.gridWid=100,this.gridHei=100;//每格宽高度
	var matrix2=new Matrix();//bmpdMatrix所用的中间矩阵
	this.useUvm2=true;//使用四边形双重贴图
	this.usePerspective=true;//一般采用透视图，为false时显示成轴测图	
	this.modelArr=new Array();
	this.n=0;//有效面数
	this.m=0;//有效贴图数
	this.childymin=0;//作为子模型的最近距离
	this.childymax=Infinity;//作为子模型的最远距离
	this.renderedPlaneMax=facesMax;
	this.quickSortEnabled=true;//允许按每个最大深度排序。
	this.additionalFixEnabled=false;//允许进行排序后的进一步修正。
	this.depthMode=0;//深度判断模式（additionalFixEnabled为false时有效）
	this.angleLimit=45;//点拆分时的临界角
	this.frameList;//影片剪辑帧序列图片数组
	this.frameListRect;//影片剪辑每帧的包围矩形数组
	this.frameListi;//影片剪辑帧序列播放状态
	this.usePerspectiveRotation=true;//影片剪辑帧序列显示时应用由透视关系引发的旋转（需要保证加载时旋转方向正确，即加载后的序列左右方向顺时针旋转，上下方向向下旋转）
	this.useListRotationx=false;//影片剪辑帧序列播放状态是否表示上下旋转
	this.listrxmin=-90;//影片剪辑能表示的上下旋转角度的最小值
	this.listrxmax=90;//影片剪辑能表示的上下旋转角度的最大值
	this.rootModel=this;
	this.parentModel;
	this.uncomradeModel;//public var centy:Number=100;//旋转的中心坐标离站点的距离	
	this.useExpandPixel=true;
	this.expandFillRange=0.5;
	this.expandFillRate=1.05;
	this.patternType="repeat";
	
	this.set_bitmap=set_bitmap0;
	this.get_bitmap=get_bitmap0;
	this.onloadBitmapComplete=null;//图片加载成功时的响应函数
	this.onloadBitmapError=null;//图片加载失败时的响应函数
	
	this.createNew=createNew0;	
	this.createNew(width0,height0,fname,hideBack0,rotationType0,useSmooth0,useSpecular0,sight0);	
	function createNew0(width0,height0,fname,hideBack0,rotationType0,useSmooth0,useSpecular0,sight0){
		
		//构造方法
		var colorf=0x00ccff,spotInten0=0.8,spotx0=363,spoty0=0,spotz0=0;
		tanS=Math.tan(sight0/2*Math.PI/180);//视角的一半的正切值
		this.mdx=width0/2;//画面垂直线的灭点横坐标
		this.mdy=height0/2;//画面垂直线的灭点纵坐标
		
		sx=width0/2;//站点横坐标
		sy=width0/(2*tanS);//站点与画面的距离
		this.wid=width0;
		this.hei=height0;
		this.spotx=this.wid/2;
		var i;	
		this.spotx=spotx0;
		this.spoty=spoty0;
		this.spotz=spotz0;
		this.spotInten=spotInten0;
		this.colour=colorf;//dcolour=dcolorf;
		this.hideBack=hideBack0;
		this.rotationType=rotationType0;
		this.useSmooth=useSmooth0;
		this.useSpecular=useSpecular0;
		this.rootModel=this;
		this.parentModel=this;
		this.uncomradeModel=this;
		var fnameArray=fname.split("|");
		//if(fnameArray[0]!=""){
		//	this.loadRequiredFile(fnameArray[0]);
		//}
		if(fnameArray.length>1){
			this.set_bitmap(fnameArray[1]);
			
		}
	}
	
	this.createShape=function(){
		this.shape=document.createElement("canvas");
		this.shape.width=this.wid;
		this.shape.height=this.hei;
		//this.graphics=this.shape.getContext("2d");
	}
	
	this.updateRelation=function(){
		//更新其下子模型的传递信息
		var i=0;
		var leng=0;
		var model=null;
		if(this.child!=null&&this.child.length>0){
			leng=this.child.length;
			for(i=0;i<leng;i++){
				model=this.child[i];
				if(model==null){
					continue;
				}
				model.parentModel=this;
				model.rootModel=this.rootModel;
				if(this.rotationType>=0){
					model.rotationType=model.rotationType>=0?(this.rotationType==2?1:this.rotationType):(this.rotationType==2?-2:-1-this.rotationType);
				}else{
					model.rotationType=model.rotationType>=0?-1-this.rotationType:this.rotationType;
				}
				if(model.child!=null&&model.child.length>0 || 
				   model.comrade!=null&&model.comrade.length>0){
					model.updateRelation();
				}
			}
		}
		if(this.comrade!=null&&this.comrade.length>0){
			leng=this.child.length;
			model=this.comrade[i];
			for(i=0;i<leng;i++){
				model=this.comrade[i];
				if(model==null){
					continue;
				}
				model.uncomradeModel=this;
				//model.rootModel=this.rootModel;
				if(this.rotationType>=0){
					model.rotationType=model.rotationType>=0?(this.rotationType==2?1:this.rotationType):(this.rotationType==2?-2:-1-this.rotationType);
				}else{
					model.rotationType=model.rotationType>=0?-1-this.rotationType:this.rotationType;
				}
				if(model.child!=null&&model.child.length>0 || 
				   model.comrade!=null&&model.comrade.length>0){
					model.updateRelation();
				}
			}
		}
	}
	
	/*this.loadBitmapFile=function(event){
		event=event||window.event;//加载位图文件
		this.bmpd=(loader.content).bitmapData;
		if(uvm.length<=0){
			this.createUVMatrix();
		}
		this.plot();
		dispatchEvent(new Event("Texture Complete"));
	}*/
		
	this.createN=function(arg0,arg1){
		//生成顶点和面的法向量(单位向量)，并初步纠正一些错误的平面。（模型或平滑属性改变时需要）
		//arg0,arg1为保留参数
		var point=this.point;
		var coord=this.coord;
		var uv=this.uv;
		var coord2=this.coord2;
		var vx,vy,vz,vx2,vy2,vz2;
		var leng=point.length;
		var leng2=coord.length;
		var pointc=this.pointc;
		var i,j;
		var d1,d2,d3,dmax;//距离
		if(pointt.length!=point.length){
			pointt=new Array(leng);//数量不匹配时则初始化
			for(i=0;i<leng;i++){
				pointt[i]=new Array(3);
			}
		}
		if(coordn.length!=leng2){
			coordn=new Array(leng2);//数量不匹配时则初始化
			for(i=0;i<leng2;i++){
				coordn[i]=new Array(4);
			}
		}
		if(this.coordc.length!=leng2){
			this.coordc=new Array(leng2);//数量不匹配时则初始化	
		}
		//if(this.useSmooth){
			if(pointn.length!=point.length){
				pointn=new Array(leng);//数量不匹配时则初始化
				pointc=new Array(leng);//数量不匹配时则初始化
				this.pointc=pointc;
				for(i=0;i<leng;i++){
					pointn[i]=new Array(3);
				}
			}
			for(i=0;i<leng;i++){
				pointn[i][0]=0;
				pointn[i][1]=0;
				pointn[i][2]=0;
			}
		//}
		for(i=0;i<leng2;i++){
			if(coord[i][3]==undefined||coord[i][2]==undefined||coord[i][1]==undefined||coord[i][0]==undefined||coord[i][0]<0||coord[i][0]>=leng||coord[i][1]<0||coord[i][1]>=leng||coord[i][2]<0||coord[i][2]>=leng||coord[i][3]>=leng){
				//trace(coord[i]);
				coord[i]=[0,0,0,-1];//纠正错误
				coordn[i]=[0,1,0,0];
				continue;
			}//trace(coord[2]);
			if(coord[i][3]>=0){
				vx=point[coord[i][1]][0]-point[coord[i][2]][0];
				vy=point[coord[i][1]][1]-point[coord[i][2]][1];
				vz=point[coord[i][1]][2]-point[coord[i][2]][2];
				vx2=point[coord[i][3]][0]-point[coord[i][0]][0];
				vy2=point[coord[i][3]][1]-point[coord[i][0]][1];
				vz2=point[coord[i][3]][2]-point[coord[i][0]][2];
				/*d1=vx*vx+vy*vy+vz*vz;
					d2=vx2*vx2+vy2*vy2+vz2*vz2;
				//生成渐变关键点编号*/
					coordn[i][3]=d1>d2?1:3;
			}else{
				vx=point[coord[i][1]][0]-point[coord[i][0]][0];
				vy=point[coord[i][1]][1]-point[coord[i][0]][1];
				vz=point[coord[i][1]][2]-point[coord[i][0]][2];
				vx2=point[coord[i][2]][0]-point[coord[i][0]][0];
				vy2=point[coord[i][2]][1]-point[coord[i][0]][1];
				vz2=point[coord[i][2]][2]-point[coord[i][0]][2];
				/*d1=vx*vx+vy*vy+vz*vz;
					d2=vx2*vx2+vy2*vy2+vz2*vz2;
					d3=(vx2-vx)*(vx2-vx)+(vy2-vy)*(vy2-vy)+(vz2-vz)*(vy2-vz);
					dmax=0;
					if(d1>d2){
						dmax=d1;
						coordn[i][3]=0;//生成渐变关键点编号
					}else{
						dmax=d2;
						coordn[i][3]=2;
					}
					if(dmax<d3){
						dmax=d3;
						coordn[i][3]=1;
					}*/
			}
			coordn[i][0]=vz*vy2-vy*vz2;//生成法向量
			coordn[i][1]=vx*vz2-vz*vx2;
			coordn[i][2]=vy*vx2-vx*vy2;
			d1=Math.sqrt(coordn[i][0]*coordn[i][0]+coordn[i][1]*coordn[i][1]+coordn[i][2]*coordn[i][2]);
			if(d1!=0){
				coordn[i][0]/=d1;//将平面法向量数乘成单位向量
				coordn[i][1]/=d1;
				coordn[i][2]/=d1;
			}
			coordn[i][3]=-(coordn[i][0]*point[coord[i][0]][0]+coordn[i][1]*point[coord[i][0]][1]+coordn[i][2]*point[coord[i][0]][2]);
			if(coord[i][3]>=0){
				coordn[i][3]-=coordn[i][0]*point[coord[i][1]][0]+coordn[i][1]*point[coord[i][1]][1]+coordn[i][2]*point[coord[i][1]][2];
				coordn[i][3]-=coordn[i][0]*point[coord[i][2]][0]+coordn[i][1]*point[coord[i][2]][1]+coordn[i][2]*point[coord[i][2]][2];
				coordn[i][3]-=coordn[i][0]*point[coord[i][3]][0]+coordn[i][1]*point[coord[i][3]][1]+coordn[i][2]*point[coord[i][3]][2];
				coordn[i][3]*=0.25;
			}
			//if(this.useSmooth){
				j=coord[i][0];//生成点法向量
				pointn[j][0]+=coordn[i][0];
				pointn[j][1]+=coordn[i][1];
				pointn[j][2]+=coordn[i][2];
				j=coord[i][1];
				pointn[j][0]+=coordn[i][0];
				pointn[j][1]+=coordn[i][1];
				pointn[j][2]+=coordn[i][2];
				j=coord[i][2];
				pointn[j][0]+=coordn[i][0];
				pointn[j][1]+=coordn[i][1];
				pointn[j][2]+=coordn[i][2];
				j=coord[i][3];
				if(j>=0){
					pointn[j][0]+=coordn[i][0];
					pointn[j][1]+=coordn[i][1];
					pointn[j][2]+=coordn[i][2];
				}
			//}//trace(coord[i]);
		}
		//if(this.useSmooth){
			for(i=0;i<leng;i++){
				d1=Math.sqrt(pointn[i][0]*pointn[i][0]+pointn[i][1]*pointn[i][1]+pointn[i][2]*pointn[i][2]);//将点法向量数乘成单位向量
				pointn[i][0]/=d1;
				pointn[i][1]/=d1;
				pointn[i][2]/=d1;
			}
		//}
		this.updateBuffer();
	}
	
	this.createUVMatrix=function(coordm){
		this.updateTexture();
	}
	
	this.updateTexture=function(){
		var gl=this.gl;
		if(gl==null)return;
		this.removeTexture();
		if(this.bmpd==null)return;
		this.texture = gl.createTexture();
		gl.bindTexture(gl.TEXTURE_2D, this.texture);

		// Set the parameters so we can render any size image.
		gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
		gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
		gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
		gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);

		// Upload the image into the texture.
		gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, this.bmpd);
	}

	this.removeTexture=function(){
		var gl=this.gl;
		if(gl==null)return;
		if(this.texture!=null){
			gl.deleteTexture(this.texture);
			this.texture=null;
		}
		
	}
	
	this.createVrmlFile=function(){
		//生成vrml文件
		var fileStr="#VRML V2.0 utf8\r\n\r\n";
		var dateConvert=new Date();
		var pointStr="";
		var coordStr="";
		var m=0;
		var n=0;
		var zxy;
		var x3d,y3d,z3d,temp;
		var leng=this.point.length;
		var leng2=this.coord.length;
		fileStr+="#Produced By Viewer3d ver 1.0\r\n";
		fileStr+="#Date:"+dateConvert.toLocaleString()+"\r\n\r\n";
		fileStr+="DEF v3d Transform {\r\n";
			fileStr+="    translation "+this.tx+" "+this.tz+" "+(-this.ty)+"\r\n";
			fileStr+="    children [\r\n";
			fileStr+="        Shape {\r\n";
				fileStr+="            appearance Appearance {\r\n";
					fileStr+="                material Material {\r\n";
						fileStr+="                    diffuseColor "+((this.colour>>16&0xff)/255.0)+" "+((this.colour>>8&0xff)/255.0)+" "+((this.colour&0xff)/255.0)+"\r\n";
						fileStr+="                }\r\n";
					fileStr+="            }\r\n";
				fileStr+="            geometry DEF v3df IndexedFaceSet {\r\n";
					fileStr+="                creaseAngle 1\r\n";
					fileStr+="                ccw TRUE\r\n";
					fileStr+="                solid FALSE\r\n";
					fileStr+="                convex TRUE\r\n";
					fileStr+="                coord DEF v3dc Coordinate { point [\r\n";
						for(n=0;n<leng;n++){
							if(m==0){
								pointStr+="                    ";
							}
							x3d=this.point[n][0]*this.scaleShape;
							y3d=this.point[n][2]*this.scaleShape;
							z3d=-this.point[n][1]*this.scaleShape;
							;
							pointStr+=x3d.toPrecision(5)+" "+y3d.toPrecision(5)+" "+z3d.toPrecision(5)+", ";
							if(n==leng-1){
								pointStr=pointStr.substr(0,pointStr.length-2);
								break;
							}
							m++;
							if(m>=5){
								pointStr+="\r\n";
								m=0;
							}
						}
						m=0;
						for(n=0;n<leng2;n++){
							if(m==0){
								coordStr+="                    ";
							}
							coordStr+=this.coord[n][0]+", "+this.coord[n][1]+", ";
							if(this.coord[n][3]<0){
								coordStr+=this.coord[n][2]+", -1, ";
							}else{
								coordStr+=this.coord[n][3]+", "+this.coord[n][2]+", -1, ";
							}
							if(n>=leng2-1||this.coord[n+1][0]==-1){
								coordStr=coordStr.substr(0,coordStr.length-2);
								break;
							}
							m++;
							if(m>=5){
								coordStr+="\r\n";
								m=0;
							}
						}
						fileStr+=pointStr+"]\r\n";
						fileStr+="                }\r\n";
					fileStr+="                coordIndex [\r\n";
					fileStr+=coordStr+"]\r\n";
					fileStr+="            }\r\n";
				fileStr+="        }\r\n";
			fileStr+="    ]\r\n";
			fileStr+="}\r\n";
		return fileStr;
	}
	
	function expandPolygen(arrt,arr,numBegin,count,rate){
		var i=numBegin;
		var j=0;
		var numOut=numBegin+(count<<1);
		if(rate==1){
			while(i<numOut){
				arrt[j]=arr[i];
				i++;j++;
				arrt[j]=arr[i];
				i++;j++;
			}
			return;
		}
		
		var midx=0;
		var midy=0;
		while(i<numOut){
			midx+=arr[i];
			i++;
			midy+=arr[i];
			i++;
		}
		midx/=count;
		midy/=count;	
			
		i=numBegin;
		j=0;
		while(i<numOut){
			arrt[j]=midx+(arr[i]-midx)*rate;
			i++;j++;
			arrt[j]=midy+(arr[i]-midy)*rate;
			i++;j++;
		}
	}
	
	function expandPolygenByPixel(arrt,arr,numBegin,count,pixel){
		var i=numBegin;
		var j=0;
		var numOut=numBegin+(count<<1);
		if(pixel==0){
			while(i<numOut){
				arrt[j]=arr[i];
				i++;j++;
				arrt[j]=arr[i];
				i++;j++;
			}
			return;
		}
		
		var dx,dy;
		var dxa,dya;
		var x0,y0,xt,yt;
		var x1,y1,x2,y2;
		var offset=2*pixel;
		var anotherOffset;
		//i=numBegin;
		//j=0;
		while(i<numOut){
			x0=arr[i];
			y0=arr[i+1];
			if(i+3<numOut){				
				xt=arr[i+2];
				yt=arr[i+3];				
			}else{
				xt=arr[numBegin];
				yt=arr[numBegin+1];
			}
			dx=xt-x0;
			dy=yt-y0;
			dxa=dx>=0?dx:-dx;
			dya=dy>=0?dy:-dy;
			if(dxa==0 && dya==0){
				x1=x0;
				x2=xt;
				y1=y0;
				y2=yt;
			}else if (dxa>dya) {
				if (xt>=x0) {
					x1=x0-offset;
					x2=xt+offset;
				} else {
					x1=x0+offset;
					x2=xt-offset;
				}
				anotherOffset=offset*dya/dxa;
				if (yt>y0) {
					y1=y0-anotherOffset;
					y2=yt+anotherOffset;
				} else {
					y1=y0+anotherOffset;
					y2=yt-anotherOffset;
				}
			} else {
				anotherOffset=offset*dxa/dya;
				if (xt>x0) {
					x1=x0-anotherOffset;
					x2=xt+anotherOffset;
				} else {
					x1=x0+anotherOffset;
					x2=xt-anotherOffset;
				}
				
				if (yt>y0) {
					y1=y0-offset;
					y2=yt+offset;
				} else {
					y1=y0+offset;
					y2=yt-offset;
				}
			}
			if(i==numBegin){
				arrt[j]=x1;
				arrt[j+1]=y1;
				arrt[j+2]=x2;
				arrt[j+3]=y2;
			}else if(i+3<numOut){
				arrt[j]=(arrt[j]+x1)*0.5;
				arrt[j+1]=(arrt[j+1]+y1)*0.5;
				arrt[j+2]=x2;
				arrt[j+3]=y2;
			}else{
				arrt[j]=(arrt[j]+x1)*0.5;
				arrt[j+1]=(arrt[j+1]+y1)*0.5;
				arrt[0]=(arrt[0]+x2)*0.5;
				arrt[1]=(arrt[1]+y2)*0.5;
			}
			i+=2;
			j+=2;
		}
	}
	
	function expandPolygenByPixelOld(arrt,arr,numBegin,count,pixel){
		var i=numBegin;
		var j=0;
		var numOut=numBegin+(count<<1);
		if(pixel==0){
			while(i<numOut){
				arrt[j]=arr[i];
				i++;j++;
				arrt[j]=arr[i];
				i++;j++;
			}
			return;
		}
		
		var midx=0;
		var midy=0;
		while(i<numOut){
			midx+=arr[i];
			i++;
			midy+=arr[i];
			i++;
		}
		midx/=count;
		midy/=count;
		
		var dx=0,dy=0,d2,d2max=0;
		i=numBegin;
		while(i<numOut){
			dx=arr[i]-midx;			
			i++;
			dy=arr[i]-midy;			
			i++;
			
			if(dx<0)dx=-dx;
			if(dy<0)dy=-dy;
			d2=dx>=dy?dx:dy;
			
			//d2=dx*dx+dy*dy;
			
			//if(dx<0)dx=-dx;
			//if(dy<0)dy=-dy;
			//d2=Math.abs(dx)+Math.abs(dy);			
			
			if(d2max<d2){
				d2max=d2;
			}
		}
		
		var d=d2;
		//var d=Math.sqrt(d2);
		//var d=d2*0.5;		
		var rate=d>0?(d+pixel)/d:1;
			
		i=numBegin;
		j=0;
		while(i<numOut){
			arrt[j]=midx+(arr[i]-midx)*rate;
			i++;j++;
			arrt[j]=midy+(arr[i]-midy)*rate;
			i++;j++;
		}
	}

	function transformPointsWithTexture(arr,mt){
		var x0=arr[0];
		var y0=arr[1];
		arr[0]=x0*mt.a+y0*mt.c+mt.tx;
		arr[1]=x0*mt.b+y0*mt.d+mt.ty;
		
		x0=arr[2];
		y0=arr[3];
		arr[2]=x0*mt.a+y0*mt.c+mt.tx;
		arr[3]=x0*mt.b+y0*mt.d+mt.ty;
		
		x0=arr[4];
		y0=arr[5];
		arr[4]=x0*mt.a+y0*mt.c+mt.tx;
		arr[5]=x0*mt.b+y0*mt.d+mt.ty;
	}

	
	this.initShader=function(gl, type, source) {
		let shader = gl.createShader(type);
		gl.shaderSource(shader, source);
		gl.compileShader(shader);
		if(!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
			console.log('error occured compiling the shaders:' + gl.getShaderInfoLog(shader));
			return null;
		}
		return shader;
	}
	
	this.initProgram=function(gl, vsource, fsource, withUsing) {
		let vShader = this.initShader(gl, gl.VERTEX_SHADER, vsource);
		let fShader = this.initShader(gl, gl.FRAGMENT_SHADER, fsource);
		// 创建WebGL程序
		let program = gl.createProgram();
		gl.attachShader(program, vShader);
		gl.attachShader(program, fShader);
		gl.linkProgram(program);
		// 判断是否创建成功
		if(!gl.getProgramParameter(program, gl.LINK_STATUS)) {
			console.log('unable to initialize!');
			return;
		}
		if(withUsing){
			gl.useProgram(program);
		}
		return program;
	}

	this.getIdentityMatrix3D=function(){
		var rd=new Array(16);
		var i;
		for(i=0;i<16;i++){
			rd[i]=i%5==0?1:0;
		}
		return rd;
	}

	this.getConcatedMatrix3D=function(rd0,rdt){
		var rd=new Array(16);
		var i;
		var rowi,coli;
		for(i=0;i<16;i++){
			rd[i]=i%5==0?1:0;
		}
		var hasPerspective=!(rd0[3]==0 && rd0[7]==0 && rd0[11]==0 && rd0[15]==1 && rdt[3]==0 && rdt[7]==0 && rdt[11]==0 && rdt[15]==1);
		if(hasPerspective){
			for(i=0;i<16;i++){
				rowi=i&12;
				coli=i&3;
				rd[i]=rd0[rowi]*rdt[coli]+rd0[rowi|1]*rdt[4|coli]+rd0[rowi|2]*rdt[8|coli]+rd0[rowi|3]*rdt[12|coli];
			}
		}else{
			for(i=0;i<16;i++){
				rowi=i&12;
				coli=i&3;
				if(coli==3)continue;
				if(rowi!=12){
					rd[i]=rd0[rowi]*rdt[coli]+rd0[rowi|1]*rdt[4|coli]+rd0[rowi|2]*rdt[8|coli];
				}else{
					rd[i]=rd0[rowi]*rdt[coli]+rd0[rowi|1]*rdt[4|coli]+rd0[rowi|2]*rdt[8|coli]+rdt[12|coli];
				}
			}
		}
		return rd;
	}

	this.getDeterminantOfMatrix3D=function(rd){
		var rd=this.rawData;
		var i=0;
		var sum=0;
		var sumt=0;
		if(rd[3]!=0){
			sumt=rd[4]*rd[9]*rd[14]+rd[5]*rd[10]*rd[12]+rd[6]*rd[8]*rd[13]-
			     rd[4]*rd[10]*rd[13]-rd[5]*rd[8]*rd[14]-rd[6]*rd[9]*rd[12];
			sum-=rd[3]*sumt;
		}
		if(rd[7]!=0){
			sumt=rd[0]*rd[9]*rd[14]+rd[1]*rd[10]*rd[12]+rd[2]*rd[8]*rd[13]-
			     rd[0]*rd[10]*rd[13]-rd[1]*rd[8]*rd[14]-rd[2]*rd[9]*rd[12];
			sum+=rd[7]*sumt;
		}
		if(rd[11]!=0){
			sumt=rd[0]*rd[5]*rd[14]+rd[1]*rd[6]*rd[12]+rd[2]*rd[4]*rd[13]-
			     rd[0]*rd[6]*rd[13]-rd[1]*rd[4]*rd[14]-rd[2]*rd[5]*rd[12];
			sum-=rd[11]*sumt;
		}
		if(rd[15]!=0){
			sumt=rd[0]*rd[5]*rd[10]+rd[1]*rd[6]*rd[8]+rd[2]*rd[4]*rd[9]-
			     rd[0]*rd[6]*rd[9]-rd[1]*rd[4]*rd[10]-rd[2]*rd[5]*rd[8];
			sum+=rd[15]*sumt;
		}
		return sum;
	}

	this.getTransposedMatrix3D=function(rd0){
		var rd=rd0.slice(0);
		var i,j;
		var rowi,coli;
		var temp;
		for(i=0;i<16;i++){
			rowi=i&12;
			coli=i&3;
			j=coli<<2|rowi>>2;
			if(i>=j){
				return;
			}
			temp=rd[i];
			rd[i]=rd[j];
			rd[j]=temp;
		}
		return rd;
	}

	this.getInvertedMatrix3D=function(rd0){
		var det=this.getDeterminantOfMatrix3D(rd0);
		if(det==0){
			return null;
		}
		var rd=rd0.slice(0);
		var hasPerspective=!(rd[3]==0 && rd[7]==0 && rd[11]==0 && rd[15]==1);
		var hasTranslation=!(rd[12]==0 && rd[13]==0 && rd[14]==0);
		var arr=new Array(16);
		for(i=0;i<16;i++){
			arr[i]=rd[i];
		}
		var deti=1/det;
	  /* 0  1  2  3
	     4  5  6  7
	     8  9 10 11
	    12 13 14 15*/
		if(!hasPerspective){
			rd[0]=(arr[5]*arr[10]-arr[6]*arr[9])*deti;
			rd[4]=(arr[6]*arr[8]-arr[4]*arr[10])*deti;
			rd[8]=(arr[4]*arr[9]-arr[5]*arr[8])*deti;
			rd[1]=(arr[2]*arr[9]-arr[1]*arr[10])*deti;
			rd[5]=(arr[0]*arr[10]-arr[2]*arr[8])*deti;
			rd[9]=(arr[1]*arr[8]-arr[0]*arr[9])*deti;
			rd[2]= (arr[1]*arr[6]-arr[2]*arr[5])*deti;
			rd[6]= (arr[2]*arr[4]-arr[0]*arr[6])*deti;
			rd[10]=(arr[0]*arr[5]-arr[1]*arr[4])*deti;
			if(hasTranslation){
				rd[12]=-(arr[12]*rd[0]+arr[13]*rd[4]+arr[14]*rd[5]);
				rd[13]=-(arr[12]*rd[1]+arr[13]*rd[5]+arr[14]*rd[9]);
				rd[14]=-(arr[12]*rd[2]+arr[13]*rd[6]+arr[14]*rd[10]);
			}
		}else{
			var arrt=new Array(9);
			var j=0;
			var rowi,coli;
			var rowj,colj;
			var rowjt,coljt;
			for(i=0;i<16;i++){
				rowi=i&12;
				coli=i&3;
				for(j=0;j<16;j++){
					rowj=j&12;
					colj=j&3;
					if(rowi==rowj || coli==colj){
						continue;
					}
					rowjt=rowj<rowi?(rowj>>2):(rowj>>2)-1;
					coljt=colj<coli?colj:colj-1;
					
					arrt[3*rowjt+coljt]=arr[j];
				}
				j=coli<<2|rowi>>2;
				rd[j]=(arrt[0]*(arrt[4]*arrt[8]-arrt[5]*arrt[7])+
					   arrt[1]*(arrt[5]*arrt[6]-arrt[3]*arrt[8])+
					   arrt[2]*(arrt[3]*arrt[7]-arrt[4]*arrt[6]))*deti;
				if((((rowi>>2)+coli)&1)!=0){
					rd[j]=-rd[j];
				}
			}
		}
		return rd;
	}

	this.updateToushiMatrix=function(){
		var w=this.wid;
		var h=this.hei;
		var x0=this.mdx-w/2;
		var y0=sy;
		var z0=this.mdy-h/2;
		var y1=sy/this.ymins;
		var yt=10000;
		this.toushiMatrix=[
			y0*2/w,0,0,0,
			x0*2/w,-z0*2/h,yt/(yt-y1),1,
			0,y0*2/h,0,0,
			0,-y0,yt*y1/(y1-yt),0];
	};

	this.getScaleMatrix3D=function(scale){
		return [
			scale,0,0,0,
			0,scale,0,0,
			0,0,scale,0,
			0,0,0,1
		];
	};

	this.getRotationMatrix3D=function(rx,ry,rz,rw){
		if(arguments.length<4)rw=NaN;
		if(isNaN(rw)){
			var sx=Math.sin(rx*Math.PI/180);
			var cx=Math.cos(rx*Math.PI/180);
			var sy=Math.sin(ry*Math.PI/180);
			var cy=Math.cos(ry*Math.PI/180);
			var sz=Math.sin(rz*Math.PI/180);
			var cz=Math.cos(rz*Math.PI/180);
			if(this.rotationType==0 || this.rotationType==-1 || (this.rootModel!=null && this.rootModel!=this)){
				return [cy*cz,-cx*sz+sx*sy*cz,-sx*sz-cx*sy*cz,0,
					    cy*sz,cx*cz+sx*sy*sz,sx*cz-cx*sy*sz,0,
						sy,-sx*cy,cx*cy,0,
						0,0,0,1
					];
			}else{
				return [cy*cz,-cy*sz,-sy,0,
						cx*sz+sx*sy*cz,cx*cz-sx*sy*sz,sx*cy,0,
						-sx*sz+cx*sy*cz,-sx*cz-cx*sy*sz,cx*cy,0,
						0,0,0,1
				];
			}
		}else{
			return [rw*rw+rx*rx-ry*ry-rz*rz,2*(rx*ry+rz*rw),2*(rx*rz-ry*rw),0,
					2*(rx*ry-rz*rw),rw*rw-rx*rx+ry*ry-rz*rz,2*(ry*rz+rx*rw),0,
					2*(rx*rz+ry*rw),2*(ry*rz-rx*rw),rw*rw-rx*rx-ry*ry+rz*rz,0,
					0,0,0,1
				   ];
		}
	};
	

	this.plot=function(){
		if(this.rootModel!=null && this.rootModel!=this){
			this.rootModel.plot();
			return;
		}

		//this.plotToCanvas();
		//return;

		
		if(!this.gl && this.shape){
			try{
				this.gl=this.shape.getContext("webgl")||this.shape.getContext("experimental-webgl");
			}catch(ex){
				console.log(ex);
				this.gl=null;
			}
			if(this.gl && this.graphics){
				//this.graphics.clearRect(0,0,this.wid,this.hei);
			}
			console.log(this.gl);
		}
		if(this.rotationType==0 || this.rotationType==-1){
			this.rootAdditionMatrix=this.getIdentityMatrix3D();
			this.rootAdditionMatrix[13]+=2*sy;
		}else{
			this.rootAdditionMatrix=this.getIdentityMatrix3D();
			this.rootAdditionMatrix[12]-=this.tx;
			this.rootAdditionMatrix[13]-=this.ty;
			this.rootAdditionMatrix[14]-=this.tz;
			this.rotationMatrix=this.getTransposedMatrix3D(this.rotationMatrix0.slice(0));
			this.rootAdditionMatrix=this.getConcatedMatrix3D(this.rootAdditionMatrix,this.rotationMatrix);
			this.rootAdditionMatrix=this.getConcatedMatrix3D(this.rootAdditionMatrix,this.getScaleMatrix3D(1/this.scaleShape));
			this.rootAdditionMatrix[14]+=this.height*0.5;
		}
		if(!this.toushiMatrix){
			this.updateToushiMatrix(0);
		}
		this.attachModel();
	}

	this.attachModel=function(){
		var boxc=this.boxc,boxt=this.boxt;
		var isEmptyModel=false;//是否为不进行自动渲染的模型
		
		var i;
		var j;
		var leng;
		var model;
		var rootx=this.rootModel.tx;
		var rooty=this.rootModel.ty;
		var rootz=this.rootModel.tz;
		var panoMode=this.rotationType!=0 && this.rotationType!=-1;

		this.rotationMatrix0=this.getRotationMatrix3D(this.rx,this.ry,this.rz,this.rw);
		
		this.modelMatrix0=this.getIdentityMatrix3D();
		if(!panoMode || this.rootModel!=null && this.rootModel!=this){
			this.modelMatrix0=this.getConcatedMatrix3D(this.modelMatrix0,this.getScaleMatrix3D(this.scaleShape));
			this.modelMatrix0=this.getConcatedMatrix3D(this.modelMatrix0,this.rotationMatrix0);
			this.modelMatrix0[12]+=this.tx;
			this.modelMatrix0[13]+=this.ty;
			this.modelMatrix0[14]+=this.tz;
			this.rotationMatrix=this.rotationMatrix0.slice(0);
		}
		if(this.parentModel!=null && this.parentModel!=this){
			this.modelMatrix=this.getConcatedMatrix3D(this.modelMatrix0,this.parentModel.modelMatrix0);
			this.rotationMatrix.append(this.rotationMatrix0,this.parentModel.rotationMatrix);
		}
		this.modelMatrix=this.getConcatedMatrix3D(this.modelMatrix0,this.rootAdditionMatrix);
		this.perspectiveMatrix=this.getConcatedMatrix3D(this.modelMatrix,this.toushiMatrix);
		
		var picturex;
		var picturey;
		var rectx0;
		var rectxt;
		var recty0;
		var rectyt;
		if(this.rotationType>0 && !isEmptyModel){
			//picturex=0;
			picturey=0;
			rectx0=Infinity;
			recty0=Infinity;
			rectxt=-Infinity;
			rectyt=-Infinity;
			var rectObject;
			var allBack=true;
			var allForwardFar=true;
			var inRect=false;
			var td=this.toushiMatrix;
			
			j=0;
			for(i=0;i<8;i++){
				if(boxt[j+1]>=sy/this.ymins){
					allBack=false;
				}
				if(boxt[j+1]<=this.ymax){
					allForwardFar=false;
				}
				
				if(boxt[j+1]>=0){
					//picturex=(boxt[j]*td[0]+boxt[j+1]*td[4]+boxt[j+2]*td[8]+td[12])/(boxt[j]*td[3]+boxt[j+1]*td[7]+boxt[j+2]*td[11]+td[15]);
					//picturey=(boxt[j]*td[1]+boxt[j+1]*td[5]+boxt[j+2]*td[9]+td[13])/(boxt[j]*td[3]+boxt[j+1]*td[7]+boxt[j+2]*td[11]+td[15]);
					picturex=td[4]+boxt[j]*td[0]/boxt[j+1];
					picturey=td[5]+(boxt[j+2]*td[9]+td[13])/boxt[j+1];
				}else{
					//picturex=(boxt[j]*td[0]-boxt[j+1]*td[4]+boxt[j+2]*td[8]+td[12])/(boxt[j]*td[3]-boxt[j+1]*td[7]+boxt[j+2]*td[11]+td[15]);
					//picturey=(boxt[j]*td[1]-boxt[j+1]*td[5]+boxt[j+2]*td[9]+td[13])/(boxt[j]*td[3]-boxt[j+1]*td[7]+boxt[j+2]*td[11]+td[15]);
					picturex=td[4]-boxt[j]*td[0]/boxt[j+1];
					picturey=td[5]-(boxt[j+2]*td[9]+td[13])/boxt[j+1];
				}
				
				if(picturex<rectx0){
					rectx0=picturex;
				}
				if(picturex>rectxt){
					rectxt=picturex;
				}
				if(picturey<recty0){
					recty0=picturey;
				}
				if(picturey>rectyt){
					rectyt=picturey;
				}
				j+=3;
			}
			inRect=rectxt<-1 || rectx0>1 || rectyt<-1 || recty0>1;
			
			if(allBack || allForwardFar || !inRect){
				isEmptyModel=true;
			}
		}
		
		
		if(!isEmptyModel){
			this.renderModel();
			this.rendered=true;
		}else{
			this.rendered=false;
		}
		
		
		if(this.child!=null && this.child.length>0){
			leng=this.child.length;
			var rmax2;
			if(this.childTrimEnabled){
				if(isNaN(this.childTrimR)){
					rmax2=this.rootModel.scaleShape;
					rmax2*=rmax2;
					rmax2*=this.ymax*this.ymax;
				}else{
					rmax2=this.childTrimR*this.childTrimR;
				}
			}
			for(i=0;i<leng;i++){
				model=this.child[i];
				if(model==null){
					continue;
				}
				model.parentModel=this;
				model.rootModel=this.rootModel;
				if(this.rotationType>=0){
					model.rotationType=model.rotationType>=0?(this.rotationType==2?1:this.rotationType):(this.rotationType==2?-2:-1-this.rotationType);
				}else{
					model.rotationType=model.rotationType>=0?-1-this.rotationType:this.rotationType;
				}
				model.attachModel();
			}
		}
	};

	


	this.updateBuffer=function(){
		if(!this.gl){
			return;
		}
		var gl=this.gl;
		if(this.vetexBuffer){
			this.gl.deleteBuffer(this.vetexBuffer);
		}
		this.vetexData=null;
		var triangles=[];
		var i=0;
		var coord=this.coord;
		var point=this.point;
		var length=coord.length;
		var arr=[];
		for(i=0;i<length;i++){
			arr=coord[i];
			if(!arr || arr.length<3){
				continue;
			}
			triangles.push(point[arr[0]][0]);
			triangles.push(point[arr[0]][1]);
			triangles.push(point[arr[0]][2]);
			triangles.push(point[arr[1]][0]);
			triangles.push(point[arr[1]][1]);
			triangles.push(point[arr[1]][2]);
			triangles.push(point[arr[2]][0]);
			triangles.push(point[arr[2]][1]);
			triangles.push(point[arr[2]][2]);

			if(arr.length>3 && arr[3]>=0){
				triangles.push(point[arr[3]][0]);
				triangles.push(point[arr[3]][1]);
				triangles.push(point[arr[3]][2]);
				triangles.push(point[arr[2]][0]);
				triangles.push(point[arr[2]][1]);
				triangles.push(point[arr[2]][2]);
				triangles.push(point[arr[1]][0]);
				triangles.push(point[arr[1]][1]);
				triangles.push(point[arr[1]][2]);
			}
		}
		this.vetexData=new Float32Array(triangles);
		this.vetexBuffer = gl.createBuffer();
		gl.bindBuffer(gl.ARRAY_BUFFER, this.vetexBuffer);
		gl.bufferData(gl.ARRAY_BUFFER, this.vetexData, gl.STATIC_DRAW);   
		

		if(this.normalBuffer){
			this.gl.deleteBuffer(this.normalBuffer);
		}
		this.normalData=null;
		var normals=[];
		i=0;
		point=pointn;
		length=coord.length;
		arr=[];
		for(i=0;i<length;i++){
			arr=coord[i];
			if(!arr || arr.length<3){
				continue;
			}
			normals.push(point[arr[0]][0]);
			normals.push(point[arr[0]][1]);
			normals.push(point[arr[0]][2]);
			normals.push(point[arr[1]][0]);
			normals.push(point[arr[1]][1]);
			normals.push(point[arr[1]][2]);
			normals.push(point[arr[2]][0]);
			normals.push(point[arr[2]][1]);
			normals.push(point[arr[2]][2]);
			if(arr.length>3 && arr[3]>=0){
				normals.push(point[arr[3]][0]);
				normals.push(point[arr[3]][1]);
				normals.push(point[arr[3]][2]);
				normals.push(point[arr[2]][0]);
				normals.push(point[arr[2]][1]);
				normals.push(point[arr[2]][2]);
				normals.push(point[arr[1]][0]);
				normals.push(point[arr[1]][1]);
				normals.push(point[arr[1]][2]);
			}
		}
		this.normalData=new Float32Array(normals);

		this.normalBuffer = gl.createBuffer();
		gl.bindBuffer(gl.ARRAY_BUFFER, this.normalBuffer);
		gl.bufferData(gl.ARRAY_BUFFER, this.normalData, gl.STATIC_DRAW);
		
		if(this.uvBuffer){
			this.gl.deleteBuffer(this.uvBuffer);
		}
		if(this.uv!=null && this.uv.length>0){
			i=0;
			var uv0=[];
			point=this.uv;
			length=coord.length;
			console.log("this.uv.length="+this.uv.length);
			arr=[];
			for(i=0;i<length;i++){
				arr=coord[i];
				if(!arr || arr.length<3){
					continue;
				}
				uv0.push(point[arr[0]][0]);
				uv0.push(point[arr[0]][1]);
				uv0.push(point[arr[1]][0]);
				uv0.push(point[arr[1]][1]);
				uv0.push(point[arr[2]][0]);
				uv0.push(point[arr[2]][1]);
				if(arr.length>3 && arr[3]>=0){
					uv0.push(point[arr[3]][0]);
					uv0.push(point[arr[3]][1]);
					uv0.push(point[arr[2]][0]);
					uv0.push(point[arr[2]][1]);
					uv0.push(point[arr[1]][0]);
					uv0.push(point[arr[1]][1]);
				}
			}
			this.uvData=new Float32Array(uv0);
			this.uvBuffer = gl.createBuffer();
			gl.bindBuffer(gl.ARRAY_BUFFER, this.uvBuffer);
			gl.bufferData(gl.ARRAY_BUFFER, this.uvData, gl.STATIC_DRAW);
		}
	};

	this.checkAndCreateProgram=function(){
		var gl=this.gl;
		if(this.programs.length==0){
			var vertexShader="";
			var fragmentShader="";
			for(var i=0;i<4;i++){
				vertexShader="";
				fragmentShader="";
				
				vertexShader+="uniform mat4 perspectiveMatrix;\n";
				vertexShader+="uniform mat4 rotationMatrix;\n";
				vertexShader+="uniform mat4 spotDistanceMatrix;\n";
				vertexShader+="attribute vec3 a_position;\n";
				vertexShader+="attribute vec3 a_normal;\n";
				if((i&2)!=0){
					vertexShader+="attribute vec2 a_uv;\n";
					vertexShader+="varying vec2 v_uv;\n";
				}
				vertexShader+="varying vec2 v_position;\n";
				vertexShader+="uniform vec2 specularInfo;\n";
				vertexShader+="void main(){\n";
				vertexShader+="    gl_Position = perspectiveMatrix*vec4(a_position,1);\n";
				vertexShader+="    vec3 v_normal = (rotationMatrix*vec4(a_normal,1)).xyz;\n";
				vertexShader+="    vec3 v_dist = (spotDistanceMatrix*vec4(a_position,1)).xyz;\n";
				vertexShader+="    float vt2 = dot(v_normal, v_dist);\n";
				vertexShader+="    float vt3 = inversesqrt(dot(v_dist, v_dist));\n";
				if((i&2)==1){
					//useSpecular
					vertexShader+="    float specular = (2.0*vt2*v_normal.y-v_dist.y)*vt3;\n";
					vertexShader+="    specular = pow(clamp(specular,0.0,1.0),specularInfo.y)*specularInfo.x;\n";
					vertexShader+="    v_position = vec2(vt2*vt3,specular);\n";
					//vertexShader+="    v_position = vec3(vt2*color1.x+color2.x+specular, vt2*color1.y+color2.y+specular, vt2*color1.z+color2.z+specular);\n";
				}else{
					vertexShader+="    v_position = vec2(vt2*vt3,0.0);\n";
					//vertexShader+="    v_position = vec3(vt2*color1.x+color2.x, vt2*color1.y+color2.y, vt2*color1.z+color2.z);\n";
				}
				if((i&2)!=0){
					vertexShader+="    v_uv = a_uv;\n";
				}
				

				vertexShader+="}\n";

				fragmentShader+="precision mediump float;\n";
				fragmentShader+="varying vec2 v_position;\n";
				if((i&2)!=0){
					fragmentShader+="varying vec2 v_uv;\n";
					fragmentShader+="uniform sampler2D u_image;\n";
				}
				fragmentShader+="uniform vec3 color1;\n";
				fragmentShader+="uniform vec3 color2;\n";
				
				fragmentShader+="void main(){\n";
				if((i&2)==0){
					fragmentShader+="    float vx = v_position.x;\n";
					fragmentShader+="    float vy = v_position.y;\n";
					fragmentShader+="    if(gl_FrontFacing){\n";
					//fragmentShader+="        vx=clamp(vx,0.0,1.0);\n";
					fragmentShader+="    }else{\n";
					//fragmentShader+="        vx=clamp(-vx,0.0,1.0);\n";
					fragmentShader+="        vx=-vx;\n";
					fragmentShader+="    }\n";
					fragmentShader+="    gl_FragColor = vec4(vx*color1.x+color2.x+vy, vx*color1.y+color2.y+vy, vx*color1.z+color2.z+vy, 1);\n";
				}else{
					fragmentShader+="    gl_FragColor = texture2D(u_image, v_uv);\n";
				
				}
				fragmentShader+="}\n";
				//console.log(i,vertexShader,fragmentShader);
				this.programs.push([this.initProgram(gl,vertexShader,fragmentShader,false),vertexShader,fragmentShader]);
			}
			
		}
		var num=(this.useSpecular?1:0)|(this.texture!=null && this.uvBuffer?2:0);
		if(this.currentProgram!=num){
			this.currentProgram=num;
			console.log(this.programs[num][1]);
			gl.useProgram(this.programs[num][0]);
		}
	}


	this.renderModel=function(){
		if(!this.gl){
			return;
		}

		//this.updateTexture();
		var gl=this.gl;

		var useBitmap=this.bmpd!=null;
		var useNBitmap=this.nbmpd!=null && this.vtangent!=null;
		var i=0;

		var spotDistanceMatrix=this.modelMatrix.slice(0);
		spotDistanceMatrix[12]+=-this.spotx+this.mdx;
		spotDistanceMatrix[13]+=-this.spoty;
		spotDistanceMatrix[14]+=-this.spotz;

		var dr=(this.colour>>16&0xff)-this.ambientr;
		var dg=(this.colour>>8&0xff)-this.ambientg;
		var db=(this.colour&0xff)-this.ambientb;

		if(!this.vetexBuffer || !this.vetexData){
			this.updateBuffer();
		}
		if(this.bmpd!=null && this.texture==null){
			this.updateTexture();
		}
		
		gl.clearColor(0.0, 0.0, 0.0, 1.0);
		gl.clearDepth(0.5);
		//gl.clear(gl.COLOR_BUFFER_BIT);
		//gl.clear(gl.DEPTH_BUFFER_BIT);
		
		gl.enable(gl.DEPTH_TEST);
		gl.depthFunc(gl.LESS);

		this.checkAndCreateProgram();
		var program=this.programs[this.currentProgram][0];

		var perspectiveMatrixLoc=gl.getUniformLocation(program, "perspectiveMatrix");
		gl.uniformMatrix4fv(perspectiveMatrixLoc, false, new Float32Array(this.perspectiveMatrix));

		var rotationMatrixLoc=gl.getUniformLocation(program, "rotationMatrix");
		gl.uniformMatrix4fv(rotationMatrixLoc, false, new Float32Array(this.rotationMatrix));

		var spotDistanceMatrixLoc=gl.getUniformLocation(program, "spotDistanceMatrix");
		gl.uniformMatrix4fv(spotDistanceMatrixLoc, false, new Float32Array(spotDistanceMatrix));

		gl.uniform3f(gl.getUniformLocation(program,"color1"), dr/255*1.5*this.spotInten,dg/255*1.5*this.spotInten,db/255*1.5*this.spotInten);
		gl.uniform3f(gl.getUniformLocation(program,"color2"), this.ambientr/255,this.ambientg/255,this.ambientb/255);
		gl.uniform2f(gl.getUniformLocation(program,"specularInfo"), this.ks, this.ns);



		var positionLocation = gl.getAttribLocation(program, "a_position");
		gl.bindBuffer(gl.ARRAY_BUFFER, this.vetexBuffer);
		gl.enableVertexAttribArray(positionLocation);
		gl.vertexAttribPointer(positionLocation, 3, gl.FLOAT, false, 0, 0);

		var normalLocation = gl.getAttribLocation(program, "a_normal");
		gl.bindBuffer(gl.ARRAY_BUFFER, this.normalBuffer);
		gl.enableVertexAttribArray(normalLocation);
		gl.vertexAttribPointer(normalLocation, 3, gl.FLOAT, false, 0, 0);

		if(this.uvBuffer!=null){
			var uvLocation = gl.getAttribLocation(program, "a_uv");
			gl.bindBuffer(gl.ARRAY_BUFFER, this.uvBuffer);
			gl.enableVertexAttribArray(uvLocation);
			gl.vertexAttribPointer(uvLocation, 2, gl.FLOAT, false, 0, 0);
		}

		gl.drawArrays(gl.TRIANGLES, 0, this.vetexData.length/3);
	};
	
	this.getQuaternion=function(){
		//欧拉角转四元数
		if(!isNaN(rw)){
			return[rx,ry,rz,rw];
		}
		var arr=this.toRotationMatrix(rx,ry,rz,NaN);
		var rxrw=(arr[5]-arr[7])*0.25;
		var ryrw=(arr[6]-arr[2])*0.25;
		var rzrw=(arr[1]-arr[3])*0.25;
		var rwt;
		if(arr[0]+arr[4]+arr[8]>=1){
			//rwt=Math.sqrt(0.5+Math.sqrt(0.25-rxrw*rxrw-ryrw*ryrw-rzrw*rzrw));
			rwt=Math.sqrt(Math.abs(0.5+Math.sqrt(Math.abs(0.25-rxrw*rxrw-ryrw*ryrw-rzrw*rzrw))));
		}else{
			//rwt=Math.sqrt(0.5-Math.sqrt(0.25-rxrw*rxrw-ryrw*ryrw-rzrw*rzrw));
			rwt=Math.sqrt(Math.abs(0.5-Math.sqrt(Math.abs(0.25-rxrw*rxrw-ryrw*ryrw-rzrw*rzrw))));
		}
		if(rwt!=0){
			return[rxrw/rwt,ryrw/rwt,rzrw/rwt,rwt];
		}else{
			//增根
			var rxt=Math.sqrt(Math.abs((arr[4]+arr[8])*(-0.5)));
			var ryt=Math.sqrt(Math.abs((arr[0]+arr[8])*(-0.5)));
			var rzt=Math.sqrt(Math.abs((arr[0]+arr[4])*(-0.5)));
			if(arr[5]<0||arr[2]<0||arr[1]<0){
				if(arr[5]>0){
					rxt=-rxt;
				}
				if(arr[2]>0){
					ryt=-ryt;
				}
				if(arr[1]>0){
					rzt=-rzt;
				}
			}
			return[rxt,ryt,rzt,0];
		}
	}
	
	this.getEulerAngles=function(){
		//四元数转欧拉角
		if(isNaN(rw)){
			return[rx,ry,rz,NaN];
		}
		var arr=this.toRotationMatrix(rx,ry,rz,rw);
		var rxt;
		var ryt;
		var rzt;
		if(this.rotationType==0||this.rotationType==-1||(this.rootModel!=null&&this.rootModel!=this)){
			if((arr[0]!=0||arr[3]!=0)&&(arr[7]!=0||arr[8]!=0)){
				rxt=Math.atan2(-arr[7],arr[8])*180/Math.PI;
				rzt=Math.atan2(arr[3],arr[0])*180/Math.PI;
				ryt=Math.asin(arr[6])*180/Math.PI;
			}else{
				//万向锁
				ryt=arr[6]>=0?90:-90;
				rzt=Math.atan2(-arr[1],arr[4]);
				rxt=0;
			}
		}else{
			if((arr[1]!=0||arr[0]!=0)&&(arr[5]!=0||arr[8]!=0)){
				rxt=Math.atan2(arr[5],arr[8])*180/Math.PI;
				ryt=Math.atan2(-arr[1],arr[0])*180/Math.PI;
				rzt=-Math.asin(arr[2])*180/Math.PI;
			}else{
				//万向锁
				rxt=-arr[2]>=0?90:-90;
				ryt=Math.atan2(arr[3],arr[4]);
				rzt=0;
			}
		}
		return[rxt,ryt,rzt,NaN];
	}
	
	this.getAxisRotation=function(){
		//获得当前旋转所绕的轴和旋转的角度数
		var axsw;
		var aysw;
		var azsw;
		var cw;
		var sw;
		var arr;
		if(isNaN(rw)){
			arr=this.getQuaternion();
			axsw=arr[0];
			aysw=arr[1];
			azsw=arr[2];
			cw=arr[3];
		}else{
			axsw=rx;
			aysw=ry;
			azsw=rz;
			cw=rw;
		}
		sw=Math.sqrt(1-cw*cw);
		var angle=Math.acos(cw)*360/Math.PI;
		if(angle<0){
			sw=-sw;
		}
		if(cw==1||cw==-1||sw==0){
			return[0,0,1,0];
		}else{
			return[axsw/sw,aysw/sw,azsw/sw,angle];
		}
	}
	
	Viewer3d.getQuaternionArrayFromAxis=function(ax,ay,az,angle){
		//从环绕的旋转轴和其角度中获得四元数(旋转轴向量，旋转轴角度)
		var d=Math.sqrt(ax*ax+ay*ay+az*az);
		var cosw_2=Math.cos(angle*Math.PI/360);
		var sinw_2=Math.sin(angle*Math.PI/360);
		return[ax*sinw_2/d,ay*sinw_2/d,az*sinw_2/d,cosw_2];
	}
	
	this.updateQuaternionFromAxis=function(ax,ay,az,angle){
		//从环绕的旋转轴和其角度中获得四元数并更新到当前的旋转属性(旋转轴向量，旋转轴角度)
		var arr=this.getQuaternionArrayFromAxis(ax,ay,az,angle);
		this.rx=arr[0];
		this.ry=arr[1];
		this.rz=arr[2];
		this.rw=arr[3];
	}
	
	this.concatAxisRotation=function(ax,ay,az,angle){
		//追加一个绕某个轴旋转的角度
		var arr;
		var rx0;
		var ry0;
		var rz0;
		var rw0;
		if(isNaN(rw)){
			arr=this.getQuaternion();
			rx0=arr[0];
			ry0=arr[1];
			rz0=arr[2];
			rw0=arr[3];
		}else{
			rx0=rx;
			ry0=ry;
			rz0=rz;
			rw0=rw;
		}
		arr=this.getQuaternionArrayFromAxis(ax,ay,az,angle);
		this.rx=rx0*arr[3]+rw0*arr[0]+rz0*arr[1]-ry0*arr[2];
		this.ry=ry0*arr[3]+rw0*arr[1]+rx0*arr[2]-rz0*arr[0];
		this.rz=rz0*arr[3]+rw0*arr[2]+ry0*arr[0]-rx0*arr[1];
		this.rw=rw0*arr[3]-rx0*arr[0]-ry0*arr[1]-rz0*arr[2];
	}
	
	this.concatAxisRotationFromVelocity=function(r,vx,vy,vz,nx,ny,nz){
		if(arguments.length<7)nz=1;
		if(arguments.length<6)ny=0;
		if(arguments.length<5)nx=0;
		if(arguments.length<4)vz=0;//从运动速度和所附着平面的法向量，追加一个绕某个轴滚动的角度
		if(vx==0&&vy==0&&vz==0){
			return;
		}
		this.concatAxisRotation(ny*vz-vy*nz,vx*nz-nx*vz,nx*vy-vx*ny,(Math.sqrt(vx*vx+vy*vy+vz*vz)*180)/(Math.PI*r));
	}
	
	this.concatAngles=function(rx2,ry2,rz2,rw2){
		if(arguments.length<4)rw2=NaN;
		var rx3;
		var ry3;
		var rz3;
		var rw3;
		if(isNaN(rw2)){
			var arr=this.toRotationMatrix(this.rx,this.ry,this.rz,this.rw);
			var arr2=this.toRotationMatrix(rx2,ry2,rz2);
			var arr3=[arr[0]*arr2[0]+arr[1]*arr2[3]+arr[2]*arr2[6],arr[0]*arr2[1]+arr[1]*arr2[4]+arr[2]*arr2[7],arr[0]*arr2[2]+arr[1]*arr2[5]+arr[2]*arr2[8],arr[3]*arr2[0]+arr[4]*arr2[3]+arr[5]*arr2[6],arr[3]*arr2[1]+arr[4]*arr2[4]+arr[5]*arr2[7],arr[3]*arr2[2]+arr[4]*arr2[5]+arr[5]*arr2[8],arr[6]*arr2[0]+arr[7]*arr2[3]+arr[8]*arr2[6],arr[6]*arr2[1]+arr[7]*arr2[4]+arr[8]*arr2[7],arr[6]*arr2[2]+arr[7]*arr2[5]+arr[8]*arr2[8]];
			if((arr3[0]!=0||arr3[3]!=0)&&(arr3[7]!=0||arr3[8]!=0)){
				rx3=Math.atan2(-arr3[7],arr3[8])*180/Math.PI;
				rz3=Math.atan2(arr3[3],arr3[0])*180/Math.PI;
				ry3=Math.asin(arr3[6])*180/Math.PI;
			}else{
				//万向锁
				ry3=arr3[6]>=0?90:-90;
				rz3=Math.atan2(-arr3[1],arr3[4]);
				rx3=0;
			}
			rw3=NaN;
		}else{
			rx3=this.rw*rx2+this.rx*rw2+this.ry*rz2-this.rz*ry2;
			ry3=this.rw*ry2-this.rx*rz2+this.ry*rw2+this.rz*rx2;
			rz3=this.rw*rz2+this.rx*ry2-this.ry*rx2+this.rz*rw2;
			rw3=this.rw*rw2-this.rx*rx2-this.ry*ry2-this.rz*rz2;
		}
		this.rx=rx3;
		this.ry=ry3;
		this.rz=rz3;
		this.rw=rw3;
	}
	
	this.toRotationMatrix=function(rx,ry,rz,rw){
		if(arguments.length<4)rw=NaN;
		if(isNaN(rw)){
			var sx=Math.sin(rx*Math.PI/180);
			var cx=Math.cos(rx*Math.PI/180);
			var sy=Math.sin(ry*Math.PI/180);
			var cy=Math.cos(ry*Math.PI/180);
			var sz=Math.sin(rz*Math.PI/180);
			var cz=Math.cos(rz*Math.PI/180);
			return[cy*cz,-cx*sz+sx*sy*cz,-sx*sz-cx*sy*cz,cy*sz,cx*cz+sx*sy*sz,sx*cz-cx*sy*sz,sy,-sx*cy,cx*cy];
		}else{
			return[rw*rw+rx*rx-ry*ry-rz*rz,2*(rx*ry+rz*rw),2*(rx*rz-ry*rw),2*(rx*ry-rz*rw),rw*rw-rx*rx+ry*ry-rz*rz,2*(ry*rz+rx*rw),2*(rx*rz+ry*rw),2*(ry*rz-rx*rw),rw*rw-rx*rx-ry*ry+rz*rz];
		}
	}
	
	this.quickSort=function(minn,maxn){
		//面片按最大深度的逆序快速排序
		var planeArray=this.planeArray;
		var i;
		var j;
		var temp;
		var k=(minn+maxn)>>1;
		if(k!=minn){
			temp=planeArray[k];
			planeArray[k]=planeArray[minn];
			planeArray[minn]=temp;
		}else if(maxn-minn==1&&planeArray[maxn][0]>planeArray[k][0]){
			temp=planeArray[k];
			planeArray[k]=planeArray[maxn];
			planeArray[maxn]=temp;
			return;
		}
		k=minn;
		var flag=true;
		var flagprev=true;
		i=minn;
		j=maxn;
		while(i<=j){
			flagprev=flag;
			if(flag&&planeArray[j][0]>planeArray[k][0]){
				temp=planeArray[k];
				planeArray[k]=planeArray[j];
				planeArray[j]=temp;
				k=j;
				flag=!flag;
			}else if(!flag&&planeArray[i][0]<planeArray[k][0]){
				temp=planeArray[k];
				planeArray[k]=planeArray[i];
				planeArray[i]=temp;
				k=i;
				flag=!flag;
			}
			flagprev?j-=Number(1):i++;
		}
		temp=null;
		if(k-minn>1){
			this.quickSort(minn,k-1);
		}
		if(maxn-k>1){
			this.quickSort(k+1,maxn);
		}
	}
	
	this.quickSort2=function(minn,maxn){
		//面片按comparePlane的比较算法的逆序快速排序
		var planeArray=this.planeArray;
		var i;
		var j;
		var temp;
		var k=(minn+maxn)>>1;
		if(k!=minn){
			temp=planeArray[k];
			planeArray[k]=planeArray[minn];
			planeArray[minn]=temp;
		}else if(maxn-minn==1&&this.comparePlane(planeArray[maxn],planeArray[k])){
			temp=planeArray[k];
			planeArray[k]=planeArray[maxn];
			planeArray[maxn]=temp;
			return;
		}
		k=minn;
		var flag=true;
		var flagprev=true;
		i=minn;
		j=maxn;
		while(i<=j){
			flagprev=flag;
			if(flag&&this.comparePlane(planeArray[j],planeArray[k])){
				temp=planeArray[k];
				planeArray[k]=planeArray[j];
				planeArray[j]=temp;
				k=j;
				flag=!flag;
			}else if(!flag&&!this.comparePlane(planeArray[i],planeArray[k])){
				temp=planeArray[k];
				planeArray[k]=planeArray[i];
				planeArray[i]=temp;
				k=i;
				flag=!flag;
			}
			flagprev?j-=Number(1):i++;
		}
		temp=null;
		if(k-minn>1){
			this.quickSort(minn,k-1);
		}
		if(maxn-k>1){
			this.quickSort(k+1,maxn);
		}
	}
	
	this.comparePlane=function(planeArrayi1,planeArrayi2){
		var y1=planeArrayi1[0];
		var y2=planeArrayi2[0];
		var p1=planeArrayi1[9];
		var p2=planeArrayi2[9];
		var m1=this.modelArr[planeArrayi1[10]];
		var m2=this.modelArr[planeArrayi2[10]];
		var coorda1=m1.coorda[p1];
		var coorda2=m2.coorda[p2];
		var A=coorda1[0];
		var B=coorda1[1];
		var C=coorda1[2];
		var D=coorda1[3];
		var d0=A*coorda2[4]+B*coorda2[5]+C*coorda2[6]+D;
		var d1=A*coorda2[7]+B*coorda2[8]+C*coorda2[9]+D;
		var d2=A*coorda2[10]+B*coorda2[11]+C*coorda2[12]+D;
		var d3=isNaN(coorda1[13])?0:A*coorda2[13]+B*coorda2[14]+C*coorda2[15]+D;
		var lumda;
		var lumdamin=1-0.0001;
		var lumdamax=1+0.0001;
		if(d0>=0&&d1>=0&&d2>=0&&d3>=0||d0<=0&&d1<=0&&d2<=0&&d3>=0){
			lumda=(-D)/(A*coorda2[4]+B*coorda2[5]+C*coorda2[6]);
			trace(lumda);
			if(lumda<lumdamin||lumda>lumdamax){
				return lumda>1;
			}
			lumda=(-D)/(A*coorda2[7]+B*coorda2[8]+C*coorda2[9]);
			if(lumda<lumdamin||lumda>lumdamax){
				return lumda>1;
			}
			lumda=(-D)/(A*coorda2[10]+B*coorda2[11]+C*coorda2[12]);
			return lumda>1;
		}
		A=coorda2[0];
		B=coorda2[1];
		C=coorda2[2];
		D=coorda2[3];
		d0=A*coorda1[4]+B*coorda1[5]+C*coorda1[6]+D;
		d1=A*coorda1[7]+B*coorda1[8]+C*coorda1[9]+D;
		d2=A*coorda1[10]+B*coorda1[11]+C*coorda1[12]+D;
		d3=isNaN(coorda1[13])?0:A*coorda1[13]+B*coorda1[14]+C*coorda1[15]+D;
		if(d0>=0&&d1>=0&&d2>=0&&d3>=0||d0<=0&&d1<=0&&d2<=0&&d3>=0){
			lumda=(-D)/(A*coorda1[4]+B*coorda1[5]+C*coorda1[6]);
			trace("$"+lumda);
			if(lumda<lumdamin||lumda>lumdamax){
				return lumda<1;
			}
			lumda=(-D)/(A*coorda1[7]+B*coorda1[8]+C*coorda1[9]);
			if(lumda<lumdamin||lumda>lumdamax){
				return lumda<1;
			}
			lumda=(-D)/(A*coorda1[10]+B*coorda1[11]+C*coorda1[12]);
			return lumda<1;
		}
		return planeArrayi1[0]>planeArrayi2[0];
	}
	
	this.additionalFix=function(leng){
		//抗破面
		var i,j,k,l;
		var arr;
		var arr2;
		var isTriangle;
		var model=null;
		var model2=null;
		var d;
		var d1;
		var d2;
		var d3;
		var d4;
		var temp;
		var pointti;
		var coordi;
		var coordni;
		var pointti2;
		var coordi2;
		var coordni2;
		var flag=false;
		var flagprev=false;
		for(i=0;i<leng-1;i++){
			arr=this.planeArray[i];
			arr2=this.planeArray[i+1];
			if(arr[11]>=arr2[0]){
				flagprev=flag;
				flag=false;
			}else{
				if(!flag&&i<leng-2){
					isTriangle=isNaN(arr[7]);
					if((isTriangle?Math.min(arr[1],arr[3],arr[5]):Math.min(arr[1],arr[3],arr[5],arr[7]))>=(isTriangle?Math.max(arr2[1],arr2[3],arr2[5]):Math.max(arr2[1],arr2[3],arr2[5],arr2[7]))){
						continue;
					}
					if((isTriangle?Math.max(arr[1],arr[3],arr[5]):Math.min(arr[1],arr[3],arr[5],arr[7]))<=(isTriangle?Math.min(arr2[1],arr2[3],arr2[5]):Math.max(arr2[1],arr2[3],arr2[5],arr2[7]))){
						continue;
					}
					if((isTriangle?Math.min(arr[2],arr[4],arr[6]):Math.min(arr[2],arr[4],arr[6],arr[8]))>=(isTriangle?Math.max(arr2[2],arr2[4],arr2[6]):Math.max(arr2[2],arr2[4],arr2[6],arr2[8]))){
						continue;
					}
					if((isTriangle?Math.max(arr[2],arr[4],arr[6]):Math.min(arr[2],arr[4],arr[6],arr[8]))<=(isTriangle?Math.min(arr2[2],arr2[4],arr2[6]):Math.max(arr2[2],arr2[4],arr2[6],arr2[8]))){
						continue;
					}
				}
				k=arr[9];
				l=arr2[9];
				model=this.modelArr[arr[10]];
				model2=this.modelArr[arr2[10]];//coordi=model.coord[k];
				//pointti=model.pointt[coordi[0]];
				coordni=model.coorda[k];
				coordi2=model2.coord[l];
				pointti2=model2.pointt[coordi2[0]];//coordni2=model2.coordn[k];
				d=coordni[0]*this.mdx+coordni[2]*this.mdy+coordni[3];
				d1=coordni[0]*pointti2[0]+coordni[1]*pointti2[1]+coordni[2]*pointti2[2]+coordni[3];
				pointti2=model2.pointt[coordi2[1]];
				d2=coordni[0]*pointti2[0]+coordni[1]*pointti2[1]+coordni[2]*pointti2[2]+coordni[3];
				pointti2=model2.pointt[coordi2[2]];
				d3=coordni[0]*pointti2[0]+coordni[1]*pointti2[1]+coordni[2]*pointti2[2]+coordni[3];
				if(coordi2[3]>=0){
					pointti2=model2.pointt[coordi2[3]];
					d4=coordni[0]*pointti2[0]+coordni[1]*pointti2[1]+coordni[2]*pointti2[2]+coordni[3];
				}else{
					d4=0;
				}
				if(d*(d1+d2+d3+d4)<0){
					flagprev=flag;
					flag=true;
					if(!flagprev){
						j=i;
					}
				}else{
					flagprev=flag;
					flag=false;
				}
			}
			if(flagprev&&(!flag||i==leng-2)){
				k=!flag?j+((i-j+1)>>1):j+((i-j+2)>>1);
				while(j<k){
					temp=this.planeArray[k-j-1];
					this.planeArray[k-j-1]=this.planeArray[j];
					this.planeArray[j]=temp;
					j++;
				}
			}
		}
	}
	
	this.diffuseColour=function(colour,px,py,pz,nx,ny,nz,hl,rl){
		if(arguments.length<9)rl=0.927;
		if(arguments.length<8)hl=1.5;//根据某点坐标p、该点法向量n和点光源坐标（或平行光源向量）(spotx,spoty,spotz,spotk)，结合高光强度(正面用hl，背面用rl）和颜色colour生成一个点的漫反射颜色
		var r=(colour>>16)&0xff;
		var g=(colour>>8)&0xff;
		var b=colour&0xff;
		var nd=nx*nx+ny*ny+nz*nz;
		var spx,spy,spz,spd;
		var costheta;
		if(this.spotk){
			spx=px-this.spotx;
			spy=py-this.spoty;
			spz=pz-this.spotz;
			spd=spx*spx+spy*spy+spz*spz;
			costheta=(nx*spx+ny*spy+nz*spz)/Math.sqrt(spd*nd);
		}else{
			spd=this.spotx*this.spotx+this.spoty*this.spoty+this.spotz*this.spotz;
			costheta=(nx*this.spotx+ny*this.spoty+nz*this.spotz)/Math.sqrt(spd*nd);
		}
		if(costheta<=0){
			costheta=-costheta;
			r=(r-this.ambientr)*costheta*rl+this.ambientr;
			g=(g-this.ambientg)*costheta*rl+this.ambientg;
			b=(b-this.ambientb)*costheta*rl+this.ambientb;
		}else{
			r=(r-this.ambientr)*costheta*hl+this.ambientr;
			g=(g-this.ambientg)*costheta*hl+this.ambientg;
			b=(b-this.ambientb)*costheta*hl+this.ambientb;
		}//r=(r-ambientr)*costheta*1.5+ambientr;
		//g=(g-ambientg)*costheta*1.5+ambientg;
		//b=(b-ambientb)*costheta*1.5+ambientb;
		r=(r-this.ambientr)*1.5+this.ambientr;
		g=(g-this.ambientg)*1.5+this.ambientg;
		b=(b-this.ambientb)*1.5+this.ambientb;
		if(r<this.ambientr){
			r=this.ambientr;
		}
		if(g<this.ambientg){
			g=this.ambientg;
		}
		if(b<this.ambientb){
			b=this.ambientb;
		}
		if(r>255){
			r=255;
		}
		if(g>255){
			g=255;
		}
		if(b>255){
			b=255;
		}
		return(r<<16)|(g<<8)|b;
	}
	
	this.specularColour=function(colour,px,py,pz,nx,ny,nz,hl,rl){
		if(arguments.length<9)rl=0.927;
		if(arguments.length<8)hl=1.5;//,ks:Number=0.25,ns:Number=5):int{
		//根据某点坐标p、该点法向量n和点光源坐标（或平行光源向量）(spotx,spoty,spotz,spotk)，结合漫反射高光强度(正面用hl，背面用rl）、镜面反射高光强度ks、光泽度ns和颜色colour生成一个点的镜面反射颜色
		var r=(colour>>16)&0xff;
		var g=(colour>>8)&0xff;
		var b=colour&0xff;
		var nd=Math.sqrt(nx*nx+ny*ny+nz*nz);
		var spx,spy,spz,spd;
		var spx2,spy2,spz2,spd2;
		var costheta;
		var cosphi;
		var lumda;
		if(this.spotk){
			spx=px-this.spotx;
			spy=py-this.spoty;
			spz=pz-this.spotz;
		}else{
			spx=this.spotx;
			spy=this.spoty;
			spz=this.spotz;
		}
		spd=Math.sqrt(spx*spx+spy*spy+spz*spz);
		costheta=(nx*spx+ny*spy+nz*spz)/(spd*nd);
		lumda=Math.abs(nd/(costheta*spd));
		if(costheta>=0.1){
			spx2=spx*lumda-2*nx;
			spy2=spy*lumda-2*ny;
			spz2=spz*lumda-2*nz;
		}else if(costheta<=-0.1){
			spx2=spx*lumda+2*nx;
			spy2=spy*lumda+2*ny;
			spz2=spz*lumda+2*nz;
		}else{
			lumda=1;
			spx2=spx;
			spy2=spy;
			spz2=spz;
		}
		cosphi=-spy2/(spd*lumda);
		cosphi=Math.pow(cosphi,this.ns);
		if(costheta<=0){
			costheta=-costheta;
			r=(r-this.ambientr)*costheta*hl+this.ambientr;
			g=(g-this.ambientg)*costheta*hl+this.ambientg;
			b=(b-this.ambientb)*costheta*hl+this.ambientb;
		}else{
			//costheta=-costheta;
			r=(r-this.ambientr)*costheta*rl+this.ambientr;
			g=(g-this.ambientg)*costheta*rl+this.ambientg;
			b=(b-this.ambientb)*costheta*rl+this.ambientb;
		}
		if(cosphi>=0){
			//r+=(255-r)*cosphi*ks;
			//g+=(255-g)*cosphi*ks;
			//b+=(255-b)*cosphi*ks;
			r+=127*this.ks*cosphi;
			g+=127*this.ks*cosphi;
			b+=127*this.ks*cosphi;
		}//r=(r-ambientr)*costheta*1.5+ambientr;
		//g=(g-ambientg)*costheta*1.5+ambientg;
		//b=(b-ambientb)*costheta*1.5+ambientb;
		r=(r-this.ambientr)*1.5+this.ambientr;
		g=(g-this.ambientg)*1.5+this.ambientg;
		b=(b-this.ambientb)*1.5+this.ambientb;
		if(r<this.ambientr){
			r=this.ambientr;
		}
		if(g<this.ambientg){
			g=this.ambientg;
		}
		if(b<this.ambientb){
			b=this.ambientb;
		}
		if(r>255){
			r=255;
		}
		if(g>255){
			g=255;
		}
		if(b>255){
			b=255;
		}
		return(r<<16)|(g<<8)|b;
	}
	
	this.bmpdMatrix=function(matrix,bmpw,bmph,px1,py1,px2,py2,px3,py3,uvMatrix){
		//由uv矩阵和透视图上的点坐标生成
		if(uvMatrix==null){
			//matrix.identity();				
			return;
		}
		matrix.a=uvMatrix.a;
		matrix.b=uvMatrix.b;
		matrix.c=uvMatrix.c;
		matrix.d=uvMatrix.d;
		matrix.tx=uvMatrix.tx;
		matrix.ty=uvMatrix.ty;//var matrix2:Matrix=new Matrix();
		matrix2.a=(px2-px1)/bmpw;
		matrix2.b=(py2-py1)/bmpw;
		matrix2.c=(px3-px2)/bmph;
		matrix2.d=(py3-py2)/bmph;
		matrix2.tx=px1;
		matrix2.ty=py1;
		matrix.concat(matrix2);
		//matrix2.invertFrom(matrix);
	}

	
	this.split=function(angle0){
		if(arguments.length<1)angle0=45;
		var point=this.point;
		var coord=this.coord;
		var uv=this.uv;
		var coord2=this.coord2;
		if(coordn.length<=0){
			this.createN();
		}
		var i;
		var j;
		var k;
		var l;
		var m;
		var n;
		var leng=point.length;
		var leng2=coord.length;
		var cos0=Math.cos(angle0*Math.PI/180);
		var cost;
		var pointci=new Array(leng);//点所在平面数组
		var pointcj=new Array(leng);//点所在平面的点序号数组
		var jksign;//某个点的连续的平面组的编组序号
		var ordered=false;//数组已排好序
		var temp;
		for(i=0;i<leng;i++){
			pointci[i]=new Array();
			pointcj[i]=new Array();
		}
		for(i=0;i<leng2;i++){
			pointci[coord[i][0]].push(i);
			pointcj[coord[i][0]].push(0);
			pointci[coord[i][1]].push(i);
			pointcj[coord[i][1]].push(1);
			pointci[coord[i][2]].push(i);
			pointcj[coord[i][2]].push(2);
			if(coord[i][3]>=0){
				pointci[coord[i][3]].push(i);
				pointcj[coord[i][3]].push(3);
			}
		}
		l=leng-1;
		for(i=0;i<leng;i++){
			jksign=new Array(pointci[i].length);
			for(j=0;j<jksign.length;j++){
				jksign[j]=j;
			}
			for(j=0;j<jksign.length;j++){
				for(k=j+1;k<jksign.length;k++){
					if(jksign[k]==jksign[j]){
						continue;
					}
					m=pointci[i][j];
					n=pointci[i][k];
					cost=coordn[m][0]*coordn[n][0]+coordn[m][1]*coordn[n][1]+coordn[m][2]*coordn[n][2];
					if(cost>cos0){
						jksign[k]=jksign[j];
					}
				}
			}
			for(j=0;j<jksign.length;j++){
				ordered=true;
				for(k=1;k<jksign.length-j;k++){
					if(jksign[j]>jksign[k]){
						temp=jksign[k];
						jksign[k]=jksign[j];
						jksign[j]=temp;
						temp=pointci[i][k];
						pointci[i][k]=pointci[i][j];
						pointci[i][j]=temp;
						temp=pointcj[i][k];
						pointcj[i][k]=pointcj[i][j];
						pointcj[i][j]=temp;
						ordered=false;
					}
				}
				if(ordered){
					break;
				}
			}
			k=jksign[0];
			for(j=0;j<jksign.length;j++){
				if(k==jksign[j]){
					if(k!=jksign[0]){
						coord[pointci[i][j]][pointcj[i][j]]=l;
					}
					continue;
				}
				k=jksign[j];
				point.push([point[i][0],point[i][1],point[i][2]]);
				if(uv.length>0&&coord2.length<=0){
					uv.push([uv[i][0],uv[i][1]]);
				}
				l++;
				coord[pointci[i][j]][pointcj[i][j]]=l;
			}
		}
		this.createN();
		if(this.bmpd!=null){
			this.updateTexture();
		}
	}
	
	function set_bitmap0(src0){
		//改变贴图
		if(src0==null || src0==""){
			this.bmpd=null;
			this.updateTexture();
		}
		if(this.get_bitmap==null || this.get_bitmap()==src0){
			return;
		}
		var bmd=document.createElement("img");
		
		var model=this;
		bmd.onload=function(){
			if(!bmd.complete){
				return;
			}
			model.bmpd=bmd;
			model.updateTexture();
			bmd=null;
		}
		bmd.onerror=function(){
			if(model.onloadBitmapError){
				model.onloadBitmapError();
			}
			bmd=null;
		}
		bmd.src=src0;
	};
	
	
	function get_bitmap0(){
		return this.bmpd?this.bmpd.src:null;
	}
	
	this.set_sight=function(sight0){
		if(sight0>180){
			sight0=180;
		}
		if(sight0<0){
			sight0=0;
		}
		tanS=Math.tan(sight0/2*Math.PI/180);//视角的一半的正切值
		this.sy=this.wid/(2*tanS);//站点与画面的距离
		var i;
		var leng;
		if(this.child!=null){
			leng=this.child.length;
			for(i=0;i<leng;i++){
				this.child[i].sight=sight0;
			}
		}
		if(this.comrade!=null){
			leng=this.comrade.length;
			for(i=0;i<leng;i++){
				if(this.comrade[i] instanceof  Viewer3d){
					this.comrade[i].sight=sight0;
				}
			}
		}
	}
	
	this.get_sight=function(){
		return Math.atan(tanS)*2*180/Math.PI;
	}
	
	this.get_path=function(){
		var arr=new Array();
		var model=this;
		while(model.parentModel!=model||model.uncomradeModel.parentModel!=model){
			if(model.parentModel!=model){
				model=model.parentModel;
				arr.push(model);
			}else{
				model=model.uncomradeModel.parentModel;
				arr.push(model);
			}
		}
		return(arr.reverse());
	}
	
	this.get_renderedPath=function(){
		var arr=new Array();
		var model=this;
		while(model.parentModel!=model){
			model=model.parentModel;
			arr.push(model);
		}
		return(arr.reverse());
	}
	
	this.getLocalInfo=function(model){
		if(arguments.length<1)model=null;
		return[this.tx,this.ty,this.tz,this.rx,this.ry,this.rz,this.scaleShape];
	}
}
