Dotpl-JS
===============================================
*Dotpl-JS* is a pure javascript template engine.
There are three simple API only.

* Apply the template using the json data,then return the view:```dotpl.applyTpl(tpl, data, renderer)```

* Apply the remote template,return the view from the callback function:```dotpl.applyRTpl(url, data, cb, renderer)```

* Locate the data using the string "key1.key2.key2":```dotpl.diving(key,data)```

### Samples
* General
```javascript
alert(dotpl.applyTpl("hello ${val}", {val:"world"})); 
alert(dotpl.applyTpl("hello ${val} ${val2}", {val:"world",val1:"wide-web",val2:"good"}
	, function(k,v,kv){ 
		if(k=='val') return kv['val']+"-"+kv['val1']; 
	}
)); 
alert(dotpl.applyTpl("hello ${data.val}", {data:{val:"freedom"}})); 
alert(dotpl.applyTpl("hello ${data.val} nothing ${none}", {data:{val:"freedom"}})); 
alert(dotpl.applyTpl("hello ${data.data1.val}", {data:{data1:{val:"evolution"}}})); 
alert(dotpl.applyTpl("hello ${val},i ${action} you", {val:"town", action:'love'}));
```
* Template using IF logic:
```javascript
alert(dotpl.applyTpl("hello ${val}, <tpl if=\"'${action}'=='love'\">i ${action} you</tpl>"
	, {val:"town", action:'love'})); 

alert(dotpl.applyTpl("hello ${val},if false<tpl if=\"'${action}'=='love'\">i ${action} you</tpl>"
	, {val:"town", action:'like'}));
```
* Template using FOR logic:
```javascript
alert(dotpl.applyTpl("list:\n<tpl for=\".\">${__offset} hello ${key} ${val}\n</tpl>"
	, [{key:"world", val:'like'},{key:"town", val:'freedom'}])); 

alert(dotpl.applyTpl("list:\n<tpl for=\"data\">${__offset} hello ${key} ${val}\n</tpl>"
	, {data:[{key:"world", val:'like'},{key:"town", val:'freedom'}]})); 

alert(dotpl.applyTpl("list:\n<tpl for=\"data\">${__offset} hello ${__val} \n</tpl>"
	, {data:[1,2,4]}));

alert(dotpl.applyTpl("list:\n<tpl for=\"data\">${__offset} hello ${__val} \n</tpl>"
	, {data:["s1","s2","s3"]}));
```
* Template using mutil FOR logic:
```javascript
alert(dotpl.applyTpl("list:\n<tpl for=\"data\">${__offset} hello ${key} ${val}\n</tpl>"
	+ "list2:\n<tpl for=\"data\">${__offset} 1024 ${key} ${val}\n</tpl>"
	,  {data:[{key:"world", val:'like'},{key:"town", val:'freedom'}]}));

alert(dotpl.applyTpl("<tpl for=\".\">list${__offset} \n <ul><tpl0 for=\"data\"><li>"
	+ "${__offset} \n ${key} ${val}</li></tpl0></ul></tpl>"
	,  [{data:[{key:"world", val:'like'},{key:"town", val:'freedom'}]}
	,{data:[{key:"world1", val:'like1'},{key:"town1", val:'freedom1'}]}]));
```
* Apply remote template:
```javascript
dotpl.applyRTpl("/display.tpl",{key:'hellow world'},function(view){alert(view);});
```
* Diving API:
```javascript
alert(dotpl.diving("data", {data:{data1:{val:"evolution"}}})); 
alert(dotpl.diving("data.data1", {data:{data1:{val:"evolution"}}})); 
alert(dotpl.diving("data.data1.val", {data:{data1:{val:"evolution"}}}));
```	