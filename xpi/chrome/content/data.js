/*

rikaichan
Copyright (C) 2005-2006 Jonathan Zarate
http://www.polarcloud.com/

Based on rikaiXUL 0.4 by Todd Rudick
http://rikaixul.mozdev.org/

---

This program is free software; you can redistribute it and/or modify
it under the terms of the GNU General Public License as published by
the Free Software Foundation; either version 2 of the License, or
(at your option) any later version.

This program is distributed in the hope that it will be useful,
but WITHOUT ANY WARRANTY; without even the implied warranty of
MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
GNU General Public License for more details.

You should have received a copy of the GNU General Public License
along with this program; if not, write to the Free Software
Foundation, Inc., 51 Franklin St, Fifth Floor, Boston, MA  02110-1301  USA

*/


function rcxHaveNames() {
	return typeof(rcxNamesDict) != "undefined";
}

function rcxDict(loadNames) {
	var hWindow = Components.classes["@mozilla.org/appshell/appShellService;1"]
				.getService(Components.interfaces.nsIAppShellService)
				.hiddenDOMWindow;

	if (hWindow.rikaichan_dict) {
		hWindow.rikaichan_dict.lock();
		return hWindow.rikaichan_dict;
	}
	
	this.loadDictionary();
	if (loadNames) this.loadNames();
	this.loadDifRules();
	
	this.lock();
	this.hWindow = hWindow;
	hWindow.rikaichan_dict = this;
}

rcxDict.prototype = {
	
	lockCount: 0,
	
	lock: function() {
		++this.lockCount;
	},
	
	unlock: function() {
		if (--this.lockCount == 0) {
			delete this.hWindow.rikaichan_dict;
		}
	},

	//

	fileRead: function(url, charset) {
		var ios = Components.classes["@mozilla.org/network/io-service;1"]
					.getService(Components.interfaces.nsIIOService);
		var ss = Components.classes["@mozilla.org/scriptableinputstream;1"]
					.getService(Components.interfaces.nsIScriptableInputStream);
		var ch = ios.newChannel(url, null, null);
		var inp = ch.open();
		ss.init(inp);
		var buffer = ss.read(inp.available());
		ss.close();
		inp.close();
		
		if (!charset) return buffer;
		
		var conv = Components.classes['@mozilla.org/intl/scriptableunicodeconverter']
						.createInstance(Components.interfaces.nsIScriptableUnicodeConverter);
		conv.charset = charset;
		return conv.ConvertToUnicode(buffer);
	},
	
	fileReadArray: function(name, charset) {
		var a = this.fileRead(name, charset).split("\n");
		while ((a.length > 0) && (a[a.length - 1].length == 0)) a.pop();
		return a;
	},
	
	//
	/*
	binSearchX: function(data, text) {
		var tlen = text.length;
		var midi;
		var mids;
		var start = 0;
		var end = data.length - 1;
		while (start <= end) {
			midi = (start + end) >> 1;
			mids = data[midi].substr(0, tlen);
			if (text > mids) start = midi + 1;
				else if (text < mids) end = midi - 1;
					else return midi;
		}
		return -1;
	},	
	*/

	// slow, but uses a lot less memory than array search; someone improve me!
	binSearchF: function(data, text) {
		const tlen = text.length;
		var beg = 0;
		var end = data.length - 1;
		var i;
		var mi;
		var mis;
		
		while (beg < end) {
			mi = (beg + end) >> 1;
			i = data.lastIndexOf("\n", mi) + 1;
			
			mis = data.substr(i, tlen);
			if (text < mis) end = i - 1;
				else if (text > mis) beg = data.indexOf("\n", mi + 1) + 1;
					else return data.substring(i, data.indexOf("\n", mi + 1));
		}
		return null;
	},

	//

	loadNames: function() {
		if ((this.nameDict) && (this.nameIndex)) return;
		this.nameDict = this.fileRead(rcxNamesDict.datURI, rcxNamesDict.datCharset);
		this.nameIndex = this.fileRead(rcxNamesDict.idxURI, rcxNamesDict.idxCharset);
	},
	
	loadDictionary: function() {
//		this.test_index(); return;

		this.wordDict = this.fileRead(rcxWordDict.datURI, rcxWordDict.datCharset);
		this.wordIndex = this.fileRead(rcxWordDict.idxURI, rcxWordDict.idxCharset);

		this.kanjiData = this.fileRead("chrome://rikaichan/content/kanji.dat", "EUC-JP");
		this.radData = this.fileReadArray("chrome://rikaichan/content/radicals.dat", "UTF-8");
	},

/*
	test_index: function() {
		var ixF = this.fileRead("chrome://rikaichan/content/dict.idx", "EUC-JP");
		var ixA = ixF.split("\n");

		while ((ixA.length > 0) && (ixA[ixA.length - 1].length == 0)) ixA.pop();
		
//		alert("length=" + ixA.length + " / " + ixF.length);
if (0) {		
		var timeA = (new Date()).getTime();
		for (var i = ixA.length - 1; i >= 0; --i) {
			if ((i & 0xFF) == 0) window.status = "A: " + i;
			var s = ixA[i];
			var r = this.binSearchX(ixA, s.substr(0, s.indexOf(",") + 1));
			if ((r == -1) || (ixA[r] != s)) {
				alert("A failed: " + s);
				return;
			}
		}
}		
		timeA = ((new Date()).getTime() - timeA) / 1000;


		var timeF = (new Date()).getTime();
		for (var i = ixA.length - 1; i >= 0; --i) {
			if ((i & 0xFF) == 0) window.status = "F: " + i;
			var s = ixA[i];
			var r = this.binSearchF(ixF, s.substr(0, s.indexOf(",") + 1));
			if (r != s) {
				alert("F failed: " + s);
				return;
			}
		}
		timeF = ((new Date()).getTime() - timeF) / 1000;

		var timeX = (new Date()).getTime();
if (0) {
		for (var i = ixA.length - 1; i >= 0; --i) {
			if ((i & 0xFF) == 0) window.status = "X: " + i;
			var s = ixA[i];
			
			var w = s.substr(0, s.indexOf(",") + 1);
			var j = 0;
			r = "";
			if (ixF.substr(0, w.length) == w) {
				r = ixF.substr(0, ixF.indexOf("\n"));
			}
			else {
				w = "\n" + w;
				j = ixF.indexOf(w);
				if (j != -1) r = ixF.substring(j + 1, ixF.indexOf("\n", j + 1));
			}
				
			if (r != s) {
				alert("X failed:\n[" + s + "]\n[" + r + "]");
				return;
			}
		}
}
		timeX = ((new Date()).getTime() - timeX) / 1000;

		alert("A=" + timeA + " / F=" + timeF + " / X=" + timeX);
	},

*/	
	///
	
	loadDifRules: function() {
		this.difReasons = [];
		this.difRules = [];
		this.difExact = [];
		
		var buffer = this.fileReadArray("chrome://rikaichan/content/deinflect.dat", "UTF-8");
		var prevLen = -1;
		var g, o;
		
		// i = 1: skip header
		for (var i = 1; i < buffer.length; ++i) {
			var f = buffer[i].split("\t");

			if (f.length == 1) {
				this.difReasons.push(f[0]);
			}
			else if (f.length == 4) {
				o = {};
				o.from = f[0];
				o.to = f[1];
				o.type = f[2];
				o.reason = f[3];
				
				if (prevLen != o.from.length) {
					prevLen = o.from.length;
					g = [];
					g.flen = prevLen;
					this.difRules.push(g);
				}
				g.push(o);
			}
		}
		
	},
	
	deinflect: function(word) {
		var r = [];
		var have = [];
		var o;

		o = {};
		o.word = word;
		o.type = 0xFF;
		o.reason = "";
		//o.debug = "root";
		r.push(o);
		have[word] = 0;
	
		var i, j, k;

		i = 0;
		do {
			word = r[i].word;
			var wordLen = word.length;
			var type = r[i].type;

			for (j = 0; j < this.difRules.length; ++j) {
				var g = this.difRules[j];
				if (g.flen <= wordLen) {
					var end = word.substr(-g.flen);
					for (k = 0; k < g.length; ++k) {
						var rule = g[k];
						if ((type & rule.type) && (end == rule.from)) {
							var newWord = word.substr(0, word.length - rule.from.length) + rule.to;
							if (newWord.length <= 1) continue;
							o = {};
							if (have[newWord] != undefined) {
								o = r[have[newWord]];
								o.type |= (rule.type >> 8);
								
								//o.reason += " / " + r[i].reason + " " + this.difReasons[rule.reason];
								//o.debug += " @ " + rule.debug;
								continue;
							}
							have[newWord] = r.length;
							if (r[i].reason.length) o.reason = r[i].reason + " " + this.difReasons[rule.reason];
								else o.reason = this.difReasons[rule.reason];
							o.type = rule.type >> 8;
							o.word = newWord;
							//o.debug = r[i].debug + " $ " + rule.debug;
							r.push(o);
						}
					}
				}
			}

		} while (++i < r.length);

		return r;
	},
	
	

	// katakana -> hiragana conversion tables
	ch:[0x3092,0x3041,0x3043,0x3045,0x3047,0x3049,0x3083,0x3085,0x3087,0x3063,0x30FC,0x3042,0x3044,0x3046,
		0x3048,0x304A,0x304B,0x304D,0x304F,0x3051,0x3053,0x3055,0x3057,0x3059,0x305B,0x305D,0x305F,0x3061,
		0x3064,0x3066,0x3068,0x306A,0x306B,0x306C,0x306D,0x306E,0x306F,0x3072,0x3075,0x3078,0x307B,0x307E,
		0x307F,0x3080,0x3081,0x3082,0x3084,0x3086,0x3088,0x3089,0x308A,0x308B,0x308C,0x308D,0x308F,0x3093],
	cv:[0x30F4,0xFF74,0xFF75,0x304C,0x304E,0x3050,0x3052,0x3054,0x3056,0x3058,0x305A,0x305C,0x305E,0x3060,
		0x3062,0x3065,0x3067,0x3069,0xFF85,0xFF86,0xFF87,0xFF88,0xFF89,0x3070,0x3073,0x3076,0x3079,0x307C],
	cs:[0x3071,0x3074,0x3077,0x307A,0x307D],

	// returns [the entries, maximum length matched]
	lookup: function(word, doNames) {
		var i;
		var u;
		var v;
		var r;
		var p;
		var trueLen = [0];

		// half & full-width katakana to hiragana conversion
		// note: katakana vu is never converted to hiragana
		
		p = 0;
		r = "";
		for (i = 0; i < word.length; ++i) {
			u = v = word.charCodeAt(i);
			
			if (u <= 0x3000) break;
			
			// full-width katakana to hiragana
			if ((u >= 0x30A1) && (u <= 0x30F3)) {
				u -= 0x60;	
			}
			// half-width katakana to hiragana
			else if ((u >= 0xFF66) && (u <= 0xFF9D)) {
				u = this.ch[u - 0xFF66];
			}
			// voiced (used in half-width katakana) to hiragana
			else if (u == 0xFF9E) {
				if ((p >= 0xFF73) && (p <= 0xFF8E)) {
					r = r.substr(0, r.length - 1);
					u = this.cv[p - 0xFF73];
				}
			}
			// semi-voiced (used in half-width katakana) to hiragana
			else if (u == 0xFF9F) {
				if ((p >= 0xFF8A) && (p <= 0xFF8E)) {
					r = r.substr(0, r.length - 1);
					u = this.cs[p - 0xFF8A];
				}
			}
			// ignore J~
			else if (u == 0xFF5E) {
				p = 0;
				continue;
			}
			
			r += String.fromCharCode(u);
			trueLen[r.length] = i + 1;	// need to keep real length because of the half-width semi/voiced conversion
			p = v;
		}
		word = r;


		// lookup
		var dict
		var index;
		var maxTrim;
		if (doNames) {
			this.loadNames();
			dict = this.nameDict;
			index = this.nameIndex;
			maxTrim = 40;
		}
		else {
			dict = this.wordDict;
			index = this.wordIndex;
			maxTrim = 10;
		}
		
		var cache = [];
        var have = [];
        var count = 0;
        var maxLen = 0;
		r = "";
        while (word.length > 0) {
			var showInf = (count != 0);
			var trys;
			if (doNames) {
				trys = [{'word':word, 'type':0xFF, 'reason':''}];
			}
            else {
				trys = this.deinflect(word);
			}
            for (i = 0; i < trys.length; i++) {
                u = trys[i];

				//@debug
				//r += "[try " + u.word + "/" + u.reason + "/" + u.type + "]<br/>";
				
				if (cache[u.word] == undefined) {
					var ix = this.binSearchF(index, u.word + ",");
					if (!ix) {
						cache[u.word] = [];
						continue;
					}
					ix = ix.split(",");
					cache[u.word] = ix;
				}
				else {
					ix = cache[u.word];
					
					//@debug
					//r += '<span style="color:#A77">[cached] ' + ix[0] + '</span><br/>';
				}

                var canTrim = (count != 0);
                for (var j = 1; j < ix.length; ++j) {
                    var ofs = ix[j];
					if (have[ofs]) {
						//@debug
						//r += '<span style="color:#A77">[had] ' + dict.substr(ofs, 30) + ' ...</span><br/>';
						
						continue;
					}
                    var dentry = dict.substring(ofs, dict.indexOf("\n", ofs));
                                
					var ok = true;
					if (i > 0) {
						// > 0 a de-inflected word
						
						// ex:
						// /(io) (v5r) to finish/to close/
						// /(v5r) to finish/to close/(P)/
						// /(aux-v,v1) to begin to/(P)/
						// /(adj-na,exp,int) thank you/many thanks/
						// /(adj) shrill/
						
						var w;
						var x = dentry.split(/[,()]/);
						var y = u.type;
						var z = x.length - 1;
						if (z > 10) z = 10;
						for (; z >= 0; --z) {
							w = x[z];
							if ((y & 1) && (w == 'v1')) break;
							if ((y & 4) && (w == 'adj')) break;
							if ((y & 2) && (w.substr(0, 2) == 'v5')) break;
							if ((y & 16) && (w.substr(0, 3) == 'vs-')) break;
							if ((y & 8) && (w == 'vk')) break;
						}
						ok = (z != -1);
						
						//@debug
						/*if (!ok) {
							r += '<span style="color:#D44">';
							r += trys[i].reason + '/';
							r += y + ': ';
							r += dentry.substr(0, 30);
							r += ' ...</span><br/>';
						}*/
						
					}
                    if (ok) {
                        if ((canTrim) && (count >= maxTrim)) {
							r += ". . .";
							break;
						}

						have[ofs] = 1;
                        ++count;
                        if (maxLen == 0) maxLen = trueLen[word.length];
						
						dentry = dentry.match(/^(.+?)\s+(?:\[(.*?)\])?\s*\/(.+)\//);
                        if (dentry[2]) {
                            r += '<span class="w-kanji">' + dentry[1] + '</span><span class="w-kana">&#32;' + dentry[2] + '</span> ';
                        }
                        else {
                            r += '<span class="w-kana">' + dentry[1] + '</span> ';
                        }
						if (trys[i].reason) 
							r += ' <span class="w-conj">(' 
								+ (showInf ? (word + ' ') : '') 
								+ trys[i].reason + ')</span>';
                        r += "<br/><span class=\"w-def\">\u226B " + dentry[3].replace(/\//g, "; ") + "</span><br/>\n";
                    }
                }	// for j < ix.length
				if (count >= maxTrim) break;
            }	// for i < trys.length
            if (count >= maxTrim) break;
            word = word.substr(0, word.length - 1);
        }	// while word.length > 0

		if ((doNames) && (count > 10)) {
			if (count > 20) {
				v = r.length / 3;
				if (((i = r.indexOf("\n", v - 1)) > 0) && ((j = r.indexOf("\n", i + v)) > 0)) {
					r = "<table><tr><td valign='top' style='padding-right:20px'>" +
						r.substr(0, i + 1) + "</td><td valign='top' style='padding-right:20px'>" +
						r.substr(i + 1, j - i) + "</td><td valign='top'>" +
						r.substr(j + 1) +
						"</td></tr></table>";
				}
			}
			else {
				if ((i = r.indexOf("\n", r.length / 2)) > 0) {
					r = "<table><tr><td valign='top' style='padding-right:20px'>" + r.substr(0, i) + "</td><td width=20>&#32;</td><td valign='top'>" + r.substr(i + 1) + "</td></tr></table>";
				}
			}
		}
		
        return [r, maxLen];
    },
	
	
	//

	
	kanjiInfo: function(kanji) {
		var kdEntry = this.binSearchF(this.kanjiData, kanji);
		if (!kdEntry) return "";
		
		var moreinfo = [];
		var beg;
		var end;
		var s;
		var t;
		var cls;
		var n;
		var j;

		// =parse=
		
		// kana
		for (beg = 15; (beg < kdEntry.length) && (kdEntry.charCodeAt(beg) < 256); beg++) { ; }
		for (end = beg + 1;(end < kdEntry.length) && (kdEntry.charAt(end) != "{"); end++) { ; }
		
		// misc info
		t = kdEntry.substring(7, beg - 1).split(/\s+/);
		for (i = 0; i < t.length; i++) {
			if (t[i].match(/^([A-Z]+)(.*)/)) {
				if (!moreinfo[RegExp.$1]) moreinfo[RegExp.$1] = RegExp.$2;
					else moreinfo[RegExp.$1] += " " + RegExp.$2;
			}
		}


		// =format=

		// English meanings
		var eigo = '<div class="k-eigo">' + 
				kdEntry.substring(end).replace(/\{/g, "").replace(/}\s*/g, ", ").replace(/,\s*$/, "") +
				'</div>';


		// Japanese readings
		var readings = 
			'<div class="k-yomi">' +
			kdEntry.substring(beg, end)
				.replace(/^\s*|\s*$/g, "")
				.replace(/\s+/g, "\u3001 ")
				.replace(/\.([^\u3001]+)/g, '<span class="k-yomi-hi">$1</span>')
				.replace(/(\u3001 )?T1\u3001 /, "<br/><span class=\"k-yomi-ti\">\u540D\u4E57\u308A</span> ")
				.replace(/(\u3001 )?T2\u3001 /, "<br/><span class=\"k-yomi-ti\">\u90E8\u9996\u540D</span> ") +
				'</div>';
	
		
		// radical, grade, freq, strokes box
		j = moreinfo['B'] - 1;
		t = moreinfo['G'];
		if (!t) t = '-';
			else if (t == 8) t = "general<br/>use";
			else if (t == 9) t = "name<br/>use";
			else t = "grade<br/>" + t;
		var xbox = '<table class="k-abox-tb"><tr>' +
			'<td class="k-abox-r">radical<br/>' + this.radData[j].charAt(0) + ' ' + (j + 1) + '</td>' +
			'<td class="k-abox-g">' + t + '</td>' +
			'</tr><tr>' +
			'<td class="k-abox-f">freq<br/>' + (moreinfo['F'] ? moreinfo['F'] : '-') + '</td>' +
			'<td class="k-abox-s">strokes<br/>' + parseInt(moreinfo['S']) + '</td>' +
			'</tr></table>';
		
		// components of a kanji
		// ^^ j = moreinfo['B'] - 1;
		t = this.radData[j].split("\t");
		xbox += '<table class="k-bbox-tb">' +
				'<tr><td class="k-bbox-1a">' + t[0] + '</td>' +
				'<td class="k-bbox-1b">' + t[2] + '</td>' +
				'<td class="k-bbox-1b">' + t[3] + '</td></tr>';
		n = 1;
		for (i = 0; i < this.radData.length; ++i) {
			s = this.radData[i];
			if ((j != i) && (s.indexOf(kanji) != -1)) {
				t = s.split("\t");
				cls = ' class="k-bbox-' + (n ^= 1);
				xbox += '<tr><td' + cls + 'a">' + t[0] + '</td>' +
						'<td' + cls + 'b">' + t[2] + '</td>' +
						'<td' + cls + 'b">' + t[3] + '</td></tr>';
			}			
		}
		xbox += '</table>';

		
		// index & stuff
		const dc = [
//			"C", 	"Classical Radical",
//			"DR",	"Father Joseph De Roo Index",
//			"DO",	"P.G. O'Neill Index", 
//			"O", 	"P.G. O'Neill Japanese Names Index",
//			"Q", 	"Four Corner Code", 
//			"MN",	"Morohashi Daikanwajiten Index", 
//			"MP",	"Morohashi Daikanwajiten Volume/Page", 
//			"E", 	"Henshall Index",
//			"K",	"Gakken Kanji Dictionary Index", 
//			"W",	"Korean Reading",
			"H",	"Halpern Index",
			"L",	"Heisig Index",
			"DK",	"Kanji Learners Dictionary Index",
			"N",	"Nelson Index",
			"V",	"New Nelson Index",
			"Y",	"PinYin",
			"P",	"Skip Pattern",
			"IN",	"Tuttle Kanji &amp; Kana",
			"I",	"Tuttle Kanji Dictionary", 
			"U",	"Unicode"
			];
		var mix = '';
		n = 0;
		for (i = 0; i < dc.length; i += 2) {
			s = moreinfo[dc[i]];
			cls = ' class="k-mix-td' + (n ^= 1) + '"';
			mix += '<tr><td' + cls + '>' + dc[i + 1] + '</td><td' + cls + '>' + (s ? s : '-') + '</td></tr>';
		}
		if (mix != '') mix = '<table class="k-mix-tb">' + mix + '</table>';
		
		return '<table class="k-main-tb">' +
			'<tr><td valign="top">' + xbox + '<span class="k-kanji">' + kanji + '</span><br/>' +
			eigo + readings + '</td></tr>' +
			'<tr><td>' + mix + '</td></tr>' +
			'</table>';
	}
	
};
