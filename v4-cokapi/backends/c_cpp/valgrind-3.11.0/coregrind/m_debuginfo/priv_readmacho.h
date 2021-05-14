
/*--------------------------------------------------------------------*/
/*--- Reading of syms & debug info from Mach-O files.              ---*/
/*---                                             priv_readmacho.h ---*/
/*--------------------------------------------------------------------*/

/*
   This file is part of Valgrind, a dynamic binary instrumentation
   framework.

   Copyright (C) 2006 Apple Inc.
      Greg Parker  gparker@apple.com

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

#ifndef __PRIV_READMACHO_H
#define __PRIV_READMACHO_H

#include "pub_core_basics.h"     // SizeT
#include "pub_core_debuginfo.h"  // DebugInfo

/* Identify a Mach-O object file by peering at the first few bytes of
   it. */
extern Bool ML_(is_macho_object_file)( const void* buf, SizeT size );

/* The central function for reading Mach-O debug info.  For the
   object/exe specified by the DebugInfo, find Mach-O sections, then read
   the symbols, line number info, file name info, CFA (stack-unwind
   info) and anything else we want, into the tables within the
   supplied DebugInfo.
*/
extern Bool ML_(read_macho_debug_info) ( DebugInfo* si );


#endif /* ndef __PRIV_READMACHO_H */

/*--------------------------------------------------------------------*/
/*--- end                                                          ---*/
/*--------------------------------------------------------------------*/
