/**
 * Created by gyp on 14-8-12.
 */
function headPicker(){
    createjs.MovieClip.call(this);
    this.scaleX=1;
    this.scaleY=1;
    dx = this.x = 320;
    dy = this.y = HEI/2;
    this.drawImg = function(img){
        var bmp = new createjs.Bitmap(img);
        bmp.x=-(img.width)/2;
        bmp.y=-(img.height)/2;
        bmp.scaleY = 1;
        bmp.scaleX = 1;
        this._img = bmp;
        this._img.cache(0,0,img.width,img.height);
        this.addChild(this._img);
    }
    this.setXY = function(x,y){
        this.x = x;
        this.y = y;
    }
    this.setScale = function(scale){
        this.scaleX = scale;
        this.scaleY = scale;
    }
    this.clipRect = function(){
        mainView.removeChild(mvClipTwo);
        var shape = new createjs.Shape();
        shape.graphics = new createjs.Graphics().beginStroke('rgba(255,255,255,1)').drawRect(0,0,640,640).endStroke();
        this.mask = shape;
    }
    this.getDataString = function(){
        return this.getStage().toDataURL("image/png");
    }
}
headPicker.prototype = new createjs.MovieClip();