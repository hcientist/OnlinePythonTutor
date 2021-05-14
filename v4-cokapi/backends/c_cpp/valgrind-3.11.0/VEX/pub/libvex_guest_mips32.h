
/*---------------------------------------------------------------*/
/*--- begin                             libvex_guest_mips32.h ---*/
/*---------------------------------------------------------------*/

/*
   This file is part of Valgrind, a dynamic binary instrumentation
   framework.

   Copyright (C) 2010-2015 RT-RK
      mips-valgrind@rt-rk.com

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

#ifndef __LIBVEX_PUB_GUEST_MIPS32_H
#define __LIBVEX_PUB_GUEST_MIPS32_H

#include "libvex_basictypes.h"


/*---------------------------------------------------------------*/
/*--- Vex's representation of the MIPS32 CPU state.           ---*/
/*---------------------------------------------------------------*/

typedef
   struct {
      /* CPU Registers */
      /* 0 */ UInt guest_r0;   /* Hardwired to 0 */
      /* 4 */ UInt guest_r1;   /* Assembler temporary */
      /* 8 */ UInt guest_r2;   /* Values for function returns ...*/
      /* 12 */ UInt guest_r3;  /* ...and expression evaluation */
      /* 16 */ UInt guest_r4;  /* Function arguments */
      /* 20 */ UInt guest_r5;
      /* 24 */ UInt guest_r6;
      /* 28 */ UInt guest_r7;
      /* 32 */ UInt guest_r8;  /* Temporaries */
      /* 36 */ UInt guest_r9;
      /* 40 */ UInt guest_r10;
      /* 44 */ UInt guest_r11;
      /* 48 */ UInt guest_r12;
      /* 52 */ UInt guest_r13;
      /* 56 */ UInt guest_r14;
      /* 60 */ UInt guest_r15;
      /* 64 */ UInt guest_r16;  /* Saved temporaries */
      /* 68 */ UInt guest_r17;
      /* 72 */ UInt guest_r18;
      /* 76 */ UInt guest_r19;
      /* 80 */ UInt guest_r20;
      /* 84 */ UInt guest_r21;
      /* 88 */ UInt guest_r22;
      /* 92 */ UInt guest_r23;
      /* 96 */ UInt guest_r24;  /* Temporaries */
      /* 100 */ UInt guest_r25;
      /* 104 */ UInt guest_r26;  /* Reserved for OS kernel */
      /* 108 */ UInt guest_r27;
      /* 112 */ UInt guest_r28;  /* Global pointer */
      /* 116 */ UInt guest_r29;  /* Stack pointer */
      /* 120 */ UInt guest_r30;  /* Frame pointer */
      /* 124 */ UInt guest_r31;  /* Return address */
      /* 128 */ UInt guest_PC;  /* Program counter */
      /* 132 */ UInt guest_HI;  /* Multiply and divide register higher result */
      /* 136 */ UInt guest_LO;  /* Multiply and divide register lower result */

      /* FPU Registers */
      /* 144 */ ULong guest_f0;  /* Floating point general purpose registers */
      /* 152 */ ULong guest_f1;
      /* 160 */ ULong guest_f2;
      /* 168 */ ULong guest_f3;
      /* 176 */ ULong guest_f4;
      /* 184 */ ULong guest_f5;
      /* 192 */ ULong guest_f6;
      /* 200 */ ULong guest_f7;
      /* 208 */ ULong guest_f8;
      /* 216 */ ULong guest_f9;
      /* 224 */ ULong guest_f10;
      /* 232 */ ULong guest_f11;
      /* 240 */ ULong guest_f12;
      /* 248 */ ULong guest_f13;
      /* 256 */ ULong guest_f14;
      /* 264 */ ULong guest_f15;
      /* 272 */ ULong guest_f16;
      /* 280 */ ULong guest_f17;
      /* 288 */ ULong guest_f18;
      /* 296 */ ULong guest_f19;
      /* 304 */ ULong guest_f20;
      /* 312 */ ULong guest_f21;
      /* 320 */ ULong guest_f22;
      /* 328 */ ULong guest_f23;
      /* 336 */ ULong guest_f24;
      /* 344 */ ULong guest_f25;
      /* 352 */ ULong guest_f26;
      /* 360 */ ULong guest_f27;
      /* 368 */ ULong guest_f28;
      /* 376 */ ULong guest_f29;
      /* 384 */ ULong guest_f30;
      /* 392 */ ULong guest_f31;

      /* 400 */ UInt guest_FIR;
      /* 404 */ UInt guest_FCCR;
      /* 408 */ UInt guest_FEXR;
      /* 412 */ UInt guest_FENR;
      /* 416 */ UInt guest_FCSR;

      /* TLS pointer for the thread. It's read-only in user space.
         On Linux it is set in user space by various thread-related
         syscalls.
         User Local Register.
         This register provides read access to the coprocessor 0
         UserLocal register, if it is implemented. In some operating
         environments, the UserLocal register is a pointer to a
         thread-specific storage block.
      */
      /* 420 */ UInt guest_ULR;

      /* Emulation notes */
      /* 424 */ UInt guest_EMNOTE;

      /* For clflush: record start and length of area to invalidate */
      /* 428 */ UInt guest_CMSTART;
      /* 432 */ UInt guest_CMLEN;
      /* 436 */ UInt guest_NRADDR;

      /* 440 */ UInt host_EvC_FAILADDR;
      /* 444 */ UInt host_EvC_COUNTER;
      /* 448 */ UInt guest_COND;

      /* MIPS32 DSP ASE(r2) specific registers. */
      /* 452 */ UInt guest_DSPControl;
      /* 456 */ ULong guest_ac0;
      /* 464 */ ULong guest_ac1;
      /* 472 */ ULong guest_ac2;
      /* 480 */ ULong guest_ac3;

        UInt padding;
} VexGuestMIPS32State;
/*---------------------------------------------------------------*/
/*--- Utility functions for MIPS32 guest stuff.               ---*/
/*---------------------------------------------------------------*/

/* ALL THE FOLLOWING ARE VISIBLE TO LIBRARY CLIENT */

/* Initialise all guest MIPS32 state. */

extern
void LibVEX_GuestMIPS32_initialise ( /*OUT*/VexGuestMIPS32State* vex_state );


#endif /* ndef __LIBVEX_PUB_GUEST_MIPS32_H */


/*---------------------------------------------------------------*/
/*---                                   libvex_guest_mips32.h ---*/
/*---------------------------------------------------------------*/
