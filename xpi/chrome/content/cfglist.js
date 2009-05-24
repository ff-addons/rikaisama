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

// 0 = integer, 1 = string, 2 = checkbox/boolean
var rcxCfgList = [
	// general
	[1, 'css'],
	[0, 'popdelay'],
	[0, 'highlight'],
	[0, 'resizedoc'],
	[0, 'dictorder'],
	[0, 'title'],
	[0, 'ruby'],
	[0, 'enmode'],

	// menus
	[2, 'tmtoggle'],
	[2, 'tmlbar'],
	[2, 'cmtoggle'],
	[2, 'cmlbar'],
	
	// keyboard
	[2, 'nopopkeys'],

	// words
	[0, 'wmax'],
	[0, 'wpos'],
	[0, 'wpop'],

	// names
	[0, 'nadelay'],
	[0, 'namax'],

	// clipboard / save file
	[1, 'sfile'],
	[1, 'sfcs'],
	[0, 'smaxfe'],
	[0, 'smaxfk'],
	[0, 'smaxce'],
	[0, 'smaxck'],
	[0, 'snlf'],
	[1, 'ssep']
];
