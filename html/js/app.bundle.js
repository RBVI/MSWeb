var app="object"==typeof app?app:{};app.App=function(e){function t(t){for(var n,l,u=t[0],i=t[1],c=t[2],s=0,p=[];s<u.length;s++)l=u[s],a[l]&&p.push(a[l][0]),a[l]=0;for(n in i)Object.prototype.hasOwnProperty.call(i,n)&&(e[n]=i[n]);for(f&&f(t);p.length;)p.shift()();return o.push.apply(o,c||[]),r()}function r(){for(var e,t=0;t<o.length;t++){for(var r=o[t],n=!0,u=1;u<r.length;u++){var i=r[u];0!==a[i]&&(n=!1)}n&&(o.splice(t--,1),e=l(l.s=r[0]))}return e}var n={},a={2:0},o=[];function l(t){if(n[t])return n[t].exports;var r=n[t]={i:t,l:!1,exports:{}};return e[t].call(r.exports,r,r.exports,l),r.l=!0,r.exports}l.m=e,l.c=n,l.d=function(e,t,r){l.o(e,t)||Object.defineProperty(e,t,{enumerable:!0,get:r})},l.r=function(e){"undefined"!=typeof Symbol&&Symbol.toStringTag&&Object.defineProperty(e,Symbol.toStringTag,{value:"Module"}),Object.defineProperty(e,"__esModule",{value:!0})},l.t=function(e,t){if(1&t&&(e=l(e)),8&t)return e;if(4&t&&"object"==typeof e&&e&&e.__esModule)return e;var r=Object.create(null);if(l.r(r),Object.defineProperty(r,"default",{enumerable:!0,value:e}),2&t&&"string"!=typeof e)for(var n in e)l.d(r,n,function(t){return e[t]}.bind(null,n));return r},l.n=function(e){var t=e&&e.__esModule?function(){return e.default}:function(){return e};return l.d(t,"a",t),t},l.o=function(e,t){return Object.prototype.hasOwnProperty.call(e,t)},l.p="";var u=window.webpackJsonp=window.webpackJsonp||[],i=u.push.bind(u);u.push=t,u=u.slice();for(var c=0;c<u.length;c++)t(u[c]);var f=i;return o.push([71,0]),r()}({108:function(e,t,r){"use strict";Object.defineProperty(t,"__esModule",{value:!0});var n=function(){function e(e,t){for(var r=0;r<t.length;r++){var n=t[r];n.enumerable=n.enumerable||!1,n.configurable=!0,"value"in n&&(n.writable=!0),Object.defineProperty(e,n.key,n)}}return function(t,r,n){return r&&e(t.prototype,r),n&&e(t,n),t}}(),a=r(0),o=function(e){return e&&e.__esModule?e:{default:e}}(a),l=r(40);var u=function(e){function t(){return function(e,t){if(!(e instanceof t))throw new TypeError("Cannot call a class as a function")}(this,t),function(e,t){if(!e)throw new ReferenceError("this hasn't been initialised - super() hasn't been called");return!t||"object"!=typeof t&&"function"!=typeof t?e:t}(this,(t.__proto__||Object.getPrototypeOf(t)).apply(this,arguments))}return function(e,t){if("function"!=typeof t&&null!==t)throw new TypeError("Super expression must either be null or a function, not "+typeof t);e.prototype=Object.create(t&&t.prototype,{constructor:{value:e,enumerable:!1,writable:!0,configurable:!0}}),t&&(Object.setPrototypeOf?Object.setPrototypeOf(e,t):e.__proto__=t)}(t,a.Component),n(t,[{key:"render",value:function(){return o.default.createElement(l.PanelMenuWrapper,null,o.default.createElement(l.TraceAccordion,{group:"Traces",name:"Style"},o.default.createElement(l.PlotlySection,{name:"Colorscale",attr:"marker.colorscale"},o.default.createElement(l.ColorscalePicker,{label:"Colorscale",attr:"marker.colorscale"}))),o.default.createElement(l.LayoutPanel,{group:"Layout",name:"Style"},o.default.createElement(l.PlotlyFold,{name:"PlotlyFold"},o.default.createElement(l.Info,{attr:"title"},o.default.createElement("p",null,"This custom editor demonstrates the general-purpose container and field components."),o.default.createElement("p",null,"This is an ",o.default.createElement("code",null,"Info")," component.")),o.default.createElement(l.PlotlySection,{name:"PlotlySection"},o.default.createElement(l.Numeric,{label:"Numeric",attr:"width",show:!0,units:"units"}),o.default.createElement(l.Dropdown,{label:"Dropdown",attr:"xaxis.title",show:!0,options:[{label:"Yes",value:"yes"},{label:"No",value:"no"}]}),o.default.createElement(l.Radio,{label:"Radio",attr:"yaxis.title",show:!0,options:[{label:"Yes",value:"yes"},{label:"No",value:"no"}]}),o.default.createElement(l.Flaglist,{label:"Flaglist",attr:"titlefont.family",show:!0,options:[{label:"Yes",value:"y"},{label:"No",value:"n"}]}),o.default.createElement(l.ColorPicker,{label:"ColorPicker",attr:"plot_bgcolor",show:!0}),o.default.createElement(l.TextEditor,{attr:"title",label:"TextEditor default"}),o.default.createElement(l.TextEditor,{attr:"title",label:"TextEditor richTextOnly",richTextOnly:!0}),o.default.createElement(l.TextEditor,{attr:"title",label:"TextEditor htmlOnly",htmlOnly:!0}),o.default.createElement(l.TextEditor,{attr:"title",label:"TextEditor latexOnly",latexOnly:!0})))),o.default.createElement(l.SingleSidebarItem,null,o.default.createElement(l.Button,{variant:"primary",label:"save",onClick:function(){return alert("save button clicked!")}})),o.default.createElement(l.SingleSidebarItem,null,o.default.createElement(l.Button,{variant:"secondary",label:"clear",onClick:function(){return alert("clear button clicked!")}})))}}]),t}();t.default=u},71:function(e,t,r){"use strict";Object.defineProperty(t,"__esModule",{value:!0});var n=function(){function e(e,t){for(var r=0;r<t.length;r++){var n=t[r];n.enumerable=n.enumerable||!1,n.configurable=!0,"value"in n&&(n.writable=!0),Object.defineProperty(e,n.key,n)}}return function(t,r,n){return r&&e(t.prototype,r),n&&e(t,n),t}}(),a=r(0),o=f(a),l=f(r(1)),u=f(r(114)),i=f(r(40)),c=(f(r(108)),r(40));function f(e){return e&&e.__esModule?e:{default:e}}r(211);var s={editable:!0},p=function(e){function t(e){!function(e,t){if(!(e instanceof t))throw new TypeError("Cannot call a class as a function")}(this,t);var r=function(e,t){if(!e)throw new ReferenceError("this hasn't been initialised - super() hasn't been called");return!t||"object"!=typeof t&&"function"!=typeof t?e:t}(this,(t.__proto__||Object.getPrototypeOf(t)).call(this,e));return r.dataSources=e.dataSources,r.dataSourceOptions="dataSourceOptions"in e?e.dataSourceOptions:Object.keys(dataSources).map(function(e){return{value:e,label:e}}),r.state={data:[],layout:{},frames:[]},"data"in e&&(r.state.data=e.data),"layout"in e&&(r.state.layout=e.layout),"frames"in e&&(r.state.frames=e.frames),r}return function(e,t){if("function"!=typeof t&&null!==t)throw new TypeError("Super expression must either be null or a function, not "+typeof t);e.prototype=Object.create(t&&t.prototype,{constructor:{value:e,enumerable:!1,writable:!0,configurable:!0}}),t&&(Object.setPrototypeOf?Object.setPrototypeOf(e,t):e.__proto__=t)}(t,a.Component),n(t,[{key:"getChildContext",value:function(){return{localize:function(e){return(0,c.localizeString)({},"en",e)}}}},{key:"render",value:function(){var e=this;return o.default.createElement("div",{className:"app"},o.default.createElement(i.default,{data:this.state.data,layout:this.state.layout,config:s,frames:this.state.frames,dataSources:this.dataSources,dataSourceOptions:this.dataSourceOptions,plotly:u.default,onUpdate:function(t,r,n){return e.setState({data:t,layout:r,frames:n})},useResizeHandler:!0,advancedTraceTypeSelector:!0}))}}]),t}();p.childContextTypes={localize:l.default.func},t.default=p}});
