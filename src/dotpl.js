/*
 * dotpl-js
 * https://github.com/zzzhan/dotpl-js
 *
 * Licensed under the MIT license.
 */
(function(factory){
  "use strict";
  if (typeof define === 'function' && define.amd) {
    define([this], factory);
  } else if (typeof(module) !== 'undefined' && module.exports) {
    module.exports = factory(this);
  } else {
    var root = window||this,
    prev_dotpl = root.dotpl,
	dotpl = factory(root);

    dotpl.noConflict = function () {
        root.dotpl = prev_dotpl;
        return dotpl;
    };
    root.dotpl = dotpl;
    root.Dotpl = dotpl.constructor;
  }
}(function(root){
	var _op = '\\$\\{',
		_cl = '\\}',
		_tg = 'tpl',
		_to = '<',
		_tc = '>',
		_keyMapping = {
		  'ENTER':13
		},
		_filters = {
		  capitalize: function(ss) {
		    return ss.replace(/^\S/,function(s){return s.toUpperCase();});
		  },
		  lowercase: function(ss) {
		    return ss.toLowerCase();
		  },
		  uppercase: function(ss) {
		    return ss.toUpperCase();
		  },
		  reverse: function(ss) {
		    return ss.split('').reverse().join('');
		  }
		};
	function _diving(key,kv) {
		var keys = key.split("\.");
		var i = 0;
		do {
			kv = kv[keys[i++]];
			if(kv==null) {break;}
		} while(i<keys.length&&typeof(kv)==='object');
		return kv;
	}
	function _eval(k,kv) {
	  k = k.replace(/(&gt;)|(&lt;)/g,function(s) { return s==='&gt;'?'>':'<'});
	  var ret = k.replace(/\$*\w+/ig, function(s) {
	    if(/\d+/.test(s)) return s;
	    var v = _diving(s, kv);
		if(typeof v === 'string') {
		  v = '\''+v+'\'';
		}
		return v==null?s:v;
	  });
	  return eval(ret);
	}
	function _parseVal($1, values, renderer, pk, parent) {
		$1 = $1.trim();
		var keys = $1.split('|'),
			key = keys[0].trim(),
			evalflag = /\+|\-|\*|\/|>|<|=/.test(key),
			val = evalflag?_eval(key,values):_diving(key,values);
		val = (val==null?"":val);
		for(var i=1;i<keys.length;i++) {
		  var k = keys[i].trim(),defFilter = true;
		  if(typeof renderer==='object') {
		    if(!!renderer.filters&&!!renderer.filters[k]) {
		      val = renderer.filters[k](val);
			  defFilter = false;
			}
		  }
		  if(defFilter&&!!_filters[k]) {
		    val = _filters[k](val);
		  }
		}
		if(typeof val==='boolean') {return val;}
		var func = null;
		if(typeof renderer==='object') {
			func = renderer.renderer;
		} else {
			func = renderer;
		}
		if(typeof func==='function') {
			var tmp = func($1, val, values, pk, parent);
			return tmp==null?val:tmp;
		}
		return val;
	}
	function _applyMapTpl(tpl, values, renderer, pk, parent) {
		var re = new RegExp('<(\\w+)([^>]*)>\\s*'+_op+'([^'+_cl+']+?)'+_cl+'\\s*<\\/\\1>', 'ig'),
			view = tpl.replace(re, function($0,$1,$2,$3) {
			try {
			  var v = _parseVal($3, values, renderer, pk, parent);
			  return '<'+$1+$2+' do-v="'+$3.trim()+'">'+v+'</'+$1+'>';
			} catch(e){
				throw new Error($1+(e.message||e));
			}
		});
		var re1 = new RegExp(_op+'([^'+_cl+']+?)'+_cl, 'ig');///\$\{([^\}]+?)\}/ig;
		view = view.replace(re1, function($0,$1) {
			try {
			  return _parseVal($1, values, renderer, pk, parent);
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
					cb(xmlhttp.responseText,xmlhttp.status);
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
	function _applyTpl(tpl, data, renderer, pk, parent){
		var re = new RegExp('\\'+_to+'('+_tg+'\\d?)\\s+([^\\'+_tc+']+?)\\'+_tc+'([\\s\\S]+?)\\'+_to+'\\/\\1\\'+_tc, 'ig');
		if(re.test(tpl)) {
			tpl = tpl.replace(re, function($0,$1,$2,$3){
				var output = "",kv = null,attr = {},re1 = /(\w+)\s*=\s*(['|"]{1})([^\2]+?)\2\s*/ig;
                while((kv=re1.exec($2))!=null) {
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
								arr = renderer.beforeLoop(arr, forkey, pk, parent||data);
							}
						}
						output+='<do-f do-v="'+forkey+'">';
						if(arr!=null&&arr.length>0) {
							for(var i=0;i<arr.length;i++) {
								var item = {};
								if(typeof(arr[i])!=='object') {
									item.__val = arr[i];
								} else {
									item = arr[i];
								}
								item.__offset = i;
								item.$index = i;
								if(typeof renderer==='object') {
									if(!!renderer.skip&&renderer.skip(item, forkey, arr, pk, parent||data)) {
										continue;
									}
								}
								output+=_applyTpl($3.trim(),item,renderer,forkey,data);
							}
						} else {
			                if(attr['emptytext']!=null) {output = attr['emptytext'];}
						}
						output+='</do-f>';
					} else if(attr['if']!=null) {
						try {
							var strflag = _applyTpl(attr['if'],data,renderer, pk, parent);
							if(typeof strflag==='string') {
								/*jslint evil: true */
								strflag = eval('Boolean('+strflag+')');
							}
							if(strflag) {
								return _applyTpl($3.trim(), data, renderer, pk, parent);
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
		return _applyMapTpl(tpl, data, renderer, pk, parent);
	}
	function _isEditable(el) {
	  var nodeName = el.nodeName.toLowerCase();
	  return el.nodeType == 1 && (nodeName == "textarea" ||
			(nodeName == "input" && /^(?:text|email|number|search|tel|url|password)$/i.test(el.type)));
	}
	var Dotpl = function(opt) {
	  var self = this, doc = root.document,
		  el = opt.el, d = opt.data,tpl;
	  self._opt = opt;
	  if(typeof el === 'string') {
	    if(el.indexOf('#')===0) {
		  el = doc.getElementById(el.substring(1));
		} else {
		  el = doc.getElementsByName(el);
		}
	  }
	  self._el = el;
	  if(!opt.tpl) {
	    opt.tpl = self._el.innerHTML;
	  }
	  //self._tpl = tpl;
	  if(!!el) {
	    el.innerHTML = self.toString();
	    self._data = {};
	    self._defineProperty(d);
	    self._bindSync();
	    self._binding();
	  }
	};
	Dotpl.prototype = {
      constructor: Dotpl,
	  _defineProperty: function(d) {
	    var self = this;
		for(var k in d) {
		  Object.defineProperty(self._data, k, {
		    get: (function(kk) {
			  return function () {
			    return d[kk];
		      };
			})(k),
		    set: (function(kk) {
			  return function (b) {
			  var old = d[kk];
			  d[kk] = b;
			//self._el.innerHTML = _applyTpl(self._tpl, self._data);
			  self._dataChanged(kk, b, old);
		    };
			})(k)
		  });
		  if(Object.prototype.toString.call(d[k]) === '[object Array]') {
		    self._definePropertyArray(d[k], k);
		  }
		}
	  },
	  _definePropertyArray: function(arr, k) {
	    var self = this, oPush = arr.push,
			oSplice = arr.splice;
		arr.push = function() {
          var ret = oPush.apply(this, arguments);
		  self._onArrayPush(k, arguments);
		  return ret;
		};
		arr.splice = function() {
          var ret = oSplice.apply(this, arguments);
		  self._onArraySplice(k, arguments);
		  return ret;
		};
	  },
	  _dataChanged: function(k,d) {
	    var self = this, el = self._el,
			ts = el.querySelectorAll('[do-v='+k+']');
		//console.log(k+':'+d);
		for(var i=0;i<ts.length;i++) {
		  var target = ts[i];
		  var nodeName = target.nodeName.toLowerCase();
		  if (_isEditable(target)) {
			target.value = d;
		  } else {
		    target.innerHTML = d;
		  }
		}
	  },
	  _onArrayPush: function(key, arr) {
	    var self = this, el = self._el,
			opt = self._opt,
			tpl = opt.tpl,
			ts = el.querySelectorAll('do-f[do-v='+key+']'),
			re = new RegExp('\\'+_to+'('+_tg+'\\d?)\\s+for=(["|\']?)'+key+'\\2[^\\'+_tc+']*?\\'+_tc+'([\\s\\S]+?)\\'+_to+'\\/\\1\\'+_tc, 'ig'),
			res,
			tpls=[];
		while((res=re.exec(tpl))!=null) {
		  tpls[tpls.length]=res[3];
		}
		for(var i=0;i<ts.length;i++) {
		  var target = ts[i],
			  t = tpls[i],s='';
		  for(var j=0;j<arr.length;j++) {
		    s+=_applyTpl(t, arr[j]).trim();
		  }
		  //console.log(s);
		  var div = document.createElement('div');
		  div.innerHTML = s;
		  var nodes = div.childNodes;
		  for(var k=0;k<nodes.length;k++) {		
		    target.appendChild(nodes[k]);
		  }	
		}
	  },
	  _onArraySplice: function(key, arr) {
	    var self = this, el = self._el,
			ts = el.querySelectorAll('do-f[do-v='+key+']');
		for(var i=0;i<ts.length;i++) {
		  var target = ts[i],
			  index = arr[0],
			  count = arr[1],
			  i=0,child;
		  while(!!(child=target.childNodes[index])&&i<count) {
		    target.removeChild(child);
			i++;
		  }
		}
	  },
	  _bindSync: function() {
		var self = this,
			data = self._data,
			opt = self._opt,
			el = self._el,
			tpl = opt.tpl,
			re = /\s+do\-sync=/ig,
		    res,
			bind = {};
		if(re.test(tpl)) {
		  el.addEventListener('keyup', function(e) {
		    for (var target=e.target; target && target!=this; target=target.parentNode) {
			  var field = target.getAttribute('do-sync');
			  if(!!field) {
				if(data[field]!==target.value) {
			      data[field] = target.value;
				}
			    break;
			  }
		    }
		  });
		}
	  },
	  _binding: function() {
		var self = this,
			opt = self._opt,
			el = self._el,
			tpl = opt.tpl,
			re = /do\:(\w+)/ig,
		    res,
			bind = {};
		while((res = re.exec(tpl)) != null) {
		  var evt = res[1];
		  if(!bind[evt]) {
		    el.addEventListener(evt, function(e) {
			  var type = e.type;
			  for (var target=e.target; target && target!=this; target=target.parentNode) {
			// loop parent nodes from the target to the delegation node
			    var flag = false,
					attrs = target.attributes,
					func,
					namespace;
			    for(var j=0;j<attrs.length;j++) {
				  var attr = attrs[j],
					  res1 = new RegExp('do\\:'+type+'(\\.\\w+)?', 'ig').exec(attr.name);
				  if(!!res1) {
				    flag = true;
					func = attr.value;
					if(!!res1[1]) {
					  namespace = res1[1].substring(1);
					}
					break;
				  }
				}
			    if(!!func&&opt.func) {
				  if(!!namespace) {
				    if(_keyMapping[namespace.toUpperCase()]!==e.keyCode) {
				      //console.log(e.keyCode);
					  break;
					}
				  }
				  var re1 = /(\w+)\(([^\)]*?)\)/i,
					  res2 = re1.exec(func);
				  if(!!res2) {
				    if(res2[2].trim()==='') {
				      opt.func[res2[1]].call(self._data, e);
					} else {
					  var params = res2[2].split(','),
						  args = [],
						  parent = target.parentNode,child;
					  for(var i=0;i<params.length;i++) {
					    var param = params[i].trim();
						switch(param) {
						  case '$index':
							while(parent&&parent.tagName.toUpperCase()!=='DO-F') {
							  child = parent;
							  parent = parent.parentNode;
							}
							var i = 0;
							while( (child = child.previousSibling) != null ) {
							  i++;
							}
						    args[args.length]=i;
						  break;
						  default:
						  args[args.length]=param;
						}
					  }
				      opt.func[res2[1]].apply(self._data, args);
					}
					break;
				  } else if (typeof opt.func[func]==='function') {
				    opt.func[func].call(self._data, e);
				    break;
				  }
				}
			  }
		    }, false);
		  } else {
		    bind[evt] = true;
		  }
		}
	  },
	  toString: function() {
	    var self = this,
			opt=self._opt,
			tpl = opt.tpl,
			d = opt.data;			
	    return _applyTpl(tpl, d, opt.renderer);
	  }
	};
    return {
		diving:_diving,
		applyTpl:_applyTpl,
		applyRTpl:function(url, data, cb, renderer){
			_request(url, function(tpl, status){
				if(status===200) {
					cb(_applyTpl(tpl, data, renderer));
				} else {
					throw new Error("Error "+status+":"+url);
				}
			});
		},
		setDelimiters:function(opener, closer, tag) {
			_op = opener;
			_cl = closer;
			tag = tag||'<tpl>';
			_tg = tag.substring(1, tag.length-1);
			_to = tag.substring(0, 1);
			_tc = tag.substring( tag.length-1);
		},
		inst: function(opt) {
		  return new Dotpl(opt);
		},
		constructor:Dotpl
	};
}));