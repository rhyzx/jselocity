Jselocity
=========

a velocity like javascript template engine

How to use
----------

#### variable ####
	var renderer = tmpl('fire in the $name!')
	renderer.render({name: 'hole'}); //return 'fire in the hole!'
	
#### if statement ####
	var s =	'						\
			#if($flag === "yes")	\n\
				you are right!		\n\
			#elseif($flag === "no")	\n\
				go die! 			\n\
			#else					\n\
				WTF!!				\n\
			#end					\n\
			';
	tmpl(s).render({flag: 'true'}); //return 'WTF!!'

#### for statement ####
built-in variables: ** $INDEX $ODD $EVEN **
	var s = '							\
			#for($item in $items)		\n\
				day$INDEX, $item.did.	\n\
			#end						\n\
			';
	var d = {
		list : [
			{weather: 'fine', did: 'sleep'},
			{weather: 'rainy', did: 'sleep'},
			{weather: 'cloudy', did: 'sleep'},
			{weather: 'fine', did: 'sleep'},
		]
	};
	tmpl(s).render(d);
	/*	return
		day1, sleep.
		day2, sleep.
		day3, sleep.
		day4, sleep.
	*/
	
#### format ####
	tmpl.addFormat('time', function(v) { //add formatter first
		return new Date(v).toLocaleDateString();;
	});
	
	tmpl('#format.time($msec)').render({msec: 1356278400000}); //return 'Mon Dec 24 2012 00:00:00 GMT+0800'

#### escaper(WIP) ####
** $S **
	tmpl('$name$SDAM!!!').render({name: 'GUN'}); //return 'GUNDAM!!!';

#### PS ####
there is no **cache sys in jselocity**, you should cache it by self.
	var cache	= {},
		url 	= '/user/id',
		s		= getStringByURL(url);
		
	var renderer = tmpl(s); //get it
	cache[url] = renderer; //cache it
	/* ===========> */
	var rendererNow = cache[url]; //reget
	var result = rendererNow.render(data); //output
	