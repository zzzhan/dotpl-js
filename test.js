var dotpl = require('./dist/dotpl.min');
console.log(dotpl.applyTpl("hello ${data.val}", {data:{val:"world"}}));
dotpl.setDelimiters('<%', '%>');
console.log(dotpl.applyTpl("hello <%data.val%>", {data:{val:"world"}}));