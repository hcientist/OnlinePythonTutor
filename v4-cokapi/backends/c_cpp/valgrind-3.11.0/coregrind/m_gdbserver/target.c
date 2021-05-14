/* Target operations for the remote server for GDB.
   Copyright (C) 2002, 2004, 2005, 2011
   Free Software Foundation, Inc.

   Contributed by MontaVista Software.

   This file is part of GDB.
   It has been modified to integrate it in valgrind

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
   Foundation, Inc., 51 Franklin Street, Fifth Floor,
   Boston, MA 02110-1301, USA.  */

#include "server.h"
#include "target.h"
#include "regdef.h"
#include "regcache.h"
#include "valgrind_low.h"
#include "gdb/signals.h"
#include "pub_core_aspacemgr.h"
#include "pub_core_machine.h"
#include "pub_core_threadstate.h"
#include "pub_core_transtab.h"
#include "pub_core_gdbserver.h" 
#include "pub_core_debuginfo.h"


/* the_low_target defines the architecture specific aspects depending
   on the cpu */
static struct valgrind_target_ops the_low_target;

static
char *image_ptid(unsigned long ptid)
{
  static char result[50];    // large enough
  VG_(sprintf) (result, "id %lu", ptid);
  return result;
}
#define get_thread(inf) ((struct thread_info *)(inf))
static
void remove_thread_if_not_in_vg_threads (struct inferior_list_entry *inf)
{
  struct thread_info *thread = get_thread (inf);
  if (!VG_(lwpid_to_vgtid)(thread_to_gdb_id(thread))) {
     dlog(1, "removing gdb ptid %s\n", 
          image_ptid(thread_to_gdb_id(thread)));
     remove_thread (thread);
  }
}

/* synchronize threads known by valgrind and threads known by gdbserver */
static
void valgrind_update_threads (int pid)
{
  ThreadId tid;
  ThreadState *ts;
  unsigned long ptid;
  struct thread_info *ti;

  /* call remove_thread for all gdb threads not in valgrind threads */
  for_each_inferior (&all_threads, remove_thread_if_not_in_vg_threads);
  
  /* call add_thread for all valgrind threads not known in gdb all_threads */
  for (tid = 1; tid < VG_N_THREADS; tid++) {

#define LOCAL_THREAD_TRACE " ti* %p vgtid %u status %s as gdb ptid %s lwpid %d\n", \
        ti, tid, VG_(name_of_ThreadStatus) (ts->status), \
        image_ptid (ptid), ts->os_state.lwpid

     if (VG_(is_valid_tid) (tid)) {
        ts = VG_(get_ThreadState) (tid);
        ptid = ts->os_state.lwpid;
        ti = gdb_id_to_thread (ptid);
        if (!ti) {
           /* we do not report the threads which are not yet fully
              initialized otherwise this creates duplicated threads
              in gdb: once with pid xxx lwpid 0, then after that
              with pid xxx lwpid yyy. */
           if (ts->status != VgTs_Init) {
              dlog(1, "adding_thread" LOCAL_THREAD_TRACE);
              add_thread (ptid, ts, ptid);
           }
        } else {
           dlog(2, "(known thread)" LOCAL_THREAD_TRACE);
        }
     }
#undef LOCAL_THREAD_TRACE
  }
}

static
struct reg* build_shadow_arch (struct reg *reg_defs, int n) {
   int i, r;
   static const char *postfix[3] = { "", "s1", "s2" };
   struct reg *new_regs = malloc(3 * n * sizeof(reg_defs[0]));
   int reg_set_len = reg_defs[n-1].offset + reg_defs[n-1].size;

   for (i = 0; i < 3; i++) {
      for (r = 0; r < n; r++) {
         char *regname = malloc(strlen(reg_defs[r].name) 
                                + strlen (postfix[i]) + 1);
         strcpy (regname, reg_defs[r].name);
         strcat (regname, postfix[i]);
         new_regs[i*n + r].name = regname;
         new_regs[i*n + r].offset = i*reg_set_len + reg_defs[r].offset;
         new_regs[i*n + r].size = reg_defs[r].size;
         dlog(1,
              "%-10s Nr %d offset(bit) %d offset(byte) %d  size(bit) %d\n",
              new_regs[i*n + r].name, i*n + r, new_regs[i*n + r].offset,
              (new_regs[i*n + r].offset) / 8, new_regs[i*n + r].size);
      }  
   }

   return new_regs;
}


static CORE_ADDR stopped_data_address = 0;
void VG_(set_watchpoint_stop_address) (Addr addr)
{
   stopped_data_address = addr;
}

int valgrind_stopped_by_watchpoint (void)
{
   return stopped_data_address != 0;
}

CORE_ADDR valgrind_stopped_data_address (void)
{
   return stopped_data_address;
}

/* pc at which we last stopped */
static CORE_ADDR stop_pc;

/* pc at which we resume. 
   If stop_pc != resume_pc, it means
      gdb/gdbserver has changed the pc so as to have either
      a    "continue by jumping at that address"
      or a "continue at that address to call some code from gdb".
*/
static CORE_ADDR resume_pc;

static vki_siginfo_t vki_signal_to_report;
static vki_siginfo_t vki_signal_to_deliver;

void gdbserver_signal_encountered (const vki_siginfo_t *info)
{
   vki_signal_to_report = *info;
   vki_signal_to_deliver = *info;
}

void gdbserver_pending_signal_to_report (vki_siginfo_t *info)
{
   *info = vki_signal_to_report;
}

Bool gdbserver_deliver_signal (vki_siginfo_t *info)
{
   if (info->si_signo != vki_signal_to_deliver.si_signo)
      dlog(1, "GDB changed signal  info %d to_report %d to_deliver %d\n",
           info->si_signo, vki_signal_to_report.si_signo,
           vki_signal_to_deliver.si_signo);
   *info = vki_signal_to_deliver;
   return vki_signal_to_deliver.si_signo != 0;
}

static unsigned char exit_status_to_report;
static int exit_code_to_report;
void gdbserver_process_exit_encountered (unsigned char status, Int code)
{
   vg_assert (status == 'W' || status == 'X');
   exit_status_to_report = status;
   exit_code_to_report = code;
}

static
const HChar* sym (Addr addr)
{
   return VG_(describe_IP) (addr, NULL);
}

ThreadId vgdb_interrupted_tid = 0;

/* 0 => not single stepping.
   1 => single stepping asked by gdb
   2 => single stepping asked by valgrind (watchpoint) */
static int stepping = 0;

Addr valgrind_get_ignore_break_once(void)
{
   if (valgrind_single_stepping())
      return resume_pc;
   else
      return 0;
}

void valgrind_set_single_stepping(Bool set)
{
   if (set)
      stepping = 2;
   else
      stepping = 0;
}

Bool valgrind_single_stepping(void)
{
   if (stepping)
      return True;
   else
      return False;
}

int valgrind_thread_alive (unsigned long tid)
{
  struct thread_info *ti =  gdb_id_to_thread(tid);
  ThreadState *tst;

  if (ti != NULL) {
     tst = (ThreadState *) inferior_target_data (ti);
     return tst->status != VgTs_Zombie;
  }
  else {
    return 0;
  }
}

void valgrind_resume (struct thread_resume *resume_info)
{
   dlog(1,
        "resume_info step %d sig %d stepping %d\n", 
        resume_info->step,
        resume_info->sig,
        stepping);
   if (valgrind_stopped_by_watchpoint()) {
      dlog(1, "clearing watchpoint stopped_data_address %p\n",
           C2v(stopped_data_address));
      VG_(set_watchpoint_stop_address) ((Addr) 0);
   }
   vki_signal_to_deliver.si_signo = resume_info->sig;
   /* signal was reported to GDB, GDB told us to resume execution.
      So, reset the signal to report to 0. */
   VG_(memset) (&vki_signal_to_report, 0, sizeof(vki_signal_to_report));
   
   stepping = resume_info->step;
   resume_pc = (*the_low_target.get_pc) ();
   if (resume_pc != stop_pc) {
      dlog(1,
           "stop_pc %p changed to be resume_pc %s\n",
           C2v(stop_pc), sym(resume_pc));
   }
   regcache_invalidate();
}

unsigned char valgrind_wait (char *ourstatus)
{
   int pid;
   unsigned long wptid;
   ThreadState *tst;
   enum target_signal sig;
   int code;

   pid = VG_(getpid) ();
   dlog(1, "enter valgrind_wait pid %d\n", pid);

   regcache_invalidate();
   valgrind_update_threads(pid);

   /* First see if we are done with this process. */
   if (exit_status_to_report != 0) {
      *ourstatus = exit_status_to_report;
      exit_status_to_report = 0;

      if (*ourstatus == 'W') {
         code = exit_code_to_report;
         exit_code_to_report = 0;
         dlog(1, "exit valgrind_wait status W exit code %d\n", code);
         return code;
      }

      if (*ourstatus == 'X') {
         sig = target_signal_from_host(exit_code_to_report);
         exit_code_to_report = 0;
         dlog(1, "exit valgrind_wait status X signal %u\n", sig);
         return sig;
      }
   }

   /* in valgrind, we consider that a wait always succeeds with STOPPED 'T' 
      and with a signal TRAP (i.e. a breakpoint), unless there is
      a signal to report. */
   *ourstatus = 'T';
   if (vki_signal_to_report.si_signo == 0)
      sig = TARGET_SIGNAL_TRAP;
   else
      sig = target_signal_from_host(vki_signal_to_report.si_signo);
   
   if (vgdb_interrupted_tid != 0)
      tst = VG_(get_ThreadState) (vgdb_interrupted_tid);
   else
      tst = VG_(get_ThreadState) (VG_(running_tid));
   wptid = tst->os_state.lwpid;
   /* we can only change the current_inferior when the wptid references
      an existing thread. Otherwise, we are still in the init phase.
      (hack similar to main thread hack in valgrind_update_threads) */
   if (tst->os_state.lwpid)
      current_inferior = gdb_id_to_thread (wptid);
   stop_pc = (*the_low_target.get_pc) ();
   
   dlog(1,
        "exit valgrind_wait status T ptid %s stop_pc %s signal %u\n", 
        image_ptid (wptid), sym (stop_pc), sig);
   return sig;
}

/* Fetch one register from valgrind VEX guest state.  */
static
void fetch_register (int regno)
{
   int size;
   ThreadState *tst = (ThreadState *) inferior_target_data (current_inferior);
   ThreadId tid = tst->tid;

   if (regno >= the_low_target.num_regs) {
      dlog(0, "error fetch_register regno %d max %d\n",
           regno, the_low_target.num_regs);
      return;
   }
   size = register_size (regno);
   if (size > 0) {
      Bool mod;
      char buf [size];
      VG_(memset) (buf, 0, size); // registers not fetched will be seen as 0.
      (*the_low_target.transfer_register) (tid, regno, buf,
                                           valgrind_to_gdbserver, size, &mod);
      // Note: the *mod received from transfer_register is not interesting.
      // We are interested to see if the register data in the register cache is modified.
      supply_register (regno, buf, &mod);
      if (mod && VG_(debugLog_getLevel)() > 1) {
         char bufimage [2*size + 1];
         heximage (bufimage, buf, size);
         dlog(3, "fetched register %d size %d name %s value %s tid %u status %s\n", 
              regno, size, the_low_target.reg_defs[regno].name, bufimage, 
              tid, VG_(name_of_ThreadStatus) (tst->status));
      }
   }
}

/* Fetch all registers, or just one, from the child process.  */
static
void usr_fetch_inferior_registers (int regno)
{
   if (regno == -1 || regno == 0)
      for (regno = 0; regno < the_low_target.num_regs; regno++)
         fetch_register (regno);
   else
      fetch_register (regno);
}

/* Store our register values back into the inferior.
   If REGNO is -1, do this for all registers.
   Otherwise, REGNO specifies which register (so we can save time).  */
static
void usr_store_inferior_registers (int regno)
{
   int size;
   ThreadState *tst = (ThreadState *) inferior_target_data (current_inferior);
   ThreadId tid = tst->tid;
   
   if (regno >= 0) {

      if (regno >= the_low_target.num_regs) {
         dlog(0, "error store_register regno %d max %d\n",
              regno, the_low_target.num_regs);
         return;
      }
      
      size = register_size (regno);
      if (size > 0) {
         Bool mod;
         Addr old_SP, new_SP;
         char buf[size];

         if (regno == the_low_target.stack_pointer_regno) {
            /* When the stack pointer register is changed such that
               the stack is extended, we better inform the tool of the
               stack increase.  This is needed in particular to avoid
               spurious Memcheck errors during Inferior calls. So, we
               save in old_SP the SP before the change. A change of
               stack pointer is also assumed to have initialised this
               new stack space. For the typical example of an inferior
               call, gdb writes arguments on the stack, and then
               changes the stack pointer. As the stack increase tool
               function might mark it as undefined, we have to call it
               at the good moment. */
            VG_(memset) ((void *) &old_SP, 0, size);
            (*the_low_target.transfer_register) (tid, regno, (void *) &old_SP, 
                                                 valgrind_to_gdbserver, size, &mod);
         }

         VG_(memset) (buf, 0, size);
         collect_register (regno, buf);
         (*the_low_target.transfer_register) (tid, regno, buf, 
                                              gdbserver_to_valgrind, size, &mod);
         if (mod && VG_(debugLog_getLevel)() > 1) {
            char bufimage [2*size + 1];
            heximage (bufimage, buf, size);
            dlog(2, 
                 "stored register %d size %d name %s value %s "
                 "tid %u status %s\n", 
                 regno, size, the_low_target.reg_defs[regno].name, bufimage, 
                 tid, VG_(name_of_ThreadStatus) (tst->status));
         }
         if (regno == the_low_target.stack_pointer_regno) {
            VG_(memcpy) (&new_SP, buf, size);
            if (old_SP > new_SP) {
               Word delta  = (Word)new_SP - (Word)old_SP;
               dlog(1, 
                    "   stack increase by stack pointer changed from %p to %p "
                    "delta %ld\n",
                    (void*) old_SP, (void *) new_SP,
                    delta);
               VG_TRACK( new_mem_stack_w_ECU, new_SP, -delta, 0 );
               VG_TRACK( new_mem_stack,       new_SP, -delta );
               VG_TRACK( post_mem_write, Vg_CoreClientReq, tid,
                         new_SP, -delta);
            }
         }
      }
   }
   else {
      for (regno = 0; regno < the_low_target.num_regs; regno++)
         usr_store_inferior_registers (regno);
   }
}

void valgrind_fetch_registers (int regno)
{
   usr_fetch_inferior_registers (regno);
}

void valgrind_store_registers (int regno)
{
   usr_store_inferior_registers (regno);
}

Bool hostvisibility = False;

int valgrind_read_memory (CORE_ADDR memaddr, unsigned char *myaddr, int len)
{
   const void *sourceaddr = C2v (memaddr);
   dlog(3, "reading memory %p size %d\n", sourceaddr, len);
   if (VG_(am_is_valid_for_client) ((Addr) sourceaddr, 
                                    len, VKI_PROT_READ)
       || (hostvisibility 
           && VG_(am_is_valid_for_valgrind) ((Addr) sourceaddr, 
                                             len, VKI_PROT_READ))) {
      VG_(memcpy) (myaddr, sourceaddr, len);
      return 0;
   } else {
      dlog(1, "error reading memory %p size %d\n", sourceaddr, len);
      return -1;
   }
}

int valgrind_write_memory (CORE_ADDR memaddr, 
                           const unsigned char *myaddr, int len)
{
   Bool is_valid_client_memory;
   void *targetaddr = C2v (memaddr);
   dlog(3, "writing memory %p size %d\n", targetaddr, len);
   is_valid_client_memory 
      = VG_(am_is_valid_for_client) ((Addr)targetaddr, len, VKI_PROT_WRITE);
   if (is_valid_client_memory
       || (hostvisibility 
           && VG_(am_is_valid_for_valgrind) ((Addr) targetaddr, 
                                             len, VKI_PROT_READ))) {
      if (len > 0) {
         VG_(memcpy) (targetaddr, myaddr, len);
         if (is_valid_client_memory && VG_(tdict).track_post_mem_write) {
            /* Inform the tool of the post memwrite.  Note that we do the
               minimum necessary to avoid complains from e.g.
               memcheck. The idea is that the debugger is as least
               intrusive as possible.  So, we do not inform of the pre
               mem write (and in any case, this would cause problems with
               memcheck that does not like our CorePart in
               pre_mem_write. */
            ThreadState *tst = 
               (ThreadState *) inferior_target_data (current_inferior);
            ThreadId tid = tst->tid;
            VG_(tdict).track_post_mem_write( Vg_CoreClientReq, tid,
                                             (Addr) targetaddr, len );
         }
      }
      return 0;
   } else {
      dlog(1, "error writing memory %p size %d\n", targetaddr, len);
      return -1;
   }
}

/* insert or remove a breakpoint */
static
int valgrind_point (Bool insert, char type, CORE_ADDR addr, int len)
{
   PointKind kind;
   switch (type) {
   case '0': /* implemented by inserting checks at each instruction in sb */
      kind = software_breakpoint;
      break;
   case '1': /* hw breakpoint, same implementation as sw breakpoint */
      kind = hardware_breakpoint;
      break;
   case '2':
      kind = write_watchpoint;
      break;
   case '3':
      kind = read_watchpoint;
      break;
   case '4':
      kind = access_watchpoint;
      break;
   default:
      vg_assert (0);
   }

   /* Attention: gdbserver convention differs: 0 means ok; 1 means not ok */
   if (VG_(gdbserver_point) (kind, insert, addr, len))
      return 0;
   else
      return 1; /* error or unsupported */
}

const char* valgrind_target_xml (Bool shadow_mode)
{
   return (*the_low_target.target_xml) (shadow_mode);
}

int valgrind_insert_watchpoint (char type, CORE_ADDR addr, int len)
{
   return valgrind_point (/* insert */ True, type, addr, len);
}

int valgrind_remove_watchpoint (char type, CORE_ADDR addr, int len)
{
   return valgrind_point (/* insert*/ False, type, addr, len);
}

/* Returns the (platform specific) offset of lm_modid field in the link map
   struct.
   Stores the offset in *result and returns True if offset can be determined.
   Returns False otherwise. *result is not to be used then. */
static Bool getplatformoffset (SizeT *result)
{
   static Bool getplatformoffset_called = False;

   static Bool lm_modid_offset_found = False;
   static SizeT lm_modid_offset = 1u << 31; // Rubbish initial value.
   // lm_modid_offset is a magic offset, retrieved using an external program.

   if (!getplatformoffset_called) {
      getplatformoffset_called = True;
      const HChar *platform = VG_PLATFORM;
      const HChar *cmdformat = "%s/%s-%s -o %s";
      const HChar *getoff = "getoff";
      HChar outfile[VG_(mkstemp_fullname_bufsz) (VG_(strlen)(getoff))];
      Int fd = VG_(mkstemp) (getoff, outfile);
      if (fd == -1)
         return False;
      HChar cmd[ VG_(strlen)(cmdformat)
                 + VG_(strlen)(VG_(libdir)) - 2
                 + VG_(strlen)(getoff)      - 2
                 + VG_(strlen)(platform)    - 2
                 + VG_(strlen)(outfile)     - 2
                 + 1];
      UInt cmdlen;
      struct vg_stat stat_buf;
      Int ret;

      cmdlen = VG_(snprintf)(cmd, sizeof(cmd),
                             cmdformat, 
                             VG_(libdir), getoff, platform, outfile);
      vg_assert (cmdlen == sizeof(cmd) - 1);
      ret = VG_(system) (cmd);
      if (ret != 0 || VG_(debugLog_getLevel)() >= 1)
         VG_(dmsg) ("command %s exit code %d\n", cmd, ret);
      ret = VG_(fstat)( fd, &stat_buf );
      if (ret != 0)
         VG_(dmsg) ("error VG_(fstat) %d %s\n", fd, outfile);
      else {
         HChar *w;
         HChar *ssaveptr;
         HChar *os;
         HChar *str;
         HChar *endptr;

         os = malloc (stat_buf.size+1);
         vg_assert (os);
         ret = VG_(read)(fd, os, stat_buf.size);
         vg_assert(ret == stat_buf.size);
         os[ret] = '\0';
         str = os;
         while ((w = VG_(strtok_r)(str, " \n", &ssaveptr)) != NULL) {
            if (VG_(strcmp) (w, "lm_modid_offset") == 0) {
               w = VG_(strtok_r)(NULL, " \n", &ssaveptr);
               lm_modid_offset = (SizeT) VG_(strtoull16) ( w, &endptr );
               if (endptr == w)
                  VG_(dmsg) ("%s lm_modid_offset unexpected hex value %s\n",
                             cmd, w);
               else
                  lm_modid_offset_found = True;
            } else {
               VG_(dmsg) ("%s produced unexpected %s\n", cmd, w);
            }
            str = NULL; // ensure next  VG_(strtok_r) continues the parsing.
         }
         VG_(free) (os);
      }

      VG_(close)(fd);
      ret = VG_(unlink)( outfile );
      if (ret != 0)
         VG_(umsg) ("error: could not unlink %s\n", outfile);
   }

   *result = lm_modid_offset;
   return lm_modid_offset_found;
}

Bool valgrind_get_tls_addr (ThreadState *tst,
                            CORE_ADDR offset,
                            CORE_ADDR lm,
                            CORE_ADDR *tls_addr)
{
   CORE_ADDR **dtv_loc;
   CORE_ADDR *dtv;
   SizeT lm_modid_offset;
   unsigned long int modid;

#define CHECK_DEREF(addr, len, name) \
   if (!VG_(am_is_valid_for_client) ((Addr)(addr), (len), VKI_PROT_READ)) { \
      dlog(0, "get_tls_addr: %s at %p len %lu not addressable\n",       \
           name, (void*)(addr), (unsigned long)(len));                  \
      return False;                                                     \
   }

   *tls_addr = 0;

   if (the_low_target.target_get_dtv == NULL) {
      dlog(1, "low level dtv support not available\n");
      return False;
   }

   if (!getplatformoffset (&lm_modid_offset)) {
      dlog(0, "link_map modid field offset not available\n");
      return False;
   }
   dlog (2, "link_map modid offset %p\n", (void*)lm_modid_offset);
   vg_assert (lm_modid_offset < 0x10000); // let's say
   
   dtv_loc = (*the_low_target.target_get_dtv)(tst);
   if (dtv_loc == NULL) {
      dlog(0, "low level dtv support returned NULL\n");
      return False;
   }

   CHECK_DEREF(dtv_loc, sizeof(CORE_ADDR), "dtv_loc");
   dtv = *dtv_loc;

   // Check we can read at least 2 address at the beginning of dtv.
   CHECK_DEREF(dtv, 2*sizeof(CORE_ADDR), "dtv 2 first entries");
   dlog (2, "tid %u dtv %p\n", tst->tid, (void*)dtv);

   // Check we can read the modid
   CHECK_DEREF(lm+lm_modid_offset, sizeof(unsigned long int), "link_map modid");
   modid = *(unsigned long int *)(lm+lm_modid_offset);

   // Check we can access the dtv entry for modid
   CHECK_DEREF(dtv + 2 * modid, sizeof(CORE_ADDR), "dtv[2*modid]");

   // And finally compute the address of the tls variable.
   *tls_addr = *(dtv + 2 * modid) + offset;
   
   return True;

#undef CHECK_DEREF
}

/* returns a pointer to the architecture state corresponding to
   the provided register set: 0 => normal guest registers,
                              1 => shadow1
                              2 => shadow2
*/
VexGuestArchState* get_arch (int set, ThreadState* tst) 
{
  switch (set) {
  case 0: return &tst->arch.vex;
  case 1: return &tst->arch.vex_shadow1;
  case 2: return &tst->arch.vex_shadow2;
  default: vg_assert(0);
  }
}

static int non_shadow_num_regs = 0;
static struct reg *non_shadow_reg_defs = NULL;
void initialize_shadow_low(Bool shadow_mode)
{
  if (non_shadow_reg_defs == NULL) {
    non_shadow_reg_defs = the_low_target.reg_defs;
    non_shadow_num_regs = the_low_target.num_regs;
  }

  regcache_invalidate();
  if (the_low_target.reg_defs != non_shadow_reg_defs) {
     free (the_low_target.reg_defs);
  }
  if (shadow_mode) {
    the_low_target.num_regs = 3 * non_shadow_num_regs;
    the_low_target.reg_defs = build_shadow_arch (non_shadow_reg_defs, non_shadow_num_regs);
  } else {
    the_low_target.num_regs = non_shadow_num_regs;
    the_low_target.reg_defs = non_shadow_reg_defs;
  }
  set_register_cache (the_low_target.reg_defs, the_low_target.num_regs);
}

void set_desired_inferior (int use_general)
{
  struct thread_info *found;

  if (use_general == 1) {
     found = (struct thread_info *) find_inferior_id (&all_threads,
                                                      general_thread);
  } else {
     found = NULL;

     /* If we are continuing any (all) thread(s), use step_thread
        to decide which thread to step and/or send the specified
        signal to.  */
     if ((step_thread != 0 && step_thread != -1)
         && (cont_thread == 0 || cont_thread == -1))
	found = (struct thread_info *) find_inferior_id (&all_threads,
							 step_thread);

     if (found == NULL)
	found = (struct thread_info *) find_inferior_id (&all_threads,
							 cont_thread);
  }

  if (found == NULL)
     current_inferior = (struct thread_info *) all_threads.head;
  else
     current_inferior = found;
  {
     ThreadState *tst = (ThreadState *) inferior_target_data (current_inferior);
     ThreadId tid = tst->tid;
     dlog(1, "set_desired_inferior use_general %d found %p tid %u lwpid %d\n",
          use_general, found, tid, tst->os_state.lwpid);
  }
}

void* VG_(dmemcpy) ( void *d, const void *s, SizeT sz, Bool *mod )
{
   if (VG_(memcmp) (d, s, sz)) {
      *mod = True;
      return VG_(memcpy) (d, s, sz);
   } else {
      *mod = False;
      return d;
   }
}

void VG_(transfer) (void *valgrind,
                    void *gdbserver,
                    transfer_direction dir,
                    SizeT sz,
                    Bool *mod)
{
   if (dir == valgrind_to_gdbserver)
      VG_(dmemcpy) (gdbserver, valgrind, sz, mod);
   else if (dir == gdbserver_to_valgrind)
      VG_(dmemcpy) (valgrind, gdbserver, sz, mod);
   else
      vg_assert (0);
}

void valgrind_initialize_target(void)
{
#if defined(VGA_x86)
   x86_init_architecture(&the_low_target);
#elif defined(VGA_amd64)
   amd64_init_architecture(&the_low_target);
#elif defined(VGA_arm)
   arm_init_architecture(&the_low_target);
#elif defined(VGA_arm64)
   arm64_init_architecture(&the_low_target);
#elif defined(VGA_ppc32)
   ppc32_init_architecture(&the_low_target);
#elif defined(VGA_ppc64be) || defined(VGA_ppc64le)
   ppc64_init_architecture(&the_low_target);
#elif defined(VGA_s390x)
   s390x_init_architecture(&the_low_target);
#elif defined(VGA_mips32)
   mips32_init_architecture(&the_low_target);
#elif defined(VGA_mips64)
   mips64_init_architecture(&the_low_target);
#elif defined(VGA_tilegx)
   tilegx_init_architecture(&the_low_target);
#else
   #error "architecture missing in target.c valgrind_initialize_target"
#endif
}
