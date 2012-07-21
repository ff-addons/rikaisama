/*------------------------------------------------------------------------
--  Copyright (C) 2011-2012 Christopher Brochtrup
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

#ifndef EPLKUP_DATA_H
#define EPLKUP_DATA_H

#include <eb/defs.h>

/* The maximum number of hits to output for a lookup word */
#define MAX_HITS           20

/* The maximum length of a lookup word */
#define MAXLEN_LOOKUP_WORD 127

/* The maximum length of a heading */
#define MAXLEN_HEADING     127

/* The maximum length of a file/path */
#define MAXLEN_PATH        500

/* The maximum length of a single command line argument */
#define MAXLEN_ARG         500

/* The maximum length of a text entry */
#define MAXLEN_TEXT        30000

/* The maximum length of a buffer used for conversion to utf-8 */
#define MAXLEN_CONV        (MAXLEN_TEXT * 2)

/* Gaiji replacement options */
#define GAIJI_OPTION_DEFAULT    0 /* '?'                                        */
#define GAIJI_OPTION_HTML_IMG   1 /* HTML IMG tag (image is embedded as base64) */



/* The path of the book */
extern char book_path[MAXLEN_PATH + 1];

/* The path of input file */
extern char in_path[MAXLEN_PATH + 1];

/* The path of the output file */
extern char out_path[MAXLEN_PATH + 1];

/* The path of the file that contains the gaiji replacement string to use */
extern char gaiji_file[MAXLEN_PATH + 1];

/* The name of the subbook directory (not the full path) */
extern char subbook_directory[EB_MAX_DIRECTORY_NAME_LENGTH + 1];

/* Output the number of hits on the first line? */
extern int show_hit_count;

/* The subbook */
extern int subbook_index;

/* Print the heading?  */
extern int print_heading;

/* Print the text? */
extern int print_text;

/* A particular hit to output */
extern int hit_to_output;

/* How many hits to output */
extern int max_hits_to_output;

/* Print the hit number before printing the actual hit? */
extern int print_hit_number;

/* Gaiji replacement option: GAIJI_OPTION_DEFAULT or GAIJI_OPTION_HTML_IMG */
extern int gaiji_option;

/* Print the title of the subbook? */
extern int print_title;


#endif /* EPLKUP_DATA_H */