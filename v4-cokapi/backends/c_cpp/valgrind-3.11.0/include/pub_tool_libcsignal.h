
/*--------------------------------------------------------------------*/
/*--- Signal-related libc stuff.             pub_tool_libcsignal.h ---*/
/*--------------------------------------------------------------------*/

/*
   This file is part of Valgrind, a dynamic binary instrumentation
   framework.

   Copyright (C) 2000-2015 Julian Seward
      jseward@acm.org

   This program is free software; you can redistribute it and/or
   modify it under the terms of the GNU General Public License as
   published by the Free Software Foundation; either version 2 of the
   License, or (at your option) any later version.

   This program is distributed in the hope that it will be useful, but
   WITHOUT ANY WARRANTY; without even the implied warranty of
   MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the GNU
   General Public License for more details.

   You should have received a copy of the GNU General Public License
   along with this program; if not, write to the Free Software
   Foundation, Inc., 59 Temple Place, Suite 330, Boston, MA
   02111-1307, USA.

   The GNU General Public License is contained in the file COPYING.
*/

#ifndef __PUB_TOOL_LIBCBSIGNAL_H
#define __PUB_TOOL_LIBCBSIGNAL_H

#include "pub_tool_basics.h"   // VG_ macro
#include "pub_tool_vki.h"      // vki_sigset

/* Note that these use the vki_ (kernel) structure
   definitions, which are different in places from those that glibc
   defines.  Since we're operating right at the kernel interface, glibc's view
   of the world is entirely irrelevant. */

/* --- Mess with the kernel's sig state --- */
extern Int VG_(sigprocmask) ( Int how, const vki_sigset_t* set,
                              vki_sigset_t* oldset );

#endif   // __PUB_TOOL_LIBCBSIGNAL_H

/*--------------------------------------------------------------------*/
/*--- end                                                          ---*/
/*--------------------------------------------------------------------*/
