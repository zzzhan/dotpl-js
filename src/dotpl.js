/*
 * dotpl-js
 * https://github.com/zzzhan/dotpl-js
 *
 */
(function() {
	var _opener = '\\$\\{';
	var _closer = '\\}';
	function _diving(key,kv) {
		var keys = key.split("\.");
		var i = 0;
		do {
			kv = kv[keys[i++]];
			if(kv==null) {break;}
		} while(i<keys.length&&typeof(kv)==='object');
		return kv;
	}
	function _applyMapTpl(tpl, values, renderer, pk, parent, thiz) {	
		var re = new RegExp(_opener+'([^'+_closer+']+?)'+_closer, 'ig');///\$\{([^\}]+?)\}/ig;
		var view = tpl.replace(re, function($0,$1) {
			try {
				var val = _diving($1,values);
				val = (val==null?"":val);
				if(typeof val==='boolean') {return val;}
				var func = null;
				if(typeof renderer==='object') {
					func = renderer.renderer;
				} else {
					func = renderer;
				}
				if(typeof func==='function') {
					var tmp = func.call(thiz==null?this:thiz, $1, val, values, pk, parent);
					return tmp==null?val:tmp;
				}
				return val;
			} catch(e){
				throw new Error($1+(e.message||e));
			}
		});
		return view;
	}
	function _request(url,cb,sync) {
		var xmlhttp = null;
		if (window.XMLHttpRequest){// code for IE7+, Firefox, Chrome, Opera, Safari
			xmlhttp=new XMLHttpRequest();
		} else {// code for IE6, IE5
			xmlhttp=new ActiveXObject("Microsoft.XMLHTTP");
		}
		xmlhttp.onreadystatechange=function() {
			if (xmlhttp.readyState===4) {
				try {
					cb.call(this, xmlhttp.responseText,xmlhttp.status);
				} catch(e){ throw e;}
			}
		};
		try {
			var ts = new Date().getTime();
			if(url.indexOf('?')===-1) {
				url+='?_='+ts;
			} else {
				url+='&_='+ts;
			}
			xmlhttp.open('GET',url,!!sync);
			xmlhttp.setRequestHeader("If-Modified-Since","0");
			xmlhttp.setRequestHeader("Cache-Control","no-cache");
			xmlhttp.send();
		} catch(e){ throw e;}
		return xmlhttp;
	}
	function _applyTpl(tpl, data, renderer, pk, parent, thiz){
		//var regx = /<(tpl\d?)\s+(\w+)\s*=\s*(['|"]{1})([^\3]+?)\3\s*>([\s\S]+?)<\/\1>/ig;
		var __regx = /<(tpl\d?)\s+([^>]+?)>([\s\S]+?)<\/\1>/ig;
		if(__regx.test(tpl)) {
			tpl = tpl.replace(__regx, function($0,$1,$2,$3){
				var output = "";
				var kv = null;
                var attr = {};
            	var __subg = /(\w+)\s*=\s*(['|"]{1})([^\2]+?)\2\s*/ig;
                while((kv=__subg.exec($2))!=null) {
                    attr[kv[1].toLowerCase()]=kv[3];
                }
				//if($2!=null) {
                	var forkey = attr['for'];
					if(forkey!=null) {
						var arr = data;
						if(forkey!=='.') {
							arr = _diving(forkey,data);
						}
						if(typeof renderer==='object') {
							if(!!renderer.beforeLoop) {
								arr = renderer.beforeLoop.call(thiz||this, arr, forkey, pk, parent||data);
							}
						}
						if(arr!=null&&arr.length>0) {
							for(var i=0;i<arr.length;i++) {
								var item = {};
								if(typeof(arr[i])!=='object') {
									item.__val = arr[i];
								} else {
									item = arr[i];
								}
								item.__offset = i;
								if(typeof renderer==='object') {
									if(!!renderer.skip&&renderer.skip.call(thiz||this, item, forkey, arr, pk, parent||data)) {
										continue;
									}
								}
								output+=_applyTpl($3,item,renderer,forkey,data, thiz);
							}
						} else {
			                if(attr['emptytext']!=null) {output = attr['emptytext'];}
						}
					} else if(attr['if']!=null) {
						try {
							var strflag = _applyTpl(attr['if'],data,renderer, pk, parent, thiz);
							if(typeof strflag==='string') {
								/*jslint evil: true */
								strflag = eval('Boolean('+strflag+')');
							}
							if(strflag) {
								return _applyTpl($3, data, renderer, pk, parent, thiz);
							} else {
				                if(attr['emptytext']!=null) {output = attr['emptytext'];}
							}
						} catch(e) {
							throw new Error(attr['if']+(e.message||e));
						}			
					}
				//}
				return output;         
			});
		}
		return _applyMapTpl(tpl, data, renderer, pk, parent, thiz);
	}
	var dotpl = {
		diving:_diving,
		applyTpl:_applyTpl,
		applyRTpl:function(url, data, cb, renderer, thiz){
			_request(url, function(tpl, status){
				if(status===200) {
					if(typeof renderer==='object') {
						thiz = renderer;
					}
					cb.call(thiz==null?this:thiz, _applyTpl(tpl, data, renderer, thiz));
				} else {
					throw new Error("Error "+status+":"+url);
				}
			});
		},
		setDelimiters:function(opener, closer) {
			_opener = opener;
			_closer = closer;
		}
	};
    var root = this,
        previous_dotpl = root.dotpl;

    if (typeof module !== 'undefined' && module.exports) {
        module.exports = dotpl;
    }
    else {
        root.dotpl = dotpl;
    }

    dotpl.noConflict = function () {
        root.dotpl = previous_dotpl;
        return dotpl;
    };
}());