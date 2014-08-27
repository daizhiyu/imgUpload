GYP = {
	/*
	*QueryString,获取url传过来的参数
	*title= GYP.QueryString('title')
	*/

	QueryString : function(item){

		var svalue = location.search.match(new RegExp("[\?\&]" + item + "=([^\&]*)(\&?)","i"));

		return svalue ? svalue[1] : svalue;

	},
	/*
	*setCookie,设置Cookie
	*GYP.setCookie('key','value',1);
	*/
	setCookie :function (nm, val, y) { 
		var exp = ''; 
		if (y) { 
			var dt = new Date(); 
			dt.setTime(dt.getTime() + (y * 86400000)); 
			exp = '; expires=' + dt.toGMTString(); 
		} 
		document.cookie = nm + '=' + escape(val) + exp + ';path=/;domain='+window.location.host;
	 },
	/*
	*getCookie,getCookie
	*value= GYP.getCookie('key')
	*/
	getCookie :function (nm) { 
		var m = ''; 
		if (window.RegExp) { 
			var re = new RegExp(';\\s*' + nm + '=([^;]*)', 'i');
			m = re.exec(';' + document.cookie); 
		 } 
			return (m ? unescape(m[1]) : ''); 
		},
	 /**
	 * 检查是否是正确的邮箱地址
	 * 
	 * @method checkMail
	 * @param {String}
	 *            要检查的字符串
	 * @return {Boolean} 
	 */
	checkMail:function(mail) {
		return mail.match(/\w+([-+.]\w+)*@\w+([-.]\w+)*\.\w+([-.]\w+)*/);
	},
	/**
	 * 检查是否是正确的手机号码
	 * 
	 * @method checkPhone
	 * @param {String}
	 *            要检查的字符串
	 * @return {Boolean} 
	 */
	checkPhone:function(phone) {
		return (/^1[3|4|5|8][0-9]\d{8}$/.test(phone));
	},
	/**
	 * 检查是否是正确的固话
	 * 
	 * @method checkFixed
	 * @param {String}
	 *            要检查的字符串
	 * @return {Boolean} 
	 */
	checkFixed:function(phone) {
		return (/^(0[1-9]{2})-\d{8}$|^(0[1-9]{3}-(\d{7,8}))$/.test(phone));
	},
	/*
	*htmlDecode,转成HTML标签
	*/
	htmlDecode:function(str){
		return str.replace(/&#39;/g, '\'')
			  .replace(/<br\s*(\/)?\s*>/g, '\n')
			  .replace(/&nbsp;/g, ' ')
			  .replace(/&lt;/g, '<')
			  .replace(/&gt;/g, '>')
			  .replace(/&quot;/g, '"')
			  .replace(/&amp;/g, '&');
	},
	/**
	 * 加载图片
	 * 
	 * @method stopDefault
	 * @param {Array}
	 *            sources 图片(数组)
	 * @param {function}
	 *            callback 回调函数
	 */
	loadImages:function(sources, callback) {
		var images = {};
		var loadedImages = 0;
		var numImages = 0;
		for ( var src in sources) {
			numImages++;
		}
		for ( var src in sources) {
			images[src] = new Image();
			images[src].onload = function() {
				if (++loadedImages >= numImages) {
					callback(images);
				}
			};
			images[src].src = sources[src];
		}
	},
	/**
	 * 将形如"2013-02-28 17:35:00"的字符串转换为Date对象
	 */
	parseDate:function(s) {
		var re = /^(\d{4})-(\d\d)-(\d\d) (\d\d):(\d\d):(\d\d)$/;
		var m = re.exec(s);
		return m ? new Date(m[1], m[2] - 1, m[3], m[4], m[5], m[6]) : null;
	},

	/**
	 * 阻止浏览器默认事件
	 * 
	 * @method stopDefault
	 * @param {Object}
	 *            event 浏览器事件对象
	 */
	stopDefault:function(event) {
		event.preventDefault();
		event.returnvalue = false;
	},

	/**
	 * 初始状态信息，该方法用来从服务器端加载一段js，用eval执行来初始化全局变量
	 * 
	 * @method initStatus
	 * @param {String}
	 *            link 请求链接地址
	 */
	initStatus:function(link) {
		var status = this.load(link, false);
		if (this.isNotEmpty(status))
			eval(status);
	},

	/**
	 * 获得以“http://”开头的链接地址，并加上当前域的HOST名称,例如
	 * g_utils.getHttpLink("/code/abcdefg")将返回"http://runjs.cn/code/abcdefg"
	 * 
	 * @method getHttpLink
	 * @return {String} link 返回处理好的链接地址
	 */
	getHttpLink:function(link) {
		if (this.isEmpty(link))
			return;
		if (link.indexOf("http") == -1) {
			if (link.indexOf("/") == 0) {
				link = g_status.host + link;
			} else {
				link = g_status.host + "/" + link;
			}
		}
		return link;
	},
	/**
	 * 获取当前模块名
	 * 
	 * @method className
	 * @param {Object}
	 *            obj
	 * @example className(g_utils);//返回 "Utils"
	 * @return
	 */
	className:function(obj) {
		if (obj && obj.constructor && obj.constructor.toString) {
			var arr = obj.constructor.toString().match(/function\s*(\w+)/);
			if (arr && arr.length == 2) {
				obj.clazz = arr[1]
				return arr[1];
			}
		}
		return undefined;
	},
	/**
	 * 判断checkBox是否被选中
	 * GYP.isChecked($("#checker"))
	 * @method isChecked
	 * @param {Object}
	 *            jQuery selecter
	 * @return {Boolean} 当前选中将返回true，否则将返回false
	 */
	isChecked:function(selecter) {
		return selecter.attr("checked")?true:false;
	},
	/**
	 * radioValue  radio单选框的值
	 * GYP.radioValue($("#radio"))
	 * @method radioValue
	 * @param {String}
	 *            raiod name
	 * @return {String} 返回当前Raido被选中的值
	 */
	radioValue:function(name) {
		return $(':radio[name="'+name+'"]:checked').val();
	},
	/**
	 * 判断当前对象是否为空
	 * 
	 * @method isEmpty
	 * @param {Object}
	 *            obj
	 * @return {Boolean} empty 当为 null,undefined,"" 将返回true
	 */
	isEmpty:function(obj) {
		return (typeof obj == "undefined" || obj == null ||  obj.length == 0)
	},

	/**
	 * 判断当前对象是否非空
	 * 
	 * @method isNotEmpty
	 * @param {Object}
	 *            obj
	 * @return {Boolean}
	 */
	isNotEmpty:function(obj) {
		return !this.isEmpty(obj);
	},

	/**
	 * 判断是否为函数
	 * 
	 * @method isFunc
	 * @param {Object}
	 *            fun
	 * @return {Boolean}
	 */
	isFunction:function(fun) {
		return (fun != null && typeof fun == "function");
	},

	/**
	 * 判断不是函数
	 * 
	 * @method isNotFunc
	 * @param {Object}
	 *            fun
	 * @return {Boolean}
	 */
	isNotFunction:function(fun) {
		return !this.isFunc(fun);
	},
	
	/**
	 * 判断 cur 是否为 type 类型
	 * 
	 * @method typeOf
	 * @param {Object}
	 *            cur
	 * @param {String}
	 *            type
	 * @example typeOf("Hello","string");//将返回true
	 * @return {Boolean}
	 */
	typeOf:function(cur, type) {
		if (typeof type != "string")
			return false;
		return typeof cur == type;
	},

	/**
	 * 判断是否为数组
	 * 
	 * @method isArray
	 * @param {Object}
	 *            array
	 * @return {Boolean}
	 */
	isArray:function(array) {
		return this.isNotEmpty(array) && this.className(array) == "Array"
	},

	/**
	 * 判断不是数组
	 * 
	 * @method isNotArray
	 * @param {Object}
	 *            arr
	 * @return {Boolean}
	 */
	isNotArray:function(arr) {
		return !this.isArray(arr);
	},
	/**
	 * 判断两个对象是否为相同的类
	 * 
	 * @method isSameClass
	 * @param {Object}
	 *            cur
	 * @param {Object}
	 *            cur2
	 * @return {Boolean}
	 */
	isSameClass:function(cur, cur2) {
		if (this.isNotEmpty(cur) && this.isNotEmpty(cur2)) {
			return this.className(cur) == this.className(cur2);
		}
		return false;
	},

	/**
	 * 判断两个对象为不同类
	 * 
	 * @method isDiffcentClass
	 * @param {Object}
	 *            cur
	 * @param {Object}
	 *            cur2
	 * @return {Boolean}
	 */
	isDiffcentClass:function(cur, cur2) {
		return !this.isSameClass(cur, cur2);
	},

	/**
	 * 以 window.open 方式打开弹窗
	 * 
	 * @method openwindow
	 * @param {String}
	 *            url
	 * @param {String}
	 *            name
	 * @param {Number}
	 *            iWidth
	 * @param {Number}
	 *            iHeight
	 */
	openwindow:function(url, name, iWidth, iHeight) {
		var url; // 转向网页的地址;
		var name; // 网页名称，可为空;
		var iWidth; // 弹出窗口的宽度;
		var iHeight; // 弹出窗口的高度;
		var iTop = (window.screen.availHeight - 30 - iHeight) / 2; // 获得窗口的垂直位置;
		var iLeft = (window.screen.availWidth - 10 - iWidth) / 2; // 获得窗口的水平位置;
		window.open(url, name, 'height=' + iHeight + ',,innerHeight=' + iHeight + ',width=' + iWidth + ',innerWidth=' + iWidth + ',top=' + iTop + ',left=' + iLeft + ',toolbar=no,menubar=no,scrollbars=auto,resizeable=no,location=no,status=no');
	},

	/**
	 * 更新浏览器地址栏链接地址
	 * 
	 * @method updateUrl
	 * @param {String}
	 *            url
	 */
	updateUrl:function(url) {
		if (window.history && window.history.pushState) {
			window.history.pushState(null, url, url);
		}
	},

	/**
	 * 判断当前是否处在iframe中
	 * 
	 * @method isIframe
	 * @return {Boolean}
	 */
	isIframe:function() {
		return top.location != self.location;
	},

	/**
	 * 判断当前不处在iframe中
	 * 
	 * @method isIframe
	 * @return {Boolean}
	 */
	isNotIframe:function() {
		return !this.isIframe();
	},

	/**
	 * 利用数组的join构造字符串，提高字符串拼接效率
	 * 
	 * @method buildString
	 * @param arguments
	 *            {String|Number}
	 * @return {String} 拼接后的字符串
	 */
	buildString:function() {
		var str = [];
		for ( var i = 0; i < arguments.length; i++) {
			str[i] = arguments[i];
		}
		return str.join("");
	},
	/*
	*shareToSina,新浪微博分享
	*多图pic=http://domain.com/a.jpg||http://domain.com/b.jpg;
	*/
 	shareToSina:function(url,title,pic){
		var weiboUrl = "http://service.weibo.com/share/share.php?url="+url+"&type=button&language=zh_cn&pic="+pic+"&title="+encodeURIComponent(title)+"&searchPic=true&style=simple";
		window.open(weiboUrl,"分享到新浪微博","left=30%,top=20%,width=650,height=450,toolbar=0,resizable=0");
	},
	/*
	*shareToQQ,腾讯微博分享
	*多图pic=http://domain.com/a.jpg||http://domain.com/b.jpg;
	*/
	shareToQQ:function(url,title,pic){
		var weiboUrl = "http://share.v.t.qq.com/index.php?c=share&a=index&title="+encodeURIComponent(title)+"&url="+url+"&pic="+pic;
		window.open(weiboUrl,"分享到腾讯微博","left=30%,top=20%,width=650,height=450,toolbar=0,resizable=0");
	},
	/*
	*shareToRen,分享到人人
	*只支持单图
	*/
	shareToRen:function(url,title,pic){
		var weiboUrl = "http://widget.renren.com/dialog/share?resourceUrl="+url+"&srcUrl="+url+"&title="+"http://caiyuan.qq.com"+"&pic="+pic+"&description="+encodeURIComponent(title);
		window.open(weiboUrl,"分享到人人网","left=30%,top=20%,width=650,height=450,toolbar=0,resizable=0");
	},
	/*
	*shareToDouban,分享到人人
	*只支持单图
	*/
 	shareToDouban:function(url,title,pic){
		var weiboUrl = "http://www.douban.com/share/service?bm=&image="+pic+"&url="+url+"&updated=&name="+encodeURIComponent(title);
		window.open(weiboUrl,"分享到豆瓣","left=30%,top=20%,width=650,height=450,toolbar=0,resizable=0");
	
	},
	/*
	*shareToWeixin,分享到微信
	*weixinShareImg：分享图片
	*shareTitle：分享标题
	*shareDesc：分享解释
	*/
	shareToWeixin:function(weixinShareImg,shareTitle,shareDesc){
			function onBridgeReady() {
					var appId  = '',
					imgUrl = weixinShareImg,
					link   = window.location.href,
					title  = htmlDecode(shareTitle),
					desc   = htmlDecode(shareDesc),
					fakeid = "";
					desc   = desc || link;	
					// 发送给好友; 
					WeixinJSBridge.on('menu:share:appmessage', function(argv){
							WeixinJSBridge.invoke('sendAppMessage',{
									  "appid"      : appId,
									  "img_url"    : imgUrl,
									  "img_width"  : "100",
									  "img_height" : "100",
									  "link"       : link,
									  "desc"       : desc,
									  "title"      : title	
								}, function(res) {	
									//alert("转发给朋友成功！");	
								});
					});
					// 分享到朋友圈;
					WeixinJSBridge.on('menu:share:timeline', function(argv){
						WeixinJSBridge.invoke('shareTimeline',{
											  "img_url"    : imgUrl,
											  "img_width"  : "100",
											  "img_height" : "100",
											  "link"       : link,
											  "desc"       : desc,
											  "title"      : title+desc
						}, function(res) {
							//alert("转发到朋友圈成功！")
						});
				});	
		
			}
			if (typeof WeixinJSBridge == "undefined"){
					if( document.addEventListener ){
						document.addEventListener('WeixinJSBridgeReady', onBridgeReady, false);
					}
			}else{
			onBridgeReady();
		}
	}
}