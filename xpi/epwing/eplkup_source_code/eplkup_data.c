/*------------------------------------------------------------------------
--  Copyright (C) 2011 Christopher Brochtrup
--
--  This file is part of eplkup.
--
--  eplkup is free software: you can redistribute it and/or modify
--  it under the terms of the GNU General Public License as published by
--  the Free Software Foundation, either version 3 of the License, or
--  (at your option) any later version.
--
--  eplkup is distributed in the hope that it will be useful,
--  but WITHOUT ANY WARRANTY; without even the implied warranty of
--  MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
--  GNU General Public License for more details.
--
--  You should have received a copy of the GNU General Public License
--  along with eplkup.  If not, see <http://www.gnu.org/licenses/>.
--
------------------------------------------------------------------------*/

#include "eplkup_data.h"

extern char book_path[MAXLEN_PATH + 1]  = "";
extern char in_path[MAXLEN_PATH + 1]    = "";
extern char out_path[MAXLEN_PATH + 1]   = "";
extern char gaiji_path[MAXLEN_PATH + 1] = "";
extern char subbook_directory[EB_MAX_DIRECTORY_NAME_LENGTH + 1] = "";
extern int show_hit_count               = 0;
extern int subbook_index                = 0;
extern int print_heading                = 1;
extern int print_text                   = 1;
extern int hit_to_output                = -1;
extern int max_hits_to_output           = MAX_HITS;
extern int print_hit_number             = 0;
extern int gaiji_option                 = 0;
