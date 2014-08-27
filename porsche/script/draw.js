/**
 * Created by gyp on 14-8-12.
 */
function headDrawer(){
    createjs.MovieClip.call(this);
    this.drawImg = function(img){
        var bmp = new createjs.Bitmap(img);
        bmp.x=0;
        bmp.y=0;
        bmp.scaleY = HEI/img.height;
        bmp.scaleX = WID/img.width;
        this._img = bmp;
        this._img.cache(0,0,img.width,img.height);
        this.addChild( this._img);
    }
    this.setFrame = function(frameImg){
        var bmp = new createjs.Bitmap(frameImg);
        bmp.x=-bmp.height/2;
        bmp.y=-bmp.width/2;
        bmp.scaleY = HEI/frameImg.height;
        bmp.scaleX = WID/frameImg.width;
        this._iframe = bmp;
        this._iframe.cache(0,0,frameImg.width,frameImg.height);
        this.addChild(this._iframe);
    }
    this.removeFrame = function(){
        this.removeChild(this._iframe);
    }
    this.setFilter = function(filters){
        this._img.filters = filters;
        this._img.updateCache();
    }
    this.getDataString = function(){
        return this.getStage().toDataURL("image/png");
    }
}
headDrawer.prototype = new createjs.MovieClip();