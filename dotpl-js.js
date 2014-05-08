/*
 * Dotpl-JS v1.1
 * http://code.google.com/p/dotpl-js/
 * (c) 2014 by Chunzhan.He. All rights reserved.
 * chunzhan.he@gmail.com
 */
var dotpl = function() {	
	function _diving(key,kv) {
		var keys = key.split("\.");
		var i = 0;
		do {
			kv = kv[keys[i++]];
			if(kv==null) break;
		} while(i<keys.length&&typeof(kv)=='object');
		return kv;
	}	
	function _applyMapTpl(tpl, values, renderer, pk, parent, thiz) {	
		var re = /\$?\{([^\}]+?)\}/ig;
		var view = tpl.replace(re, function($0,$1) {
			try {
				var val = _diving($1,values);
				val = (val==null?"":val);
				if(typeof renderer=='function') {
					var tmp = renderer.call(thiz==null?this:thiz, $1, val, values, pk, parent);
					return tmp==null?val:tmp;
				}
				return val;
			} catch(e){ alert($1||e.message||e);return null;}
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
			if (xmlhttp.readyState==4) {
				try {
					cb.call(this, xmlhttp.responseText,xmlhttp.status);
				} catch(e){ alert(e.message||e);return null;}
			}
		};
		try {
			var ts = new Date().getTime();
			if(url.indexOf('?')==-1)
				url+='?_='+ts;
			else
				url+='&_='+ts;
			xmlhttp.open('GET',url,!!sync);
			xmlhttp.setRequestHeader("If-Modified-Since","0");
			xmlhttp.setRequestHeader("Cache-Control","no-cache");
			xmlhttp.send();
		} catch(e){ alert(e.message||e);return null;}
		return xmlhttp;
	}
	function _applyTpl(tpl, data, renderer, pk, parent, thiz){
		var regx = /<(tpl\d?)\s+(\w+)\s*=\s*(['|"]{1})([^\3]+?)\3\s*>([\s\S]+?)<\/\1>/ig;
		if(regx.test(tpl)) {
			tpl = tpl.replace(regx, function($0,$1,$2,$3,$4,$5){
				var output = "";
				if($2!=null) {
					if($2.toUpperCase()=="FOR") {
						var arr = data;
						if($4!=".") {
							arr = _diving($4,data);
						}
						for(var i=0;arr!=null&&i<arr.length;i++) {
							var item = {};
							if(typeof(arr[i])!='object') {
								item.__val = arr[i];
							} else {
								item = arr[i];
							}
							item.__offset = i;
							output+=_applyTpl($5,item,renderer,$4,arr, thiz);
						}
					} else if($2.toUpperCase()=="IF") {
						try {
							if(eval(applyTpl($4,data))) {
								return _applyTpl($5, data, renderer, pk, parent, thiz);
							}	
						} catch(e) {
							alert($4||e.message||e);
						}			
					}
				}
				return output;         
			});
		}
		return _applyMapTpl(tpl, data, renderer, pk, parent, thiz);
	}
	return function(){		
		this.diving=_diving;
		this.applyTpl=_applyTpl;
		//remote template
		this.applyRTpl=function(url, data, cb, renderer, thiz){
			_request(url, function(tpl, status){
				if(status==200) {
					if(typeof renderer=='object')
						thiz = renderer;
					cb.call(thiz==null?this:thiz, _applyTpl(tpl, data, renderer, thiz));
				} else {
					alert("Error "+status+":"+url);
				}
			});
		};
		return this;
	};
}()();