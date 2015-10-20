var Rectangle={
    array:[],
    res:[],
    ini_position:function(b){return{up:b, down:0, left:0, right:b}},
    checkAim:function(position,aimGroup){
        var group=[];
        for(var i in aimGroup){
            if(aimGroup[i].flag==true &&aimGroup[i].site.x<position.right&&aimGroup[i].site.x>position.left&&aimGroup[i].site.y<position.up&&aimGroup[i].site.y>position.down) {
                var order=group.length;
                group[order]=aimGroup[i];
            }
        }
        return group;
    },
    add:function(position,group){
        var rect={
            pos:{
                up:position.up,
                down: position.down,
                right: position.right,
                left: position.left
            },
            aim:group
        }
        this.array.push(rect);
        return rect;
    },
    ini:function(pos,data){
        var group=this.checkAim(pos,data);
        if(group.length!=0) return this.add(pos,group);
    },
    distances:function(site1,site2){
        var x=site1.x-site2.x;
        var y=site1.y-site2.y;
        var dis=Math.sqrt(x*x+y*y);
        return {
            dis:dis,
            dir:{
                x:x/dis,
                y:y/dis
            }
        };
    },
    check_pressureLine:function(check){
        if(check.one) {
            check.one.aim.forEach(function(a){
                var pos=check.one.pos;
                if(check.two&&a.site.x- a.radius<pos.left) Rectangle.collision(a,check.two.aim);
                if(check.four&&a.site.y-a.radius<pos.down) Rectangle.collision(a,check.four.aim);
                if(check.three&&a.site.x- a.radius<pos.left&&a.site.y-a.radius<pos.down) Rectangle.collision(a,check.three.aim);
            });
        };
        if(check.two) {
            check.two.aim.forEach(function(a){
                var pos=check.two.pos;
                if(check.one&& a.site.x+ a.radius>pos.right) Rectangle.collision(a,check.one.aim);
                if(check.three&& a.site.y-a.radius<pos.down) Rectangle.collision(a,check.three.aim);
                if(check.four&&a.site.x+ a.radius>pos.right&& a.site.y-a.radius<pos.down) Rectangle.collision(a,check.four.aim);
            });
        };
        if(check.three) {
            check.three.aim.forEach(function(a){
                var pos=check.three.pos;
                if(check.two&& a.site.y+ a.radius>pos.up) Rectangle.collision(a,check.two.aim);
                if(check.four&&a.site.x+ a.radius>pos.right) Rectangle.collision(a,check.four.aim);
                if(check.one&& a.site.y+ a.radius>pos.up&&a.site.x+ a.radius>pos.right) Rectangle.collision(a,check.one.aim);
            });
        };
        if(check.four) {
            check.four.aim.forEach(function(a){
                var pos=check.four.pos;
                if(check.one&& a.site.y+ a.radius>pos.up) Rectangle.collision(a,check.one.aim);
                if(check.three&& a.site.x- a.radius<pos.left) Rectangle.collision(a,check.three.aim);
                if(check.two&&a.site.y+ a.radius>pos.up&&a.site.x- a.radius<pos.left) Rectangle.collision(a,check.two.aim);
            });
        };
    },
    split:function(rectangle,sequence){
        if(rectangle.aim.length==1) return false;
        var up_down=Math.abs(rectangle.pos.up+rectangle.pos.down)/2;
        var right_left=Math.abs(rectangle.pos.right+rectangle.pos.left)/2;
        var sPos=[];
        sPos[1]={up:rectangle.pos.up,down:up_down,right:rectangle.pos.right,left:right_left};
        sPos[2]={up:rectangle.pos.up,down:up_down,right:right_left,left:rectangle.pos.left};
        sPos[3]={up:up_down,down:rectangle.pos.down,right:right_left,left:rectangle.pos.left};
        sPos[4]={up:up_down,down:rectangle.pos.down,right:rectangle.pos.right,left:right_left};
        var ret={
            one:Rectangle.ini(sPos[1],rectangle.aim),
            two:Rectangle.ini(sPos[2],rectangle.aim),
            three:Rectangle.ini(sPos[3],rectangle.aim),
            four:Rectangle.ini(sPos[4],rectangle.aim)
        };
        Rectangle.array.splice(sequence,1);
        return ret;
    },
    splits:function(times){
        for(var n=0;n<times;n++){
            for(var i in Rectangle.array){
                var split_result=Rectangle.split(Rectangle.array[i],i);
                Rectangle.check_pressureLine(split_result);
            };
        };
    },
    collision:function(aim,rec){
        rec.forEach(function(r){
            var d=Rectangle.distances(aim.site, r.site).dis;
            var mi=aim.radius<r.radius?aim: r;
            var mx=aim.radius>r.radius?aim: r;
            if(d<mi.radius*0.4+ mx.radius&& mx.radius> mi.radius*1.2){
                var r={mx:mx,mi:mi};
                Rectangle.res.forEach(function(i){ if(r!=false&&r.mx.ID== i.mx.ID&&r.mi.ID== i.mi.ID) r=false; });
                if(r!=false) Rectangle.res.push(r);
            }
        });
    }
};
var quadTree=function(data,boundary,times){
    Rectangle.res=[];
    Rectangle.array=[];
    Rectangle.ini(Rectangle.ini_position(boundary),data);
    Rectangle.splits(times);
    return Rectangle.res;
};
exports.quadTree=quadTree;