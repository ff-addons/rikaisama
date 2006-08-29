/*

rikaichan
Copyright (C) 2005-2006 Jonathan Zarate
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

*/

var rcxPrefs = {
	funcNames: ["toggle", "lookup", "clip"],
	keyModNames: ["accel", "alt", "shift"],

	onLoad: function() {
		const keyCodes = [
			"(disabled)",
			"0","1","2","3","4","5","6","7","8","9","A","B","C","D","E","F","G","H","I","J","K",
			"L","M","N","O","P","Q","R","S","T","U","V","W","X","Y","Z","BACK","ESCAPE","PAGE_UP",
			"PAGE_DOWN","END","HOME","LEFT","UP","RIGHT","DOWN","INSERT","DELETE","F1","F2","F3",
			"F4","F5","F6","F7","F8","F9","F10","F11","F12","F13","F14","F15","F16","F17","F18",
			"F19","F20","F21","F22","F23","F24"];

		var br = Components.classes["@mozilla.org/preferences-service;1"]
					.getService(Components.interfaces.nsIPrefService)
					.getBranch("rikaichan.");
		var na;
		var i;
		var j;
		var v;
		var e;
		var x;
		
		for (i = 0; i < this.funcNames.length; ++i) {
			na = this.funcNames[i];
			
			v = br.getCharPref(na + ".key");
			if (v == "") v = "(disabled)";
				else v = v.toUpperCase();
			document.getElementById("key-" + na).value = v;
			
			if (v != "(disabled)") 
				v = br.getCharPref(na + ".keymod").toLowerCase();
			for (j = 0; j < this.keyModNames.length; ++j)
				document.getElementById(this.keyModNames[j] + "-" + na).checked = 
					(v.indexOf(this.keyModNames[j]) != -1);
			
			e = document.getElementById("key-" + na + "-mp");
			for (j = 0; j < keyCodes.length; ++j) {
				x = document.createElementNS("http://www.mozilla.org/keymaster/gatekeeper/there.is.only.xul", 
												"menuitem");
				x.setAttribute("label", keyCodes[j]);
				e.appendChild(x);
			}
			
			this.onKeyChanged(document.getElementById("key-" + na));
			
			document.getElementById("showcm-" + na).checked = br.getBoolPref(na + ".showincm");
			document.getElementById("showtm-" + na).checked = br.getBoolPref(na + ".showintm");
		}
		document.getElementById("rc-popdelay").value = br.getIntPref("popdelay");
		document.getElementById("rc-colors").value = br.getCharPref("css");
		document.getElementById("rc-highlight").checked = br.getBoolPref("hion");
		
		x = document.getElementById("rc-delaynames");
		this.haveNames = rcxHaveNames();
		if (this.haveNames) {
			x.checked = br.getBoolPref("delaynames");
			document.getElementById("rc-dictorder").value = br.getIntPref("dictorder");
		}
		else {
			x.hidden = true;
			document.getElementById("rc-dovbox").hidden = true;
		}
	},

	onOK: function() {
		var br = Components.classes["@mozilla.org/preferences-service;1"]
					.getService(Components.interfaces.nsIPrefService)
					.getBranch("rikaichan.");
		var na;
		var s;
		var i;
		var j;
		var v;
		var popDelay;
		
		popDelay = parseInt(document.getElementById("rc-popdelay").value);
		if ((popDelay < 1) || (popDelay > 5000)) {
			alert("Invalid popup delay value");
			return false;
		}

		for (i = 0; i < this.funcNames.length; ++i) {
			na = this.funcNames[i];

			v = document.getElementById("key-" + na).value.replace(/\s+/g, '');
			if (v == "(disabled)") v = "";
			br.setCharPref(na + ".key", v);

			v = "";
			for (j = 0; j < this.keyModNames.length; ++j) {
				if (document.getElementById(this.keyModNames[j] + "-" + na).checked) {
					if (v != "") v += " ";
					v += this.keyModNames[j];
				}
			}
			br.setCharPref(na + ".keymod", v);
			br.setBoolPref(na + ".showincm", document.getElementById("showcm-" + na).checked);
			br.setBoolPref(na + ".showintm", document.getElementById("showtm-" + na).checked);
		}
		
		br.setIntPref("popdelay", popDelay);
		br.setCharPref("css", document.getElementById("rc-colors").value);
		br.setBoolPref("hion", document.getElementById("rc-highlight").checked);
		
		if (this.haveNames) {
			br.setIntPref("dictorder", document.getElementById("rc-dictorder").value);
			br.setBoolPref("delaynames", document.getElementById("rc-delaynames").checked);
		}
		return true;
	},

	onKeyChanged: function(e) {
		var na;
		var v;
		
		na = e.id.replace("key-", "");
		v = e.value.replace(/\s+/g, '');
		v = ((v == "") || (v == "(disabled)"));
		for (j = 0; j < this.keyModNames.length; ++j) {
			document.getElementById(this.keyModNames[j] + "-" + na).disabled = v;
		}
		
	}
};
