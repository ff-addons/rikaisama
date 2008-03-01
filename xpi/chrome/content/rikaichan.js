/*

	Rikaichan
	Copyright (C) 2005-2008 Jonathan Zarate
	http://www.polarcloud.com/

	---

	Originally based on RikaiXUL 0.4 by Todd Rudick
	http://www.rikai.com/
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

	---

	Please do not change or remove any of the copyrights or links to web pages
	when modifying any of the files. - Jon

*/


// used for debugging
/*
rcd_con('**RIKAICHAN** --- HEY, COMMENT THESE DEBUGGING THINGS OUT ---');

function rcd_con(msg)
{
	Components.classes['@mozilla.org/consoleservice;1']
		.getService(Components.interfaces.nsIConsoleService)
		.logStringMessage(msg);
//	toJavaScriptConsole();
}

function rcd_status(s)
{
	var e;

	if (typeof(rcd_status_timeout) != 'undefined') {
		clearTimeout(rcd_status_timeout);
		rcd_status_timeout = undefined;
	}

	e = document.getElementById('rikaichan-status');
	if ((s) && (s.length)) {
		e.setAttribute('label', s.substr(0, 80));
		e.setAttribute('hidden', 'false');
		rcd_status_timeout = setTimeout(rcd_status, 3000);
	}
	else {
		e.setAttribute('hidden', 'true');
	}
}

function rcd_dumo(o)
{
	var k;
	var s = '[' + o + ']\r\n';
	for (k in o) {
		try {
			s += k + '=' + String(o[k]).replace(/[\r\n\t]/g, ' ') + '\r\n';
		}
		catch (err) {
			s += err + '\r\n';
		}
	}
	rcd_con(s);
}

function rcd_clip(s) {
	Components.classes['@mozilla.org/widget/clipboardhelper;1']
		.getService(Components.interfaces.nsIClipboardHelper)
		.copyString(s);
}
/**/

var rcxMain = {
	haveNames: false,
	canDoNames: false,
	dictCount: 0,
	altView: 0,

	init: function() {
		window.addEventListener('load', this.onLoad, false);
        this.isTB = (navigator.userAgent.indexOf('Thunderbird') != -1);
	},

    getCurrentBrowser: function() {
		if (this.isTB) {
			var b = document.getElementById('messagepane');
			if (b) return b;
			return document.getElementById('content-frame');	// compose
		}
		else {
			return gBrowser.mCurrentBrowser;
		}
    },

	E: function(e) {
		return document.getElementById(e);
	},

	statusTimer: null,

	status: function(text) {
		var e;

		if (this.statusTimer) clearTimeout(this.statusTimer);

		e = document.getElementById('rikaichan-status');
		e.setAttribute('label', text.substr(0, 80));
		e.setAttribute('hidden', 'false');
		this.statusTimer = setTimeout(function(e) { e.setAttribute('hidden', 'true') }, 3000, e);
	},

	tbObs: {
		observe: function(subject, topic, data) {
			if (topic == 'mail:composeOnSend') {
				var e;
				e = window.content.document.getElementById('rikaichan-css');
				if (e) e.parentNode.removeChild(e);
				e = window.content.document.getElementById('rikaichan-window');
				if (e) e.parentNode.removeChild(e);
			}
		}
	},

    onLoad: function() { rcxMain._onLoad(); },
	_onLoad: function() {
		try {
			var mks;

			this.haveNames = this.canDoNames = (typeof(rcxNamesDict) != 'undefined');

			window.addEventListener('unload', this.onUnload, false);

			if (this.isTB) {
				Components.classes['@mozilla.org/observer-service;1']
					.getService(Components.interfaces.nsIObserverService)
					.addObserver(this.tbObs, 'mail:composeOnSend', false);

				mks = document.getElementById('mailKeys');
				if (!mks) mks = document.getElementById('editorKeys');
			}
			else {
				Components.classes['@mozilla.org/preferences-service;1']
					.getService(Components.interfaces.nsIPrefBranch)
					.QueryInterface(Components.interfaces.nsIPrefBranchInternal)
					.addObserver('rikaichan.', this.prefObs, false);

				mks = document.getElementById('mainKeyset');
				gBrowser.mTabContainer.addEventListener('select', this.onTabSelect, false);
			}


			var pb = this.getPrefBranch();
			var names = ['toggle', 'lbar'];

			for (var i = 1; i >= 0; --i) {
				var na = names[i];
				var v = pb.getCharPref(na + '.key');
				if (v.length > 0) {
					var key = document.createElementNS(
							'http://www.mozilla.org/keymaster/gatekeeper/there.is.only.xul', 'key');
					key.setAttribute('id', 'rikaichan-key-' + na);
					key.setAttribute('key', (v.length > 1) ? '' : v);
					key.setAttribute('keycode', (v.length > 1) ? ('VK_' + v.replace(' ', '_').toUpperCase()) : '');	// "Page Up" -> "VK_PAGE_UP"
					key.setAttribute('modifiers', pb.getCharPref(na + '.mod'));
					key.setAttribute('command', 'rikaichan-' + na + '-cmd');
					mks.appendChild(key);
				}
			}

			this.loadPrefs();
		}
		catch (ex) {
			alert('Exception: ' + ex);
		}
	},

	onUnload: function() { rcxMain._onUnload(); },
	_onUnload: function() {
        if (this.isTB) {
			Components.classes['@mozilla.org/observer-service;1']
				.getService(Components.interfaces.nsIObserverService)
				.removeObserver(this.tbObs, 'mail:composeOnSend');
		}
		else {
			gBrowser.mTabContainer.removeEventListener('select', this.onTabSelect, false);
			Components.classes['@mozilla.org/preferences-service;1']
					.getService(Components.interfaces.nsIPrefBranch)
					.QueryInterface(Components.interfaces.nsIPrefBranchInternal)
					.removeObserver('rikaichan.', this.prefObs);
		}

		if (this.dict) rcxMain.dict.unlock();
	},

	//

	getPrefBranch: function() {
	    return Components.classes['@mozilla.org/preferences-service;1']
				.getService(Components.interfaces.nsIPrefService)
				.getBranch('rikaichan.');
	},

	prefObs: {
		observe: function(aSubject, aTopic, aPrefName) {
            rcxMain.loadPrefs();
		}
	},

	loadPrefs: function() {
		try {
		    var pb = this.getPrefBranch();
			var xm = ['cm', 'tm'];
			var i;
			var a, b, c;

			this.cfg = {};
			for (i = 0; i < rcxCfgList.length; ++i) {
				b = rcxCfgList[i];
				switch (b[0]) {
				case 0:
					this.cfg[b[1]] = pb.getIntPref(b[1]);
					break;
				case 1:
					this.cfg[b[1]] = pb.getCharPref(b[1]);
					break;
				case 2:
					this.cfg[b[1]] = pb.getBoolPref(b[1]);
					break;
				}
			}

			this.dictCount = 3;
			this.canDoNames = this.haveNames;
			if (!this.haveNames) this.cfg.dictorder = 0;
			switch (this.cfg.dictorder) {
			case 0:
				this.canDoNames = false;
				this.dictCount = 2;
			case 1:
				this.kanjiN = 1;
				this.namesN = 2;
				break;
			case 2:
				this.kanjiN = 2;
				this.namesN = 1;
				break;
			}

			for (i = 1; i >= 0; --i) {
				c = xm[i];
				a = !this.cfg[c + 'toggle'];
				b = !this.cfg[c + 'lbar'];
				document.getElementById('rikaichan-toggle-' + c).hidden = a;
				document.getElementById('rikaichan-lbar-' + c).hidden = b;
				document.getElementById('rikaichan-separator-' + xm[i]).hidden = a || b;
			}

			switch (this.cfg.ssep) {
			case 'Tab':
				this.cfg.ssep = '\t';
				break;
			case 'Comma':
				this.cfg.ssep = ',';
				break;
			case 'Space':
				this.cfg.ssep = ' ';
				break;
			}

			this.cfg.css = (this.cfg.css.indexOf('/') == -1) ? ('chrome://rikaichan/skin/popup-' + this.cfg.css + '.css') : this.cfg.css;
			if (!this.isTB) {
				for (i = 0; i < gBrowser.browsers.length; ++i) {
					c = gBrowser.browsers[i].contentDocument.getElementById('rikaichan-css');
					if (c) c.setAttribute('href', this.cfg.css);
				}
			}

			c = { };
			c.kdisp = [];
			a = pb.getCharPref('kindex').split(',');
			for (i = 0; i < a.length; ++i) {
				c.kdisp[a[i]] = 1;
			}
			c.wmax = this.cfg.wmax;
			c.wpop = this.cfg.wpop;
			c.wpos = this.cfg.wpos;
			c.namax = this.cfg.namax;
			this.dconfig = c;

			if (this.dict) this.dict.setConfig(c);
		}
		catch (ex) {
			alert('Exception: ' + ex);
		}
	},

	loadDictionary: function() {
		if (!this.dict) {
			if (typeof(rcxWordDict) == 'undefined') {
				alert('Please install a dictionary for Rikaichan.');
				return false;
			}
			try {
				this.dict = new rcxDict(this.haveNames && !this.cfg.nadelay);
				this.dict.setConfig(this.dconfig);
			}
			catch (ex) {
				alert('Error loading dictionary: ' + ex);
				return false;
			}

			this.status('Dictionary Loaded.');
		}
		return true;
	},


	onTabSelect: function() { rcxMain._onTabSelect(); },
	_onTabSelect: function() {
		var b = document.getElementById('rikaichan-toggle-button');
		if (b) b.setAttribute('rc_enabled', (this.getCurrentBrowser().rikaichan != null));
		this.shiftKeys = 0;
	},

	showPopup: function(text, elem, x, y, looseWidth, lbPop) {
		const topdoc = content.document;

		this.lbPop = lbPop;

		var popup = topdoc.getElementById('rikaichan-window');
		if (!popup) {
			var css = topdoc.createElementNS('http://www.w3.org/1999/xhtml', 'link');
			css.setAttribute('rel', 'stylesheet');
			css.setAttribute('type', 'text/css');
			css.setAttribute('href', this.cfg.css);
			css.setAttribute('id', 'rikaichan-css');
			topdoc.getElementsByTagName('head')[0].appendChild(css);

			popup = topdoc.createElementNS('http://www.w3.org/1999/xhtml', 'div');
			popup.setAttribute('id', 'rikaichan-window');
			topdoc.documentElement.appendChild(popup);

			popup.addEventListener('dblclick',
				function (ev) {
					rcxMain.hidePopup();
					ev.stopPropagation();
				}, true);


			if (this.cfg.resizedoc) {
				const bo = topdoc.getBoxObjectFor(topdoc.body);
				if ((bo.height < 1024) && (topdoc.body.style.minHeight == '')) {
					topdoc.body.style.minHeight = '1024px';
				}
			}
		}

		popup.style.width = 'auto';
		popup.style.height = 'auto';
		popup.style.maxWidth = (looseWidth ? '' : '600px');

		if (topdoc.contentType == 'text/plain') {
			var df = document.createDocumentFragment();
			df.appendChild(document.createElementNS('http://www.w3.org/1999/xhtml', 'span'));
			df.firstChild.innerHTML = text;

			while (popup.firstChild) {
				popup.removeChild(popup.firstChild);
			}
			popup.appendChild(df.firstChild);
		}
		else {
			popup.innerHTML = text;
		}

		if (elem) {
			popup.style.top = '-1000px';
			popup.style.left = '0px';
			popup.style.display = '';

			const bbo = this.getCurrentBrowser().boxObject;
			var pW = popup.offsetWidth;
			var pH = popup.offsetHeight;

			// guess!
			if (pW <= 0) pW = 200;
			if (pH <= 0) {
				pH = 0;
				var j = 0;
				while ((j = text.indexOf('<br/>', j)) != -1) {
					j += 5;
					pH += 22;
				}
				pH += 25;
			}

			if (this.altView == 1) {
				x = content.scrollX;
				y = content.scrollY;
			}
			else if (this.altView == 2) {
				x = (content.innerWidth - (pW + 20)) + content.scrollX;
				y = (content.innerHeight - (pH + 20)) + content.scrollY;
			}
			else if (elem instanceof Components.interfaces.nsIDOMHTMLOptionElement) {
				// these things are always on top, so go sideways

				// in some cases (ex: google.co.jp), ebo doesn't add the width of the scroller (?), so use SELECT's width
				const epbo = elem.ownerDocument.getBoxObjectFor(elem.parentNode);

				const ebo = elem.ownerDocument.getBoxObjectFor(elem);
				x = ebo.screenX - bbo.screenX;
				y = ebo.screenY - bbo.screenY;

				if (x > (content.innerWidth - (x + epbo.width))) {
					x = (x - popup.offsetWidth - 5);
					if (x < 0) x = 0;
				}
				else {
					x += epbo.width + 5;
				}

//				rcd_status("x=" + x + ' / ow=' + elem.offsetWidth + ' / epbw=' + epbo.width + ' / ebw=' + ebo.width + ' / ebo=' + ebo.screenX + ' / bbo=' + bbo.screenX);
			}
			else {
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
				if ((elem.title) && (elem.title != '')) v += 20;

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

		popup.style.left = x + 'px';
		popup.style.top = y + 'px';
		popup.style.display = '';

//		rcd_clip(text);	// @debug
	},

	hidePopup: function() {
		var popup = window.content.document.getElementById('rikaichan-window');
		if (popup) {
			popup.style.display = 'none';
			popup.innerHTML = '';
		}
		this.lbPop = 0;
		this.title = null;
	},

	isVisible: function() {
		var popup = window.content.document.getElementById('rikaichan-window');
		return (popup) && (popup.style.display != 'none');
	},

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

	//

	lastFound: null,

	savePrep: function(clip) {
		var me, mk;
		var text;
		var i;
		var f;

		f = this.lastFound;
		if ((!f) || (f.length == 0)) return null;

		if (clip) {
			me = this.cfg.smaxce;
			mk = this.cfg.smaxck;
		}
		else {
			me = this.cfg.smaxfe;
			mk = this.cfg.smaxfk;
		}

		if (!this.fromLB) mk = 1;

		text = '';
		for (i = 0; i < f.length; ++i) {
			if (f[i].kanji) {
				if (mk-- <= 0) break;
			}
			else {
				if (me-- <= 0) continue;
			}
			text += this.dict.makeText(f[i]) + '\n';
		}

		if (this.cfg.snlf == 1) text = text.replace(/\n/g, '\r\n');
			else if (this.cfg.snlf == 2) text = text.replace(/\n/g, '\r');
		if (this.cfg.ssep != '\t') return text.replace(/\t/g, this.cfg.ssep);
		return text;
	},

	copyToClip: function() {
		var text;

		if ((text = this.savePrep(1)) != null) {
			Components.classes['@mozilla.org/widget/clipboardhelper;1']
				.getService(Components.interfaces.nsIClipboardHelper)
				.copyString(text);
			this.showPopup('Copied to clipboard.');
		}
	},

	saveToFile: function() {
		var text;
		var i;
		var lf, fos, os;

		try {
			if ((text = this.savePrep(0)) == null) return;

			if (this.cfg.sfile.length == 0) {
				this.showPopup('Please set the filename in Preferences.');
				return;
			}

			lf = Components.classes['@mozilla.org/file/local;1']
					.createInstance(Components.interfaces.nsILocalFile);

			lf.initWithPath(this.cfg.sfile);

			fos = Components.classes['@mozilla.org/network/file-output-stream;1']
				.createInstance(Components.interfaces.nsIFileOutputStream);
			fos.init(lf, 0x02 | 0x08 | 0x10, 0644, 0);

			os = Components.classes['@mozilla.org/intl/converter-output-stream;1']
					.createInstance(Components.interfaces.nsIConverterOutputStream);
			os.init(fos, this.cfg.sfcs, 0, 0x3F);	// unknown -> '?'
			os.writeString(text);
			os.close();

			fos.close();

			this.showPopup('Saved.');
		}
		catch (ex) {
			this.showPopup('Error while saving: ' + ex);
		}
	},

	configPage: function() {
		window.openDialog('chrome://rikaichan/content/prefs.xul', '', 'chrome,centerscreen');
	},

	//

	shiftDown: 0,
	enterDown: 0,
	cDown: 0,
	sDown: 0,
	aDown: 0,

	onKeyDown: function(ev) { rcxMain._onKeyDown(ev) },
	_onKeyDown: function(ev) {
//		rcd_status("keyCode=" + ev.keyCode + ' charCode=' + ev.charCode + ' detail=' + ev.detail);

		if ((ev.altKey) || (ev.metaKey) || (ev.ctrlKey)) return;

		switch (ev.keyCode) {
		case 16:	// shift
			if (this.shiftDown) return;
			this.shiftDown = 1;
			break;
		case 13:	// enter
			if ((this.enterDown) || (ev.shiftKey) || (!this.isVisible())) return;
			this.enterDown = 1;
			ev.preventDefault();
			break;
		case 27:
			if (this.isVisible()) {
				this.hidePopup();
				ev.preventDefault();
			}
			return;
		case 65:	// a
			if ((!this.aDown) && (this.isVisible())) {
				this.altView = (this.altView + 1) % 3;
				if (this.altView) this.status('Alternate View #' + this.altView);
					else this.status('Normal View');
				this.show(ev.currentTarget.rikaichan);
				ev.preventDefault();
			}
			this.aDown = 1;
			return;
		case 67:	// c
			if ((!this.cDown) && (this.isVisible())) {
				ev.preventDefault();
				this.copyToClip();
			}
			this.cDown = 1;
			return;
		case 83:	// s
			if ((!this.sDown) && (this.isVisible())) {
				ev.preventDefault();
				this.saveToFile();
			}
			this.sDown = 1;
			return;
		default:
			return;
		}

		this.showMode = (this.showMode + 1) % this.dictCount;
		this.show(ev.currentTarget.rikaichan);
	},

	onKeyUp: function(ev) { rcxMain._onKeyUp(ev) },
	_onKeyUp: function(ev) {
		switch (ev.keyCode) {
		case 16:	// shift
			this.shiftDown = 0;
			break;
		case 13:	// enter
			this.enterDown = 0;
			break;
		case 65:	// a
			this.aDown = 0;
			break;
		case 67:	// c
			this.cDown = 0;
			break;
		case 83:	// s
			this.sDown = 0;
			break;
		}
	},


	mouseButtons: 0,

	onMouseDown: function(ev) {
		rcxMain.mouseButtons |= (1 << ev.button);
		if (rcxMain.lbPop) {
			var e = ev.target;
			for (i = 15; (i > 0) && (e != null); --i) {
				if (e.id == 'rikaichan-window') return;
				e = e.parentNode;
			}
		}
		rcxMain.hidePopup();
	},

	onMouseUp: function(ev) {
		rcxMain.mouseButtons &= ~(1 << ev.button);
	},

	unicodeInfo: function(c) {
		const hex = '0123456789ABCDEF';
		const u = c.charCodeAt(0);
		return c + ' U' + hex[(u >>> 12) & 15] + hex[(u >>> 8) & 15] + hex[(u >>> 4) & 15] + hex[u & 15];
	},

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

		u = rp.data.charCodeAt(ro);
		// if we have '   XYZ', where whitespace is compressed, X never seems to get selected
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
		var e = null;
		var m = this.showMode;

		do {
			switch (this.showMode) {
			case 0:
				e = this.dict.wordSearch(text, false);
				break;
			case this.kanjiN:
				e = this.dict.kanjiSearch(text.charAt(0));
				break;
			case this.namesN:
				e = this.dict.wordSearch(text, true);
				break;
			}
			if (e) break;
			this.showMode = (this.showMode + 1) % this.dictCount;
		} while (this.showMode != m);

		if (!e) {
			this.clearHi();
			this.hidePopup();
			return;
		}
		this.lastFound = [e];

		// don't try to highlight form elements
		if ((this.cfg.highlight) && (!('form' in tdata.prevTarget))) {
			var doc = rp.ownerDocument;
			if (!doc) {
				this.clearHi();
				this.hidePopup();
				return;
			}
			var r = doc.createRange();
			r.setStart(rp, ro);
			r.setEnd(rp, ro + (e.matchLen ? e.matchLen : 1));

			var sel = doc.defaultView.getSelection();
			sel.removeAllRanges();
			sel.addRange(r);
			tdata.prevSelView = doc.defaultView;
		}

		this.showPopup(this.dict.makeHtml(e), tdata.prevTarget, tdata.popX, tdata.popY, false);
	},

	showTitle: function(tdata) {
		var e = this.dict.translate(tdata.title);
		if (!e) {
			this.hidePopup();
			return;
		}
		
		e.title = tdata.title.substr(0, e.textLen).replace(/[\x00-\xff]/g, function (c) { return '&#' + c.charCodeAt(0) + ';' } );
		if (tdata.title.length > e.textLen) e.title += '...';

		this.lastFound = [e];
		this.showPopup(this.dict.makeHtml(e), tdata.prevTarget, tdata.popX, tdata.popY, false);
	},

	onMouseMove: function(ev) { rcxMain._onMouseMove(ev); },
	_onMouseMove: function(ev) {
		var tdata = ev.currentTarget.rikaichan;	// per-tab data
		var rp = ev.rangeParent;
		var ro = ev.rangeOffset;

		if (ev.target == tdata.prevTarget) {
			if (tdata.title) return;
			if ((rp == tdata.prevRangeNode) && (ro == tdata.prevRangeOfs)) return;
		}

		if (tdata.timer) {
			clearTimeout(tdata.timer);
			tdata.timer = null;
		}

		if ((ev.explicitOriginalTarget.nodeType != 3) && !('form' in ev.target)) {
			rp = null;
			ro = -1;
		}

		tdata.prevTarget = ev.target;
		tdata.prevRangeNode = rp;
		tdata.prevRangeOfs = ro;
		tdata.title = null;

		if ((this.mouseButtons != 0) || (this.lbPop)) return;

		if ((rp) && (rp.data) && (ro < rp.data.length)) {
			this.showMode = this.shiftDown ? 1 : 0;
			tdata.popX = ev.screenX;
			tdata.popY = ev.screenY;
			tdata.timer = setTimeout(
				function(tdata) {
					rcxMain.show(tdata);
				}, this.cfg.popdelay, tdata);
			return;
		}

		if (this.cfg.title) {
			if ((typeof(ev.target.title) == 'string') && (ev.target.title.length)) {
				tdata.title = ev.target.title;
			}
			else if ((typeof(ev.target.alt) == 'string') && (ev.target.alt.length)) {
				tdata.title = ev.target.alt;
			}
		}
		
		if (tdata.title) {
			tdata.popX = ev.screenX;
			tdata.popY = ev.screenY;
			tdata.timer = setTimeout(
				function(tdata) {
					rcxMain.showTitle(tdata);
				}, this.cfg.popdelay, tdata);
		}
		else {
			// dont close just because we moved from a valid popup slightly over to a place with nothing
			var dx = tdata.popX - ev.screenX;
			var dy = tdata.popY - ev.screenY;
			var distance = Math.sqrt(dx * dx + dy * dy);
			if (distance > 4) {
				this.clearHi();
				this.hidePopup();
			}
			return;
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
		bro.addEventListener('mousemove', this.onMouseMove, false);
		bro.addEventListener('mousedown', this.onMouseDown, false);
		bro.addEventListener('mouseup', this.onMouseUp, false);
		bro.addEventListener('keydown', this.onKeyDown, true);
		bro.addEventListener('keyup', this.onKeyUp, true);

//		changeSelectionColor(true);

		if (time) this.showPopup('Rikaichan enabled. Dictionary loaded in ' + time + ' seconds.', null, 5, 5, true);
			else this.showPopup('Rikaichan enabled.');
	},

	inlineDisable: function(bro) {
		var e;

		bro.removeEventListener('mousemove', this.onMouseMove, false);
		bro.removeEventListener('mousedown', this.onMouseDown, false);
		bro.removeEventListener('mouseup', this.onMouseUp, false);
		bro.removeEventListener('keydown', this.onKeyDown, true);
		bro.removeEventListener('keyup', this.onKeyUp, true);

		e = bro.contentDocument.getElementById('rikaichan-css');
		if (e) e.parentNode.removeChild(e);
		e = bro.contentDocument.getElementById('rikaichan-window');
		if (e) e.parentNode.removeChild(e);

		this.clearHi();
		delete bro.rikaichan;
	},

	inlineToggle: function() {
        var bro = this.getCurrentBrowser();
		if (bro.rikaichan) this.inlineDisable(bro);
			else this.inlineEnable(bro);
		this.onTabSelect();
	},

	getSelected: function(win) {
		var text;
		var s;
		var i;

		s = win.getSelection()
		if (s) {
			text = s.toString();
			if (text.search(/[^\s]/) != -1) return text;
		}
		for (i = 0; i < win.frames.length; ++i) {
			text = this.getSelected(win.frames[i]);
			if (text.length > 0) return text;
		}
		return '';
	},

	clearSelected: function(win) {
		var s;
		var i;

		s = win.getSelection()
		if (s) s.removeAllRanges();
		for (i = 0; i < win.frames.length; ++i) {
			this.clearSelected(win.frames[i]);
		}
	},

	lbHide: function() {
		document.getElementById('rikaichan-lbar').hidden = 1;
		this.hidePopup();
	},

	lbToggle: function() {
		var e;
		var h;
		var text;

		text = this.getSelected(window.content).substr(0, 30);
		this.lbText = this.E('rikaichan-lbar-text');

		e = this.E('rikaichan-lbar');
		if (e.hidden) {
			e.hidden = false;
		}
		else if (!this.lbText.getAttribute("focused")) {
			this.lbText.focus();
		}
		else if ((text.length == 0) || (text == this.lbLast)) {
			this.lbHide();
			return;
		}

		this.lbSearchButton();
	},

	lbKeyPress: function(ev) {
		switch (ev.keyCode) {
		case 13:
			this.lbSearch();
			ev.stopPropagation();
			break;
		case 27:
			if (this.isVisible()) this.hidePopup();
				else this.lbToggle();
			ev.stopPropagation();
			break;
		}
	},

	lbSearchButton: function() {
		var text;

		text = this.getSelected(window.content).substr(0, 30);
		if (text.length) {
			this.lbText.value = text;
			this.clearSelected(window.content);
		}

		this.lbSearch();

		this.lbText.select();
		this.lbText.focus();
	},

	lbSearch: function() {
		var names;
		var max;
		var have;
		var html;
		var kanji;
		var s, t, e, i, c;

		s = this.lbText.value.replace(/^\s+/, '').replace(/\s+$/, '');
		if (!s.length) return;

		names = 0;
		if (this.haveNames) {
			if ((this.lbLast == s) && (this.isVisible())) {
				this.lbLast = '';
				names = 1;
			}
			else this.lbLast = s;
		}

		if ((s.length == 0) || (!this.loadDictionary())) {
			this.hidePopup();
		}
		else {
			html = kanji = '';

			// checkme: is this range ok?
			if ((s.search(/[:*\uFF0A]/) != -1) || (s.search(/^([^\u3000-\uFFFF]+)$/) != -1)) {
				t = s.replace(/;$/, '/')		// ; -> /
					.replace(/\uFF0A/, '*');	// J* -> *
				if ((e = this.dict.bruteSearch(t, names)) == null)
					e = this.dict.bruteSearch(t, !names);
			}
			else {
				if ((e = this.dict.wordSearch(s, names)) == null)
					e = this.dict.wordSearch(s, !names);
			}

			if (e) {
				html = this.dict.makeHtml(e);
				this.lastFound = [e];
			}
			else {
				html = '\u300C ' + s + ' \u300D was not found in the word' + ((this.haveNames) ? ' or name ' : '') + ' dictionary.';
				this.lastFound = [];
			}
			this.lastFound.fromLB = 1;

			max = Math.max(Math.floor((content.innerWidth - 10) / 310) - 1, 1);
			have = {};
			t = s + html;
			for (i = 0; i < t.length; ++i) {
				c = t.charCodeAt(i);
				if ((c >= 0x3000) && (c <= 0xFFFF)) {
					c = t.charAt(i);
					if (!have[c]) {
						e = this.dict.kanjiSearch(c);
						if (e) {
							this.lastFound.push(e);
							have[c] = 1;
							kanji += '<td class="q-k">' + this.dict.makeHtml(e) + '</td>';
							if (--max <= 0) break;
						}
					}
				}
			}

			this.showPopup('<table class="q-tb"><tr><td class="q-w">' + html + '</td>' + kanji + '</tr></table>', null, 1, 1, true, true);
		}
	}
};

///

rcxMain.init();


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
