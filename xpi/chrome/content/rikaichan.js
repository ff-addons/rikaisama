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


// used for debugging
/*
rcd_con("**RIKAICHAN** --- HEY, COMMENT THESE DEBUGGING THINGS OUT ---");

function rcd_con(msg) {
	Components.classes["@mozilla.org/consoleservice;1"]
		.getService(Components.interfaces.nsIConsoleService)
		.logStringMessage(msg);
//	toJavaScriptConsole();
}

rcd_status_time = (new Date()).getTime();
function rcd_status(s) {
	if (window.XULBrowserWindow) {
		window.XULBrowserWindow.overLink = null;	//  status even if over links
	}
	window.status = "[" + ((new Date()).getTime() - rcd_status_time) + "] " + s;
}

function rcd_dumo(o) {
	var k;
	var s = "[" + o + "]\r\n";
	for (k in o) {
		try {
			s += k + "=" + String(o[k]).replace(/[\r\n\t]/g, " ") + "\r\n";
		}
		catch (err) {
			s += err + "\r\n";
		}
	}
	rcd_con(s);
}

function rcd_clip(s) {
	Components.classes["@mozilla.org/widget/clipboardhelper;1"]
		.getService(Components.interfaces.nsIClipboardHelper)
		.copyString(s);
}
/**/



var rcxMain = {

	haveNames: false,
	canDoNames: false,

	init: function() {
		window.addEventListener("load", this.onLoad, false);
        this.is_tbird = (navigator.userAgent.search(/Thunderbird\/\d+/) != -1);
	},

    getCurrentBrowser: function() {
//        return this.is_tbird ? document.getElementById("messagepane") : gBrowser.mCurrentBrowser;
		if (this.is_tbird) {
			var b = document.getElementById("messagepane");
			if (b) return b;
			return document.getElementById("content-frame");	// compose
		}
		else {
			return gBrowser.mCurrentBrowser;
		}
    },

	tbObs: {
		observe: function(subject, topic, data) {
			if (topic == 'mail:composeOnSend') {
				var e;
				e = window.content.document.getElementById("rikaichan-css");
				if (e) e.parentNode.removeChild(e);
				e = window.content.document.getElementById("rikaichan-popup");
				if (e) e.parentNode.removeChild(e);
			}
		}
	},
	
    onLoad: function() { rcxMain._onLoad(); },
	_onLoad: function() {
		window.addEventListener("unload", this.onUnload, false);

		this.haveNames = this.canDoNames = rcxHaveNames();

		Components.classes["@mozilla.org/preferences-service;1"]
			.getService(Components.interfaces.nsIPrefBranch)
			.QueryInterface(Components.interfaces.nsIPrefBranchInternal)
			.addObserver("rikaichan.", this.prefobs, false);
		
		var mks;

		if (this.is_tbird) {
			Components.classes["@mozilla.org/observer-service;1"]
				.getService(Components.interfaces.nsIObserverService)
				.addObserver(this.tbObs, "mail:composeOnSend", false);
		
			mks = document.getElementById("mailKeys");
			if (!mks) mks = document.getElementById("editorKeys");
		}
		else {
			mks = document.getElementById("mainKeyset");
		}

		
		// note: setting keys seem to only work during startup
		
	    var br = this.getPrefBranch();
		var tolo = ["toggle", "lookup"];
		
		for (var i = 1; i >= 0; --i) {
			var na = tolo[i];
//			var key = document.getElementById("rikaichan-key-" + na)
//			if (key) key.parentNode.removeChild(key);

			var v = br.getCharPref(na + ".key");
			if (v.length > 0) {
				var key = document.createElementNS(
						"http://www.mozilla.org/keymaster/gatekeeper/there.is.only.xul", "key");
				key.setAttribute("id", "rikaichan-key-" + na);
				key.setAttribute("key", (v.length > 1) ? "" : v);
				key.setAttribute("keycode", (v.length > 1) ? ("VK_" + v) : "");
				key.setAttribute("modifiers", br.getCharPref(na + ".keymod"));
				key.setAttribute("command", "rikaichan-" + na + "-cmd");
				mks.appendChild(key);
			}
		}
		
		this.loadPrefs();

        // Thunderbird has no tabs
        if (!this.is_tbird) gBrowser.mTabContainer.addEventListener("select", this.onTabSelect, false);
	},

	onUnload: function() { rcxMain._onUnload(); },
	_onUnload: function() {
        if (this.is_tbird) {
			Components.classes["@mozilla.org/observer-service;1"]
				.getService(Components.interfaces.nsIObserverService)
				.removeObserver(this.tbObs, "mail:composeOnSend");
		}
		else {
			gBrowser.mTabContainer.removeEventListener("select", this.onTabSelect, false);
		}		

		Components.classes["@mozilla.org/preferences-service;1"]
				.getService(Components.interfaces.nsIPrefBranch)
				.QueryInterface(Components.interfaces.nsIPrefBranchInternal)
				.removeObserver("rikaichan.", this.prefobs);
		
		if (this.dict) rcxMain.dict.unlock();
	},

	//

	getPrefBranch: function() {
	    return Components.classes["@mozilla.org/preferences-service;1"]
				.getService(Components.interfaces.nsIPrefService)
				.getBranch("rikaichan.");
	},
	
	prefobs: {
		observe: function(aSubject, aTopic, aPrefName) {
            if (this.is_tbird) return;		// seems safe; to do: fix br ref

            rcxMain.loadPrefs();
			for (var i = 0; i < gBrowser.browsers.length; ++i) {
				var css = gBrowser.browsers[i].contentDocument.getElementById("rikaichan-css");
				if (css) css.setAttribute("href", rcxMain.cssUrl);
			}
		}
	},
	
	loadPrefs: function() {
	    var br = this.getPrefBranch();
		var xm = ["cm", "tm"];
		var i;
		var a, b;
		
		for (i = 1; i >= 0; --i) {
			a = !br.getBoolPref("toggle.showin" + xm[i]);
			b = !br.getBoolPref("lookup.showin" + xm[i]);
			document.getElementById("rikaichan-toggle-" + xm[i]).hidden = a;
			document.getElementById("rikaichan-lookup-" + xm[i]).hidden = b;
			if (!this.is_tbird)
				document.getElementById("rikaichan-separator-" + xm[i]).hidden = a || b;
		}
		
		var s = br.getCharPref("css");
		if (s.indexOf("/") != -1) this.cssUrl = s;
			else this.cssUrl = "chrome://rikaichan/skin/popup-" + s + ".css";

		this.canDoNames = this.haveNames;
		i = br.getIntPref("dictorder");
		if (!this.haveNames) i = 0;
		switch (i) {
		case 0:
			this.canDoNames = false;
		case 1:
			this.kanjiN = 1;
			this.namesN = 2;
			break;
		case 2:
			this.kanjiN = 2;
			this.namesN = 1;
			break;
		}

		this.highlight = br.getBoolPref("hion");
		this.popDelay = br.getIntPref("popdelay");
		this.lbSticky = br.getBoolPref("sticky");
		this.delayNames = br.getBoolPref("delaynames");
		this.lbUpdateSticky();
	},
	
	
	//


	setStatus: function(s) {
		window.status = "[rikaichan] " + s;
	},

	loadDictionary: function() {
		if (!this.dict) {
			if (typeof(rcxWordDict) == "undefined") {
				alert("Please install a word dictionary for rikaichan.");
				return false;
			}
			try {
				this.setStatus("Loading dictionary...");
				this.dict = new rcxDict(this.haveNames && !this.delayNames);
				this.setStatus("Dictionary loaded.");
			}
			catch (ex) {
				alert("error loading dictionary: " + ex);
				return false;
			}
		}
		return true;
	},
	
	onTabSelect: function() {
		var b = document.getElementById("rikaichan-inline-button");
		if (b) b.checked = (this.getCurrentBrowser().rikaichan != undefined);
	},

	/////

	showPopup: function(text, elem, x, y, looseWidth) {

		const topdoc = content.document;
	
		var popup = topdoc.getElementById("rikaichan-popup");
		if (!popup) {
			var css = topdoc.createElementNS("http://www.w3.org/1999/xhtml", "link");
			css.setAttribute("rel", "stylesheet");
			css.setAttribute("type", "text/css");
			css.setAttribute("href", this.cssUrl);
			css.setAttribute("id", "rikaichan-css");
			topdoc.getElementsByTagName("head")[0].appendChild(css);
			
			popup = topdoc.createElementNS("http://www.w3.org/1999/xhtml", "div");
			popup.setAttribute("id", "rikaichan-popup");
			topdoc.documentElement.appendChild(popup);
//			topdoc.body.appendChild(popup);
/*			popup.addEventListener("mouseover", 
				function(ev) {
					if (!rcxMain.lbVisible) ev.currentTarget.style.visibility = "hidden";
				}, false);*/
				
			// handle this or we end up with weird results in tb composer
			popup.addEventListener("mousedown", 
				function (ev) {
					ev.preventDefault();
					popup.style.display = "none";
				}, true);
		}

		popup.style.width = "auto";
		popup.style.height = "auto";
		popup.style.maxWidth = (looseWidth ? "" : "600px");
		popup.innerHTML = text;

		if (elem) {
			popup.style.top = "-1000px";
			popup.style.left = "0px";
			popup.style.display = "";
		
			var pW = popup.offsetWidth;
			var pH = popup.offsetHeight;
			
			// we may need to just guess!
			if (pW <= 0) pW = 200;
			if (pH <= 0) {
				pH = 0;
				var j = 0;
				while ((j = text.indexOf("<br/>", j)) != -1) {
					j += 5;
					pH += 22;
				}
				pH += 25;
			}

			// these things are always on top, so go sideways
			if (elem instanceof Components.interfaces.nsIDOMHTMLOptionElement) {
/*			
				// FF104: ebo.screen* doesn't return screen coordinates with some sites, result
				// is same as first half of below... (this seems to have been fixed in DP)
				var ebo = elem.ownerDocument.getBoxObjectFor(elem);
				x = ebo.screenX - bbo.screenX;
				y = ebo.screenY - bbo.screenY;
*/

				// find the position relative to top-most window
				x = 0;
				y = 0;

				var e = elem;
				while (e) {
					x += e.offsetLeft;
					y += e.offsetTop;
					if (e.offsetParent) {
						e = e.offsetParent;
					}
					else {
						e = e.ownerDocument;
						if ((!e) || (!e.defaultView) || (!e.defaultView.frameElement)) break;
						e = e.defaultView.frameElement;
					}
				}
				
				// need another loop since elements like scrollable DIVs (any others?) are
				// probably not in the path of offsetParent
				const mainBody = window.content.document.body;
				e = elem;
				while (e) {
					if (e.scrollTop != null) {
						x -= e.scrollLeft;
						y -= e.scrollTop;
					}
					if (e.parentNode) {
						e = e.parentNode;
						if (e == mainBody) break;
					}
					else {
						if ((!e.defaultView) || (!e.defaultView.frameElement)) break;
						e = e.defaultView.frameElement;
					}
				}

				if (x > (content.innerWidth - (x + elem.offsetWidth))) {
					x = (x - popup.offsetWidth - 5);
					if (x < 0) x = 0;
				}
				else {
					x += elem.offsetWidth + 5;
				}
			}
			else {
                const bbo = this.getCurrentBrowser().boxObject;
				
				x -= bbo.screenX;
				y -= bbo.screenY;
				
				// go left if necessary
				if ((x + pW) > (content.innerWidth - 15)) {
					x = (content.innerWidth - pW) - 15;
					if (x < 0) x = 0;
				}

				// below the mouse
				var v = 20;
				
				// under the popup title
				if ((elem.title) && (elem.title != "")) v += 20;
				
				// go up if necessary
				if ((y + v + pH) > content.innerHeight) {
					var t = y - pH - 20;
					if (t >= 0) y = t;
				}
				else y += v;
				
				x += content.scrollX;
				y += content.scrollY;
			}
		}
		else {
			x += content.scrollX;
			y += content.scrollY;
		}

		popup.style.left = x + "px";
		popup.style.top = y + "px";
		popup.style.display = "";
	},

	hidePopup: function() {
		var popup = window.content.document.getElementById("rikaichan-popup");
		if (popup) {
			popup.style.display = "none";
			popup.innerHTML = "";
		}
	},

	/////
	
	clearHi: function() {
		var tdata = this.getCurrentBrowser().rikaichan;
		if ((!tdata) || (!tdata.prevSelView)) return;
		if (tdata.prevSelView.closed) {
			tdata.prevSelView = null;
			return;
		}
		tdata.prevSelView.getSelection().removeAllRanges();
		tdata.prevSelView = null;
		tdata.kanjiChar = null;
	},
	
	/////

	unicodeInfo: function(c) {
		const hex = "0123456789ABCDEF";
		const u = c.charCodeAt(0);
		return c + " U" + hex[(u >>> 12) & 15] + hex[(u >>> 8) & 15] + hex[(u >>> 4) & 15] + hex[u & 15];
	},


	shiftDown: false,
	
	onKeyDown: function(ev) {
		if ((ev.keyCode == 16) && (!rcxMain.shiftDown)) {	// shift
			rcxMain.shiftDown = true;
			var tdata = ev.currentTarget.rikaichan;	// per-tab data
			tdata.showMode = (tdata.showMode + 1) % (rcxMain.canDoNames ? 3 : 2);
			rcxMain.show(tdata);
		}
	},
	
	onKeyUp: function(ev) {
		if (ev.keyCode == 16) rcxMain.shiftDown = false;
	},


	mouseButtons: 0,
	
	onMouseDown: function(ev) {
		rcxMain.mouseButtons |= (1 << ev.button);
		rcxMain.hidePopup();
	},
	
	onMouseUp: function(ev) {
		rcxMain.mouseButtons &= ~(1 << ev.button);
	},

/*
	2E80 - 2EFF	CJK Radicals Supplement
	2F00 - 2FDF	Kangxi Radicals
	2FF0 - 2FFF	Ideographic Description
p	3000 - 303F CJK Symbols and Punctuation
x	3040 - 309F Hiragana
x	30A0 - 30FF Katakana
	3190 - 319F	Kanbun
	31F0 - 31FF Katakana Phonetic Extensions
	3200 - 32FF Enclosed CJK Letters and Months
	3300 - 33FF CJK Compatibility
x	3400 - 4DBF	CJK Unified Ideographs Extension A
x	4E00 - 9FFF	CJK Unified Ideographs
x	F900 - FAFF	CJK Compatibility Ideographs
p	FF00 - FFEF Halfwidth and Fullwidth Forms
x	FF66 - FF9D	Katakana half-width

*/

	kanjiN: 1,
	namesN: 2,
	
	show: function(tdata) {
		var rp = tdata.prevRangeNode;
		var ro = tdata.prevRangeOfs;
		var u;
		
		if (!rp) {
			this.clearHi();
			this.hidePopup();
			return;
		}
		
		// if we have "   XYZ", where whitespace is compressed, X never seems to get selected
		while (((u = rp.data.charCodeAt(ro)) == 32) || (u == 9) || (u == 10)) {
			++ro;
			if (ro >= rp.data.length) {
				this.clearHi();
				this.hidePopup();
				return;
			}
		}

		//
		if ((isNaN(u)) ||
			((u != 0x25CB) &&
			((u < 0x3001) || (u > 0x30FF)) &&
			((u < 0x3400) || (u > 0x9FFF)) &&
			((u < 0xF900) || (u > 0xFAFF)) &&
			((u < 0xFF10) || (u > 0xFF9D)))) {
			this.clearHi();
			this.hidePopup();
			return;
		}
	
		var text = rp.data.substr(ro, 12);
		var rp = tdata.prevRangeNode;
		var de = ['', 0];
		var again;
		
		do {
			again = false;
			switch (tdata.showMode) {
			case 0:
				// returns [the_entries, maximum_length_matched]
				de = this.dict.lookup(text, false);
				if (de[1] > 0) 	break;
				tdata.showMode = 1;
				again = true;
				break;
			case this.kanjiN:
				de[0] = this.dict.kanjiInfo(text.charAt(0));
				de[1] = (de[0].length > 1) ? 1 : 0;
				break;
			case this.namesN:
				de = this.dict.lookup(text, true);
				if (de[1] == 0) {
					tdata.showMode = (this.namesN == 1) ? 2 : 0;
					again = true;
				}
			}
		} while (again);

		// don't try to highlight form elements
		if ((this.highlight) && (!("form" in tdata.prevTarget))) {
			var doc = rp.ownerDocument;
			if (!doc) {
				this.clearHi();
				this.hidePopup();
				return;
			}
			var r = doc.createRange();
			r.setStart(rp, ro);
			r.setEnd(rp, ro + ((de[1] > 0) ? de[1] : 1));

			var sel = doc.defaultView.getSelection();
			sel.removeAllRanges();
			sel.addRange(r);
			tdata.prevSelView = doc.defaultView;
		}
		
		this.showPopup((de[1] > 0) ? de[0] : ("no kanji information about " + 	this.unicodeInfo(text.charAt(0))),
			tdata.prevTarget, tdata.popX, tdata.popY, false);
	},

	onMouseMove: function(ev) { rcxMain._onMouseMove(ev); },
	_onMouseMove: function(ev) {
		var tdata = ev.currentTarget.rikaichan;	// per-tab data
		var rp = ev.rangeParent;
		var ro = ev.rangeOffset;

		if ((ev.target == tdata.prevTarget) && 
			(rp == tdata.prevRangeNode) && (ro == tdata.prevRangeOfs)) return;

		if (tdata.timer) {
			clearTimeout(tdata.timer);
			tdata.timer = null;
		}

//		rcd_status(ev.timeStamp + ": eot=" + ev.explicitOriginalTarget.nodeName + " rp=" + (rp?rp.nodeName:"null"));
		if ((ev.explicitOriginalTarget.nodeType != 3) && !("form" in ev.target)) {
			rp = null;
			ro = -1;
		}
		
		tdata.prevTarget = ev.target;
		tdata.prevRangeNode = rp;
		tdata.prevRangeOfs = ro;

		if ((this.mouseButtons != 0) || (this.lbFocused)) return;

//		this.clearHi();
		
/*
		if ((rp) && ((!rp.data) || (ro >= rp.data.length))) {
			rcd_status("!data || ro > length");
			return;
		}
*/
		if ((rp) && (rp.data) && (ro < rp.data.length)) {
			tdata.showMode = ev.shiftKey ? 1 : 0;
			tdata.popX = ev.screenX;
			tdata.popY = ev.screenY;
			tdata.timer = setTimeout(
				function(tdata) { 
					rcxMain.show(tdata);
				}, this.popDelay, tdata);
		}
		else {
			this.clearHi();
			this.hidePopup();
		}

	},
	
	inlineEnable: function(bro) {
		var time;
	
		if (!this.dict) {
			time = (new Date()).getTime();
			if (!this.loadDictionary()) return;
			time = String(((new Date()).getTime() - time) / 1000);
			if (time.match(/^(\d+\.\d)/)) time = RegExp.$1;
		}

		bro.rikaichan = {};
		this.mouseButtons = 0;
		bro.addEventListener("mousemove", this.onMouseMove, false);
		bro.addEventListener("mousedown", this.onMouseDown, false);
		bro.addEventListener("mouseup", this.onMouseUp, false);
		bro.addEventListener("keydown", this.onKeyDown, true);
		bro.addEventListener("keyup", this.onKeyUp, true);
//		bro.addEventListener("unload", this.onTabClose, true);	-- also gets called when location changes

//		changeSelectionColor(true);
		
		if (time) this.showPopup("Dictionary loaded in " + time + " seconds. rikaichan ready!", null, 5, 5, true);
		this.setStatus("Ready");
	},
	
	inlineDisable: function(bro) {
		bro.removeEventListener("mousemove", this.onMouseMove, false);
		bro.removeEventListener("mousedown", this.onMouseDown, false);
		bro.removeEventListener("mouseup", this.onMouseUp, false);
		bro.removeEventListener("keydown", this.onKeyDown, true);
		bro.removeEventListener("keyup", this.onKeyUp, true);
//		bro.removeEventListener("unload", this.onTabClose, true);

		var e;
		e = bro.contentDocument.getElementById("rikaichan-css");
		if (e) e.parentNode.removeChild(e);
		e = bro.contentDocument.getElementById("rikaichan-popup");
		if (e) e.parentNode.removeChild(e);

		this.clearHi();
		delete bro.rikaichan;
		
		this.setStatus("Disabled");
	},

	inlineToggle: function() {
		if (!this.lbSticky) this.lbHide(true);

        // Thunderbird has no tabs, so we need to use the window instead of
        // the current browser container
        var bro = this.getCurrentBrowser();
		if (bro.rikaichan) this.inlineDisable(bro);
			else this.inlineEnable(bro);

		this.onTabSelect();
		
//		var b = document.getElementById("rikaichan-inline-button");
//		if (b) b.checked = (bro.rikaichan != undefined);
	},
	
	/////


	getSelectedText: function(win) {
		var text;
		var sel = win.getSelection();
		if (sel) {
			text = sel.toString();
			if (text.search(/[^\s]/) != -1) return text;
		}
		for (var i = 0; i < win.frames.length; ++i) {
			text = this.getSelectedText(win.frames[i]);
			if (text.length > 0) return text;
		}
		return "";
	},

	lbFocused: false,
	lbVisible: false,
	lbSticky: false,
	
	lbToggle: function() {
		if (this.lbVisible) {
			if (this.lbSticky) this.lbDefaultSearch();
				else this.lbHide(true);
		} else {
			this.lbShow();
		}
	},
	
	lbShow: function() {
		this.lbVisible = true;
		this.lbLastText = "";
		
		var bar = document.getElementById("rikaichan-lookup");
		bar.hidden = false;
		
		this.lbText = document.getElementById("rikaichan-lookup-text");

		var b = document.getElementById("rikaichan-lookup-button");
		if (b) b.checked = true;

		this.lbDefaultSearch();
	},
	
	lbHide: function(refocus) {
		document.getElementById("rikaichan-lookup").hidden = true;
		this.lbVisible = false;
		this.lbFocused = false;

		var b = document.getElementById("rikaichan-lookup-button");
		if (b) b.checked = false;
		
		this.hidePopup();

		if (refocus) window.content.focus();
	},

	lbDefaultSearch: function() {
		this.lbText.value = this.getSelectedText(window.content).substr(0, 30);
		this.lbSearch();
	
		this.lbVisible = false;
		this.lbText.select();
		this.lbText.focus();
		this.lbVisible = true;
	},
	
	lbFocus: function() {
		this.lbFocused = true;
	},
	
	lbBlur: function() {
		this.lbFocused = false;
		if (!this.lbVisible) return;
		if (this.lbSticky) this.hidePopup();
			else this.lbHide(false);
	},
	
	lbSearch: function() {
		var s = this.lbText.value;
		var doNames = false;

		if (this.haveNames) {
			if (this.lbLastText == s) {
				this.lbLastText = "";
				doNames = true;
			}
			else this.lbLastText = s;
		}
		
		s = s.replace(/[^\u3001-\uFFFF]/g, "");
		if (s.length == 0) {
			this.hidePopup();
			return;
		}
	
		if (!this.loadDictionary()) return;
		var w = this.dict.lookup(s, doNames);
		
		var maxK = Math.max(Math.floor((content.innerWidth - 10) / 310) - 1, 1);
		var k = "";
		var have = [];
		var t = s + w[0];
		for (var i = 0; i < t.length; ++i) {
			var c = t.charAt(i);
			var x = this.dict.kanjiInfo(c);
			if ((x.length == 0) || (have[c])) continue;
			have[c] = true;
			k += "<td class='q-k'>" + x + "</td>";
			if (--maxK <= 0) break;
		}
		i = 0;
		this.showPopup("<table class='q-tb'><tr><td class='q-w'>" + 
			(w[1] ? w[0] : ("no information about " + s)) +
			"</td>" + k + "</tr></table>", null, 5, 5, true);
	},
	
	lbKey: function(ev) {
		if (ev.keyCode ==  27) {
			ev.preventDefault();
			this.lbHide(true);
		}
	},

	lbToggleSticky: function() {
		this.lbSticky = !this.lbSticky;
		document.getElementById("rikaichan-lookup-text").focus();
		this.getPrefBranch().setBoolPref("sticky", this.lbSticky);
	},
	
	lbUpdateSticky: function() {
		document.getElementById("rikaichan-lookup-sticky").checked = this.lbSticky;
	}
	
};

///

rcxMain.init();
