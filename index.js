var express = require('express');
var quadTree=require('./四叉树').quadTree;
var app = express();
var http = require('http').Server(app);
var io = require('socket.io')(http);
function http_app(){
    http.listen(3000, function() {console.log('listening on 3000.');});
    app.use(express.static('.'));
    app.get('/', function(req, res) {res.sendFile(__dirname + '/Agar.html');});
};http_app();
if(typeof Object.beget !=='function'){
    Object.create=function(o){
        var F=function(){};
        F.prototype=o;
        return new F();
    };
};
var circle={
    boundary:2048,
    array:[],
    func:{
        germ:{
            period:0,
            update:{num:15,interval:5000},
            recreate:function(){
                if(this.flag==false){this.flag=true;this.color=circle.randomColor(); this.site=circle.randomSite();return this; }
                else return false;
            },
            kill:function(){ this.flag=false;return this }
        },
        player:{
            radiusLimit:{mi:20,mx:400},
            speedLimit:{mi:1,mx:4},
            launchLimit:{mi:400,mx:600},
            splitLimit:40,
            sendData:function(){
                return {ID:this.ID,site:this.site,status:this.status};
            },
            sigmoid:function(score,p){
                var y=(1-Math.exp((-1)*score/p))/(Math.exp((-1)*score/p)+1);
                return{
                    speed:function(){
                        var mi=circle.func.player.speedLimit.mi;
                        var mx=circle.func.player.speedLimit.mx;
                        return mi+(mx-mi)*(1-y);
                    },
                    radius:function(){
                        var mi=circle.func.player.radiusLimit.mi;
                        var mx=circle.func.player.radiusLimit.mx;
                        return mi+(mx-mi)*y;
                    }
                };
            },
            updateScore:function(app,num){
                if(app=='+') this.score+=num||1;
                else if(app=='*') this.score*=num||1;
                this.radius=this.sigmoid(this.score,400).radius();
                this.speed=this.sigmoid(this.score,60).speed();
            },
            swallow:function(obj){
                obj.kill();
                this.updateScore('+',obj.score);
            },
            kill:function(){
                this.flag=false;return this
            },
            copy:function(){
                var p=circle.add('player');
                p.site=this.site;
                p.color=this.color;
                p.score=this.score;
                p.updateScore('*',1);
                p.name=this.name;
                return p;
            },
            split:function(){
                if(this.radius<circle.func.player.splitLimit) return;
                this.updateScore('*',0.5);
                var c=this.copy();
                c.status='split';
                c.split_site=this.site;
                c.split_dis=circle.launch_distance(this.radius);
                c.split_speed=this.speed*4;
                return c;
            },
            launch:function(){
                var a=circle.add('player');
                a.status='launch';
                a.type='projectile';
                a.site= this.site;
                a.score=1;
                a.color= this.color;
                a.launch_dis=circle.launch_distance(a.radius);
                a.launch_site= this.site;
                a.launch_speed=this.speed*4;
                a.subject=this.ID;
                this.updateScore('+',-1);
                return a;
            },
            broken:function(obj){}
        },
        virus:{
            scoreLimit:{mi:100,mx:200},
            sigmoid:function(score,p){
                var y=(1-Math.exp((-1)*score/p))/(Math.exp((-1)*score/p)+1);
                return{
                    speed:function(){
                        var mi=circle.func.player.speedLimit.mi;
                        var mx=circle.func.player.speedLimit.mx;
                        return mi+(mx-mi)*(1-y);
                    },
                    radius:function(){
                        var mi=circle.func.player.radiusLimit.mi;
                        var mx=circle.func.player.radiusLimit.mx;
                        return mi+(mx-mi)*y;
                    }
                };
            },
            updateScore:function(app,num){
                if(app=='+') this.score+=num||1;
                else if(app=='*') this.score*=num||1;
                this.radius=this.sigmoid(this.score,400).radius();
                this.speed=this.sigmoid(this.score,60).speed();
            },
            kill:function(){
                this.flag=false;return this
            },
            swallow:function(obj){
                obj.kill();
                this.updateScore('+',obj.score);
            }
        },
        projectile:{}
    },
    type:{
        germ:function(){
            var o=Object.create(circle.func.germ);
            o.type='germ';
            o.outline='Polygon';
            o.radius=10;
            o.score=1;
            return o;
        },
        player:function(){
            var o=Object.create(circle.func.player);
            o.type='player';
            o.outline='Arc';
            o.score=0;
            o.radius=o.radiusLimit.mi;
            o.speed=o.speedLimit.mx;
            o.status='follow_mouse';
            return o;
        },
        virus:function(){
            var o=Object.create(circle.func.virus);
            o.type='virus';
            o.outline='Star';
            o.score= o.scoreLimit.mi;
            o.updateScore('*',1);
            return o;
        },
        projectile:function(){
            var o=Object.create(circle.func.projectile);
            o.type='projectile';
            return o;
        }
    },
    randomColor:function(){
        return 'rgba(' + (Math.random()*255).toFixed(0) + ', ' + (Math.random()*255).toFixed(0) + ', ' + (Math.random()*255).toFixed(0) + ', 1.0)';
    },
    randomDirection:function(){var dx= this.boundary*(Math.random()-0.5);
        var dy= this.boundary*(Math.random()-0.5);
        var dis=Math.sqrt(dx*dx+dy*dy);
        return {x:dx/dis,y:dy/dis};
    },
    randomSite:function(){
        return {x:this.boundary*Math.random(),y:this.boundary*Math.random()}
    },
    getBirthday:function(){
        var d=new Date(); return d.getTime()/1000
    },
    initialize:function(o){
        o.color=this.randomColor();
        o.site=this.randomSite();
        o.birthday=this.getBirthday();
        o.flag=true;
        o.ID=this.array.length;
        this.array.push(o);
        return o;
    },
    add:function(name,num){
        var c;
        var n=num||1
        for(var i=0;i<n;i++) c=this.initialize(this.type[name]());
        return c
    },
    get:function(ID){
        return this.array[ID];
    },
    handling_collisions:function(results){
        results.forEach(function(c){
            if(c.mx.type=='player'&& c.mi.type=='germ')         c.mx.swallow(c.mi);
            else if(c.mx.type=='player'&& c.mi.type=='player') c.mx.swallow(c.mi);
            else if(c.mx.type=='player'&& c.mi.type=='projectile'&& c.mx.ID!= c.mi.subject) c.mx.swallow(c.mi);
            else if(c.mx.type=='virus'&& c.mi.type=='projectile') c.mx.swallow(c.mi);
            else if(c.mx.type=='player'&& c.mi.type=='virus') {
                c.mx.broken=true;
                c.mi.flag=false
            }
        })
    },
    update:function(){
        var results=quadTree(circle.array,circle.boundary,12);
        circle.handling_collisions(results);
        circle.func.germ.period+=10
        circle.updateGerm();
        setTimeout(circle.update,10);
    },
    updateGerm:function(){
        if(circle.func.germ.period>=circle.func.germ.update.interval){
            var times=0;
            circle.array.forEach(function(cir){
                if(times<= circle.func.germ.update.num&&cir.flag==0&&cir.type=='germ') {
                    cir.recreate();
                    times++;
                }
            })
            circle.func.germ.period=0;
        }
    },
    launch_distance:function(radius){
        var mx=circle.func.player.radiusLimit.mx;
        var mi=circle.func.player.radiusLimit.mi;
        var dx=circle.func.player.launchLimit.mx;
        var di=circle.func.player.launchLimit.mi;
        var a=(dx-di)/(mi-mx);
        var b=dx-a*mi;
        return a*radius+b;
    }
};
circle.add('germ',150);
circle.add('virus',7);
circle.update();
io.on('connection', function (socket) {
    socket.emit('boundary',circle.boundary);
    socket.on('battle',function(){
        socket.emit('battle',JSON.stringify(circle.array));
    });
    socket.on('begin',function(name){
        var p=circle.add('player');
        if(name) p.name=name;
        socket.emit('player', p.sendData());
    });
    socket.on('updatePlayer',function(data){
        if(data==[]) return;
        for(var i in data){
            circle.array[data[i].ID].site=data[i].site;
            circle.array[data[i].ID].status=data[i].status;
        }
    });
    socket.on('keydown',function(data){
        if(data.key==32){
            data.ID.forEach(function(id){
                var p=circle.get(id);
                var c=p.split();
                if(c) {
                    c.dir=data.dir;
                    socket.emit('player', c.sendData());
                }
            })
        }
        else if(data.key==87){
            data.ID.forEach(function(id){
                var p=circle.get(id);
                if(p.type=='player'){
                    var a= p.launch();
                    a.dir=data.dir;
                    socket.emit('player', a.sendData());
                }
            })
        }
    });
    socket.on('merge',function(data){
        var a=circle.get(data.x);
        var b=circle.get(data.y);
        a.swallow(b);
    });
    socket.on('broken',function(data){
        var p=circle.get(data);
        delete p.broken;
        var num=6;
        p.updateScore('*',1/num);
        for(var i=0;i<num;i++) {
            var c=p.copy();
            c.dir=circle.randomDirection();
            c.status='split';
            c.split_site=p.site;
            c.split_dis=circle.launch_distance(p.radius)*0.5;
            c.split_speed=p.speed*4;
            socket.emit('player', c.sendData());
        }
        p.dir=circle.randomDirection();
        p.status='split';
        p.split_site=p.site;
        p.split_dis=circle.launch_distance(p.radius)*0.5;
        p.split_speed=p.speed*4;
    });
})