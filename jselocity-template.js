/**
 * Jselocity Template.beta
 * a velocity-like js template engine
 * inspired by John Resig's Micro-Templating http://ejohn.org/blog/javascript-micro-templating/
 *
 * Copyright (c) 2012 rhyzx
 * https://github.com/rhyzx/Jselocity
 * Licensed under the MIT license
 *
 * @example :
 * 		tmpl('this is $name.').render({name:'mike'}); //this is mike.
 */
;(function($) {
	//bind function
	$.tmpl = tmpl;
	/**
	 * 创建一个模板
	 */
	function tmpl(str) {
		return new Template(str);
	}

	//default value
	var placeHolder = '-';

	var formaters = {
		SimpleDateFormat	: function(date, pattern) {
			var rs = {
				'y' : date.getFullYear(),
				'M' : date.getMonth()+1,
				'd' : date.getDate(),
				'h' : date.getHours(),
				'm' : date.getMinutes(),
				's' : date.getSeconds()
			};
			return pattern.replace(/y+|M+|d+|h+|m+|s+/g, function(x) {
				var t = '000000'+rs[x.charAt(0)];	//max leading 8 zero
				return t.substring(t.length-x.length);
			});
		},
		now : function(v) {
			return formaters.SimpleDateFormat(new Date(), 'yyyy-MM-dd');
		}
	};
	/**
	 * 添加format接口
	 */
	tmpl.addFormat = function(key, format) {
		if(formaters[key] && typeof format == 'function') {
			formaters[key] = format;
		} else {
			console.warn('format:' +key +';已经存在, 或者format不是function');
		}
	};

	var processor = {
		/* 用于模板内部取数据 */
		get			: function(obj, fields) {
			var v = obj;
			if(fields) { //undefined ''
				try {
					v = eval('obj' +fields);
				} catch(e) {
					v = null;
				}
			}
			return v;
		},
		getString	: function(obj, fields) {
			var v = processor.get(obj, fields);
			var type = typeof v;
			if(type != 'string' && type != 'number') {
				return placeHolder;
			} else {
				return v;
			}
		},
		/* 用于模板内部格式化数据 */
		format		: function(name, data, fields) {
			var formater	= formaters[name];
			var value		= processor.get(data, fields);
			if(formater) {
				return formater(value);
			} else {
				console.warn('format:' +name +' not exist;');
				return placeHolder;
			}
		}
	};

	//cache regexs
	var regexs = {
		variable	: /\$([A-z_]\w*)((\.[A-z_]\w*|\[\d+\])*)/g, //$name $friends[0] $other.age
		ifStmt		: /#if *\((\S+?) *\)/g,	//#if(stmt)
		elseifStmt	: /#elseif *\((\S+?) *\)/g, //#else if(stmt)
		elseStmt	: /#else(\s+|$)/g,	//#else
		forStmt		: /#for *\( *\$([A-z_]\w*) +in +(\S+?) *\)/g,	//#for($name in $list)/#for($name in [1,2,3])
		foreachStmt	: /#foreach *\( *\$([A-z_]\w*) +in +(\S+?) *\)/g,	//#foreach($name in $list)/#foreach($name in {"a":1, "b":2})
		endStmt		: /#end(\s+|$)/g,

		format		: /#format.([A-z_]\w*)\( *\$([A-z_]\w*)((\.[A-z_]\w*|\[\d+\])*) *\)/g,	//#format.formaterName($value)

		escaper		: /\\/g,
		lineBreak	: /[\n\r]/g
	};

	/**
	 * Template Class
	 */
	function Template(str) {
		this.renderer = new Function("DATA", "FN",
			"eval((function() {" + //put all object's variables to local
				"var vars = [];" +
				"for(var i in DATA) {vars.push(i +'=DATA.' +i);}" +
				"if(vars.length>0) {" +
				"return 'var ' +vars.join(',') +';';" +
				"} else {return '';}" +
				"})());\n" +

				//build string
				"var R=[],S='';R.push('" +
				str
					.replace(regexs.ifStmt, function(all, x) {
					return "'); if(" +x.replace(regexs.variable, "FN.get(typeof $1=='undefined'?undefined:$1,'$2')") +") { R.push('";
				})	//if $a == 'v'
					.replace(regexs.elseifStmt, function(all, x) {
						return "'); } else if(" +x.replace(regexs.variable, "FN.get(typeof $1=='undefined'?undefined:$1,'$2')") +") { R.push('";
					})
					.replace(regexs.forStmt, function(all, x, y) {
						return "'); for(var TARGET=" +y.replace(regexs.variable, "FN.get(typeof $1=='undefined'?undefined:$1,'$2') || []") +
							",INDEX=0, LEN=TARGET.length, EVEN, ODD, " +x +"=TARGET[INDEX]; INDEX<LEN; "+
							"INDEX++, EVEN=(INDEX%2==0), ODD=!EVEN, " +x +"=TARGET[INDEX]) { R.push('"
					})	//for statement, add EVEN ODD variable
					//.replace()  //@TODO foreach stmt (iterator object)
					.replace(regexs.elseStmt, 	"'); } else { R.push('")
					.replace(regexs.endStmt, 			"'); } R.push('")
					.replace(regexs.format, "', FN.format('$1', typeof $2=='undefined'?undefined:$2,'$3'), '")
					.replace(regexs.variable, "', FN.getString(typeof $1=='undefined'?undefined:$1,'$2'), '")	//repalce $name with value
					.replace(regexs.escaper, "\\\\")
					.replace(regexs.lineBreak, "\\n")
				+ "');return R.join('');"
		);
	}
	Template.prototype = {
		/**
		 * 渲染数据接口
		 * @param {json} data
		 * @return {String} htmlStr
		 */
		render		: function(data) {
			return this.renderer(data, processor);
		},

		/**
		 * get HTML Dom object
		 * 利用DocumentFragment生成html Dom
		 * 如果有callback则使用异步生成html(不卡)
		 * @param data {json} 渲染用数据
		 * @param {function} callback(dom {DocumentFragment} ) || @return {DocumentFragment} dom
		 */
		renderHTML	: function(data, callback) {
			var html = this.render(data);
			var temp = document.createElement('div'),
				frag = document.createDocumentFragment();

			temp.innerHTML = html;
			if(callback) {
				(function(){
					if(temp.firstChild){
						frag.appendChild(temp.firstChild);
						setTimeout(arguments.callee, 0); //递归
					} else {
						callback(frag);
					}
				})();
			} else {
				while(temp.firstChild) {
					frag.appendChild(temp.firstChild);
				}
				return frag;
			}
		},
		construcotr	: Template
	};
})(window);