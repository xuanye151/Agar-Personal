var socket = io.connect('http://localhost:3000');
var canvas = document.getElementById('myCanvas');
canvas.width= document.documentElement.clientWidth;
canvas.height= document.documentElement.clientHeight;
var context = canvas.getContext('2d');
if(typeof Object.beget !=='function'){
    Object.create=function(o){
        var F=function(){};
        F.prototype=o;
        return new F();
    };
};
var b={
    mouse:{x:0,y:0},
    scale:1,
    player:[],
    playerFunc:{
        correct:function(aim1,aim2,speed,precise){
            var d=b.distances(aim1,aim2);
            if(d.dis>=precise){
                this.site.x+= d.dir.x*speed;
                this.site.y+= d.dir.y*speed;
                this.site= b.setBoundary(this.site);
            }
            return this;
        },
        correct_dir:function(dir,speed){
            this.site.x+=dir.x*speed;
            this.site.y+=dir.y*speed;
            this.site= b.setBoundary(this.site);
            return this;
        }
    },
    iniPlayer:function(data){
        var p=Object.create(b.playerFunc);
        p.site=data.site;
        p.ID=data.ID;
        p.status=data.status;
        return p;
    },
    getMousePos:function(canvas, evt){
        var rect = canvas.getBoundingClientRect();  //画布边界数据
        return {
            x: evt.clientX - rect.left,
            y: evt.clientY - rect.top
        };
    },
    distances:function(site1,site2){
        var x=site1.x-site2.x;
        var y=site1.y-site2.y;
        var dis=Math.sqrt(x*x+y*y);
        return {
            dis:dis,
            dir:{
                x:x/dis*(-1),
                y:y/dis*(-1)
            }
        };
    },
    collide:function(data){
        b.player.forEach(function(i){
            b.player.forEach(function(j){
                var aim1=data[i.ID],aim2=data[j.ID];
                if(i.ID!= j.ID&&(aim1.status=='gather'||aim2.status=='gather')){
                    var d=b.distances(aim1.site,aim2.site).dis;
                    if(d<=aim1.radius+aim2.radius+2){
                        if(aim1.status=='gather'||aim1.status=='follow') {
                            i.correct(j.site, i.site,aim1.speed,1);
                            aim1.status='follow';
                        }
                        if(aim2.status=='gather'||aim1.status=='follow') {
                            j.correct(i.site, j.site,aim2.speed,1);
                            aim2.status='follow';
                        }
                    }
                }
            })
        })
    },
    correctPlayer:function(data){
        if(b.player.length==0) return false;
        for(var i in b.player){
            var p=b.player[i];
            var o=data[p.ID];
            if(o.flag==false) b.player.splice(i,1);
            if(o.status=='follow_mouse'){
                p.correct(eyes.midScreen,b.mouse,o.speed,4);
            }
            else if(o.status=='split') {
                var d=b.distances(p.site,o.split_site).dis;
                if(d>= o.split_dis-20) p.status='gather';
                p.correct_dir(o.dir, o.split_speed*(1-d/o.split_dis));
            }
            else if(o.status=='gather'){
                //var main=data[b.player[0].ID];  //获得主球
                //p.correct(p.site, main.site,o.speed,o.radius+main.radius);
                p.correct(p.site, b.average_coordinates(),o.speed,o.radius);
                p.correct(eyes.midScreen,b.mouse,o.speed,4);
            }
            else if(o.status=='launch'){
                var d=b.distances(p.site,o.launch_site).dis;
                p.correct_dir(o.dir,o.launch_speed*(1-d/o.launch_dis));
            }
            var d=new Date();
            var runTime= d.getTime()/1000-o.birthday;
            if(runTime>= 30&& p.ID!=b.player[0].ID&& p.status!='torpor') {
                socket.emit('merge',{ x:b.player[0].ID,y:p.ID });
                p.status='torpor';
            }
        }
        b.collide(data);
        return b.player;
    },
    setBoundary:function(site){
        if(b.boundary){
            if(site.x>b.boundary) site.x=b.boundary-1;
            else if(site.x<0) site.x=0+1;
            if(site.y>b.boundary) site.y=b.boundary-1;
            else if(site.y<0) site.y=0+1;
        }
        return site;
    },
    playerID:function(){
        var i=[];
        this.player.forEach(function(p){i.push(p.ID)});
        return i;
    },
    average_coordinates:function(){
        if(b.player.length==0) return false;
        var o={x:0,y:0};
        var i=0;
        this.player.forEach(function(p){
            if(p.status!='launch'){
                o.x+= p.site.x;
                o.y+= p.site.y;
                i++;
            }
        });
        o.x/=i;
        o.y/=i;
        return o;
    },
    score:function(data){
        var s=0;
        b.player.forEach(function(p){if(data[p.ID].type=='player') s+= data[p.ID].score;})
        return s;
    }
};
var draw={
    Line:function(context,mx,my,lx,ly){
        context.beginPath();
        context.moveTo(mx,my);
        context.lineTo(lx,ly);
        context.stroke();
    },
    Grid:function(x,y,step,color){
        var range=5000;
        context.strokeStyle = color;
        context.lineWidth = 0.5;
        for (var i=0.5-range+x;  i<range+x; i+= step) {draw.Line(context,i,0,i,range);}
        for (var i= 0.5-range+y; i<range+y; i+= step) {draw.Line(context,0,i,range,i);}
    },
    Arc:function(x,y,radius,color){
        context.beginPath();
        context.arc(x,y,radius,0,Math.PI*2);  //画玩家控制圆
        context.fillStyle = color;
        context.fill();
    },
    Polygon:function(Xcenter, Ycenter, size,color, numberOfSides){
        numberOfSides = numberOfSides || 7;
        size = size || 10;
        context.beginPath();
        var x=0;
        context.moveTo (Xcenter +  size * Math.cos(x), Ycenter +  size *  Math.sin(x));
        for (var i = 1; i <= numberOfSides;i += 1) {
            context.lineTo (Xcenter + size * Math.cos(x+i * 2 * Math.PI / numberOfSides), Ycenter + size * Math.sin(x+i * 2 * Math.PI / numberOfSides));
        }
        context.lineWidth = 1;
        context.fillStyle = color || 'red';
        context.fill();
    },
    Star:function(centerX, centerY, radius, color, spikes){
        radius = radius || 40;
        color = color || 'green';
        spikes = spikes || 45;
        var rot=Math.PI/2*3;
        var x=centerX;
        var y=centerY;
        var step=Math.PI/spikes;
        var outerRadius = radius * 1.08;
        context.strokeSyle="#000";
        context.beginPath();
        context.moveTo(centerX,centerY-outerRadius);
        for(i=0;i<spikes;i++){
            x=centerX+Math.cos(rot)*outerRadius;
            y=centerY+Math.sin(rot)*outerRadius;
            context.lineTo(x,y);
            rot+=step;
            x=centerX+Math.cos(rot)*radius;
            y=centerY+Math.sin(rot)*radius;
            context.lineTo(x,y);
            rot+=step;
        }
        context.lineTo(centerX,centerY-outerRadius);
        context.stroke();
        context.closePath();
        context.fillStyle = color;
        context.fill();},
    Name:function(name,x,y){
        context.fillStyle = 'black';
        context.font = "15pt Calibri";
        var mea=context.measureText(name);
        var w=mea.width/2;
        context.fillText(name,x-w,y+6);
    },
    Rect:function(x,y,width,height,color){
        context.fillStyle=color;
        context.fillRect(x,y,width,height);
    },
    Score:function(data){
        context.globalAlpha=0.5;
        this.Rect(0,canvas.height-30,100,30,'lightgray');
        context.globalAlpha=1;
        context.fillStyle = 'white';
        context.fillText('Score: '+ b.score(data),10,canvas.height-10);
    },
    All:function(data,scale){
        context.clearRect(0,0,canvas.width,canvas.height);
        this.Grid(eyes.canvas_screen().x,eyes.canvas_screen().y,40*scale,'lightgray');
        data.forEach(function(d){
            d.site.x*=scale||1;
            d.site.y*=scale||1;
            d.site.x+=eyes.canvas_screen().x;
            d.site.y+=eyes.canvas_screen().y;
            d.radius*=scale||1;
            if(d.flag==true&& d.outline=='Polygon') draw.Polygon(d.site.x, d.site.y,d.radius,d.color);
            if(d.flag==true&& d.outline=='Star')    draw.Star(d.site.x, d.site.y, d.radius, d.color);
            if(d.flag==true&& d.outline=='Arc')     draw.Arc(d.site.x, d.site.y, d.radius, d.color);
            if(d.flag==true&&d.name)                  draw.Name(d.name,d.site.x, d.site.y);
            if(d.flag==true&& d.broken)               socket.emit('broken', d.ID);
        });
        this.Score(data);
    }
};
var eyes={
    now:{x:0,y:0},
    midScreen:{x:canvas.width/2,y:canvas.height/2},
    canvas_screen:function(){
        var t={
            x:-this.now.x* b.scale+eyes.midScreen.x,
            y:-this.now.y* b.scale+eyes.midScreen.y
        };
        return t;
    },
    follow:function(obj){
        if(obj!=false) eyes.now=obj;
        else eyes.now=this.midScreen;
    }
};
canvas.addEventListener('mousemove', function(evt) {
    var mousePos = b.getMousePos(canvas, evt); //鼠标事件数据
    b.mouse.x = mousePos.x;  //坐标x
    b.mouse.y = mousePos.y;  //坐标y
}, false);
window.addEventListener('keydown', function(evt) {
    var data={key:evt.keyCode ? evt.keyCode:evt.which};
    if(data.key==32||data.key==87) {
        data.dir=b.distances(eyes.midScreen ,b.mouse).dir;
        data.ID= b.playerID();
        socket.emit('keydown',data);
    }
    if(data.key==38) b.scale*=1.1;
    else if(data.key==40) b.scale*=0.9;
}, false);
socket.emit('battle');
socket.emit('begin','靳博洋');
socket.on('battle',function(data){
    data=JSON.parse(data);
    draw.All(data, b.scale);
    eyes.follow(b.average_coordinates());
    b.correctPlayer(data);
    socket.emit('updatePlayer', b.player);
    socket.emit('battle');
});
socket.on('player',function(data){
    b.player.push(b.iniPlayer(data));
});
socket.on('boundary',function(data){
    b.boundary=data;
});