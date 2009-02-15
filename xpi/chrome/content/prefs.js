/*

	Rikaichan
	Copyright (C) 2005-2009 Jonathan Zarate
	http://www.polarcloud.com/

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

var rcxPrefs = {
	funcs: ['toggle', 'lbar'],
	modifiers: ['accel', 'alt', 'shift'],
	keys: ['(disabled)',
		'0','1','2','3','4','5','6','7','8','9','A','B','C','D','E','F','G','H','I','J','K',
		'L','M','N','O','P','Q','R','S','T','U','V','W','X','Y','Z','Back','Escape','Page Up',
		'Page Down','End','Home','Left','Up','Right','Down','Insert','Delete','F1','F2','F3',
		'F4','F5','F6','F7','F8','F9','F10','F11','F12'],
	kindex: ['COMP', 'H','L','E','DK','N','V','Y','P','IN','I','U'],

	E: function(e) {
		return document.getElementById(e);
	},

	checkRange: function(e, name, min, max) {
		var v;

		e = this.E(e);
		v = e.value;
		if ((isNaN(v)) || (v < min) || (v > max)) {
			e.focus();
			alert('Invalid ' + name + ' (' + v + '). Valid range: ' + min + '-' + max);
			return false;
		}
		return true;
	},

	onLoad: function() {
		var pb;
		var i, j;
		var e, v;
		var a, b;

		try {
			if (navigator.userAgent.search(/thunderbird|shredder/i) != -1) {
				this.E('rcp-enmode-hbox').hidden = true;
			}

			pb = Components
					.classes['@mozilla.org/preferences-service;1']
					.getService(Components.interfaces.nsIPrefService)
					.getBranch('rikaichan.');

			for (i = 0; i < this.funcs.length; ++i) {
				a = this.funcs[i];

				v = pb.getCharPref(a + '.mod');
				for (j = 0; j < this.modifiers.length; ++j) {
					b = this.modifiers[j];
					this.E('rcp-' + a + '-' + b).checked = (v.indexOf(b) != -1);
				}

				e = this.E('rcp-' + a + '-list');
				for (j = 0; j < this.keys.length; ++j) {
					v = document.createElementNS('http://www.mozilla.org/keymaster/gatekeeper/there.is.only.xul', 'menuitem');
					v.setAttribute('label', this.keys[j]);
					e.appendChild(v);
				}

				v = pb.getCharPref(a + '.key');
				if (v.length == 0) v = this.keys[0];
				this.E('rcp-' + a + '-key').value = v;
			}

			v = pb.getCharPref('kindex').split(',');
			for (i = 0; i < v.length; ++i) {
				if ((e = this.E('rcp-kindex-' + v[i])) != null) {
					e.checked = true;
				}
			}

			for (i = 0; i < rcxCfgList.length; ++i) {
				b = rcxCfgList[i];
				e = this.E('rcp-' + b[1]);

				switch (b[0]) {
				case 0:
					e.value = pb.getIntPref(b[1]);
					break;
				case 1:
					e.value = pb.getCharPref(b[1]);
					break;
				case 2:
					e.checked = pb.getBoolPref(b[1]);
					break;
				}
			}
		}
		catch (ex) {
			alert('Exception: ' + ex);
		}
	},

	onOK: function() {
		var pb;
		var i, j;
		var a, b, e, v;

		try {

			if (!this.checkRange('rcp-popdelay', 'Popup Delay', 1, 2000)) return false;
			if (!this.checkRange('rcp-wmax', 'Maximum Entries To Display', 3, 100)) return false;
			if (!this.checkRange('rcp-namax', 'Maximum Entries To Display', 3, 200)) return false;

			pb = Components
					.classes['@mozilla.org/preferences-service;1']
					.getService(Components.interfaces.nsIPrefService)
					.getBranch('rikaichan.');

			for (i = 0; i < this.funcs.length; ++i) {
				a = this.funcs[i];

				v = [];
				for (j = 0; j < this.modifiers.length; ++j) {
					b = this.modifiers[j];
					if (this.E('rcp-' + a + '-' + b).checked) v.push(b);
				}
				pb.setCharPref(a + '.mod', v.join(' '));

				pb.setCharPref(a + '.key', this.E('rcp-' + a + '-key').value);

			}

			v = [];
			for (i = 0; i < this.kindex.length; ++i) {
				if (this.E('rcp-kindex-' + this.kindex[i]).checked)
					v.push(this.kindex[i]);
			}
			pb.setCharPref('kindex', v.join(','));

			for (i = 0; i < rcxCfgList.length; ++i) {
				b = rcxCfgList[i];
				e = this.E('rcp-' + b[1]);

				switch (b[0]) {
				case 0:
					pb.setIntPref(b[1], e.value);
					break;
				case 1:
					pb.setCharPref(b[1], e.value);
					break;
				case 2:
					pb.setBoolPref(b[1], e.checked);
					break;
				}
			}

			return true;
		}
		catch (ex) {
			alert('Exception: ' + ex);
		}

		return false;
	},

	onKeyChanged: function(e) {
		var v;

		e.value = v = e.value.replace(/^\s+|\s+$/g, '').replace(/\s+/g, ' ');
		v = ((v.length == 0) || (v == '(disabled)'));
		for (j = 0; j < this.modifiers.length; ++j) {
			document.getElementById(e.id.replace('key', this.modifiers[j])).disabled = v;
		}
	}
};
