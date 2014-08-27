/**
 * Created by gyp on 14-8-12.
 */
var WID,HEI;
var cropper;
//设置选取图片相关参数
var stage,mainView,shareHead,mvClipTwo;
//设置图片处理相关参数
var stageTwo,mainViewTwo,pickedImg;
//滤镜参数
var blurFilter, hueFilter, constrastFilter, saturationFilter, brightnessFilter;
var redChannelFilter, greenChannelFilter, blueChannelFilter;
var colorFilter;
//默认选取照片的canvas的相关属性
var currentScale =1;
var initialScale = 1;
var dx=0;
var dy=0;
var shareHeadString;
//边框例子
var iframes = ["iframeThree.png","iframeTwo.png","iframeFive.png","iframeSix.png","iframeFour.png"];
var filtersArray = [
    [0, 2, -12, -33, 0, 0, 255, 223, 255],
    [41, 6, 0, -59, 0, 0, 255, 173, 145],
    [22, -10, -12, -41, 0, 0, 255, 255, 158],
    [27, 18, -35, 8, 0, 0, 215, 255, 215],
    [22, 73, -100, 18, 0, 0, 255, 255, 255]
]
//是否添加了滤镜和边框
var hasFilter = false , hasIframe = false;
//滤镜和边框index
var filterIndex = 0;
var iframeIndex = 0;
//生成的相关参数
var shareImage;
var url = "http://cd2014.porsche-events.cn/";
var title="快来看看我用 @保时捷 Martini Racing 涂装制作的个性照片。点击 http://cd2014.porsche-events.cn ，制作专属于你的Martini Racing照片，分享还可赢取 Martini 系列精美礼品。#2014成都车展#";
//cache
$(document).ready(function(){
    //初始化
    init();
    //添加事件绑定
    //模拟上传事件点击
    $(document).on("click",".content .screenWelcome .startPick",function(){
         $(".content .screenWelcome #upload01").click();
    })
    //确定选取
    $(document).on("click",".content .screenOne .pickerMenus .pickerMenuOne",selectSure);
    //取消选择
    $(document).on("click",".content .screenOne .pickerMenus .pickerMenuTwo",function(){
       ga('send','event','porsche','diy', 'Martini-CropPic');
       window.location.href = "index.php";
    })
    //保存图片
    $(document).on("click",".content .screenTwo .editMenus .editMenuThree",saveImg);
	$(".share_buttons a").hover(function(){
		 	$(this).fadeTo("fast",0.5);
		 },function(){
			 $(this).fadeTo("fast",1);
			 })
})
//初始化
function init(){
    //判断时候有表单没填
    if($.cookie("form")=="yes"){
        window.location.href = "save.html?img="+$.cookie("shareImage");
    }
    WID = $(".content").width();
    HEI = $(window).height();
    if(HEI>956){
        $(".content .screenTwo .editMenus").addClass("two");
    }else{
        $(".content .screenTwo .editMenus").addClass("one");
    }
    $(".content").css({"height":HEI});
    $(".content .wrap").css({"line-height":HEI+"px","height":HEI,"width":WID});
    $(".content .screenOne #picker").attr({"height":HEI,"width":WID}).css({"height":HEI,"width":WID});
        stage = new createjs.Stage("picker");
        createjs.Ticker.setFPS(30);
        createjs.Ticker.addEventListener("tick",stage);
        mainView = new createjs.Container();
        stage.addChild(mainView);
}
function selectImage(fileList){
    $(".content .wrap").show();
    var file = fileList[0];
    //var blobURLref = URL.createObjectURL(file);
    canvasResize(file, {
        width: 1000,
        height: 1000,
        crop: false,
        quality: 80,
        rotate: 0,
        callback: function(data, width, height) {
            var tmpImg = data;
            startPick(tmpImg);
        }

    });
}
// 判断屏幕是否旋转
function orientationChange() {
    switch(window.orientation) {
        case 0:
            break;
        case -90:
            alert("为了更好的体验，推荐竖屏访问哦");
            break;
        case 90:
            alert("为了更好的体验，推荐竖屏访问哦");
            break;
        case 180:
            break;
    }
};
//设置图片
function startPick(imgString){
    $(".content .screenWelcome").hide();
    $(".content .screenOne").show();
    var img = new Image();
    img.src = imgString;
    img.onload = function(){
        shareHead = new headPicker();
        shareHead.drawImg(img);
        mainView.addChild(shareHead);
        mainView.setChildIndex(shareHead,10);
        var iframe = new Image();
        iframe.src = "images/pickWrap.png";
        iframe.onload = function(){
            var bmp = new createjs.Bitmap(iframe);
            bmp.x=-bmp.width/2;
            bmp.y=-bmp.height/2;
            bmp.scaleY = HEI/iframe.height;
            bmp.scaleX = WID/iframe.width;
            mvClipTwo = new createjs.MovieClip()
            mvClipTwo.addChild(bmp);
            mainView.addChild(mvClipTwo);
            mainView.setChildIndex(mvClipTwo,20);
            addTouch();
            $(".content .wrap").hide();
        }
    }

}
//添加选择照片的手势
function addTouch(){
    touch.on('.content .screenOne #picker', 'touchstart', function(ev){
        ev.preventDefault();
    });
    touch.on('.content .screenOne #picker', 'pinch', function(ev){

        currentScale = ev.scale - 1;

        currentScale = initialScale + currentScale;
        /*
         currentScale = currentScale > 2.5 ? 2.5 : currentScale;
         */
        currentScale = currentScale < 0.3 ? 0.3 : currentScale;

        shareHead.setScale(currentScale) ;
    });



    touch.on('.content .screenOne #picker', 'pinchend', function(ev){
        initialScale = currentScale;
    });
    touch.on('.content .screenOne #picker', 'drag', function(ev){
        dx = dx || 0;
        dy = dy || 0;
        var offx = dx + ev.x;
        var offy = dy + ev.y;
        shareHead.setXY(offx,offy) ;
    });
    touch.on('.content .screenOne #picker', 'dragend', function(ev){
        dx += ev.x;
        dy += ev.y;
    });
}
//移除选着照片的相关手势
function removeTouch(){
    touch.off('.content .screenOne #picker', 'touchstart',function(){});
    touch.off('.content .screenOne #picker', 'pinch',function(){});
    touch.off('.content .screenOne #picker', 'pinchend',function(){});
    touch.off('.content .screenOne #picker', 'dragend',function(){});
}
//确定选取
function selectSure(){
    //removeTouch();
    ga('send','event','porsche','diy', 'Martini-CancelPic');
    $(".content .wrap").show();
    shareHead.clipRect();
    window.setTimeout(function(){
        var shareHeadStringw = shareHead.getDataString();
        var canvasIMG = document.getElementById("hiddenCanvas");
        canvasIMG.width= 320;
        canvasIMG.height = 320;
        var context2 = canvasIMG.getContext("2d");
        var img = new Image();
        img.src = shareHeadStringw;
        img.onload =function(){
            context2.drawImage(img, 0, 0, 320, 320);
            shareHeadString = canvasIMG.toDataURL("image/png");
            addEditPlace();
        }

    },300);

}
//添加第二个canvas
function addEditPlace(){
    createjs.Ticker.removeEventListener("tick",stage);
    $(".content .screenOne").hide();
    $(".content .screenTwo").show();
    $(".content .wrap").css("height",$(".content .screenTwo").height());
    stageTwo = new createjs.Stage("sharePic");
    createjs.Ticker.setFPS(30);
    createjs.Ticker.addEventListener("tick",stageTwo);
    mainViewTwo = new createjs.Container();
    stageTwo.addChild(mainViewTwo);
    startDraw(shareHeadString);
    addFilterAndIframeAction();
}
//添加draw对象
function startDraw(imgString){
    var img = new Image();
    img.src = imgString;
    img.onload = function(){
        pickedImg = new headDrawer();
        pickedImg.drawImg(img);
        stageTwo.addChild(pickedImg);
        $(".content .wrap").hide();
    }
    var index = 0;
    var iframe = new Image();
    //pickedImg.removeFrame();
    iframe.src = "images/"+iframes[index];
    iframe.onload = function(){
        pickedImg.setFrame(iframe);
    }
}
//随机滤镜
function computeFilter(i){
    var brightnessValue = filtersArray[i][0];
    var contrastValue =  filtersArray[i][1];
    var saturationValue =  filtersArray[i][2];
    var hueValue = filtersArray[i][3];

    var blurXValue = filtersArray[i][4];
    var blurYValue = filtersArray[i][5];

    var redChannelvalue = filtersArray[i][6];
    var greenChannelValue =  filtersArray[i][7];
    var blueChannelValue =  filtersArray[i][8];

    cm = new createjs.ColorMatrix();
    cm.adjustColor(brightnessValue, contrastValue, saturationValue, hueValue);

    colorFilter = new createjs.ColorMatrixFilter(cm);
    blurFilter = new createjs.BlurFilter(blurXValue,  blurYValue, 2);
    redChannelFilter = new createjs.ColorFilter(redChannelvalue/255,1,1,1);
    greenChannelFilter = new createjs.ColorFilter(1,greenChannelValue/255,1,1);
    blueChannelFilter = new createjs.ColorFilter(1,1,blueChannelValue/255,1);
    setFilters();
}
//随机边框
function randomIframe(){
    pickedImg.removeFrame();
    var i = Math.ceil(Math.random()*5);
    var iframe = new Image();
    iframe.src = "images/"+iframes[i];
    iframe.onload = function(){
        pickedImg.setFrame(iframe);
    }
}
function saveImg(){
    ga('send','event','porsche','diy', 'Martini-SavePic');
    $(".content .wrap").show();
    var finalImgString = pickedImg.getDataString();
    $.ajax({
        url:"http://cd2014.porsche-events.cn/saveImages/savePng.php",
        data:{"img":finalImgString},
        dataType:"json",
        type:"post",
        success:function(data){
            if(parseInt(data.code)==1){
                $(".content .screenFour .finalPic").attr("src",data.file);
                shareImage = data.file;
                $(".content .screenTwo").hide();
                $(".content .screenFour").show();
                $(".content .wrap").hide();
                $(".content .wrap").css("height",$(".content .screenFour").height());
                addSharer();
                addWEixinShare(data.file);
            }else{
                $(".content .wrap").hide();
            }

        },
        timeout:function(){
            $(".content .wrap").hide();
        }
    })
}
//添加滤镜和相关切换相关时间
function addFilterAndIframeAction(){
    //显示滤镜
    $(document).on("click",".content .screenTwo .editMenus .editMenuOne",function(){
        ga('send','event','porsche','diy', 'Martini-Filter');
        $(".content .screenTwo .filterPlace").show();
        $(".content .screenTwo .iframePlace").hide();
    });
    //显示边框
    $(document).on("click",".content .screenTwo .editMenus .editMenuTwo",function(){
        ga('send','event','porsche','diy', 'Martini-Frame');
        $(".content .screenTwo .iframePlace").show();
        $(".content .screenTwo .filterPlace").hide();
    });
    //添加滤镜
    $(document).on("click",".content .screenTwo .filterPlace .fileterShower .filterTotal .filters",function(){
        var index = $(this).index();
        computeFilter(index);
    });
    //添加边框
    $(document).on("click",".content .screenTwo .iframePlace .iframeShower .iframeTotal .iframers",function(){
        pickedImg.removeFrame();
        var index = $(this).index();
        var iframe = new Image();
        iframe.src = "images/"+iframes[index];
        iframe.onload = function(){
            pickedImg.setFrame(iframe);
        }
    });
    //左右切换滤镜按钮
    $(document).on("click",".content .screenTwo .filterPlace .direction.directionLeft",function(){
        filterIndex--;
        changeFilterPlace();
    })
    $(document).on("click",".content .screenTwo .filterPlace .direction.directionRight",function(){
        filterIndex++;
        changeFilterPlace();
    })
    //添加左右切换滤镜手势
    touch.on(".content .screenTwo .filterPlace", 'swiperight', function(ev){
        filterIndex--;
        changeFilterPlace()
    });

    touch.on(".content .screenTwo .filterPlace", 'swipeleft', function(ev){
        filterIndex++;
        changeFilterPlace()
    });
    //左右切换边框按钮
    $(document).on("click",".content .screenTwo .iframePlace .direction.directionLeft",function(){
        iframeIndex--;
        changeIframePlace();
    })
    $(document).on("click",".content .screenTwo .iframePlace .direction.directionRight",function(){
        iframeIndex++;
        changeIframePlace();
    })
    //添加左右切换边框手势
    touch.on(".content .screenTwo .iframePlace ", 'swiperight', function(ev){
        iframeIndex--;
        changeIframePlace()
    });

    touch.on(".content .screenTwo .iframePlace ", 'swipeleft', function(ev){
        iframeIndex++;
        changeIframePlace()
    });
}
//添加分享到社区
function addSharer(){
    $(document).on("click",".content .screenFour .shareMenus .shareMenuFour",function(){
        ga('send','event','porsche','diy', 'Martini-Form');
        window.location.href='save.html?img='+shareImage;
    })
}
//分享到社区网站
function shareToSinaer(){
    ga('send','event','porsche','diy', 'Form-ShareToSina');
    $.cookie("form","yes", {expires: 1, path: '/test', domain: 'cd2014.porsche-events.cn'});
    $.cookie("shareImage",shareImage,  {expires: 1, path: '/test', domain: 'cd2014.porsche-events.cn'});
    GYP.shareToSina(url,title,shareImage);
}
function shareToDoubaner(){
    ga('send','event','porsche','diy', 'Form-ShareToRenRen');
    $.cookie("form","yes", {expires: 1, path: '/test', domain: 'cd2014.porsche-events.cn'});
    $.cookie("shareImage",shareImage,  {expires: 1, path: '/test', domain: 'cd2014.porsche-events.cn'});
    GYP.shareToDouban(url,title,shareImage);
}
function shareToQQer(){
    ga('send','event','porsche','diy', 'Form-ShareToTencent');
    $.cookie("form","yes", {expires: 1, path: '/test', domain: 'cd2014.porsche-events.cn'});
    $.cookie("shareImage",shareImage,  {expires: 1, path: '/test', domain: 'cd2014.porsche-events.cn'});
    GYP.shareToQQ(url,title,shareImage);
}
//设置滤镜切换
function changeFilterPlace(){
    if(filterIndex<=0) {
        filterIndex = 0;
        $(".content .screenTwo .filterPlace .direction.directionLeft").hide();
    }else{
        $(".content .screenTwo .filterPlace .direction.directionLeft").show();
    }
    if(filterIndex>=$(".content .screenTwo .filterPlace .fileterShower .filterTotal .filters").length-3){
        filterIndex = $(".content .screenTwo .filterPlace .fileterShower .filterTotal .filters").length-3;
        $(".content .screenTwo .filterPlace .direction.directionRight").hide();
    }else{
        $(".content .screenTwo .filterPlace .direction.directionRight").show();
    }
    $(".content .screenTwo .filterPlace .fileterShower .filterTotal").animate({"left":-178*filterIndex+"px"},200);
}
//设置边框切换
function changeIframePlace(){
    if(iframeIndex<=0){
        iframeIndex = 0;
        $(".content .screenTwo .iframePlace .direction.directionLeft").hide();
    }else{
        $(".content .screenTwo .iframePlace .direction.directionLeft").show();
    }
    if(iframeIndex>=$(".content .screenTwo .iframePlace .iframeShower .iframeTotal .iframers").length-3){
        iframeIndex = $(".content .screenTwo .iframePlace .iframeShower .iframeTotal .iframers").length-3;
        $(".content .screenTwo .iframePlace .direction.directionRight").hide();
    }else{
        $(".content .screenTwo .iframePlace .direction.directionRight").show();
    }
    $(".content .screenTwo .iframePlace .iframeShower .iframeTotal").animate({"left":-178*iframeIndex+"px"},200);
}
//添加微信分享相关参数
function addWEixinShare(imgUrl){
    // 需要分享的内容，请放到ready里
    WeixinApi.ready(function(Api) {

        // 微信分享的数据
        var wxData = {
            "appId": "", // 服务号可以填写appId
            "imgUrl" : imgUrl,
            "link" : 'http://cd2014.porsche-events.cn/',
            "desc" : '快来看看 Porsche 与 Martini 一同为我制作的炫酷照片！',
            "title" : "2014 成都国际汽车展览会 保时捷专题网站"
        };

        // 分享的回调
        var wxCallbacks = {
            // 分享操作开始之前
            ready : function() {
                // 你可以在这里对分享的数据进行重组
                //alert("准备分享");
            },
            // 分享被用户自动取消
            cancel : function(resp) {
                // 你可以在你的页面上给用户一个小Tip，为什么要取消呢？
                alert("取消分享");
            },
            // 分享失败了
            fail : function(resp) {
                // 分享失败了，是不是可以告诉用户：不要紧，可能是网络问题，一会儿再试试？
                //alert("分享失败");
            },
            // 分享成功
            confirm : function(resp) {
                // 分享成功了，我们是不是可以做一些分享统计呢？
                $(".content .screenFour .rules").show();
            },
            // 整个分享过程结束
            all : function(resp) {
                // 如果你做的是一个鼓励用户进行分享的产品，在这里是不是可以给用户一些反馈了？
                //alert("分享结束");
            }
        };

        // 用户点开右上角popup菜单后，点击分享给好友，会执行下面这个代码
        Api.shareToFriend(wxData, wxCallbacks);

        // 点击分享到朋友圈，会执行下面这个代码
        Api.shareToTimeline(wxData, wxCallbacks);

        // 点击分享到腾讯微博，会执行下面这个代码
        Api.shareToWeibo(wxData, wxCallbacks);

    });
    $(document).on("click",".content .screenFour .rules .closeRules,.content .screenFour .rules .clickToCloseRules",function(){
        window.location.href='save.html?img='+imgUrl;
    })
}
//设置滤镜
function setFilters(){
    $(".content .wrap").show();
    var filters = [colorFilter, blurFilter, redChannelFilter, greenChannelFilter, blueChannelFilter];
    pickedImg.setFilter(filters);
    $(".content .wrap").hide();
}