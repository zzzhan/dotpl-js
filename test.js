var dotpl = require('./src/dotpl');
console.log(dotpl.applyTpl("hello ${data.val}", {data:{val:"world"}}));
dotpl.setDelimiters('{{', '}}');
console.log(dotpl.applyTpl("hello {{data.val}}", {data:{val:"world"}}));
console.log(dotpl.applyTpl("hello <tpl for='shapes_group'>{{name}}\n<tpl0 for='group'>{{type}}-{{name}}\n</tpl0></tpl>", {"name":"Root Name","shapes_group":[{
  "name":"Equation {{test}}",
  "test":"testing",
  "group":[{
    "type":"plus",
    "name":"Plus {{test}}"
  },{
    "type":"minus",
    "name":"Minus {{name}}"
  },{
    "type":"multiply",
    "name":"Multiply"
  },{
    "type":"division",
    "name":"Division"
  },{
    "type":"equal",
    "name":"Equal"
  },{
    "type":"notequal",
    "name":"Notequal"
  }]
}]}));