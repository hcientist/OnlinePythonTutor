/* -*- mode: C; c-basic-offset: 3; -*- */

/*--------------------------------------------------------------------*/
/*--- Top level management of symbols and debugging information.   ---*/
/*---                                                  debuginfo.c ---*/
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

#include "pub_core_basics.h"
#include "pub_core_vki.h"
#include "pub_core_threadstate.h"
#include "pub_core_debuginfo.h"  /* self */
#include "pub_core_demangle.h"
#include "pub_core_libcbase.h"
#include "pub_core_libcassert.h"
#include "pub_core_libcprint.h"
#include "pub_core_libcfile.h"
#include "pub_core_libcproc.h"   // VG_(getenv)
#include "pub_core_seqmatch.h"
#include "pub_core_options.h"
#include "pub_core_redir.h"      // VG_(redir_notify_{new,delete}_SegInfo)
#include "pub_core_aspacemgr.h"
#include "pub_core_machine.h"    // VG_PLAT_USES_PPCTOC
#include "pub_core_xarray.h"
#include "pub_core_oset.h"
#include "pub_core_stacktrace.h" // VG_(get_StackTrace) XXX: circular dependency
#include "pub_core_ume.h"

#include "priv_misc.h"           /* dinfo_zalloc/free */
#include "priv_image.h"
#include "priv_d3basics.h"       /* ML_(pp_GX) */
#include "priv_tytypes.h"
#include "priv_storage.h"
#include "priv_readdwarf.h"
#if defined(VGO_linux) || defined(VGO_solaris)
# include "priv_readelf.h"
# include "priv_readdwarf3.h"
# include "priv_readpdb.h"
#elif defined(VGO_darwin)
# include "priv_readmacho.h"
# include "priv_readpdb.h"
#endif


/* Set this to 1 to enable debug printing for the
   should-we-load-debuginfo-now? finite state machine. */
#define DEBUG_FSM 0


#include "pub_tool_libcbase.h"
#include "pub_tool_mallocfree.h"

// pgbovine - super hacky -- INLINED json.h and json.c from here:
// http://git.ozlabs.org/?p=ccan;a=tree;f=ccan/json;hb=HEAD
// http://stackoverflow.com/a/6588482
// BEGIN json.c -- changed slightly to use Valgrind's libc functions

/*
  Copyright (C) 2011 Joseph A. Adams (joeyadams3.14159@gmail.com)
  All rights reserved.

  Permission is hereby granted, free of charge, to any person obtaining a copy
  of this software and associated documentation files (the "Software"), to deal
  in the Software without restriction, including without limitation the rights
  to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
  copies of the Software, and to permit persons to whom the Software is
  furnished to do so, subject to the following conditions:

  The above copyright notice and this permission notice shall be included in
  all copies or substantial portions of the Software.

  THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
  IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
  FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
  AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
  LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
  OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN
  THE SOFTWARE.
*/

#include <stdint.h>

#define out_of_memory() do {                    \
    VG_(printf)("JSON lib: Out of memory.\n");    \
    vg_assert(0);                     \
  } while (0)

/* Sadly, strdup is not portable. */
static char *json_strdup(const char *str)
{
  char *ret = (char*) VG_(malloc)("json_strdup", VG_(strlen)(str) + 1);
  if (ret == NULL)
    out_of_memory();
  VG_(strcpy)(ret, str);
  return ret;
}

/* String buffer */

typedef struct
{
  char *cur;
  char *end;
  char *start;
} SB;

static void sb_init(SB *sb)
{
  sb->start = (char*) VG_(malloc)("sb_init", 17);
  if (sb->start == NULL)
    out_of_memory();
  sb->cur = sb->start;
  sb->end = sb->start + 16;
}

/* sb and need may be evaluated multiple times. */
#define sb_need(sb, need) do {                  \
    if ((sb)->end - (sb)->cur < (need))     \
      sb_grow(sb, need);                  \
  } while (0)

static void sb_grow(SB *sb, int need)
{
  size_t length = sb->cur - sb->start;
  size_t alloc = sb->end - sb->start;
  
  do {
    alloc *= 2;
  } while (alloc < length + need);
  
  sb->start = (char*) VG_(realloc)("sb_grow", sb->start, alloc + 1);
  if (sb->start == NULL)
    out_of_memory();
  sb->cur = sb->start + length;
  sb->end = sb->start + alloc;
}

static void sb_put(SB *sb, const char *bytes, int count)
{
  sb_need(sb, count);
  VG_(memcpy)(sb->cur, bytes, count);
  sb->cur += count;
}

#define sb_putc(sb, c) do {         \
    if ((sb)->cur >= (sb)->end) \
      sb_grow(sb, 1);         \
    *(sb)->cur++ = (c);         \
  } while (0)

static void sb_puts(SB *sb, const char *str)
{
  sb_put(sb, str, VG_(strlen)(str));
}

static char *sb_finish(SB *sb)
{
  *sb->cur = 0;
  vg_assert(sb->start <= sb->cur && VG_(strlen)(sb->start) == (size_t)(sb->cur - sb->start));
  return sb->start;
}

static void sb_free(SB *sb)
{
  VG_(free)(sb->start);
}

/*
 * Unicode helper functions
 *
 * These are taken from the ccan/charset module and customized a bit.
 * Putting them here means the compiler can (choose to) inline them,
 * and it keeps ccan/json from having a dependency.
 */

/*
 * Type for Unicode codepoints.
 * We need our own because wchar_t might be 16 bits.
 */
typedef uint32_t uchar_t;

/*
 * Validate a single UTF-8 character starting at @s.
 * The string must be null-terminated.
 *
 * If it's valid, return its length (1 thru 4).
 * If it's invalid or clipped, return 0.
 *
 * This function implements the syntax given in RFC3629, which is
 * the same as that given in The Unicode Standard, Version 6.0.
 *
 * It has the following properties:
 *
 *  * All codepoints U+0000..U+10FFFF may be encoded,
 *    except for U+D800..U+DFFF, which are reserved
 *    for UTF-16 surrogate pair encoding.
 *  * UTF-8 byte sequences longer than 4 bytes are not permitted,
 *    as they exceed the range of Unicode.
 *  * The sixty-six Unicode "non-characters" are permitted
 *    (namely, U+FDD0..U+FDEF, U+xxFFFE, and U+xxFFFF).
 */
static int utf8_validate_cz(const char *s)
{
  unsigned char c = *s++;
  
  if (c <= 0x7F) {        /* 00..7F */
    return 1;
  } else if (c <= 0xC1) { /* 80..C1 */
    /* Disallow overlong 2-byte sequence. */
    return 0;
  } else if (c <= 0xDF) { /* C2..DF */
    /* Make sure subsequent byte is in the range 0x80..0xBF. */
    if (((unsigned char)*s++ & 0xC0) != 0x80)
      return 0;
    
    return 2;
  } else if (c <= 0xEF) { /* E0..EF */
    /* Disallow overlong 3-byte sequence. */
    if (c == 0xE0 && (unsigned char)*s < 0xA0)
      return 0;
    
    /* Disallow U+D800..U+DFFF. */
    if (c == 0xED && (unsigned char)*s > 0x9F)
      return 0;
    
    /* Make sure subsequent bytes are in the range 0x80..0xBF. */
    if (((unsigned char)*s++ & 0xC0) != 0x80)
      return 0;
    if (((unsigned char)*s++ & 0xC0) != 0x80)
      return 0;
    
    return 3;
  } else if (c <= 0xF4) { /* F0..F4 */
    /* Disallow overlong 4-byte sequence. */
    if (c == 0xF0 && (unsigned char)*s < 0x90)
      return 0;
    
    /* Disallow codepoints beyond U+10FFFF. */
    if (c == 0xF4 && (unsigned char)*s > 0x8F)
      return 0;
    
    /* Make sure subsequent bytes are in the range 0x80..0xBF. */
    if (((unsigned char)*s++ & 0xC0) != 0x80)
      return 0;
    if (((unsigned char)*s++ & 0xC0) != 0x80)
      return 0;
    if (((unsigned char)*s++ & 0xC0) != 0x80)
      return 0;
    
    return 4;
  } else {                /* F5..FF */
    return 0;
  }
}

/* Validate a null-terminated UTF-8 string. */
static bool utf8_validate(const char *s)
{
  int len;
  
  for (; *s != 0; s += len) {
    len = utf8_validate_cz(s);
    if (len == 0)
      return false;
  }
  
  return true;
}

/*
 * Read a single UTF-8 character starting at @s,
 * returning the length, in bytes, of the character read.
 *
 * This function assumes input is valid UTF-8,
 * and that there are enough characters in front of @s.
 */
static int utf8_read_char(const char *s, uchar_t *out)
{
  const unsigned char *c = (const unsigned char*) s;
  
  vg_assert(utf8_validate_cz(s));

  if (c[0] <= 0x7F) {
    /* 00..7F */
    *out = c[0];
    return 1;
  } else if (c[0] <= 0xDF) {
    /* C2..DF (unless input is invalid) */
    *out = ((uchar_t)c[0] & 0x1F) << 6 |
           ((uchar_t)c[1] & 0x3F);
    return 2;
  } else if (c[0] <= 0xEF) {
    /* E0..EF */
    *out = ((uchar_t)c[0] &  0xF) << 12 |
           ((uchar_t)c[1] & 0x3F) << 6  |
           ((uchar_t)c[2] & 0x3F);
    return 3;
  } else {
    /* F0..F4 (unless input is invalid) */
    *out = ((uchar_t)c[0] &  0x7) << 18 |
           ((uchar_t)c[1] & 0x3F) << 12 |
           ((uchar_t)c[2] & 0x3F) << 6  |
           ((uchar_t)c[3] & 0x3F);
    return 4;
  }
}

/*
 * Write a single UTF-8 character to @s,
 * returning the length, in bytes, of the character written.
 *
 * @unicode must be U+0000..U+10FFFF, but not U+D800..U+DFFF.
 *
 * This function will write up to 4 bytes to @out.
 */
static int utf8_write_char(uchar_t unicode, char *out)
{
  unsigned char *o = (unsigned char*) out;
  
  vg_assert(unicode <= 0x10FFFF && !(unicode >= 0xD800 && unicode <= 0xDFFF));

  if (unicode <= 0x7F) {
    /* U+0000..U+007F */
    *o++ = unicode;
    return 1;
  } else if (unicode <= 0x7FF) {
    /* U+0080..U+07FF */
    *o++ = 0xC0 | unicode >> 6;
    *o++ = 0x80 | (unicode & 0x3F);
    return 2;
  } else if (unicode <= 0xFFFF) {
    /* U+0800..U+FFFF */
    *o++ = 0xE0 | unicode >> 12;
    *o++ = 0x80 | (unicode >> 6 & 0x3F);
    *o++ = 0x80 | (unicode & 0x3F);
    return 3;
  } else {
    /* U+10000..U+10FFFF */
    *o++ = 0xF0 | unicode >> 18;
    *o++ = 0x80 | (unicode >> 12 & 0x3F);
    *o++ = 0x80 | (unicode >> 6 & 0x3F);
    *o++ = 0x80 | (unicode & 0x3F);
    return 4;
  }
}

/*
 * Compute the Unicode codepoint of a UTF-16 surrogate pair.
 *
 * @uc should be 0xD800..0xDBFF, and @lc should be 0xDC00..0xDFFF.
 * If they aren't, this function returns false.
 */
static bool from_surrogate_pair(uint16_t uc, uint16_t lc, uchar_t *unicode)
{
  if (uc >= 0xD800 && uc <= 0xDBFF && lc >= 0xDC00 && lc <= 0xDFFF) {
    *unicode = 0x10000 + ((((uchar_t)uc & 0x3FF) << 10) | (lc & 0x3FF));
    return true;
  } else {
    return false;
  }
}

/*
 * Construct a UTF-16 surrogate pair given a Unicode codepoint.
 *
 * @unicode must be U+10000..U+10FFFF.
 */
static void to_surrogate_pair(uchar_t unicode, uint16_t *uc, uint16_t *lc)
{
  uchar_t n;
  
  vg_assert(unicode >= 0x10000 && unicode <= 0x10FFFF);
  
  n = unicode - 0x10000;
  *uc = ((n >> 10) & 0x3FF) | 0xD800;
  *lc = (n & 0x3FF) | 0xDC00;
}

#define is_space(c) ((c) == '\t' || (c) == '\n' || (c) == '\r' || (c) == ' ')
#define is_digit(c) ((c) >= '0' && (c) <= '9')

static bool parse_value     (const char **sp, JsonNode        **out);
static bool parse_string    (const char **sp, char            **out);
static bool parse_number    (const char **sp, double           *out);
static bool parse_array     (const char **sp, JsonNode        **out);
static bool parse_object    (const char **sp, JsonNode        **out);
static bool parse_hex16     (const char **sp, uint16_t         *out);

static bool expect_literal  (const char **sp, const char *str);
static void skip_space      (const char **sp);

static void emit_value              (SB *out, const JsonNode *node);
static void emit_value_indented     (SB *out, const JsonNode *node, const char *space, int indent_level);
static void emit_string             (SB *out, const char *str);
static void emit_number             (SB *out, double num);
static void emit_array              (SB *out, const JsonNode *array);
static void emit_array_indented     (SB *out, const JsonNode *array, const char *space, int indent_level);
static void emit_object             (SB *out, const JsonNode *object);
static void emit_object_indented    (SB *out, const JsonNode *object, const char *space, int indent_level);

static int write_hex16(char *out, uint16_t val);

static JsonNode *mknode(JsonTag tag);
static void append_node(JsonNode *parent, JsonNode *child);
static void prepend_node(JsonNode *parent, JsonNode *child);
static void append_member(JsonNode *object, char *key, JsonNode *value);

/* Assertion-friendly validity checks */
static bool tag_is_valid(unsigned int tag);
static bool number_is_valid(const char *num);

JsonNode *json_decode(const char *json)
{
  const char *s = json;
  JsonNode *ret;
  
  skip_space(&s);
  if (!parse_value(&s, &ret))
    return NULL;
  
  skip_space(&s);
  if (*s != 0) {
    json_delete(ret);
    return NULL;
  }
  
  return ret;
}

char *json_encode(const JsonNode *node)
{
  return json_stringify(node, NULL);
}

char *json_encode_string(const char *str)
{
  SB sb;
  sb_init(&sb);
  
  emit_string(&sb, str);
  
  return sb_finish(&sb);
}

char *json_stringify(const JsonNode *node, const char *space)
{
  SB sb;
  sb_init(&sb);
  
  if (space != NULL)
    emit_value_indented(&sb, node, space, 0);
  else
    emit_value(&sb, node);
  
  return sb_finish(&sb);
}

void json_delete(JsonNode *node)
{
  if (node != NULL) {
    json_remove_from_parent(node);
    
    switch (node->tag) {
      case JSON_STRING:
        VG_(free)(node->string_);
        break;
      case JSON_ARRAY:
      case JSON_OBJECT:
      {
        JsonNode *child, *next;
        for (child = node->children.head; child != NULL; child = next) {
          next = child->next;
          json_delete(child);
        }
        break;
      }
      default:;
    }
    
    VG_(free)(node);
  }
}

bool json_validate(const char *json)
{
  const char *s = json;
  
  skip_space(&s);
  if (!parse_value(&s, NULL))
    return false;
  
  skip_space(&s);
  if (*s != 0)
    return false;
  
  return true;
}

JsonNode *json_find_element(JsonNode *array, int index)
{
  JsonNode *element;
  int i = 0;
  
  if (array == NULL || array->tag != JSON_ARRAY)
    return NULL;
  
  json_foreach(element, array) {
    if (i == index)
      return element;
    i++;
  }
  
  return NULL;
}

JsonNode *json_find_member(JsonNode *object, const char *name)
{
  JsonNode *member;
  
  if (object == NULL || object->tag != JSON_OBJECT)
    return NULL;
  
  json_foreach(member, object)
    if (VG_(strcmp)(member->key, name) == 0)
      return member;
  
  return NULL;
}

JsonNode *json_first_child(const JsonNode *node)
{
  if (node != NULL && (node->tag == JSON_ARRAY || node->tag == JSON_OBJECT))
    return node->children.head;
  return NULL;
}

static JsonNode *mknode(JsonTag tag)
{
  JsonNode *ret = (JsonNode*) VG_(calloc)("mknode", 1, sizeof(JsonNode));
  if (ret == NULL)
    out_of_memory();
  ret->tag = tag;
  return ret;
}

JsonNode *json_mknull(void)
{
  return mknode(JSON_NULL);
}

JsonNode *json_mkbool(bool b)
{
  JsonNode *ret = mknode(JSON_BOOL);
  ret->bool_ = b;
  return ret;
}

static JsonNode *mkstring(char *s)
{
  JsonNode *ret = mknode(JSON_STRING);
  ret->string_ = s;
  return ret;
}

JsonNode *json_mkstring(const char *s)
{
  return mkstring(json_strdup(s));
}

JsonNode *json_mknumber(double n)
{
  JsonNode *node = mknode(JSON_NUMBER);
  node->number_ = n;
  return node;
}

JsonNode *json_mkarray(void)
{
  return mknode(JSON_ARRAY);
}

JsonNode *json_mkobject(void)
{
  return mknode(JSON_OBJECT);
}

static void append_node(JsonNode *parent, JsonNode *child)
{
  child->parent = parent;
  child->prev = parent->children.tail;
  child->next = NULL;
  
  if (parent->children.tail != NULL)
    parent->children.tail->next = child;
  else
    parent->children.head = child;
  parent->children.tail = child;
}

static void prepend_node(JsonNode *parent, JsonNode *child)
{
  child->parent = parent;
  child->prev = NULL;
  child->next = parent->children.head;
  
  if (parent->children.head != NULL)
    parent->children.head->prev = child;
  else
    parent->children.tail = child;
  parent->children.head = child;
}

static void append_member(JsonNode *object, char *key, JsonNode *value)
{
  value->key = key;
  append_node(object, value);
}

void json_append_element(JsonNode *array, JsonNode *element)
{
  vg_assert(array->tag == JSON_ARRAY);
  vg_assert(element->parent == NULL);
  
  append_node(array, element);
}

void json_prepend_element(JsonNode *array, JsonNode *element)
{
  vg_assert(array->tag == JSON_ARRAY);
  vg_assert(element->parent == NULL);
  
  prepend_node(array, element);
}

void json_append_member(JsonNode *object, const char *key, JsonNode *value)
{
  vg_assert(object->tag == JSON_OBJECT);
  vg_assert(value->parent == NULL);
  
  append_member(object, json_strdup(key), value);
}

void json_prepend_member(JsonNode *object, const char *key, JsonNode *value)
{
  vg_assert(object->tag == JSON_OBJECT);
  vg_assert(value->parent == NULL);
  
  value->key = json_strdup(key);
  prepend_node(object, value);
}

void json_remove_from_parent(JsonNode *node)
{
  JsonNode *parent = node->parent;
  
  if (parent != NULL) {
    if (node->prev != NULL)
      node->prev->next = node->next;
    else
      parent->children.head = node->next;
    if (node->next != NULL)
      node->next->prev = node->prev;
    else
      parent->children.tail = node->prev;
    
    VG_(free)(node->key);
    
    node->parent = NULL;
    node->prev = node->next = NULL;
    node->key = NULL;
  }
}

static bool parse_value(const char **sp, JsonNode **out)
{
  const char *s = *sp;
  
  switch (*s) {
    case 'n':
      if (expect_literal(&s, "null")) {
        if (out)
          *out = json_mknull();
        *sp = s;
        return true;
      }
      return false;
    
    case 'f':
      if (expect_literal(&s, "false")) {
        if (out)
          *out = json_mkbool(false);
        *sp = s;
        return true;
      }
      return false;
    
    case 't':
      if (expect_literal(&s, "true")) {
        if (out)
          *out = json_mkbool(true);
        *sp = s;
        return true;
      }
      return false;
    
    case '"': {
      char *str;
      if (parse_string(&s, out ? &str : NULL)) {
        if (out)
          *out = mkstring(str);
        *sp = s;
        return true;
      }
      return false;
    }
    
    case '[':
      if (parse_array(&s, out)) {
        *sp = s;
        return true;
      }
      return false;
    
    case '{':
      if (parse_object(&s, out)) {
        *sp = s;
        return true;
      }
      return false;
    
    default: {
      double num;
      if (parse_number(&s, out ? &num : NULL)) {
        if (out)
          *out = json_mknumber(num);
        *sp = s;
        return true;
      }
      return false;
    }
  }
}

static bool parse_array(const char **sp, JsonNode **out)
{
  const char *s = *sp;
  JsonNode *ret = out ? json_mkarray() : NULL;
  JsonNode *element;
  
  if (*s++ != '[')
    goto failure;
  skip_space(&s);
  
  if (*s == ']') {
    s++;
    goto success;
  }
  
  for (;;) {
    if (!parse_value(&s, out ? &element : NULL))
      goto failure;
    skip_space(&s);
    
    if (out)
      json_append_element(ret, element);
    
    if (*s == ']') {
      s++;
      goto success;
    }
    
    if (*s++ != ',')
      goto failure;
    skip_space(&s);
  }
  
success:
  *sp = s;
  if (out)
    *out = ret;
  return true;

failure:
  json_delete(ret);
  return false;
}

static bool parse_object(const char **sp, JsonNode **out)
{
  const char *s = *sp;
  JsonNode *ret = out ? json_mkobject() : NULL;
  char *key;
  JsonNode *value;
  
  if (*s++ != '{')
    goto failure;
  skip_space(&s);
  
  if (*s == '}') {
    s++;
    goto success;
  }
  
  for (;;) {
    if (!parse_string(&s, out ? &key : NULL))
      goto failure;
    skip_space(&s);
    
    if (*s++ != ':')
      goto failure_free_key;
    skip_space(&s);
    
    if (!parse_value(&s, out ? &value : NULL))
      goto failure_free_key;
    skip_space(&s);
    
    if (out)
      append_member(ret, key, value);
    
    if (*s == '}') {
      s++;
      goto success;
    }
    
    if (*s++ != ',')
      goto failure;
    skip_space(&s);
  }
  
success:
  *sp = s;
  if (out)
    *out = ret;
  return true;

failure_free_key:
  if (out)
    VG_(free)(key);
failure:
  json_delete(ret);
  return false;
}

bool parse_string(const char **sp, char **out)
{
  const char *s = *sp;
  SB sb;
  char throwaway_buffer[4];
    /* enough space for a UTF-8 character */
  char *b;
  
  if (*s++ != '"')
    return false;
  
  if (out) {
    sb_init(&sb);
    sb_need(&sb, 4);
    b = sb.cur;
  } else {
    b = throwaway_buffer;
  }
  
  while (*s != '"') {
    unsigned char c = *s++;
    
    /* Parse next character, and write it to b. */
    if (c == '\\') {
      c = *s++;
      switch (c) {
        case '"':
        case '\\':
        case '/':
          *b++ = c;
          break;
        case 'b':
          *b++ = '\b';
          break;
        case 'f':
          *b++ = '\f';
          break;
        case 'n':
          *b++ = '\n';
          break;
        case 'r':
          *b++ = '\r';
          break;
        case 't':
          *b++ = '\t';
          break;
        case 'u':
        {
          uint16_t uc, lc;
          uchar_t unicode;
          
          if (!parse_hex16(&s, &uc))
            goto failed;
          
          if (uc >= 0xD800 && uc <= 0xDFFF) {
            /* Handle UTF-16 surrogate pair. */
            if (*s++ != '\\' || *s++ != 'u' || !parse_hex16(&s, &lc))
              goto failed; /* Incomplete surrogate pair. */
            if (!from_surrogate_pair(uc, lc, &unicode))
              goto failed; /* Invalid surrogate pair. */
          } else if (uc == 0) {
            /* Disallow "\u0000". */
            goto failed;
          } else {
            unicode = uc;
          }
          
          b += utf8_write_char(unicode, b);
          break;
        }
        default:
          /* Invalid escape */
          goto failed;
      }
    } else if (c <= 0x1F) {
      /* Control characters are not allowed in string literals. */
      goto failed;
    } else {
      /* Validate and echo a UTF-8 character. */
      int len;
      
      s--;
      len = utf8_validate_cz(s);
      if (len == 0)
        goto failed; /* Invalid UTF-8 character. */
      
      while (len--)
        *b++ = *s++;
    }
    
    /*
     * Update sb to know about the new bytes,
     * and set up b to write another character.
     */
    if (out) {
      sb.cur = b;
      sb_need(&sb, 4);
      b = sb.cur;
    } else {
      b = throwaway_buffer;
    }
  }
  s++;
  
  if (out)
    *out = sb_finish(&sb);
  *sp = s;
  return true;

failed:
  if (out)
    sb_free(&sb);
  return false;
}

/*
 * The JSON spec says that a number shall follow this precise pattern
 * (spaces and quotes added for readability):
 *   '-'? (0 | [1-9][0-9]*) ('.' [0-9]+)? ([Ee] [+-]? [0-9]+)?
 *
 * However, some JSON parsers are more liberal.  For instance, PHP accepts
 * '.5' and '1.'.  JSON.parse accepts '+3'.
 *
 * This function takes the strict approach.
 */
bool parse_number(const char **sp, double *out)
{
  const char *s = *sp;

  /* '-'? */
  if (*s == '-')
    s++;

  /* (0 | [1-9][0-9]*) */
  if (*s == '0') {
    s++;
  } else {
    if (!is_digit(*s))
      return false;
    do {
      s++;
    } while (is_digit(*s));
  }

  /* ('.' [0-9]+)? */
  if (*s == '.') {
    s++;
    if (!is_digit(*s))
      return false;
    do {
      s++;
    } while (is_digit(*s));
  }

  /* ([Ee] [+-]? [0-9]+)? */
  if (*s == 'E' || *s == 'e') {
    s++;
    if (*s == '+' || *s == '-')
      s++;
    if (!is_digit(*s))
      return false;
    do {
      s++;
    } while (is_digit(*s));
  }

  if (out)
    *out = VG_(strtod)(*sp, NULL);

  *sp = s;
  return true;
}

static void skip_space(const char **sp)
{
  const char *s = *sp;
  while (is_space(*s))
    s++;
  *sp = s;
}

static void emit_value(SB *out, const JsonNode *node)
{
  vg_assert(tag_is_valid(node->tag));
  switch (node->tag) {
    case JSON_NULL:
      sb_puts(out, "null");
      break;
    case JSON_BOOL:
      sb_puts(out, node->bool_ ? "true" : "false");
      break;
    case JSON_STRING:
      emit_string(out, node->string_);
      break;
    case JSON_NUMBER:
      emit_number(out, node->number_);
      break;
    case JSON_ARRAY:
      emit_array(out, node);
      break;
    case JSON_OBJECT:
      emit_object(out, node);
      break;
    default:
      vg_assert(false);
  }
}

void emit_value_indented(SB *out, const JsonNode *node, const char *space, int indent_level)
{
  vg_assert(tag_is_valid(node->tag));
  switch (node->tag) {
    case JSON_NULL:
      sb_puts(out, "null");
      break;
    case JSON_BOOL:
      sb_puts(out, node->bool_ ? "true" : "false");
      break;
    case JSON_STRING:
      emit_string(out, node->string_);
      break;
    case JSON_NUMBER:
      emit_number(out, node->number_);
      break;
    case JSON_ARRAY:
      emit_array_indented(out, node, space, indent_level);
      break;
    case JSON_OBJECT:
      emit_object_indented(out, node, space, indent_level);
      break;
    default:
      vg_assert(false);
  }
}

static void emit_array(SB *out, const JsonNode *array)
{
  const JsonNode *element;
  
  sb_putc(out, '[');
  json_foreach(element, array) {
    emit_value(out, element);
    if (element->next != NULL)
      sb_putc(out, ',');
  }
  sb_putc(out, ']');
}

static void emit_array_indented(SB *out, const JsonNode *array, const char *space, int indent_level)
{
  const JsonNode *element = array->children.head;
  int i;
  
  if (element == NULL) {
    sb_puts(out, "[]");
    return;
  }
  
  sb_puts(out, "[\n");
  while (element != NULL) {
    for (i = 0; i < indent_level + 1; i++)
      sb_puts(out, space);
    emit_value_indented(out, element, space, indent_level + 1);
    
    element = element->next;
    sb_puts(out, element != NULL ? ",\n" : "\n");
  }
  for (i = 0; i < indent_level; i++)
    sb_puts(out, space);
  sb_putc(out, ']');
}

static void emit_object(SB *out, const JsonNode *object)
{
  const JsonNode *member;
  
  sb_putc(out, '{');
  json_foreach(member, object) {
    emit_string(out, member->key);
    sb_putc(out, ':');
    emit_value(out, member);
    if (member->next != NULL)
      sb_putc(out, ',');
  }
  sb_putc(out, '}');
}

static void emit_object_indented(SB *out, const JsonNode *object, const char *space, int indent_level)
{
  const JsonNode *member = object->children.head;
  int i;
  
  if (member == NULL) {
    sb_puts(out, "{}");
    return;
  }
  
  sb_puts(out, "{\n");
  while (member != NULL) {
    for (i = 0; i < indent_level + 1; i++)
      sb_puts(out, space);
    emit_string(out, member->key);
    sb_puts(out, ": ");
    emit_value_indented(out, member, space, indent_level + 1);
    
    member = member->next;
    sb_puts(out, member != NULL ? ",\n" : "\n");
  }
  for (i = 0; i < indent_level; i++)
    sb_puts(out, space);
  sb_putc(out, '}');
}

void emit_string(SB *out, const char *str)
{
  bool escape_unicode = false;
  const char *s = str;
  char *b;
  
  // modified by pgbovine to remove the original assertion and instead to simply
  // print out an unknown symbol like "???" for non-UTF8-encodable strings:
  //vg_assert(utf8_validate(str));
  if (!utf8_validate(str)) {
    sb_need(out, 14);
    b = out->cur;
    *b++ = '"';
    *b++ = '?';
    *b++ = '?';
    *b++ = '?';
    *b++ = '"';
    out->cur = b;
    return; // exit early!!!
  }
  
  /*
   * 14 bytes is enough space to write up to two
   * \uXXXX escapes and two quotation marks.
   */
  sb_need(out, 14);
  b = out->cur;
  
  *b++ = '"';
  while (*s != 0) {
    unsigned char c = *s++;
    
    /* Encode the next character, and write it to b. */
    switch (c) {
      case '"':
        *b++ = '\\';
        *b++ = '"';
        break;
      case '\\':
        *b++ = '\\';
        *b++ = '\\';
        break;
      case '\b':
        *b++ = '\\';
        *b++ = 'b';
        break;
      case '\f':
        *b++ = '\\';
        *b++ = 'f';
        break;
      case '\n':
        *b++ = '\\';
        *b++ = 'n';
        break;
      case '\r':
        *b++ = '\\';
        *b++ = 'r';
        break;
      case '\t':
        *b++ = '\\';
        *b++ = 't';
        break;
      default: {
        int len;
        
        s--;
        len = utf8_validate_cz(s);
        
        if (len == 0) {
          /*
           * Handle invalid UTF-8 character gracefully in production
           * by writing a replacement character (U+FFFD)
           * and skipping a single byte.
           *
           * This should never happen when assertions are enabled
           * due to the assertion at the beginning of this function.
           */
          vg_assert(false);
          if (escape_unicode) {
            VG_(strcpy)(b, "\\uFFFD");
            b += 6;
          } else {
            *b++ = 0xEF;
            *b++ = 0xBF;
            *b++ = 0xBD;
          }
          s++;
        } else if (c < 0x1F || (c >= 0x80 && escape_unicode)) {
          /* Encode using \u.... */
          uint32_t unicode;
          
          s += utf8_read_char(s, &unicode);
          
          if (unicode <= 0xFFFF) {
            *b++ = '\\';
            *b++ = 'u';
            b += write_hex16(b, unicode);
          } else {
            /* Produce a surrogate pair. */
            uint16_t uc, lc;
            vg_assert(unicode <= 0x10FFFF);
            to_surrogate_pair(unicode, &uc, &lc);
            *b++ = '\\';
            *b++ = 'u';
            b += write_hex16(b, uc);
            *b++ = '\\';
            *b++ = 'u';
            b += write_hex16(b, lc);
          }
        } else {
          /* Write the character directly. */
          while (len--)
            *b++ = *s++;
        }
        
        break;
      }
    }
  
    /*
     * Update *out to know about the new bytes,
     * and set up b to write another encoded character.
     */
    out->cur = b;
    sb_need(out, 14);
    b = out->cur;
  }
  *b++ = '"';
  
  out->cur = b;
}

static void emit_number(SB *out, double num)
{
  /*
   * This isn't exactly how JavaScript renders numbers,
   * but it should produce valid JSON for reasonable numbers
   * preserve precision well enough, and avoid some oddities
   * like 0.3 -> 0.299999999999999988898 .
   */
  char buf[64];
  VG_(sprintf)(buf, "%.16g", num);
  
  if (number_is_valid(buf))
    sb_puts(out, buf);
  else
    sb_puts(out, "null");
}

static bool tag_is_valid(unsigned int tag)
{
  return (/* tag >= JSON_NULL && */ tag <= JSON_OBJECT);
}

static bool number_is_valid(const char *num)
{
  return (parse_number(&num, NULL) && *num == '\0');
}

static bool expect_literal(const char **sp, const char *str)
{
  const char *s = *sp;
  
  while (*str != '\0')
    if (*s++ != *str++)
      return false;
  
  *sp = s;
  return true;
}

/*
 * Parses exactly 4 hex characters (capital or lowercase).
 * Fails if any input chars are not [0-9A-Fa-f].
 */
static bool parse_hex16(const char **sp, uint16_t *out)
{
  const char *s = *sp;
  uint16_t ret = 0;
  uint16_t i;
  uint16_t tmp;
  char c;

  for (i = 0; i < 4; i++) {
    c = *s++;
    if (c >= '0' && c <= '9')
      tmp = c - '0';
    else if (c >= 'A' && c <= 'F')
      tmp = c - 'A' + 10;
    else if (c >= 'a' && c <= 'f')
      tmp = c - 'a' + 10;
    else
      return false;

    ret <<= 4;
    ret += tmp;
  }
  
  if (out)
    *out = ret;
  *sp = s;
  return true;
}

/*
 * Encodes a 16-bit number into hexadecimal,
 * writing exactly 4 hex chars.
 */
static int write_hex16(char *out, uint16_t val)
{
  const char *hex = "0123456789ABCDEF";
  
  *out++ = hex[(val >> 12) & 0xF];
  *out++ = hex[(val >> 8)  & 0xF];
  *out++ = hex[(val >> 4)  & 0xF];
  *out++ = hex[ val        & 0xF];
  
  return 4;
}

bool json_check(const JsonNode *node, char errmsg[256])
{
  #define problem(...) do { \
      if (errmsg != NULL) \
        VG_(snprintf)(errmsg, 256, __VA_ARGS__); \
      return false; \
    } while (0)
  
  if (node->key != NULL && !utf8_validate(node->key))
    problem("key contains invalid UTF-8");
  
  if (!tag_is_valid(node->tag))
    problem("tag is invalid (%u)", node->tag);
  
  if (node->tag == JSON_BOOL) {
    if (node->bool_ != false && node->bool_ != true)
      problem("bool_ is neither false (%d) nor true (%d)", (int)false, (int)true);
  } else if (node->tag == JSON_STRING) {
    if (node->string_ == NULL)
      problem("string_ is NULL");
    if (!utf8_validate(node->string_))
      problem("string_ contains invalid UTF-8");
  } else if (node->tag == JSON_ARRAY || node->tag == JSON_OBJECT) {
    JsonNode *head = node->children.head;
    JsonNode *tail = node->children.tail;
    
    if (head == NULL || tail == NULL) {
      if (head != NULL)
        problem("tail is NULL, but head is not");
      if (tail != NULL)
        problem("head is NULL, but tail is not");
    } else {
      JsonNode *child;
      JsonNode *last = NULL;
      
      if (head->prev != NULL)
        problem("First child's prev pointer is not NULL");
      
      for (child = head; child != NULL; last = child, child = child->next) {
        if (child == node)
          problem("node is its own child");
        if (child->next == child)
          problem("child->next == child (cycle)");
        if (child->next == head)
          problem("child->next == head (cycle)");
        
        if (child->parent != node)
          problem("child does not point back to parent");
        if (child->next != NULL && child->next->prev != child)
          problem("child->next does not point back to child");
        
        if (node->tag == JSON_ARRAY && child->key != NULL)
          problem("Array element's key is not NULL");
        if (node->tag == JSON_OBJECT && child->key == NULL)
          problem("Object member's key is NULL");
        
        if (!json_check(child, errmsg))
          return false;
      }
      
      if (last != tail)
        problem("tail does not match pointer found by starting at head and following next links");
    }
  }
  
  return true;
  
  #undef problem
}

// END json.c


/*------------------------------------------------------------*/
/*--- The _svma / _avma / _image / _bias naming scheme     ---*/
/*------------------------------------------------------------*/

/* JRS 11 Jan 07: I find the different kinds of addresses involved in
   debuginfo reading confusing.  Recently I arrived at some
   terminology which makes it clearer (to me, at least).  There are 3
   kinds of address used in the debuginfo reading process:
 
   stated VMAs - the address where (eg) a .so says a symbol is, that
                 is, what it tells you if you consider the .so in
                 isolation
 
   actual VMAs - the address where (eg) said symbol really wound up
                 after the .so was mapped into memory
 
   image addresses - pointers into the copy of the .so (etc)
                     transiently mmaped aboard whilst we read its info

   Additionally I use the term 'bias' to denote the difference
   between stated and actual VMAs for a given entity.

   This terminology is not used consistently, but a start has been
   made.  readelf.c and the call-frame info reader in readdwarf.c now
   use it.  Specifically, various variables and structure fields have
   been annotated with _avma / _svma / _image / _bias.  In places _img
   is used instead of _image for the sake of brevity.
*/


/*------------------------------------------------------------*/
/*--- fwdses                                               ---*/
/*------------------------------------------------------------*/

static UInt debuginfo_generation = 0;
static void cfsi_m_cache__invalidate ( void );


/*------------------------------------------------------------*/
/*--- Root structure                                       ---*/
/*------------------------------------------------------------*/

/* The root structure for the entire debug info system.  It is a
   linked list of DebugInfos. */
static DebugInfo* debugInfo_list = NULL;


/* Find 'di' in the debugInfo_list and move it one step closer to the
   front of the list, so as to make subsequent searches for it
   cheaper.  When used in a controlled way, makes a major improvement
   in some DebugInfo-search-intensive situations, most notably stack
   unwinding on amd64-linux. */
static void move_DebugInfo_one_step_forward ( DebugInfo* di )
{
   DebugInfo *di0, *di1, *di2;
   if (di == debugInfo_list)
      return; /* already at head of list */
   vg_assert(di != NULL);
   di0 = debugInfo_list;
   di1 = NULL;
   di2 = NULL;
   while (True) {
      if (di0 == NULL || di0 == di) break;
      di2 = di1;
      di1 = di0;
      di0 = di0->next;
   }
   vg_assert(di0 == di);
   if (di0 != NULL && di1 != NULL && di2 != NULL) {
      DebugInfo* tmp;
      /* di0 points to di, di1 to its predecessor, and di2 to di1's
         predecessor.  Swap di0 and di1, that is, move di0 one step
         closer to the start of the list. */
      vg_assert(di2->next == di1);
      vg_assert(di1->next == di0);
      tmp = di0->next;
      di2->next = di0;
      di0->next = di1;
      di1->next = tmp;
   }
   else
   if (di0 != NULL && di1 != NULL && di2 == NULL) {
      /* it's second in the list. */
      vg_assert(debugInfo_list == di1);
      vg_assert(di1->next == di0);
      di1->next = di0->next;
      di0->next = di1;
      debugInfo_list = di0;
   }
}


/*------------------------------------------------------------*/
/*--- Notification (acquire/discard) helpers               ---*/
/*------------------------------------------------------------*/

/* Gives out unique abstract handles for allocated DebugInfos.  See
   comment in priv_storage.h, declaration of struct _DebugInfo, for
   details. */
static ULong handle_counter = 1;

/* Allocate and zero out a new DebugInfo record. */
static 
DebugInfo* alloc_DebugInfo( const HChar* filename )
{
   Bool       traceme;
   DebugInfo* di;

   vg_assert(filename);

   di = ML_(dinfo_zalloc)("di.debuginfo.aDI.1", sizeof(DebugInfo));
   di->handle       = handle_counter++;
   di->fsm.filename = ML_(dinfo_strdup)("di.debuginfo.aDI.2", filename);
   di->fsm.maps     = VG_(newXA)(
                         ML_(dinfo_zalloc), "di.debuginfo.aDI.3",
                         ML_(dinfo_free), sizeof(DebugInfoMapping));

   /* Everything else -- pointers, sizes, arrays -- is zeroed by
      ML_(dinfo_zalloc).  Now set up the debugging-output flags. */
   traceme 
      = VG_(string_match)( VG_(clo_trace_symtab_patt), filename );
   if (traceme) {
      di->trace_symtab = VG_(clo_trace_symtab);
      di->trace_cfi    = VG_(clo_trace_cfi);
      di->ddump_syms   = VG_(clo_debug_dump_syms);
      di->ddump_line   = VG_(clo_debug_dump_line);
      di->ddump_frames = VG_(clo_debug_dump_frames);
   }

   return di;
}


/* Free a DebugInfo, and also all the stuff hanging off it. */
static void free_DebugInfo ( DebugInfo* di )
{
   Word i, j, n;
   TyEnt* ent;
   GExpr* gexpr;

   vg_assert(di != NULL);
   if (di->fsm.maps)     VG_(deleteXA)(di->fsm.maps);
   if (di->fsm.filename) ML_(dinfo_free)(di->fsm.filename);
   if (di->fsm.dbgname)  ML_(dinfo_free)(di->fsm.dbgname);
   if (di->soname)       ML_(dinfo_free)(di->soname);
   if (di->loctab)       ML_(dinfo_free)(di->loctab);
   if (di->loctab_fndn_ix) ML_(dinfo_free)(di->loctab_fndn_ix);
   if (di->inltab)       ML_(dinfo_free)(di->inltab);
   if (di->cfsi_base)    ML_(dinfo_free)(di->cfsi_base);
   if (di->cfsi_m_ix)    ML_(dinfo_free)(di->cfsi_m_ix);
   if (di->cfsi_rd)      ML_(dinfo_free)(di->cfsi_rd);
   if (di->cfsi_m_pool)  VG_(deleteDedupPA)(di->cfsi_m_pool);
   if (di->cfsi_exprs)   VG_(deleteXA)(di->cfsi_exprs);
   if (di->fpo)          ML_(dinfo_free)(di->fpo);

   if (di->symtab) {
      /* We have to visit all the entries so as to free up any
         sec_names arrays that might exist. */
      n = di->symtab_used;
      for (i = 0; i < n; i++) {
         DiSym* sym = &di->symtab[i];
         if (sym->sec_names)
            ML_(dinfo_free)(sym->sec_names);
      }
      /* and finally .. */
      ML_(dinfo_free)(di->symtab);
   }

   if (di->strpool)
      VG_(deleteDedupPA) (di->strpool);
   if (di->fndnpool)
      VG_(deleteDedupPA) (di->fndnpool);

   /* Delete the two admin arrays.  These lists exist primarily so
      that we can visit each object exactly once when we need to
      delete them. */
   if (di->admin_tyents) {
      n = VG_(sizeXA)(di->admin_tyents);
      for (i = 0; i < n; i++) {
         ent = (TyEnt*)VG_(indexXA)(di->admin_tyents, i);
         /* Dump anything hanging off this ent */
         ML_(TyEnt__make_EMPTY)(ent);
      }
      VG_(deleteXA)(di->admin_tyents);
      di->admin_tyents = NULL;
   }

   if (di->admin_gexprs) {
      n = VG_(sizeXA)(di->admin_gexprs);
      for (i = 0; i < n; i++) {
         gexpr = *(GExpr**)VG_(indexXA)(di->admin_gexprs, i);
         ML_(dinfo_free)(gexpr);
      }
      VG_(deleteXA)(di->admin_gexprs);
      di->admin_gexprs = NULL;
   }

   /* Dump the variable info.  This is kinda complex: we must take
      care not to free items which reside in either the admin lists
      (as we have just freed them) or which reside in the DebugInfo's
      string table. */
   if (di->varinfo) {
      for (i = 0; i < VG_(sizeXA)(di->varinfo); i++) {
         OSet* scope = *(OSet**)VG_(indexXA)(di->varinfo, i);
         if (!scope) continue;
         /* iterate over all entries in 'scope' */
         VG_(OSetGen_ResetIter)(scope);
         while (True) {
            DiAddrRange* arange = VG_(OSetGen_Next)(scope);
            if (!arange) break;
            /* for each var in 'arange' */
            vg_assert(arange->vars);
            for (j = 0; j < VG_(sizeXA)( arange->vars ); j++) {
               DiVariable* var = (DiVariable*)VG_(indexXA)(arange->vars,j);
               vg_assert(var);
               /* Nothing to free in var: all the pointer fields refer
                  to stuff either on an admin list, or in
                  .strpool */
            }
            VG_(deleteXA)(arange->vars);
            /* Don't free arange itself, as OSetGen_Destroy does
               that */
         }
         VG_(OSetGen_Destroy)(scope);
      }
      VG_(deleteXA)(di->varinfo);
   }

   ML_(dinfo_free)(di);
}


/* 'si' is a member of debugInfo_list.  Find it, remove it from the
   list, notify m_redir that this has happened, and free all storage
   reachable from it.
*/
static void discard_DebugInfo ( DebugInfo* di )
{
   const HChar* reason = "munmap";

   DebugInfo** prev_next_ptr = &debugInfo_list;
   DebugInfo*  curr          =  debugInfo_list;

   while (curr) {
      if (curr == di) {
         /* Found it;  remove from list and free it. */
         if (curr->have_dinfo
             && (VG_(clo_verbosity) > 1 || VG_(clo_trace_redir)))
            VG_(message)(Vg_DebugMsg, 
                         "Discarding syms at %#lx-%#lx in %s due to %s()\n",
                         di->text_avma, 
                         di->text_avma + di->text_size,
                         curr->fsm.filename ? curr->fsm.filename
                                            : "???",
                         reason);
         vg_assert(*prev_next_ptr == curr);
         *prev_next_ptr = curr->next;
         if (curr->have_dinfo)
            VG_(redir_notify_delete_DebugInfo)( curr );
         free_DebugInfo(curr);
         return;
      }
      prev_next_ptr = &curr->next;
      curr          =  curr->next;
   }

   /* Not found. */
}


/* Repeatedly scan debugInfo_list, looking for DebugInfos with text
   AVMAs intersecting [start,start+length), and call discard_DebugInfo
   to get rid of them.  This modifies the list, hence the multiple
   iterations.  Returns True iff any such DebugInfos were found.
*/
static Bool discard_syms_in_range ( Addr start, SizeT length )
{
   Bool       anyFound = False;
   Bool       found;
   DebugInfo* curr;

   while (True) {
      found = False;

      curr = debugInfo_list;
      while (True) {
         if (curr == NULL)
            break;
         if (curr->text_present
             && curr->text_size > 0
             && (start+length - 1 < curr->text_avma 
                 || curr->text_avma + curr->text_size - 1 < start)) {
            /* no overlap */
	 } else {
	    found = True;
	    break;
	 }
	 curr = curr->next;
      }

      if (!found) break;
      anyFound = True;
      discard_DebugInfo( curr );
   }

   return anyFound;
}


/* Does [s1,+len1) overlap [s2,+len2) ?  Note: does not handle
   wraparound at the end of the address space -- just asserts in that
   case. */
static Bool ranges_overlap (Addr s1, SizeT len1, Addr s2, SizeT len2 )
{
   Addr e1, e2;
   if (len1 == 0 || len2 == 0) 
      return False;
   e1 = s1 + len1 - 1;
   e2 = s2 + len2 - 1;
   /* Assert that we don't have wraparound.  If we do it would imply
      that file sections are getting mapped around the end of the
      address space, which sounds unlikely. */
   vg_assert(s1 <= e1);
   vg_assert(s2 <= e2);
   if (e1 < s2 || e2 < s1) return False;
   return True;
}


/* Do the basic mappings of the two DebugInfos overlap in any way? */
static Bool do_DebugInfos_overlap ( const DebugInfo* di1, const DebugInfo* di2 )
{
   Word i, j;
   vg_assert(di1);
   vg_assert(di2);
   for (i = 0; i < VG_(sizeXA)(di1->fsm.maps); i++) {
      const DebugInfoMapping* map1 = VG_(indexXA)(di1->fsm.maps, i);
      for (j = 0; j < VG_(sizeXA)(di2->fsm.maps); j++) {
         const DebugInfoMapping* map2 = VG_(indexXA)(di2->fsm.maps, j);
         if (ranges_overlap(map1->avma, map1->size, map2->avma, map2->size))
            return True;
      }
   }

   return False;
}


/* Discard all elements of debugInfo_list whose .mark bit is set.
*/
static void discard_marked_DebugInfos ( void )
{
   DebugInfo* curr;

   while (True) {

      curr = debugInfo_list;
      while (True) {
         if (!curr)
            break;
         if (curr->mark)
            break;
	 curr = curr->next;
      }

      if (!curr) break;
      discard_DebugInfo( curr );

   }
}


/* Discard any elements of debugInfo_list which overlap with diRef.
   Clearly diRef must have its mapping information set to something sane. */
static void discard_DebugInfos_which_overlap_with ( DebugInfo* diRef )
{
   DebugInfo* di;
   /* Mark all the DebugInfos in debugInfo_list that need to be
      deleted.  First, clear all the mark bits; then set them if they
      overlap with siRef.  Since siRef itself is in this list we at
      least expect its own mark bit to be set. */
   for (di = debugInfo_list; di; di = di->next) {
      di->mark = do_DebugInfos_overlap( di, diRef );
      if (di == diRef) {
         vg_assert(di->mark);
         di->mark = False;
      }
   }
   discard_marked_DebugInfos();
}


/* Find the existing DebugInfo for |filename| or if not found, create
   one.  In the latter case |filename| is strdup'd into VG_AR_DINFO,
   and the new DebugInfo is added to debugInfo_list. */
static DebugInfo* find_or_create_DebugInfo_for ( const HChar* filename )
{
   DebugInfo* di;
   vg_assert(filename);
   for (di = debugInfo_list; di; di = di->next) {
      vg_assert(di->fsm.filename);
      if (0==VG_(strcmp)(di->fsm.filename, filename))
         break;
   }
   if (!di) {
      di = alloc_DebugInfo(filename);
      vg_assert(di);
      di->next = debugInfo_list;
      debugInfo_list = di;
   }
   return di;
}


/* Debuginfo reading for 'di' has just been successfully completed.
   Check that the invariants stated in
   "Comment_on_IMPORTANT_CFSI_REPRESENTATIONAL_INVARIANTS" in
   priv_storage.h are observed. */
static void check_CFSI_related_invariants ( const DebugInfo* di )
{
   DebugInfo* di2 = NULL;
   Bool has_nonempty_rx = False;
   Bool cfsi_fits = False;
   Word i, j;
   vg_assert(di);
   /* This fn isn't called until after debuginfo for this object has
      been successfully read.  And that shouldn't happen until we have
      both a r-x and rw- mapping for the object.  Hence: */
   vg_assert(di->fsm.have_rx_map);
   vg_assert(di->fsm.have_rw_map);
   for (i = 0; i < VG_(sizeXA)(di->fsm.maps); i++) {
      const DebugInfoMapping* map = VG_(indexXA)(di->fsm.maps, i);
      /* We are interested in r-x mappings only */
      if (!map->rx)
         continue;

      /* degenerate case: r-x section is empty */
      if (map->size == 0)
         continue;
      has_nonempty_rx = True;
        
      /* normal case: r-x section is nonempty */
      /* invariant (0) */
      vg_assert(map->size > 0);

      /* invariant (1) */
      for (di2 = debugInfo_list; di2; di2 = di2->next) {
         if (di2 == di)
            continue;
         for (j = 0; j < VG_(sizeXA)(di2->fsm.maps); j++) {
            const DebugInfoMapping* map2 = VG_(indexXA)(di2->fsm.maps, j);
            if (!map2->rx || map2->size == 0)
               continue;
            vg_assert(!ranges_overlap(map->avma,  map->size,
                                      map2->avma, map2->size));
         }
      }
      di2 = NULL;

      /* invariant (2) */
      if (di->cfsi_rd) {
         vg_assert(di->cfsi_minavma <= di->cfsi_maxavma); /* duh! */
         /* Assume the csfi fits completely into one individual mapping
            for now. This might need to be improved/reworked later. */
         if (di->cfsi_minavma >= map->avma &&
             di->cfsi_maxavma <  map->avma + map->size)
            cfsi_fits = True;
      }
   }

   /* degenerate case: all r-x sections are empty */
   if (!has_nonempty_rx) {
      vg_assert(di->cfsi_rd == NULL);
      return;
   }

   /* invariant (2) - cont. */
   if (di->cfsi_rd)
      vg_assert(cfsi_fits);

   /* invariants (3) and (4) */
   if (di->cfsi_rd) {
      vg_assert(di->cfsi_used > 0);
      vg_assert(di->cfsi_size > 0);
      for (i = 0; i < di->cfsi_used; i++) {
         DiCfSI* cfsi = &di->cfsi_rd[i];
         vg_assert(cfsi->len > 0);
         vg_assert(cfsi->base >= di->cfsi_minavma);
         vg_assert(cfsi->base + cfsi->len - 1 <= di->cfsi_maxavma);
         if (i > 0) {
            DiCfSI* cfsip = &di->cfsi_rd[i-1];
            vg_assert(cfsip->base + cfsip->len <= cfsi->base);
         }
      }
   } else {
      vg_assert(di->cfsi_used == 0);
      vg_assert(di->cfsi_size == 0);
   }
}


/*--------------------------------------------------------------*/
/*---                                                        ---*/
/*--- TOP LEVEL: INITIALISE THE DEBUGINFO SYSTEM             ---*/
/*---                                                        ---*/
/*--------------------------------------------------------------*/

void VG_(di_initialise) ( void )
{
   /* There's actually very little to do here, since everything
      centers around the DebugInfos in debugInfo_list, they are
      created and destroyed on demand, and each one is treated more or
      less independently. */
   vg_assert(debugInfo_list == NULL);

   /* flush the CFI fast query cache. */
   cfsi_m_cache__invalidate();
}


/*--------------------------------------------------------------*/
/*---                                                        ---*/
/*--- TOP LEVEL: NOTIFICATION (ACQUIRE/DISCARD INFO) (LINUX) ---*/
/*---                                                        ---*/
/*--------------------------------------------------------------*/

#if defined(VGO_linux) || defined(VGO_darwin) || defined(VGO_solaris)

/* Helper (indirect) for di_notify_ACHIEVE_ACCEPT_STATE */
static Bool overlaps_DebugInfoMappings ( const DebugInfoMapping* map1,
                                         const DebugInfoMapping* map2 )
{
   vg_assert(map1 && map2 && map1 != map2);
   vg_assert(map1->size != 0 && map2->size != 0);
   if (map1->avma + map1->size <= map2->avma) return False;
   if (map2->avma + map2->size <= map1->avma) return False;
   return True;
}


/* Helper (indirect) for di_notify_ACHIEVE_ACCEPT_STATE */
static void show_DebugInfoMappings 
               ( const DebugInfo* di,
                 /*MOD*/XArray* maps /* XArray<DebugInfoMapping> */ )
{
   Word i, n;
   vg_assert(maps);
   n = VG_(sizeXA)(maps);
   for (i = 0; i < n; i++) {
      const DebugInfoMapping* map = VG_(indexXA)(maps, i);
      TRACE_SYMTAB("  [%ld]    avma 0x%-16lx    size %-8lu    "
                   "foff %-8lld    %s %s %s\n",
                   i, map->avma, map->size, (Long)map->foff,
                   map->rx ? "rx" : "--",
                   map->rw ? "rw" : "--",
                   map->ro ? "ro" : "--");
   }
}


/* Helper for di_notify_ACHIEVE_ACCEPT_STATE.  This removes overlaps
   in |maps|, in a fairly weak way, by truncating overlapping ends.
   This may need to be strengthened in future.  Currently it performs
   a post-fixup check, so as least we can be sure that if this
   function returns (rather than asserts) that |maps| is overlap
   free. */
static void truncate_DebugInfoMapping_overlaps
               ( const DebugInfo* di,
                 /*MOD*/XArray* maps /* XArray<DebugInfoMapping> */ )
{
   TRACE_SYMTAB("Un-de-overlapped _DebugInfoMappings:\n");
   show_DebugInfoMappings(di, maps);
   TRACE_SYMTAB("\n");

   Word i, j, n;
   DebugInfoMapping *map_i, *map_j;

   n = VG_(sizeXA)(maps);
   for (i = 0; i < n; i++) {

      map_i = VG_(indexXA)(maps, i);
      if (map_i->size == 0)
        continue; // Hmm, mutancy.  Shouldn't happen.

      for (j = i+1; j < n; j++) {

         map_j = VG_(indexXA)(maps, j);
         if (map_j->size == 0)
           continue; // Hmm, mutancy.  Shouldn't happen.

         /* map_j was observed later than map_i, since the entries are
            in the XArray in the order in which they were observed.
            If map_j starts inside map_i, trim map_i's end so it does
            not overlap map_j.  This reflects the reality that when
            two mmaped areas overlap, the later mmap silently
            overwrites the earlier mmap's mapping. */
         if (map_j->avma >= map_i->avma
             && map_j->avma < map_i->avma + map_i->size) {
            SizeT map_i_newsize = map_j->avma - map_i->avma;
            vg_assert(map_i_newsize < map_i->size);
            map_i->size = map_i_newsize;
         }

      }
   }

   TRACE_SYMTAB("De-overlapped DebugInfoMappings:\n");
   show_DebugInfoMappings(di, maps);
   TRACE_SYMTAB("\n");
   TRACE_SYMTAB("Checking that there are no remaining overlaps.\n");

   for (i = 0; i < n; i++) {
      map_i = VG_(indexXA)(maps, i);
      if (map_i->size == 0)
        continue;
      for (j = i+1; j < n; j++) {
         map_j = VG_(indexXA)(maps, j);
         if (map_j->size == 0)
           continue;
         Bool overlap
            = overlaps_DebugInfoMappings( map_i, map_j );
         /* If the following assert ever fails, it means the de-overlapping
            scheme above is too weak, and needs improvement. */
         vg_assert(!overlap);
      }
   }

   TRACE_SYMTAB("Check successful.\n");
}


/* The debug info system is driven by notifications that a text
   segment has been mapped in, or unmapped, or when sections change
   permission.  It's all a bit kludgey and basically means watching
   syscalls, trying to second-guess when the system's dynamic linker
   is done with mapping in a new object for execution.  This is all
   tracked using the DebugInfoFSM struct for the object.  Anyway, once
   we finally decide we've got to an accept state, this section then
   will acquire whatever info is available for the corresponding
   object.  This section contains the notification handlers, which
   update the FSM and determine when an accept state has been reached.
*/

/* When the sequence of observations causes a DebugInfoFSM to move
   into the accept state, call here to actually get the debuginfo read
   in.  Returns a ULong whose purpose is described in comments 
   preceding VG_(di_notify_mmap) just below.
*/
static ULong di_notify_ACHIEVE_ACCEPT_STATE ( struct _DebugInfo* di )
{
   ULong di_handle;
   Bool  ok;

   vg_assert(di->fsm.filename);
   TRACE_SYMTAB("\n");
   TRACE_SYMTAB("------ start ELF OBJECT "
                "-------------------------"
                "------------------------------\n");
   TRACE_SYMTAB("------ name = %s\n", di->fsm.filename);
   TRACE_SYMTAB("\n");

   /* We're going to read symbols and debug info for the avma
      ranges specified in the _DebugInfoFsm mapping array. First
      get rid of any other DebugInfos which overlap any of those
      ranges (to avoid total confusion). */
   discard_DebugInfos_which_overlap_with( di );

   /* The DebugInfoMappings that now exist in the FSM may involve
      overlaps.  This confuses ML_(read_elf_debug_info), and may cause
      it to compute wrong biases.  So de-overlap them now.
      See http://bugzilla.mozilla.org/show_bug.cgi?id=788974 */
   truncate_DebugInfoMapping_overlaps( di, di->fsm.maps );

   /* And acquire new info. */
#  if defined(VGO_linux) || defined(VGO_solaris)
   ok = ML_(read_elf_debug_info)( di );
#  elif defined(VGO_darwin)
   ok = ML_(read_macho_debug_info)( di );
#  else
#    error "unknown OS"
#  endif

   if (ok) {

      TRACE_SYMTAB("\n------ Canonicalising the "
                   "acquired info ------\n");
      /* invalidate the CFI unwind cache. */
      cfsi_m_cache__invalidate();
      /* prepare read data for use */
      ML_(canonicaliseTables)( di );
      /* Check invariants listed in
         Comment_on_IMPORTANT_REPRESENTATIONAL_INVARIANTS in
         priv_storage.h. */
      check_CFSI_related_invariants(di);
      ML_(finish_CFSI_arrays)(di);
      /* notify m_redir about it */
      TRACE_SYMTAB("\n------ Notifying m_redir ------\n");
      VG_(redir_notify_new_DebugInfo)( di );
      /* Note that we succeeded */
      di->have_dinfo = True;
      vg_assert(di->handle > 0);
      di_handle = di->handle;

   } else {
      TRACE_SYMTAB("\n------ ELF reading failed ------\n");
      /* Something went wrong (eg. bad ELF file).  Should we delete
         this DebugInfo?  No - it contains info on the rw/rx
         mappings, at least. */
      di_handle = 0;
      vg_assert(di->have_dinfo == False);
   }

   TRACE_SYMTAB("\n");
   TRACE_SYMTAB("------ name = %s\n", di->fsm.filename);
   TRACE_SYMTAB("------ end ELF OBJECT "
                "-------------------------"
                "------------------------------\n");
   TRACE_SYMTAB("\n");

   return di_handle;
}


/* Notify the debuginfo system about a new mapping.  This is the way
   new debug information gets loaded.  If allow_SkFileV is True, it
   will try load debug info if the mapping at 'a' belongs to Valgrind;
   whereas normally (False) it will not do that.  This allows us to
   carefully control when the thing will read symbols from the
   Valgrind executable itself.

   If use_fd is not -1, that is used instead of the filename; this
   avoids perturbing fcntl locks, which are released by simply
   re-opening and closing the same file (even via different fd!).

   If a call to VG_(di_notify_mmap) causes debug info to be read, then
   the returned ULong is an abstract handle which can later be used to
   refer to the debuginfo read as a result of this specific mapping,
   in later queries to m_debuginfo.  In this case the handle value
   will be one or above.  If the returned value is zero, no debug info
   was read. */

ULong VG_(di_notify_mmap)( Addr a, Bool allow_SkFileV, Int use_fd )
{
   NSegment const * seg;
   const HChar* filename;
   Bool       is_rx_map, is_rw_map, is_ro_map;
   DebugInfo* di;
   Int        actual_fd, oflags;
   SysRes     preadres;
   HChar      buf1k[1024];
   Bool       debug = (DEBUG_FSM != 0);
   SysRes     statres;
   struct vg_stat statbuf;

   vg_assert(use_fd >= -1);

   /* In short, figure out if this mapping is of interest to us, and
      if so, try to guess what ld.so is doing and when/if we should
      read debug info. */
   seg = VG_(am_find_nsegment)(a);
   vg_assert(seg);

   if (debug) {
      VG_(printf)("di_notify_mmap-0:\n");
      VG_(printf)("di_notify_mmap-1: %#lx-%#lx %c%c%c\n",
                  seg->start, seg->end, 
                  seg->hasR ? 'r' : '-',
                  seg->hasW ? 'w' : '-',seg->hasX ? 'x' : '-' );
   }

   /* guaranteed by aspacemgr-linux.c, sane_NSegment() */
   vg_assert(seg->end > seg->start);

   /* Ignore non-file mappings */
   if ( ! (seg->kind == SkFileC
           || (seg->kind == SkFileV && allow_SkFileV)) )
      return 0;

   /* If the file doesn't have a name, we're hosed.  Give up. */
   filename = VG_(am_get_filename)( seg );
   if (!filename)
      return 0;

   /*
    * Cannot read from these magic files:
    * --20208-- WARNING: Serious error when reading debug info
    * --20208-- When reading debug info from /proc/xen/privcmd:
    * --20208-- can't read file to inspect ELF header
    */
   if (VG_(strncmp)(filename, "/proc/xen/", 10) == 0)
      return 0;

   if (debug)
      VG_(printf)("di_notify_mmap-2: %s\n", filename);

   /* Only try to read debug information from regular files.  */
   statres = VG_(stat)(filename, &statbuf);

   /* stat dereferences symlinks, so we don't expect it to succeed and
      yet produce something that is a symlink. */
   vg_assert(sr_isError(statres) || ! VKI_S_ISLNK(statbuf.mode));

   /* Don't let the stat call fail silently.  Filter out some known
      sources of noise before complaining, though. */
   if (sr_isError(statres)) {
      DebugInfo fake_di;
      Bool quiet = VG_(strstr)(filename, "/var/run/nscd/") != NULL;
      if (!quiet && VG_(clo_verbosity) > 1) {
         VG_(memset)(&fake_di, 0, sizeof(fake_di));
         fake_di.fsm.filename = ML_(dinfo_strdup)("di.debuginfo.nmm", filename);
         ML_(symerr)(&fake_di, True, "failed to stat64/stat this file");
      }
      return 0;
   }

   /* Finally, the point of all this stattery: if it's not a regular file,
      don't try to read debug info from it. */
   if (! VKI_S_ISREG(statbuf.mode))
      return 0;

   /* no uses of statbuf below here. */

   /* Now we have to guess if this is a text-like mapping, a data-like
      mapping, neither or both.  The rules are:

        text if:   x86-linux    r and x
                   other-linux  r and x and not w

        data if:   x86-linux    r and w
                   other-linux  r and w and not x

      Background: On x86-linux, objects are typically mapped twice:

      1b8fb000-1b8ff000 r-xp 00000000 08:02 4471477 vgpreload_memcheck.so
      1b8ff000-1b900000 rw-p 00004000 08:02 4471477 vgpreload_memcheck.so

      whereas ppc32-linux mysteriously does this:

      118a6000-118ad000 r-xp 00000000 08:05 14209428 vgpreload_memcheck.so
      118ad000-118b6000 ---p 00007000 08:05 14209428 vgpreload_memcheck.so
      118b6000-118bd000 rwxp 00000000 08:05 14209428 vgpreload_memcheck.so

      The third mapping should not be considered to have executable
      code in.  Therefore a test which works for both is: r and x and
      NOT w.  Reading symbols from the rwx segment -- which overlaps
      the r-x segment in the file -- causes the redirection mechanism
      to redirect to addresses in that third segment, which is wrong
      and causes crashes.

      JRS 28 Dec 05: unfortunately icc 8.1 on x86 has been seen to
      produce executables with a single rwx segment rather than a
      (r-x,rw-) pair. That means the rules have to be modified thusly:

      x86-linux:   consider if r and x
      all others:  consider if r and x and not w

      2009 Aug 16: apply similar kludge to ppc32-linux.
      See http://bugs.kde.org/show_bug.cgi?id=190820

      There are two modes on s390x: with and without the noexec kernel
      parameter. Together with some older kernels, this leads to several
      variants:
      executable: r and x
      data:       r and w and x
      or
      executable: r and x
      data:       r and w
   */
   is_rx_map = False;
   is_rw_map = False;
   is_ro_map = False;

#  if defined(VGA_x86) || defined(VGA_ppc32) || defined(VGA_mips32) \
      || defined(VGA_mips64)
   is_rx_map = seg->hasR && seg->hasX;
   is_rw_map = seg->hasR && seg->hasW;
#  elif defined(VGA_amd64) || defined(VGA_ppc64be) || defined(VGA_ppc64le)  \
        || defined(VGA_arm) || defined(VGA_arm64)
   is_rx_map = seg->hasR && seg->hasX && !seg->hasW;
   is_rw_map = seg->hasR && seg->hasW && !seg->hasX;
#  elif defined(VGP_s390x_linux)
   is_rx_map = seg->hasR && seg->hasX && !seg->hasW;
   is_rw_map = seg->hasR && seg->hasW;
#  elif defined(VGA_tilegx)
   is_rx_map = seg->hasR && seg->hasX; // && !seg->hasW;
   is_rw_map = seg->hasR && seg->hasW; // && !seg->hasX;
#  else
#    error "Unknown platform"
#  endif

#  if defined(VGP_x86_darwin) && DARWIN_VERS >= DARWIN_10_7
   is_ro_map = seg->hasR && !seg->hasW && !seg->hasX;
#  endif

#  if defined(VGO_solaris)
   is_rx_map = seg->hasR && seg->hasX && !seg->hasW;
   is_rw_map = seg->hasR && seg->hasW;
#  endif

   if (debug)
      VG_(printf)("di_notify_mmap-3: "
                  "is_rx_map %d, is_rw_map %d, is_ro_map %d\n",
                  (Int)is_rx_map, (Int)is_rw_map, (Int)is_ro_map);

   /* Ignore mappings with permissions we can't possibly be interested in. */
   if (!(is_rx_map || is_rw_map || is_ro_map))
      return 0;

   /* Peer at the first few bytes of the file, to see if it is an ELF */
   /* object file. Ignore the file if we do not have read permission. */
   VG_(memset)(buf1k, 0, sizeof(buf1k));
   oflags = VKI_O_RDONLY;
#  if defined(VKI_O_LARGEFILE)
   oflags |= VKI_O_LARGEFILE;
#  endif

   if (use_fd == -1) {
      SysRes fd = VG_(open)( filename, oflags, 0 );
      if (sr_isError(fd)) {
         if (sr_Err(fd) != VKI_EACCES) {
            DebugInfo fake_di;
            VG_(memset)(&fake_di, 0, sizeof(fake_di));
            fake_di.fsm.filename = ML_(dinfo_strdup)("di.debuginfo.nmm",
                                                     filename);
            ML_(symerr)(&fake_di, True,
                        "can't open file to inspect ELF header");
         }
         return 0;
      }
      actual_fd = sr_Res(fd);
   } else {
      actual_fd = use_fd;
   }

   preadres = VG_(pread)( actual_fd, buf1k, sizeof(buf1k), 0 );
   if (use_fd == -1) {
      VG_(close)( actual_fd );
   }

   if (sr_isError(preadres)) {
      DebugInfo fake_di;
      VG_(memset)(&fake_di, 0, sizeof(fake_di));
      fake_di.fsm.filename = ML_(dinfo_strdup)("di.debuginfo.nmm", filename);
      ML_(symerr)(&fake_di, True, "can't read file to inspect ELF header");
      return 0;
   }
   if (sr_Res(preadres) == 0)
      return 0;
   vg_assert(sr_Res(preadres) > 0 && sr_Res(preadres) <= sizeof(buf1k) );

   /* We're only interested in mappings of object files. */
#  if defined(VGO_linux) || defined(VGO_solaris)
   if (!ML_(is_elf_object_file)( buf1k, (SizeT)sr_Res(preadres), False ))
      return 0;
#  elif defined(VGO_darwin)
   if (!ML_(is_macho_object_file)( buf1k, (SizeT)sr_Res(preadres) ))
      return 0;
#  else
#    error "unknown OS"
#  endif

   /* See if we have a DebugInfo for this filename.  If not,
      create one. */
   di = find_or_create_DebugInfo_for( filename );
   vg_assert(di);

   if (debug)
      VG_(printf)("di_notify_mmap-4: "
                  "noting details in DebugInfo* at %p\n", di);

   /* Note the details about the mapping. */
   DebugInfoMapping map;
   map.avma = seg->start;
   map.size = seg->end + 1 - seg->start;
   map.foff = seg->offset;
   map.rx   = is_rx_map;
   map.rw   = is_rw_map;
   map.ro   = is_ro_map;
   VG_(addToXA)(di->fsm.maps, &map);

   /* Update flags about what kind of mappings we've already seen. */
   di->fsm.have_rx_map |= is_rx_map;
   di->fsm.have_rw_map |= is_rw_map;
   di->fsm.have_ro_map |= is_ro_map;

   /* So, finally, are we in an accept state? */
   if (di->fsm.have_rx_map && di->fsm.have_rw_map && !di->have_dinfo) {
      /* Ok, so, finally, we found what we need, and we haven't
         already read debuginfo for this object.  So let's do so now.
         Yee-ha! */
      if (debug)
         VG_(printf)("di_notify_mmap-5: "
                     "achieved accept state for %s\n", filename);
      return di_notify_ACHIEVE_ACCEPT_STATE ( di );
   } else {
      /* If we don't have an rx and rw mapping, or if we already have
         debuginfo for this mapping for whatever reason, go no
         further. */
      return 0;
   }
}


/* Unmap is simpler - throw away any SegInfos intersecting 
   [a, a+len).  */
void VG_(di_notify_munmap)( Addr a, SizeT len )
{
   Bool anyFound;
   if (0) VG_(printf)("DISCARD %#lx %#lx\n", a, a+len);
   anyFound = discard_syms_in_range(a, len);
   if (anyFound)
      cfsi_m_cache__invalidate();
}


/* Uh, this doesn't do anything at all.  IIRC glibc (or ld.so, I don't
   remember) does a bunch of mprotects on itself, and if we follow
   through here, it causes the debug info for that object to get
   discarded. */
void VG_(di_notify_mprotect)( Addr a, SizeT len, UInt prot )
{
   Bool exe_ok = toBool(prot & VKI_PROT_EXEC);
#  if defined(VGA_x86)
   exe_ok = exe_ok || toBool(prot & VKI_PROT_READ);
#  endif
   if (0 && !exe_ok) {
      Bool anyFound = discard_syms_in_range(a, len);
      if (anyFound)
         cfsi_m_cache__invalidate();
   }
}


/* This is a MacOSX >= 10.7 32-bit only special.  See comments on the
   declaration of struct _DebugInfoFSM for details. */
void VG_(di_notify_vm_protect)( Addr a, SizeT len, UInt prot )
{
   Bool debug = (DEBUG_FSM != 0);

   Bool r_ok = toBool(prot & VKI_PROT_READ);
   Bool w_ok = toBool(prot & VKI_PROT_WRITE);
   Bool x_ok = toBool(prot & VKI_PROT_EXEC);
   if (debug) {
      VG_(printf)("di_notify_vm_protect-0:\n");
      VG_(printf)("di_notify_vm_protect-1: %#lx-%#lx %c%c%c\n",
                  a, a + len - 1,
                  r_ok ? 'r' : '-', w_ok ? 'w' : '-', x_ok ? 'x' : '-' );
   }

   Bool do_nothing = True;
#  if defined(VGP_x86_darwin) && (DARWIN_VERS >= DARWIN_10_7)
   do_nothing = False;
#  endif
   if (do_nothing /* wrong platform */) {
      if (debug)
         VG_(printf)("di_notify_vm_protect-2: wrong platform, "
                     "doing nothing.\n");
      return;
   }

   if (! (r_ok && !w_ok && x_ok))
      return; /* not an upgrade to r-x */

   /* Find a DebugInfo containing a FSM that has [a, +len) previously
      observed as a r-- mapping, plus some other rw- mapping.  If such
      is found, conclude we're in an accept state and read debuginfo
      accordingly. */
   if (debug)
      VG_(printf)("di_notify_vm_protect-3: looking for existing DebugInfo*\n");
   DebugInfo* di;
   DebugInfoMapping *map = NULL;
   Word i;
   for (di = debugInfo_list; di; di = di->next) {
      vg_assert(di->fsm.filename);
      if (di->have_dinfo)
         continue; /* already have debuginfo for this object */
      if (!di->fsm.have_ro_map)
         continue; /* need to have a r-- mapping for this object */
      if (di->fsm.have_rx_map)
         continue; /* rx- mapping already exists */
      if (!di->fsm.have_rw_map)
         continue; /* need to have a rw- mapping */
      /* Try to find a mapping matching the memory area. */
      for (i = 0; i < VG_(sizeXA)(di->fsm.maps); i++) {
         map = VG_(indexXA)(di->fsm.maps, i);
         if (map->ro && map->avma == a && map->size == len)
            break;
         map = NULL;
      }
      if (!map)
         continue; /* this isn't an upgrade of an r-- mapping */
      /* looks like we're in luck! */
      break;
   }
   if (di == NULL)
      return; /* didn't find anything */

   if (debug)
     VG_(printf)("di_notify_vm_protect-4: found existing DebugInfo* at %p\n",
                 di);

   /* Do the upgrade.  Simply update the flags of the mapping
      and pretend we never saw the RO map at all. */
   vg_assert(di->fsm.have_ro_map);
   map->rx = True;
   map->ro = False;
   di->fsm.have_rx_map = True;
   di->fsm.have_ro_map = False;
   /* See if there are any more ro mappings */
   for (i = 0; i < VG_(sizeXA)(di->fsm.maps); i++) {
      map = VG_(indexXA)(di->fsm.maps, i);
      if (map->ro) {
         di->fsm.have_ro_map = True;
         break;
      }
   }

   /* Check if we're now in an accept state and read debuginfo.  Finally. */
   if (di->fsm.have_rx_map && di->fsm.have_rw_map && !di->have_dinfo) {
      if (debug)
         VG_(printf)("di_notify_vm_protect-5: "
                     "achieved accept state for %s\n", di->fsm.filename);
      ULong di_handle __attribute__((unused))
         = di_notify_ACHIEVE_ACCEPT_STATE( di );
      /* di_handle is ignored. That's not a problem per se -- it just
         means nobody will ever be able to refer to this debuginfo by
         handle since nobody will know what the handle value is. */
   }
}


/*--------- PDB (windows debug info) reading --------- */

/* this should really return ULong, as per VG_(di_notify_mmap). */
void VG_(di_notify_pdb_debuginfo)( Int fd_obj, Addr avma_obj,
                                   SizeT total_size, PtrdiffT bias_obj )
{
   Int    i, r, sz_exename;
   ULong  obj_mtime, pdb_mtime;
   HChar* pdbname = NULL;
   HChar* dot;
   SysRes sres;
   Int    fd_pdbimage;
   SizeT  n_pdbimage;
   struct vg_stat stat_buf;

   if (VG_(clo_verbosity) > 0) {
      VG_(message)(Vg_UserMsg, "\n");
      VG_(message)(Vg_UserMsg,
         "LOAD_PDB_DEBUGINFO: clreq:   fd=%d, avma=%#lx, total_size=%lu, "
         "bias=%#lx\n", 
         fd_obj, avma_obj, total_size, (UWord)bias_obj
      );
   }

   /* 'fd' refers to the .exe/.dll we're dealing with.  Get its modification
      time into obj_mtime. */
   r = VG_(fstat)(fd_obj, &stat_buf);
   if (r == -1)
      return; /* stat failed ?! */
   vg_assert(r == 0);
   obj_mtime = stat_buf.mtime;

   /* and get its name into exename. */
   const HChar *exe;
   if (! VG_(resolve_filename)(fd_obj, &exe))
      return; /*  failed */
   sz_exename = VG_(strlen)(exe);
   HChar exename[sz_exename + 1];
   VG_(strcpy)(exename, exe);  // make a copy on the stack 

   if (VG_(clo_verbosity) > 0) {
      VG_(message)(Vg_UserMsg, "LOAD_PDB_DEBUGINFO: objname: %s\n", exename);
   }

   /* Try to get the PDB file name from the executable. */
   pdbname = ML_(find_name_of_pdb_file)(exename);
   if (pdbname) {
      vg_assert(VG_(strlen)(pdbname) >= 5); /* 5 = strlen("X.pdb") */
      /* So we successfully extracted a name from the PE file.  But it's
         likely to be of the form
            e:\foo\bar\xyzzy\wibble.pdb
         and we need to change it into something we can actually open
         in Wine-world, which basically means turning it into
            $HOME/.wine/drive_e/foo/bar/xyzzy/wibble.pdb
         We also take into account $WINEPREFIX, if it is set.
         For the moment, if the name isn't fully qualified, just forget it
         (we'd have to root around to find where the pdb actually is)
      */
      /* Change all the backslashes to forward slashes */
      for (i = 0; pdbname[i]; i++) {
         if (pdbname[i] == '\\')
            pdbname[i] = '/';
      }
      Bool is_quald
         = ('a' <= VG_(tolower)(pdbname[0]) && VG_(tolower)(pdbname[0]) <= 'z')
           && pdbname[1] == ':'
           && pdbname[2] == '/';
      HChar* home = VG_(getenv)("HOME");
      HChar* wpfx = VG_(getenv)("WINEPREFIX");
      if (is_quald && wpfx) {
         /* Change e:/foo/bar/xyzzy/wibble.pdb
                to $WINEPREFIX/drive_e/foo/bar/xyzzy/wibble.pdb
         */
         Int mashedSzB = VG_(strlen)(pdbname) + VG_(strlen)(wpfx) + 50/*misc*/;
         HChar* mashed = ML_(dinfo_zalloc)("di.debuginfo.dnpdi.1", mashedSzB);
         VG_(snprintf)(mashed, mashedSzB, "%s/drive_%c%s",
                       wpfx, pdbname[0], &pdbname[2]);
         vg_assert(mashed[mashedSzB-1] == 0);
         ML_(dinfo_free)(pdbname);
         pdbname = mashed;
      }
      else if (is_quald && home && !wpfx) {
         /* Change e:/foo/bar/xyzzy/wibble.pdb
                to $HOME/.wine/drive_e/foo/bar/xyzzy/wibble.pdb
         */
         Int mashedSzB = VG_(strlen)(pdbname) + VG_(strlen)(home) + 50/*misc*/;
         HChar* mashed = ML_(dinfo_zalloc)("di.debuginfo.dnpdi.2", mashedSzB);
         VG_(snprintf)(mashed, mashedSzB, "%s/.wine/drive_%c%s",
		       home, pdbname[0], &pdbname[2]);
         vg_assert(mashed[mashedSzB-1] == 0);
         ML_(dinfo_free)(pdbname);
         pdbname = mashed;
      } else {
         /* It's not a fully qualified path, or neither $HOME nor $WINE
            are set (strange).  Give up. */
         ML_(dinfo_free)(pdbname);
         pdbname = NULL;
      }
   }

   /* Try s/exe/pdb/ if we don't have a valid pdbname. */
   if (!pdbname) {
      /* Try to find a matching PDB file from which to read debuginfo.
         Windows PE files have symbol tables and line number information,
         but MSVC doesn't seem to use them. */
      /* Why +5 ?  Because in the worst case, we could find a dot as the
         last character of pdbname, and we'd then put "pdb" right after
         it, hence extending it a bit. */
      pdbname = ML_(dinfo_zalloc)("di.debuginfo.lpd1", sz_exename+5);
      VG_(strcpy)(pdbname, exename);
      vg_assert(pdbname[sz_exename+5-1] == 0);
      dot = VG_(strrchr)(pdbname, '.');
      if (!dot)
         goto out; /* there's no dot in the exe's name ?! */
      if (dot[1] == 0)
         goto out; /* hmm, path ends in "." */

      if ('A' <= dot[1] && dot[1] <= 'Z')
         VG_(strcpy)(dot, ".PDB");
      else
         VG_(strcpy)(dot, ".pdb");

      vg_assert(pdbname[sz_exename+5-1] == 0);
   }

   /* See if we can find it, and check it's in-dateness. */
   sres = VG_(stat)(pdbname, &stat_buf);
   if (sr_isError(sres)) {
      VG_(message)(Vg_UserMsg, "Warning: Missing or un-stat-able %s\n",
                               pdbname);
   if (VG_(clo_verbosity) > 0)
      VG_(message)(Vg_UserMsg, "LOAD_PDB_DEBUGINFO: missing: %s\n", pdbname);
      goto out;
   }
   pdb_mtime = stat_buf.mtime;

   if (obj_mtime > pdb_mtime + 60ULL) {
      /* PDB file is older than PE file.  Really, the PDB should be
         newer than the PE, but that doesn't always seem to be the
         case.  Allow the PDB to be up to one minute older.
         Otherwise, it's probably out of date, in which case ignore it
         or we will either (a) print wrong stack traces or more likely
         (b) crash.
      */
      VG_(message)(Vg_UserMsg,
                   "Warning:       %s (mtime = %llu)\n"
                   " is older than %s (mtime = %llu)\n",
                   pdbname, pdb_mtime, exename, obj_mtime);
   }

   sres = VG_(open)(pdbname, VKI_O_RDONLY, 0);
   if (sr_isError(sres)) {
      VG_(message)(Vg_UserMsg, "Warning: Can't open %s\n", pdbname);
      goto out;
   }

   /* Looks promising; go on to try and read stuff from it.  But don't
      mmap the file.  Instead mmap free space and read the file into
      it.  This is because files on CIFS filesystems that are mounted
      '-o directio' can't be mmap'd, and that mount option is needed
      to make CIFS work reliably.  (See
      http://www.nabble.com/Corrupted-data-on-write-to-
                            Windows-2003-Server-t2782623.html)
      This is slower, but at least it works reliably. */
   fd_pdbimage = sr_Res(sres);
   n_pdbimage  = stat_buf.size;
   if (n_pdbimage == 0 || n_pdbimage > 0x7FFFFFFF) {
      // 0x7FFFFFFF: why?  Because the VG_(read) just below only
      // can deal with a signed int as the size of data to read,
      // so we can't reliably check for read failure for files
      // greater than that size.  Hence just skip them; we're
      // unlikely to encounter a PDB that large anyway.
      VG_(close)(fd_pdbimage);
      goto out;
   }
   sres = VG_(am_mmap_anon_float_valgrind)( n_pdbimage );
   if (sr_isError(sres)) {
      VG_(close)(fd_pdbimage);
      goto out;
   }

   void* pdbimage = (void*)sr_Res(sres);
   r = VG_(read)( fd_pdbimage, pdbimage, (Int)n_pdbimage );
   if (r < 0 || r != (Int)n_pdbimage) {
      VG_(am_munmap_valgrind)( (Addr)pdbimage, n_pdbimage );
      VG_(close)(fd_pdbimage);
      goto out;
   }

   if (VG_(clo_verbosity) > 0)
      VG_(message)(Vg_UserMsg, "LOAD_PDB_DEBUGINFO: pdbname: %s\n", pdbname);

   /* play safe; always invalidate the CFI cache.  I don't know if
      this is necessary, but anyway .. */
   cfsi_m_cache__invalidate();
   /* dump old info for this range, if any */
   discard_syms_in_range( avma_obj, total_size );

   { DebugInfo* di = find_or_create_DebugInfo_for(exename);

     /* this di must be new, since we just nuked any old stuff in the range */
     vg_assert(di && !di->fsm.have_rx_map && !di->fsm.have_rw_map);
     vg_assert(!di->have_dinfo);

     /* don't set up any of the di-> fields; let
        ML_(read_pdb_debug_info) do it. */
     ML_(read_pdb_debug_info)( di, avma_obj, bias_obj,
                               pdbimage, n_pdbimage, pdbname, pdb_mtime );
     // JRS fixme: take notice of return value from read_pdb_debug_info,
     // and handle failure
     vg_assert(di->have_dinfo); // fails if PDB read failed
     VG_(am_munmap_valgrind)( (Addr)pdbimage, n_pdbimage );
     VG_(close)(fd_pdbimage);

     if (VG_(clo_verbosity) > 0) {
        VG_(message)(Vg_UserMsg, "LOAD_PDB_DEBUGINFO: done:    "
                                 "%lu syms, %lu src locs, %lu fpo recs\n",
                     di->symtab_used, di->loctab_used, di->fpo_size);
     }
   }

  out:
   if (pdbname) ML_(dinfo_free)(pdbname);
}

#endif /* defined(VGO_linux) || defined(VGO_darwin) || defined(VGO_solaris) */


/*------------------------------------------------------------*/
/*---                                                      ---*/
/*--- TOP LEVEL: QUERYING EXISTING DEBUG INFO              ---*/
/*---                                                      ---*/
/*------------------------------------------------------------*/

void VG_(di_discard_ALL_debuginfo)( void )
{
   DebugInfo *di, *di2;
   di = debugInfo_list;
   while (di) {
      di2 = di->next;
      VG_(printf)("XXX rm %p\n", di);
      free_DebugInfo( di );
      di = di2;
   }
}


DebugInfoMapping* ML_(find_rx_mapping) ( DebugInfo* di, Addr lo, Addr hi )
{
   Word i;
   vg_assert(lo <= hi); 

   /* Optimization: Try to use the last matched rx mapping first */
   if (   di->last_rx_map
       && lo >= di->last_rx_map->avma
       && hi <  di->last_rx_map->avma + di->last_rx_map->size)
      return di->last_rx_map;

   for (i = 0; i < VG_(sizeXA)(di->fsm.maps); i++) {
      DebugInfoMapping* map = VG_(indexXA)(di->fsm.maps, i);
      if (   map->rx && map->size > 0
          && lo >= map->avma && hi < map->avma + map->size) {
         di->last_rx_map = map;
         return map;
      }
   }

   return NULL;
}

/*------------------------------------------------------------*/
/*--- Types and functions for inlined IP cursor            ---*/
/*------------------------------------------------------------*/
struct _InlIPCursor {
   Addr eip;             // Cursor used to describe calls at eip.
   DebugInfo* di;        // DebugInfo describing inlined calls at eip

   Word    inltab_lopos; // The inlined fn calls covering eip are in
   Word    inltab_hipos; // di->inltab[inltab_lopos..inltab_hipos].
                         // Note that not all inlined fn calls in this range
                         // are necessarily covering eip.

   Int   curlevel;       // Current level to describe.
                         // 0 means to describe eip itself.
   Word  cur_inltab;     // inltab pos for call inlined at current level.
   Word  next_inltab;    // inltab pos for call inlined at next (towards main)
                         // level.
};

static Bool is_top(const InlIPCursor *iipc)
{
   return !iipc || iipc->cur_inltab == -1;
}

static Bool is_bottom(const InlIPCursor *iipc)
{
   return !iipc || iipc->next_inltab == -1;
}

Bool VG_(next_IIPC)(InlIPCursor *iipc)
{
   Word i;
   DiInlLoc *hinl = NULL;
   Word hinl_pos = -1;
   DebugInfo *di;

   if (iipc == NULL)
      return False;

   if (iipc->curlevel <= 0) {
      iipc->curlevel--;
      return False;
   }

   di = iipc->di;
   for (i = iipc->inltab_lopos; i <= iipc->inltab_hipos; i++) {
      if (di->inltab[i].addr_lo <= iipc->eip 
          && iipc->eip < di->inltab[i].addr_hi
          && di->inltab[i].level < iipc->curlevel
          && (!hinl || hinl->level < di->inltab[i].level)) {
         hinl = &di->inltab[i];
         hinl_pos = i;
      }
   }
   
   iipc->cur_inltab = iipc->next_inltab;
   iipc->next_inltab = hinl_pos;
   if (iipc->next_inltab < 0)
      iipc->curlevel = 0; // no inlined call anymore, describe eip itself
   else
      iipc->curlevel = di->inltab[iipc->next_inltab].level;

   return True;
}

/* Forward */
static void search_all_loctabs ( Addr ptr, /*OUT*/DebugInfo** pdi,
                                           /*OUT*/Word* locno );

/* Returns the position after which eip would be inserted in inltab.
   (-1 if eip should be inserted before position 0).
   This is the highest position with an addr_lo <= eip.
   As inltab is sorted on addr_lo, dichotomic search can be done
   (note that inltab might have duplicates addr_lo). */
static Word inltab_insert_pos (DebugInfo *di, Addr eip)
{
   Word mid, 
        lo = 0, 
        hi = di->inltab_used-1;
   while (lo <= hi) {
      mid      = (lo + hi) / 2;
      if (eip < di->inltab[mid].addr_lo) { hi = mid-1; continue; } 
      if (eip > di->inltab[mid].addr_lo) { lo = mid+1; continue; }
      lo = mid; break;
   }

   while (lo <= di->inltab_used-1 && di->inltab[lo].addr_lo <= eip)
      lo++;
#if 0
   for (mid = 0; mid <= di->inltab_used-1; mid++)
      if (eip < di->inltab[mid].addr_lo)
         break;
   vg_assert (lo - 1 == mid - 1);
#endif
   return lo - 1;
}

InlIPCursor* VG_(new_IIPC)(Addr eip)
{
   DebugInfo*  di;
   Word        locno;
   Word        i;
   InlIPCursor *ret;
   Bool        avail;

   if (!VG_(clo_read_inline_info))
      return NULL; // No way we can find inlined calls.

   /* Search the DebugInfo for eip */
   search_all_loctabs ( eip, &di, &locno );
   if (di == NULL || di->inltab_used == 0)
      return NULL; // No di (with inltab) containing eip.

   /* Search the entry in di->inltab with the highest addr_lo that
      contains eip. */
   /* We start from the highest pos in inltab after which eip would
      be inserted. */
   for (i = inltab_insert_pos (di, eip); i >= 0; i--) {
      if (di->inltab[i].addr_lo <= eip && eip < di->inltab[i].addr_hi) {
         break;
      }
      /* Stop the backward scan when reaching an addr_lo which
         cannot anymore contain eip : we know that all ranges before
         i also cannot contain eip. */
      if (di->inltab[i].addr_lo < eip - di->maxinl_codesz)
         return NULL;
   }
   
   if (i < 0)
      return NULL; // No entry containing eip.

   /* We have found the highest entry containing eip.
      Build a cursor. */
   ret = ML_(dinfo_zalloc) ("dinfo.new_IIPC", sizeof(*ret));
   ret->eip = eip;
   ret->di = di;
   ret->inltab_hipos = i;
   for (i = ret->inltab_hipos - 1; i >= 0; i--) {
     
      if (di->inltab[i].addr_lo < eip - di->maxinl_codesz)
         break; /* Similar stop backward scan logic as above. */
   }
   ret->inltab_lopos = i + 1;
   ret->curlevel = MAX_LEVEL;
   ret->cur_inltab = -1;
   ret->next_inltab = -1;

   /* MAX_LEVEL is higher than any stored level. We can use
      VG_(next_IIPC) to get to the 'real' first highest call level. */
   avail = VG_(next_IIPC) (ret);
   vg_assert (avail);

   return ret;
}

void VG_(delete_IIPC)(InlIPCursor *iipc)
{
   if (iipc)
      ML_(dinfo_free)( iipc );
}


/*------------------------------------------------------------*/
/*--- Use of symbol table & location info to create        ---*/
/*--- plausible-looking stack dumps.                       ---*/
/*------------------------------------------------------------*/

/* Search all symtabs that we know about to locate ptr.  If found, set
   *pdi to the relevant DebugInfo, and *symno to the symtab entry
   *number within that.  If not found, *psi is set to NULL.
   If findText==True,  only text symbols are searched for.
   If findText==False, only data symbols are searched for.
*/
static void search_all_symtabs ( Addr ptr, /*OUT*/DebugInfo** pdi,
                                           /*OUT*/Word* symno,
                                 Bool match_anywhere_in_sym,
                                 Bool findText )
{
   Word       sno;
   DebugInfo* di;
   Bool       inRange;

   for (di = debugInfo_list; di != NULL; di = di->next) {

      if (findText) {
         /* Consider any symbol in the r-x mapped area to be text.
            See Comment_Regarding_Text_Range_Checks in storage.c for
            details. */
         inRange = di->fsm.have_rx_map
                   && (ML_(find_rx_mapping)(di, ptr, ptr) != NULL);
      } else {
         inRange = (di->data_present
                    && di->data_size > 0
                    && di->data_avma <= ptr 
                    && ptr < di->data_avma + di->data_size)
                   ||
                   (di->sdata_present
                    && di->sdata_size > 0
                    && di->sdata_avma <= ptr 
                    && ptr < di->sdata_avma + di->sdata_size)
                   ||
                   (di->bss_present
                    && di->bss_size > 0
                    && di->bss_avma <= ptr 
                    && ptr < di->bss_avma + di->bss_size)
                   ||
                   (di->sbss_present
                    && di->sbss_size > 0
                    && di->sbss_avma <= ptr 
                    && ptr < di->sbss_avma + di->sbss_size)
                   ||
                   (di->rodata_present
                    && di->rodata_size > 0
                    && di->rodata_avma <= ptr 
                    && ptr < di->rodata_avma + di->rodata_size);
      }

      if (!inRange) continue;

      sno = ML_(search_one_symtab) ( 
               di, ptr, match_anywhere_in_sym, findText );
      if (sno == -1) goto not_found;
      *symno = sno;
      *pdi = di;
      return;

   }
  not_found:
   *pdi = NULL;
}


/* Search all loctabs that we know about to locate ptr.  If found, set
   *pdi to the relevant DebugInfo, and *locno to the loctab entry
   *number within that.  If not found, *pdi is set to NULL. */
static void search_all_loctabs ( Addr ptr, /*OUT*/DebugInfo** pdi,
                                           /*OUT*/Word* locno )
{
   Word       lno;
   DebugInfo* di;
   for (di = debugInfo_list; di != NULL; di = di->next) {
      if (di->text_present
          && di->text_size > 0
          && di->text_avma <= ptr 
          && ptr < di->text_avma + di->text_size) {
         lno = ML_(search_one_loctab) ( di, ptr );
         if (lno == -1) goto not_found;
         *locno = lno;
         *pdi = di;
         return;
      }
   }
  not_found:
   *pdi = NULL;
}


/* The whole point of this whole big deal: map a code address to a
   plausible symbol name.  Returns False if no idea; otherwise True.
   Caller supplies buf.  If do_cxx_demangling is False, don't do
   C++ demangling, regardless of VG_(clo_demangle) -- probably because the
   call has come from VG_(get_fnname_raw)().  findText
   indicates whether we're looking for a text symbol or a data symbol
   -- caller must choose one kind or the other.
   Note: the string returned in *BUF is persistent as long as 
   (1) the DebugInfo it belongs to is not discarded
   (2) the segment containing the address is not merged with another segment
   (3) the demangler is not invoked again
   In other words: if in doubt, save it away.
   Also, the returned string is owned by "somebody else". Callers must
   not free it or modify it. */
static
Bool get_sym_name ( Bool do_cxx_demangling, Bool do_z_demangling,
                    Bool do_below_main_renaming,
                    Addr a, const HChar** buf,
                    Bool match_anywhere_in_sym, Bool show_offset,
                    Bool findText, /*OUT*/PtrdiffT* offsetP )
{
   DebugInfo* di;
   Word       sno;
   PtrdiffT   offset;

   search_all_symtabs ( a, &di, &sno, match_anywhere_in_sym, findText );
   if (di == NULL) {
      *buf = "";
      return False;
   }

   vg_assert(di->symtab[sno].pri_name);
   VG_(demangle) ( do_cxx_demangling, do_z_demangling,
                   di->symtab[sno].pri_name, buf );

   /* Do the below-main hack */
   // To reduce the endless nuisance of multiple different names 
   // for "the frame below main()" screwing up the testsuite, change all
   // known incarnations of said into a single name, "(below main)", if
   // --show-below-main=yes.
   if ( do_below_main_renaming && ! VG_(clo_show_below_main) &&
        Vg_FnNameBelowMain == VG_(get_fnname_kind)(*buf) )
   {
     *buf = "(below main)";
   }
   offset = a - di->symtab[sno].avmas.main;
   if (offsetP) *offsetP = offset;

   if (show_offset && offset != 0) {
      static HChar *bufwo;      // buf with offset
      static SizeT  bufwo_szB;
      SizeT  need, len;

      len = VG_(strlen)(*buf);
      need = len + 1 + 19 + 1;
      if (need > bufwo_szB) {
        bufwo = ML_(dinfo_realloc)("get_sym_size", bufwo, need);
        bufwo_szB = need;
      }

      VG_(strcpy)(bufwo, *buf);
      VG_(sprintf)(bufwo + len, "%c%ld",
                   offset < 0 ? '-' : '+',
                   offset < 0 ? -offset : offset);
      *buf = bufwo;
   }

   return True;
}

/* ppc64be-linux only: find the TOC pointer (R2 value) that should be in
   force at the entry point address of the function containing
   guest_code_addr.  Returns 0 if not known. */
Addr VG_(get_tocptr) ( Addr guest_code_addr )
{
#if defined(VGA_ppc64be) || defined(VGA_ppc64le)
   DebugInfo* si;
   Word       sno;
   search_all_symtabs ( guest_code_addr, 
                        &si, &sno,
                        True/*match_anywhere_in_fun*/,
                        True/*consider text symbols only*/ );
   if (si == NULL) 
      return 0;
   else
      return GET_TOCPTR_AVMA(si->symtab[sno].avmas);
#else
   return 0;
#endif
}

/* This is available to tools... always demangle C++ names,
   match anywhere in function, but don't show offsets.
   NOTE: See important comment about the persistence and memory ownership
   of the return string at function get_sym_name */
Bool VG_(get_fnname) ( Addr a, const HChar** buf )
{
   return get_sym_name ( /*C++-demangle*/True, /*Z-demangle*/True,
                         /*below-main-renaming*/True,
                         a, buf,
                         /*match_anywhere_in_fun*/True, 
                         /*show offset?*/False,
                         /*text syms only*/True,
                         /*offsetP*/NULL );
}

/* This is available to tools... always demangle C++ names,
   match anywhere in function, and show offset if nonzero.
   NOTE: See important comment about the persistence and memory ownership
   of the return string at function get_sym_name */
Bool VG_(get_fnname_w_offset) ( Addr a, const HChar** buf )
{
   return get_sym_name ( /*C++-demangle*/True, /*Z-demangle*/True,
                         /*below-main-renaming*/True,
                         a, buf,
                         /*match_anywhere_in_fun*/True, 
                         /*show offset?*/True,
                         /*text syms only*/True,
                         /*offsetP*/NULL );
}

/* This is available to tools... always demangle C++ names,
   only succeed if 'a' matches first instruction of function,
   and don't show offsets.
   NOTE: See important comment about the persistence and memory ownership
   of the return string at function get_sym_name */
Bool VG_(get_fnname_if_entry) ( Addr a, const HChar** buf )
{
   const HChar *tmp;
   Bool res;

   res =  get_sym_name ( /*C++-demangle*/True, /*Z-demangle*/True,
                         /*below-main-renaming*/True,
                         a, &tmp,
                         /*match_anywhere_in_fun*/False, 
                         /*show offset?*/False,
                         /*text syms only*/True,
                         /*offsetP*/NULL );
   if (res)
      *buf = tmp;
   return res;
}

/* This is only available to core... don't C++-demangle, don't Z-demangle,
   don't rename below-main, match anywhere in function, and don't show
   offsets.
   NOTE: See important comment about the persistence and memory ownership
   of the return string at function get_sym_name */
Bool VG_(get_fnname_raw) ( Addr a, const HChar** buf )
{
   return get_sym_name ( /*C++-demangle*/False, /*Z-demangle*/False,
                         /*below-main-renaming*/False,
                         a, buf,
                         /*match_anywhere_in_fun*/True, 
                         /*show offset?*/False,
                         /*text syms only*/True,
                         /*offsetP*/NULL );
}

/* This is only available to core... don't demangle C++ names, but do
   do Z-demangling and below-main-renaming, match anywhere in function, and
   don't show offsets.
   NOTE: See important comment about the persistence and memory ownership
   of the return string at function get_sym_name */
Bool VG_(get_fnname_no_cxx_demangle) ( Addr a, const HChar** buf,
                                       const InlIPCursor* iipc )
{
   if (is_bottom(iipc)) {
      // At the bottom (towards main), we describe the fn at eip.
      return get_sym_name ( /*C++-demangle*/False, /*Z-demangle*/True,
                            /*below-main-renaming*/True,
                            a, buf,
                            /*match_anywhere_in_fun*/True, 
                            /*show offset?*/False,
                            /*text syms only*/True,
                            /*offsetP*/NULL );
   } else {
      const DiInlLoc *next_inl = iipc && iipc->next_inltab >= 0
         ? & iipc->di->inltab[iipc->next_inltab]
         : NULL;
      vg_assert (next_inl);
      // The function we are in is called by next_inl.
      *buf = next_inl->inlinedfn;
      return True;
   }
}

/* mips-linux only: find the offset of current address. This is needed for 
   stack unwinding for MIPS.
*/
Bool VG_(get_inst_offset_in_function)( Addr a,
                                       /*OUT*/PtrdiffT* offset )
{
   const HChar *fnname;
   return get_sym_name ( /*C++-demangle*/False, /*Z-demangle*/False,
                         /*below-main-renaming*/False,
                         a, &fnname,
                         /*match_anywhere_in_sym*/True, 
                         /*show offset?*/False,
                         /*text syms only*/True,
                         offset );
}

Vg_FnNameKind VG_(get_fnname_kind) ( const HChar* name )
{
   if (VG_STREQ("main", name)) {
      return Vg_FnNameMain;

   } else if (
#      if defined(VGO_linux)
       VG_STREQ("__libc_start_main",  name) ||  // glibc glibness
       VG_STREQ("generic_start_main", name) ||  // Yellow Dog doggedness
#      elif defined(VGO_darwin)
       // See readmacho.c for an explanation of this.
       VG_STREQ("start_according_to_valgrind", name) ||  // Darwin, darling
#      elif defined(VGO_solaris)
       VG_STREQ("_start", name) || // main() is called directly from _start
#      else
#        error "Unknown OS"
#      endif
       0) {
      return Vg_FnNameBelowMain;

   } else {
      return Vg_FnNameNormal;
   }
}

Vg_FnNameKind VG_(get_fnname_kind_from_IP) ( Addr ip )
{
   const HChar *buf;

   // We don't demangle, because it's faster not to, and the special names
   // we're looking for won't be mangled.
   if (VG_(get_fnname_raw) ( ip, &buf )) {

      return VG_(get_fnname_kind)(buf);
   } else {
      return Vg_FnNameNormal;    // Don't know the name, treat it as normal.
   }
}

/* Looks up data_addr in the collection of data symbols, and if found
   puts a pointer to its name into dname. The name is zero terminated.
   Also data_addr's offset from the symbol start is put into *offset.
   NOTE: See important comment about the persistence and memory ownership
   of the return string at function get_sym_name */
Bool VG_(get_datasym_and_offset)( Addr data_addr,
                                  /*OUT*/const HChar** dname,
                                  /*OUT*/PtrdiffT* offset )
{
   return get_sym_name ( /*C++-demangle*/False, /*Z-demangle*/False,
                       /*below-main-renaming*/False,
                       data_addr, dname,
                       /*match_anywhere_in_sym*/True, 
                       /*show offset?*/False,
                       /*data syms only please*/False,
                       offset );
}

/* Map a code address to the name of a shared object file or the
   executable.  Returns False if no idea; otherwise True.
   Note: the string returned in *BUF is persistent as long as 
   (1) the DebugInfo it belongs to is not discarded
   (2) the segment containing the address is not merged with another segment
*/
Bool VG_(get_objname) ( Addr a, const HChar** buf )
{
   DebugInfo* di;
   const NSegment *seg;
   const HChar* filename;

   /* Look in the debugInfo_list to find the name.  In most cases we
      expect this to produce a result. */
   for (di = debugInfo_list; di != NULL; di = di->next) {
      if (di->text_present
          && di->text_size > 0
          && di->text_avma <= a 
          && a < di->text_avma + di->text_size) {
         *buf = di->fsm.filename;
         return True;
      }
   }
   /* Last-ditch fallback position: if we don't find the address in
      the debugInfo_list, ask the address space manager whether it
      knows the name of the file associated with this mapping.  This
      allows us to print the names of exe/dll files in the stack trace
      when running programs under wine. */
   if ( (seg = VG_(am_find_nsegment(a))) != NULL 
        && (filename = VG_(am_get_filename)(seg)) != NULL ) {
     *buf = filename;
      return True;
   }
   return False;
}

/* Map a code address to its DebugInfo.  Returns NULL if not found.  Doesn't
   require debug info. */
DebugInfo* VG_(find_DebugInfo) ( Addr a )
{
   static UWord n_search = 0;
   DebugInfo* di;
   n_search++;
   for (di = debugInfo_list; di != NULL; di = di->next) {
      if (di->text_present
          && di->text_size > 0
          && di->text_avma <= a 
          && a < di->text_avma + di->text_size) {
         if (0 == (n_search & 0xF))
            move_DebugInfo_one_step_forward( di );
         return di;
      }
   }
   return NULL;
}

/* Map a code address to a filename.  Returns True if successful. The
   returned string is persistent as long as the DebugInfo to which it
   belongs is not discarded. */
Bool VG_(get_filename)( Addr a, const HChar** filename )
{
   DebugInfo* si;
   Word       locno;
   UInt       fndn_ix;

   search_all_loctabs ( a, &si, &locno );
   if (si == NULL) 
      return False;
   fndn_ix = ML_(fndn_ix) (si, locno);
   *filename = ML_(fndn_ix2filename) (si, fndn_ix);
   return True;
}

/* Map a code address to a line number.  Returns True if successful. */
Bool VG_(get_linenum)( Addr a, UInt* lineno )
{
   DebugInfo* si;
   Word       locno;
   search_all_loctabs ( a, &si, &locno );
   if (si == NULL) 
      return False;
   *lineno = si->loctab[locno].lineno;

   return True;
}

/* Map a code address to a filename/line number/dir name info.
   See prototype for detailed description of behaviour.
*/
Bool VG_(get_filename_linenum) ( Addr a, 
                                 /*OUT*/const HChar** filename,
                                 /*OUT*/const HChar** dirname,
                                 /*OUT*/UInt* lineno )
{
   DebugInfo* si;
   Word       locno;
   UInt       fndn_ix;

   search_all_loctabs ( a, &si, &locno );
   if (si == NULL) {
      if (dirname) {
         *dirname = "";
      }
      *filename = "";      // this used to be not initialised....
      return False;
   }

   fndn_ix = ML_(fndn_ix)(si, locno);
   *filename = ML_(fndn_ix2filename) (si, fndn_ix);
   *lineno = si->loctab[locno].lineno;

   if (dirname) {
      /* caller wants directory info too .. */
      *dirname = ML_(fndn_ix2dirname) (si, fndn_ix);
   }

   return True;
}


/* Map a function name to its entry point and toc pointer.  Is done by
   sequential search of all symbol tables, so is very slow.  To
   mitigate the worst performance effects, you may specify a soname
   pattern, and only objects matching that pattern are searched.
   Therefore specify "*" to search all the objects.  On TOC-afflicted
   platforms, a symbol is deemed to be found only if it has a nonzero
   TOC pointer.  */
Bool VG_(lookup_symbol_SLOW)(const HChar* sopatt, const HChar* name,
                             SymAVMAs* avmas)
{
   Bool     require_pToc = False;
   Int      i;
   const DebugInfo* si;
   Bool     debug = False;
#  if defined(VG_PLAT_USES_PPCTOC)
   require_pToc = True;
#  endif
   for (si = debugInfo_list; si; si = si->next) {
      if (debug)
         VG_(printf)("lookup_symbol_SLOW: considering %s\n", si->soname);
      if (!VG_(string_match)(sopatt, si->soname)) {
         if (debug)
            VG_(printf)(" ... skip\n");
         continue;
      }
      for (i = 0; i < si->symtab_used; i++) {
         const HChar* pri_name = si->symtab[i].pri_name;
         vg_assert(pri_name);
         if (0==VG_(strcmp)(name, pri_name)
             && (require_pToc ? GET_TOCPTR_AVMA(si->symtab[i].avmas) : True)) {
            *avmas = si->symtab[i].avmas;
            return True;
         }
         const HChar** sec_names = si->symtab[i].sec_names;
         if (sec_names) {
            vg_assert(sec_names[0]);
            while (*sec_names) {
               if (0==VG_(strcmp)(name, *sec_names)
                   && (require_pToc 
                       ? GET_TOCPTR_AVMA(si->symtab[i].avmas) : True)) {
                  *avmas = si->symtab[i].avmas;
                  return True;
               }
               sec_names++;
            }
         }
      }
   }
   return False;
}


/* VG_(describe_IP): return info on code address, function name and
   filename. The returned string is allocated in a static buffer and will
   be overwritten in the next invocation. */

/* Copy str into *buf starting at n, ensuring that buf is zero-terminated.
   Return the index of the terminating null character. */
static SizeT 
putStr( SizeT n, HChar** buf, SizeT *bufsiz, const HChar* str ) 
{
   SizeT slen = VG_(strlen)(str);
   SizeT need = n + slen + 1;

   if (need > *bufsiz) {
      if (need < 256) need = 256;
      *bufsiz = need;
      *buf = ML_(dinfo_realloc)("putStr", *buf, *bufsiz);
   }

   VG_(strcpy)(*buf + n, str);

   return n + slen;
}

/* Same as putStr, but escaping chars for XML output. */
static SizeT 
putStrEsc( SizeT n, HChar** buf, SizeT *bufsiz, const HChar* str )
{
   HChar alt[2];

   for (; *str != 0; str++) {
      switch (*str) {
         case '&': 
            n = putStr( n, buf, bufsiz, "&amp;"); 
            break;
         case '<': 
            n = putStr( n, buf, bufsiz, "&lt;"); 
            break;
         case '>': 
            n = putStr( n, buf, bufsiz, "&gt;"); 
            break;
         default:
            alt[0] = *str;
            alt[1] = 0;
            n = putStr( n, buf, bufsiz, alt );
            break;
      }
   }
   return n;
}

const HChar* VG_(describe_IP)(Addr eip, const InlIPCursor *iipc)
{
   static HChar *buf = NULL;
   static SizeT bufsiz = 0;
#  define APPEND(_str) \
      n = putStr(n, &buf, &bufsiz, _str)
#  define APPEND_ESC(_str) \
      n = putStrEsc(n, &buf, &bufsiz, _str)

   UInt  lineno; 
   HChar ibuf[50];   // large enough
   SizeT n = 0;

   vg_assert (!iipc || iipc->eip == eip);

   const HChar *buf_fn;
   const HChar *buf_obj;
   const HChar *buf_srcloc;
   const HChar *buf_dirname;

   Bool  know_dirinfo;
   Bool  know_fnname;
   Bool  know_objname;
   Bool  know_srcloc;

   if (is_bottom(iipc)) {
      // At the bottom (towards main), we describe the fn at eip.
      know_fnname = VG_(clo_sym_offsets)
                    ? VG_(get_fnname_w_offset) (eip, &buf_fn)
                    : VG_(get_fnname) (eip, &buf_fn);
   } else {
      const DiInlLoc *next_inl = iipc && iipc->next_inltab >= 0
         ? & iipc->di->inltab[iipc->next_inltab]
         : NULL;
      vg_assert (next_inl);
      // The function we are in is called by next_inl.
      buf_fn = next_inl->inlinedfn;
      know_fnname = True;

      // INLINED????
      // ??? Can we compute an offset for an inlined fn call ?
      // ??? Offset from what ? The beginning of the inl info ?
      // ??? But that is not necessarily the beginning of the fn
      // ??? as e.g. an inlined fn call can be in several ranges.
      // ??? Currently never showing an offset.
   }

   know_objname = VG_(get_objname)(eip, &buf_obj);

   if (is_top(iipc)) {
      // The source for the highest level is in the loctab entry.
      know_srcloc  = VG_(get_filename_linenum)(
                        eip, 
                        &buf_srcloc, 
                        &buf_dirname,
                        &lineno 
                     );
      know_dirinfo = buf_dirname[0] != '\0';
   } else {
      const DiInlLoc *cur_inl = iipc && iipc->cur_inltab >= 0
         ? & iipc->di->inltab[iipc->cur_inltab]
         : NULL;
      vg_assert (cur_inl);

      know_dirinfo = False;
      buf_dirname  = "";
      // The fndn_ix and lineno for the caller of the inlined fn is in cur_inl.
      if (cur_inl->fndn_ix == 0) {
         buf_srcloc = "???";
      } else {
         FnDn *fndn = VG_(indexEltNumber) (iipc->di->fndnpool,
                                           cur_inl->fndn_ix);
         if (fndn->dirname) {
            buf_dirname = fndn->dirname;
            know_dirinfo = True;
         }
         buf_srcloc = fndn->filename;
      }
      lineno = cur_inl->lineno;
      know_srcloc = True;
   }

   if (VG_(clo_xml)) {

      Bool   human_readable = True;
      const HChar* maybe_newline  = human_readable ? "\n      " : "";
      const HChar* maybe_newline2 = human_readable ? "\n    "   : "";

      /* Print in XML format, dumping in as much info as we know.
         Ensure all tags are balanced. */
      APPEND("<frame>");
      VG_(sprintf)(ibuf,"<ip>0x%lX</ip>", eip);
      APPEND(maybe_newline);
      APPEND(ibuf);
      if (know_objname) {
         APPEND(maybe_newline);
         APPEND("<obj>");
         APPEND_ESC(buf_obj);
         APPEND("</obj>");
      }
      if (know_fnname) {
         APPEND(maybe_newline);
         APPEND("<fn>");
         APPEND_ESC(buf_fn);
         APPEND("</fn>");
      }
      if (know_srcloc) {
         if (know_dirinfo) {
            APPEND(maybe_newline);
            APPEND("<dir>");
            APPEND_ESC(buf_dirname);
            APPEND("</dir>");
         }
         APPEND(maybe_newline);
         APPEND("<file>");
         APPEND_ESC(buf_srcloc);
         APPEND("</file>");
         APPEND(maybe_newline);
         APPEND("<line>");
         VG_(sprintf)(ibuf,"%u",lineno);
         APPEND(ibuf);
         APPEND("</line>");
      }
      APPEND(maybe_newline2);
      APPEND("</frame>");

   } else {

      /* Print for humans to read */
      //
      // Possible forms:
      //
      //   0x80483BF: really (a.c:20)
      //   0x80483BF: really (in /foo/a.out)
      //   0x80483BF: really (in ???)
      //   0x80483BF: ??? (in /foo/a.out)
      //   0x80483BF: ??? (a.c:20)
      //   0x80483BF: ???
      //
      VG_(sprintf)(ibuf,"0x%lX: ", eip);
      APPEND(ibuf);
      if (know_fnname) {
         APPEND(buf_fn);
      } else {
         APPEND("???");
      }
      if (know_srcloc) {
         APPEND(" (");
         // Get the directory name, if any, possibly pruned, into dirname.
         const HChar* dirname = NULL;
         if (know_dirinfo && VG_(sizeXA)(VG_(clo_fullpath_after)) > 0) {
            Int i;
            dirname = buf_dirname;
            // Remove leading prefixes from the dirname.
            // If user supplied --fullpath-after=foo, this will remove 
            // a leading string which matches '.*foo' (not greedy).
            for (i = 0; i < VG_(sizeXA)(VG_(clo_fullpath_after)); i++) {
               const HChar* prefix =
                  *(HChar**) VG_(indexXA)( VG_(clo_fullpath_after), i );
               HChar* str    = VG_(strstr)(dirname, prefix);
               if (str) {
                  dirname = str + VG_(strlen)(prefix);
                  break;
               }
            }
            /* remove leading "./" */
            if (dirname[0] == '.' && dirname[1] == '/')
               dirname += 2;
         }
         // do we have any interesting directory name to show?  If so
         // add it in.
         if (dirname && dirname[0] != 0) {
            APPEND(dirname);
            APPEND("/");
         }
         APPEND(buf_srcloc);
         APPEND(":");
         VG_(sprintf)(ibuf,"%u",lineno);
         APPEND(ibuf);
         APPEND(")");
      } else if (know_objname) {
         APPEND(" (in ");
         APPEND(buf_obj);
         APPEND(")");
      } else if (know_fnname) {
         // Nb: do this in two steps because "??)" is a trigraph!
         APPEND(" (in ???");
         APPEND(")");
      }

   }
   return buf;

#  undef APPEND
#  undef APPEND_ESC
}


/*--------------------------------------------------------------*/
/*---                                                        ---*/
/*--- TOP LEVEL: FOR UNWINDING THE STACK USING               ---*/
/*---            DWARF3 .eh_frame INFO                       ---*/
/*---                                                        ---*/
/*--------------------------------------------------------------*/

/* Gather up all the constant pieces of info needed to evaluate
   a CfiExpr into one convenient struct. */
typedef
   struct {
      const D3UnwindRegs* uregs;
      Addr          min_accessible;
      Addr          max_accessible;
   }
   CfiExprEvalContext;

/* Evaluate the CfiExpr rooted at ix in exprs given the context eec.
   *ok is set to False on failure, but not to True on success.  The
   caller must set it to True before calling. */
__attribute__((noinline))
static
UWord evalCfiExpr ( const XArray* exprs, Int ix, 
                    const CfiExprEvalContext* eec, Bool* ok )
{
   UWord w, wL, wR;
   Addr  a;
   const CfiExpr* e;
   vg_assert(sizeof(Addr) == sizeof(UWord));
   e = VG_(indexXA)( exprs, ix );
   switch (e->tag) {
      case Cex_Unop:
         w = evalCfiExpr( exprs, e->Cex.Unop.ix, eec, ok );
         if (!(*ok)) return 0;
         switch (e->Cex.Unop.op) {
            case Cunop_Abs: return (Word) w < 0 ? - w : w;
            case Cunop_Neg: return - (Word) w;
            case Cunop_Not: return ~ w;
            default: goto unhandled;
         }
         /*NOTREACHED*/
      case Cex_Binop:
         wL = evalCfiExpr( exprs, e->Cex.Binop.ixL, eec, ok );
         if (!(*ok)) return 0;
         wR = evalCfiExpr( exprs, e->Cex.Binop.ixR, eec, ok );
         if (!(*ok)) return 0;
         switch (e->Cex.Binop.op) {
            case Cbinop_Add: return wL + wR;
            case Cbinop_Sub: return wL - wR;
            case Cbinop_And: return wL & wR;
            case Cbinop_Mul: return wL * wR;
            case Cbinop_Shl: return wL << wR;
            case Cbinop_Shr: return wL >> wR;
            case Cbinop_Eq: return wL == wR ? 1 : 0;
            case Cbinop_Ge: return (Word) wL >= (Word) wR ? 1 : 0;
            case Cbinop_Gt: return (Word) wL > (Word) wR ? 1 : 0;
            case Cbinop_Le: return (Word) wL <= (Word) wR ? 1 : 0;
            case Cbinop_Lt: return (Word) wL < (Word) wR ? 1 : 0;
            case Cbinop_Ne: return wL != wR ? 1 : 0;
            default: goto unhandled;
         }
         /*NOTREACHED*/
      case Cex_CfiReg:
         switch (e->Cex.CfiReg.reg) {
#           if defined(VGA_x86) || defined(VGA_amd64)
            case Creg_IA_IP: return eec->uregs->xip;
            case Creg_IA_SP: return eec->uregs->xsp;
            case Creg_IA_BP: return eec->uregs->xbp;
#           elif defined(VGA_arm)
            case Creg_ARM_R15: return eec->uregs->r15;
            case Creg_ARM_R14: return eec->uregs->r14;
            case Creg_ARM_R13: return eec->uregs->r13;
            case Creg_ARM_R12: return eec->uregs->r12;
            case Creg_ARM_R7:  return eec->uregs->r7;
#           elif defined(VGA_s390x)
            case Creg_S390_IA: return eec->uregs->ia;
            case Creg_S390_SP: return eec->uregs->sp;
            case Creg_S390_FP: return eec->uregs->fp;
            case Creg_S390_LR: return eec->uregs->lr;
#           elif defined(VGA_mips32) || defined(VGA_mips64)
            case Creg_IA_IP: return eec->uregs->pc;
            case Creg_IA_SP: return eec->uregs->sp;
            case Creg_IA_BP: return eec->uregs->fp;
            case Creg_MIPS_RA: return eec->uregs->ra;
#           elif defined(VGA_ppc32) || defined(VGA_ppc64be) \
               || defined(VGA_ppc64le)
#           elif defined(VGP_arm64_linux)
            case Creg_ARM64_X30: return eec->uregs->x30;
#           elif defined(VGA_tilegx)
            case Creg_TILEGX_IP: return eec->uregs->pc;
            case Creg_TILEGX_SP: return eec->uregs->sp;
            case Creg_TILEGX_BP: return eec->uregs->fp;
            case Creg_TILEGX_LR: return eec->uregs->lr;
#           else
#             error "Unsupported arch"
#           endif
            default: goto unhandled;
         }
         /*NOTREACHED*/
      case Cex_Const:
         return e->Cex.Const.con;
      case Cex_Deref:
         a = evalCfiExpr( exprs, e->Cex.Deref.ixAddr, eec, ok );
         if (!(*ok)) return 0;
         if (a < eec->min_accessible
             || a > eec->max_accessible - sizeof(UWord) + 1) {
            *ok = False;
            return 0;
         }
         /* let's hope it doesn't trap! */
         return ML_(read_UWord)((void *)a);
      default: 
         goto unhandled;
   }
   /*NOTREACHED*/
  unhandled:
   VG_(printf)("\n\nevalCfiExpr: unhandled\n");
   ML_(ppCfiExpr)( exprs, ix );
   VG_(printf)("\n");
   vg_assert(0);
   /*NOTREACHED*/
   return 0;
}


/* Search all the DebugInfos in the entire system, to find the DiCfSI_m
   that pertains to 'ip'. 

   If found, set *diP to the DebugInfo in which it resides, and
   *cfsi_mP to the cfsi_m pointer in that DebugInfo's cfsi_m_pool.

   If not found, set *diP to (DebugInfo*)1 and *cfsi_mP to zero.
*/
__attribute__((noinline))
static void find_DiCfSI ( /*OUT*/DebugInfo** diP, 
                          /*OUT*/DiCfSI_m** cfsi_mP,
                          Addr ip )
{
   DebugInfo* di;
   Word       i = -1;

   static UWord n_search = 0;
   static UWord n_steps = 0;
   n_search++;

   if (0) VG_(printf)("search for %#lx\n", ip);

   for (di = debugInfo_list; di != NULL; di = di->next) {
      Word j;
      n_steps++;

      /* Use the per-DebugInfo summary address ranges to skip
         inapplicable DebugInfos quickly. */
      if (di->cfsi_used == 0)
         continue;
      if (ip < di->cfsi_minavma || ip > di->cfsi_maxavma)
         continue;

      /* It might be in this DebugInfo.  Search it. */
      j = ML_(search_one_cfitab)( di, ip );
      vg_assert(j >= -1 && j < (Word)di->cfsi_used);

      if (j != -1) {
         i = j;
         break; /* found it */
      }
   }

   if (i == -1) {

      /* we didn't find it. */
      *diP = (DebugInfo*)1;
      *cfsi_mP = 0;

   } else {

      /* found a di corresponding to ip. */
      /* ensure that di is 4-aligned (at least), so it can't possibly
         be equal to (DebugInfo*)1. */
      vg_assert(di && VG_IS_4_ALIGNED(di));
      *cfsi_mP = ML_(get_cfsi_m) (di, i);
      if (*cfsi_mP == NULL) {
         // This is a cfsi hole. Report no cfi information found.
         *diP = (DebugInfo*)1;
         // But we will still perform the hack below.
      } else {
         *diP = di;
      }

      /* Start of performance-enhancing hack: once every 64 (chosen
         hackily after profiling) successful searches, move the found
         DebugInfo one step closer to the start of the list.  This
         makes future searches cheaper.  For starting konqueror on
         amd64, this in fact reduces the total amount of searching
         done by the above find-the-right-DebugInfo loop by more than
         a factor of 20. */
      if ((n_search & 0xF) == 0) {
         /* Move di one step closer to the start of the list. */
         move_DebugInfo_one_step_forward( di );
      }
      /* End of performance-enhancing hack. */

      if (0 && ((n_search & 0x7FFFF) == 0))
         VG_(printf)("find_DiCfSI: %lu searches, "
                     "%lu DebugInfos looked at\n", 
                     n_search, n_steps);

   }

}


/* Now follows a mechanism for caching queries to find_DiCfSI, since
   they are extremely frequent on amd64-linux, during stack unwinding.

   Each cache entry binds an ip value to a (di, cfsi_m*) pair.  Possible
   values:

   di is non-null, cfsi_m* >= 0  ==>  cache slot in use, "cfsi_m*"
   di is (DebugInfo*)1           ==>  cache slot in use, no associated di
   di is NULL                    ==>  cache slot not in use

   Hence simply zeroing out the entire cache invalidates all
   entries.

   We can map an ip value directly to a (di, cfsi_m*) pair as
   once a DebugInfo is read, adding new DiCfSI_m* is not possible
   anymore, as the cfsi_m_pool is frozen once the reading is terminated.
   Also, the cache is invalidated when new debuginfo is read due to
   an mmap or some debuginfo is discarded due to an munmap. */

// Prime number, giving about 6Kbytes cache on 32 bits,
//                           12Kbytes cache on 64 bits.
#define N_CFSI_M_CACHE 509

typedef
   struct { Addr ip; DebugInfo* di; DiCfSI_m* cfsi_m; }
   CFSI_m_CacheEnt;

static CFSI_m_CacheEnt cfsi_m_cache[N_CFSI_M_CACHE];

static void cfsi_m_cache__invalidate ( void ) {
   VG_(memset)(&cfsi_m_cache, 0, sizeof(cfsi_m_cache));
   debuginfo_generation++;
}

UInt VG_(debuginfo_generation) (void)
{
   return debuginfo_generation;
}

static inline CFSI_m_CacheEnt* cfsi_m_cache__find ( Addr ip )
{
   UWord         hash = ip % N_CFSI_M_CACHE;
   CFSI_m_CacheEnt* ce = &cfsi_m_cache[hash];
   static UWord  n_q = 0, n_m = 0;

   n_q++;
   if (0 && 0 == (n_q & 0x1FFFFF))
      VG_(printf)("QQQ %lu %lu\n", n_q, n_m);

   if (LIKELY(ce->ip == ip) && LIKELY(ce->di != NULL)) {
      /* found an entry in the cache .. */
   } else {
      /* not found in cache.  Search and update. */
      n_m++;
      ce->ip = ip;
      find_DiCfSI( &ce->di, &ce->cfsi_m, ip );
   }

   if (UNLIKELY(ce->di == (DebugInfo*)1)) {
      /* no DiCfSI for this address */
      return NULL;
   } else {
      /* found a DiCfSI for this address */
      return ce;
   }
}


inline
static Addr compute_cfa ( const D3UnwindRegs* uregs,
                          Addr min_accessible, Addr max_accessible,
                          const DebugInfo* di, const DiCfSI_m* cfsi_m )
{
   CfiExprEvalContext eec;
   Addr               cfa;
   Bool               ok;

   /* Compute the CFA. */
   cfa = 0;
   switch (cfsi_m->cfa_how) {
#     if defined(VGA_x86) || defined(VGA_amd64)
      case CFIC_IA_SPREL: 
         cfa = cfsi_m->cfa_off + uregs->xsp;
         break;
      case CFIC_IA_BPREL: 
         cfa = cfsi_m->cfa_off + uregs->xbp;
         break;
#     elif defined(VGA_arm)
      case CFIC_ARM_R13REL: 
         cfa = cfsi_m->cfa_off + uregs->r13;
         break;
      case CFIC_ARM_R12REL: 
         cfa = cfsi_m->cfa_off + uregs->r12;
         break;
      case CFIC_ARM_R11REL: 
         cfa = cfsi_m->cfa_off + uregs->r11;
         break;
      case CFIC_ARM_R7REL: 
         cfa = cfsi_m->cfa_off + uregs->r7;
         break;
#     elif defined(VGA_s390x)
      case CFIC_IA_SPREL:
         cfa = cfsi_m->cfa_off + uregs->sp;
         break;
      case CFIR_MEMCFAREL:
      {
         Addr a = uregs->sp + cfsi_m->cfa_off;
         if (a < min_accessible || a > max_accessible-sizeof(Addr))
            break;
         cfa = ML_(read_Addr)((void *)a);
         break;
      }
      case CFIR_SAME:
         cfa = uregs->fp;
         break;
      case CFIC_IA_BPREL:
         cfa = cfsi_m->cfa_off + uregs->fp;
         break;
#     elif defined(VGA_mips32) || defined(VGA_mips64)
      case CFIC_IA_SPREL:
         cfa = cfsi_m->cfa_off + uregs->sp;
         break;
      case CFIR_SAME:
         cfa = uregs->fp;
         break;
      case CFIC_IA_BPREL:
         cfa = cfsi_m->cfa_off + uregs->fp;
         break;
#     elif defined(VGA_ppc32) || defined(VGA_ppc64be) || defined(VGA_ppc64le)
#     elif defined(VGP_arm64_linux)
      case CFIC_ARM64_SPREL: 
         cfa = cfsi_m->cfa_off + uregs->sp;
         break;
      case CFIC_ARM64_X29REL: 
         cfa = cfsi_m->cfa_off + uregs->x29;
         break;
#     elif defined(VGA_tilegx)
      case CFIC_IA_SPREL:
         cfa = cfsi_m->cfa_off + uregs->sp;
         break;
      case CFIR_SAME:
         cfa = uregs->fp;
         break;
      case CFIC_IA_BPREL:
         cfa = cfsi_m->cfa_off + uregs->fp;
         break;
#     else
#       error "Unsupported arch"
#     endif
      case CFIC_EXPR: /* available on all archs */
         if (0) {
            VG_(printf)("CFIC_EXPR: ");
            ML_(ppCfiExpr)(di->cfsi_exprs, cfsi_m->cfa_off);
            VG_(printf)("\n");
         }
         eec.uregs          = uregs;
         eec.min_accessible = min_accessible;
         eec.max_accessible = max_accessible;
         ok = True;
         cfa = evalCfiExpr(di->cfsi_exprs, cfsi_m->cfa_off, &eec, &ok );
         if (!ok) return 0;
         break;
      default: 
         vg_assert(0);
   }
   return cfa;
}


/* Get the call frame address (CFA) given an IP/SP/FP triple. */
/* NOTE: This function may rearrange the order of entries in the
   DebugInfo list. */
Addr ML_(get_CFA) ( Addr ip, Addr sp, Addr fp,
                    Addr min_accessible, Addr max_accessible )
{
   CFSI_m_CacheEnt* ce;

   ce = cfsi_m_cache__find(ip);

   if (UNLIKELY(ce == NULL))
      return 0; /* no info.  Nothing we can do. */

   /* Temporary impedance-matching kludge so that this keeps working
      on x86-linux and amd64-linux. */
#  if defined(VGA_x86) || defined(VGA_amd64)
   { D3UnwindRegs uregs;
     uregs.xip = ip;
     uregs.xsp = sp;
     uregs.xbp = fp;
     return compute_cfa(&uregs,
                        min_accessible,  max_accessible, ce->di, ce->cfsi_m);
   }
#elif defined(VGA_s390x)
   { D3UnwindRegs uregs;
     uregs.ia = ip;
     uregs.sp = sp;
     uregs.fp = fp;
     return compute_cfa(&uregs,
                        min_accessible,  max_accessible, ce->di, ce->cfsi_m);
   }
#elif defined(VGA_mips32) || defined(VGA_mips64) || defined(VGA_tilegx)
   { D3UnwindRegs uregs;
     uregs.pc = ip;
     uregs.sp = sp;
     uregs.fp = fp;
     return compute_cfa(&uregs,
                        min_accessible,  max_accessible, ce->di, ce->cfsi_m);
   }

#  else
   return 0; /* indicates failure */
#  endif
}

void VG_(ppUnwindInfo) (Addr from, Addr to)
{
   DebugInfo*         di;
   CFSI_m_CacheEnt*   ce;
   Addr ce_from;
   CFSI_m_CacheEnt*   next_ce;


   ce = cfsi_m_cache__find(from);
   ce_from = from;
   while (from <= to) {
      from++;
      next_ce = cfsi_m_cache__find(from);
      if ((ce == NULL && next_ce != NULL)
          || (ce != NULL && next_ce == NULL)
          || (ce != NULL && next_ce != NULL && ce->cfsi_m != next_ce->cfsi_m)
          || from > to) {
         if (ce == NULL) {
            VG_(printf)("[%#lx .. %#lx]: no CFI info\n", ce_from, from-1);
         } else {
            di = ce->di;
            ML_(ppDiCfSI)(di->cfsi_exprs,
                          ce_from, from - ce_from,
                          ce->cfsi_m);
         }
         ce = next_ce;
         ce_from = from;
      }
   }
}


/* The main function for DWARF2/3 CFI-based stack unwinding.  Given a
   set of registers in UREGS, modify it to hold the register values
   for the previous frame, if possible.  Returns True if successful.
   If not successful, *UREGS is not changed.

   For x86 and amd64, the unwound registers are: {E,R}IP,
   {E,R}SP, {E,R}BP.

   For arm, the unwound registers are: R7 R11 R12 R13 R14 R15.

   For arm64, the unwound registers are: X29(FP) X30(LR) SP PC.
*/
Bool VG_(use_CF_info) ( /*MOD*/D3UnwindRegs* uregsHere,
                        Addr min_accessible,
                        Addr max_accessible )
{
   DebugInfo*         di;
   DiCfSI_m*          cfsi_m = NULL;
   Addr               cfa, ipHere = 0;
   CFSI_m_CacheEnt*   ce;
   CfiExprEvalContext eec __attribute__((unused));
   D3UnwindRegs       uregsPrev;

#  if defined(VGA_x86) || defined(VGA_amd64)
   ipHere = uregsHere->xip;
#  elif defined(VGA_arm)
   ipHere = uregsHere->r15;
#  elif defined(VGA_s390x)
   ipHere = uregsHere->ia;
#  elif defined(VGA_mips32) || defined(VGA_mips64)
   ipHere = uregsHere->pc;
#  elif defined(VGA_ppc32) || defined(VGA_ppc64be) || defined(VGA_ppc64le)
#  elif defined(VGP_arm64_linux)
   ipHere = uregsHere->pc;
#  elif defined(VGA_tilegx)
   ipHere = uregsHere->pc;
#  else
#    error "Unknown arch"
#  endif
   ce = cfsi_m_cache__find(ipHere);

   if (UNLIKELY(ce == NULL))
      return False; /* no info.  Nothing we can do. */

   di = ce->di;
   cfsi_m = ce->cfsi_m;

   if (0) {
      VG_(printf)("found cfsi_m (but printing fake base/len): "); 
      ML_(ppDiCfSI)(di->cfsi_exprs, 0, 0, cfsi_m);
   }

   VG_(bzero_inline)(&uregsPrev, sizeof(uregsPrev));

   /* First compute the CFA. */
   cfa = compute_cfa(uregsHere,
                     min_accessible, max_accessible, di, cfsi_m);
   if (UNLIKELY(cfa == 0))
      return False;

   /* Now we know the CFA, use it to roll back the registers we're
      interested in. */

#  define COMPUTE(_prev, _here, _how, _off)             \
      do {                                              \
         switch (_how) {                                \
            case CFIR_UNKNOWN:                          \
               return False;                            \
            case CFIR_SAME:                             \
               _prev = _here; break;                    \
            case CFIR_MEMCFAREL: {                      \
               Addr a = cfa + (Word)_off;               \
               if (a < min_accessible                   \
                   || a > max_accessible-sizeof(Addr))  \
                  return False;                         \
               _prev = ML_(read_Addr)((void *)a);       \
               break;                                   \
            }                                           \
            case CFIR_CFAREL:                           \
               _prev = cfa + (Word)_off;                \
               break;                                   \
            case CFIR_EXPR:                             \
               if (0)                                   \
                  ML_(ppCfiExpr)(di->cfsi_exprs,_off);  \
               eec.uregs = uregsHere;                   \
               eec.min_accessible = min_accessible;     \
               eec.max_accessible = max_accessible;     \
               Bool ok = True;                          \
               _prev = evalCfiExpr(di->cfsi_exprs, _off, &eec, &ok ); \
               if (!ok) return False;                   \
               break;                                   \
            default:                                    \
               vg_assert(0);                            \
         }                                              \
      } while (0)

#  if defined(VGA_x86) || defined(VGA_amd64)
   COMPUTE(uregsPrev.xip, uregsHere->xip, cfsi_m->ra_how, cfsi_m->ra_off);
   COMPUTE(uregsPrev.xsp, uregsHere->xsp, cfsi_m->sp_how, cfsi_m->sp_off);
   COMPUTE(uregsPrev.xbp, uregsHere->xbp, cfsi_m->bp_how, cfsi_m->bp_off);
#  elif defined(VGA_arm)
   COMPUTE(uregsPrev.r15, uregsHere->r15, cfsi_m->ra_how,  cfsi_m->ra_off);
   COMPUTE(uregsPrev.r14, uregsHere->r14, cfsi_m->r14_how, cfsi_m->r14_off);
   COMPUTE(uregsPrev.r13, uregsHere->r13, cfsi_m->r13_how, cfsi_m->r13_off);
   COMPUTE(uregsPrev.r12, uregsHere->r12, cfsi_m->r12_how, cfsi_m->r12_off);
   COMPUTE(uregsPrev.r11, uregsHere->r11, cfsi_m->r11_how, cfsi_m->r11_off);
   COMPUTE(uregsPrev.r7,  uregsHere->r7,  cfsi_m->r7_how,  cfsi_m->r7_off);
#  elif defined(VGA_s390x)
   COMPUTE(uregsPrev.ia, uregsHere->ia, cfsi_m->ra_how, cfsi_m->ra_off);
   COMPUTE(uregsPrev.sp, uregsHere->sp, cfsi_m->sp_how, cfsi_m->sp_off);
   COMPUTE(uregsPrev.fp, uregsHere->fp, cfsi_m->fp_how, cfsi_m->fp_off);
#  elif defined(VGA_mips32) || defined(VGA_mips64)
   COMPUTE(uregsPrev.pc, uregsHere->pc, cfsi_m->ra_how, cfsi_m->ra_off);
   COMPUTE(uregsPrev.sp, uregsHere->sp, cfsi_m->sp_how, cfsi_m->sp_off);
   COMPUTE(uregsPrev.fp, uregsHere->fp, cfsi_m->fp_how, cfsi_m->fp_off);
#  elif defined(VGA_ppc32) || defined(VGA_ppc64be) || defined(VGA_ppc64le)
#  elif defined(VGP_arm64_linux)
   COMPUTE(uregsPrev.pc,  uregsHere->pc,  cfsi_m->ra_how,  cfsi_m->ra_off);
   COMPUTE(uregsPrev.sp,  uregsHere->sp,  cfsi_m->sp_how,  cfsi_m->sp_off);
   COMPUTE(uregsPrev.x30, uregsHere->x30, cfsi_m->x30_how, cfsi_m->x30_off);
   COMPUTE(uregsPrev.x29, uregsHere->x29, cfsi_m->x29_how, cfsi_m->x29_off);
#  elif defined(VGA_tilegx)
   COMPUTE(uregsPrev.pc, uregsHere->pc, cfsi_m->ra_how, cfsi_m->ra_off);
   COMPUTE(uregsPrev.sp, uregsHere->sp, cfsi_m->sp_how, cfsi_m->sp_off);
   COMPUTE(uregsPrev.fp, uregsHere->fp, cfsi_m->fp_how, cfsi_m->fp_off);
#  else
#    error "Unknown arch"
#  endif

#  undef COMPUTE

   *uregsHere = uregsPrev;
   return True;
}


/*--------------------------------------------------------------*/
/*---                                                        ---*/
/*--- TOP LEVEL: FOR UNWINDING THE STACK USING               ---*/
/*---            MSVC FPO INFO                               ---*/
/*---                                                        ---*/
/*--------------------------------------------------------------*/

Bool VG_(use_FPO_info) ( /*MOD*/Addr* ipP,
                         /*MOD*/Addr* spP,
                         /*MOD*/Addr* fpP,
                         Addr min_accessible,
                         Addr max_accessible )
{
   Word       i;
   const DebugInfo* di;
   FPO_DATA*  fpo = NULL;
   Addr       spHere;

   static UWord n_search = 0;
   static UWord n_steps = 0;
   n_search++;

   if (0) VG_(printf)("search FPO for %#lx\n", *ipP);

   for (di = debugInfo_list; di != NULL; di = di->next) {
      n_steps++;

      /* Use the per-DebugInfo summary address ranges to skip
         inapplicable DebugInfos quickly. */
      if (di->fpo == NULL)
         continue;
      if (*ipP < di->fpo_minavma || *ipP > di->fpo_maxavma)
         continue;

      i = ML_(search_one_fpotab)( di, *ipP );
      if (i != -1) {
         Word j;
         if (0) {
            /* debug printing only */
            VG_(printf)("look for %#lx  size %lu i %ld\n",
                        *ipP, di->fpo_size, i);
            for (j = 0; j < di->fpo_size; j++)
               VG_(printf)("[%02ld] %#x %u\n",
                            j, di->fpo[j].ulOffStart, di->fpo[j].cbProcSize);
         }
         vg_assert(i >= 0 && i < di->fpo_size);
         fpo = &di->fpo[i];
         break;
      }
   }

   if (fpo == NULL)
      return False;

   if (0 && ((n_search & 0x7FFFF) == 0))
      VG_(printf)("VG_(use_FPO_info): %lu searches, "
                  "%lu DebugInfos looked at\n",
                  n_search, n_steps);


   /* Start of performance-enhancing hack: once every 64 (chosen
      hackily after profiling) successful searches, move the found
      DebugInfo one step closer to the start of the list.  This makes
      future searches cheaper.  For starting konqueror on amd64, this
      in fact reduces the total amount of searching done by the above
      find-the-right-DebugInfo loop by more than a factor of 20. */
   if ((n_search & 0x3F) == 0) {
      /* Move si one step closer to the start of the list. */
      //move_DebugInfo_one_step_forward( di );
   }
   /* End of performance-enhancing hack. */

   if (0) {
      VG_(printf)("found fpo: ");
      //ML_(ppFPO)(fpo);
   }

   /*
   Stack layout is:
   %esp->
      4*.cbRegs  {%edi, %esi, %ebp, %ebx}
      4*.cdwLocals
      return_pc
      4*.cdwParams
   prior_%esp->

   Typical code looks like:
      sub $4*.cdwLocals,%esp
         Alternative to above for >=4KB (and sometimes for smaller):
            mov $size,%eax
            call __chkstk  # WinNT performs page-by-page probe!
               __chkstk is much like alloc(), except that on return
               %eax= 5+ &CALL.  Thus it could be used as part of
               Position Independent Code to locate the Global Offset Table.
      push %ebx
      push %ebp
      push %esi
         Other once-only instructions often scheduled >here<.
      push %edi

   If the pc is within the first .cbProlog bytes of the function,
   then you must disassemble to see how many registers have been pushed,
   because instructions in the prolog may be scheduled for performance.
   The order of PUSH is always %ebx, %ebp, %esi, %edi, with trailing
   registers not pushed when .cbRegs < 4.  This seems somewhat strange
   because %ebp is the register whose usage you want to minimize,
   yet it is in the first half of the PUSH list.

   I don't know what happens when the compiler constructs an outgoing CALL.
   %esp could move if outgoing parameters are PUSHed, and this affects
   traceback for errors during the PUSHes. */
 
   spHere = *spP;

   *ipP = ML_(read_Addr)((void *)(spHere + 4*(fpo->cbRegs + fpo->cdwLocals)));
   *spP =                         spHere + 4*(fpo->cbRegs + fpo->cdwLocals + 1 
                                                          + fpo->cdwParams);
   *fpP = ML_(read_Addr)((void *)(spHere + 4*2));
   return True;
}

Bool VG_(FPO_info_present)(void)
{
   const DebugInfo* di;
   for (di = debugInfo_list; di != NULL; di = di->next) {
      if (di->fpo != NULL)
         return True;
   }
   return False;
}


/*--------------------------------------------------------------*/
/*---                                                        ---*/
/*--- TOP LEVEL: GENERATE DESCRIPTION OF DATA ADDRESSES      ---*/
/*---            FROM DWARF3 DEBUG INFO                      ---*/
/*---                                                        ---*/
/*--------------------------------------------------------------*/

/* Try to make p2XA(dst, fmt, args..) turn into
   VG_(xaprintf)(dst, fmt, args) without having to resort to
   vararg macros.  As usual with everything to do with varargs, it's
   an ugly hack.

   //#define p2XA(dstxa, format, args...)
   //   VG_(xaprintf)(dstxa, format, ##args)
*/
#define  p2XA  VG_(xaprintf)

/* Add a zero-terminating byte to DST, which must be an XArray* of
   HChar. */
static void zterm_XA ( XArray* dst )
{
   HChar zero = 0;
   (void) VG_(addBytesToXA)( dst, &zero, 1 );
}


/* Evaluate the location expression/list for var, to see whether or
   not data_addr falls within the variable.  If so also return the
   offset of data_addr from the start of the variable.  Note that
   regs, which supplies ip,sp,fp values, will be NULL for global
   variables, and non-NULL for local variables. */
static Bool data_address_is_in_var ( /*OUT*/PtrdiffT* offset,
                                     const XArray* /* TyEnt */ tyents,
                                     const DiVariable*   var,
                                     const RegSummary*   regs,
                                     Addr  data_addr,
                                     const DebugInfo* di )
{
   MaybeULong mul;
   SizeT      var_szB;
   GXResult   res;
   Bool       show = False;

   vg_assert(var->name);
   vg_assert(var->gexpr);

   /* Figure out how big the variable is. */
   mul = ML_(sizeOfType)(tyents, var->typeR);
   /* If this var has a type whose size is unknown, zero, or
      impossibly large, it should never have been added.  ML_(addVar)
      should have rejected it. */
   vg_assert(mul.b == True);
   vg_assert(mul.ul > 0);
   if (sizeof(void*) == 4) vg_assert(mul.ul < (1ULL << 32));
   /* After this point, we assume we can truncate mul.ul to a host word
      safely (without loss of info). */

   var_szB = (SizeT)mul.ul; /* NB: truncate to host word */

   if (show) {
      VG_(printf)("VVVV: data_address_%#lx_is_in_var: %s :: ",
                  data_addr, var->name );
      ML_(pp_TyEnt_C_ishly)( tyents, var->typeR );
      VG_(printf)("\n");
   }

   /* ignore zero-sized vars; they can never match anything. */
   if (var_szB == 0) {
      if (show)
         VG_(printf)("VVVV: -> Fail (variable is zero sized)\n");
      return False;
   }

   res = ML_(evaluate_GX)( var->gexpr, var->fbGX, regs, di );

   if (show) {
      VG_(printf)("VVVV: -> ");
      ML_(pp_GXResult)( res );
      VG_(printf)("\n");
   }

   if (res.kind == GXR_Addr 
       && res.word <= data_addr
       && data_addr < res.word + var_szB) {
      *offset = data_addr - res.word;
      return True;
   } else {
      return False;
   }
}


/* Format the acquired information into DN(AME)1 and DN(AME)2, which
   are XArray*s of HChar, that have been initialised by the caller.
   Resulting strings will be zero terminated.  Information is
   formatted in an understandable way.  Not so easy.  If frameNo is
   -1, this is assumed to be a global variable; else a local
   variable. */
static void format_message ( /*MOD*/XArray* /* of HChar */ dn1,
                             /*MOD*/XArray* /* of HChar */ dn2,
                             Addr     data_addr,
                             const DebugInfo* di,
                             const DiVariable* var,
                             PtrdiffT var_offset,
                             PtrdiffT residual_offset,
                             const XArray* /*HChar*/ described,
                             Int      frameNo, 
                             ThreadId tid )
{
   Bool   have_descr, have_srcloc;
   Bool   xml       = VG_(clo_xml);
   const HChar* vo_plural = var_offset == 1 ? "" : "s";
   const HChar* ro_plural = residual_offset == 1 ? "" : "s";
   const HChar* basetag   = "auxwhat"; /* a constant */
   HChar tagL[32], tagR[32], xagL[32], xagR[32];
   const HChar *fileName = ML_(fndn_ix2filename)(di, var->fndn_ix);
   // fileName will be "???" if var->fndn_ix == 0.
   // fileName will only be used if have_descr is True.

   if (frameNo < -1) {
      vg_assert(0); /* Not allowed */
   }
   else if (frameNo == -1) {
      vg_assert(tid == VG_INVALID_THREADID);
   }
   else /* (frameNo >= 0) */ {
      vg_assert(tid != VG_INVALID_THREADID);
   }

   vg_assert(dn1 && dn2);
   vg_assert(described);
   vg_assert(var && var->name);
   have_descr = VG_(sizeXA)(described) > 0
                && *(HChar*)VG_(indexXA)(described,0) != '\0';
   have_srcloc = var->fndn_ix > 0 && var->lineNo > 0;

   tagL[0] = tagR[0] = xagL[0] = xagR[0] = 0;
   if (xml) {
      VG_(sprintf)(tagL, "<%s>",   basetag); // <auxwhat>
      VG_(sprintf)(tagR, "</%s>",  basetag); // </auxwhat>
      VG_(sprintf)(xagL, "<x%s>",  basetag); // <xauxwhat>
      VG_(sprintf)(xagR, "</x%s>", basetag); // </xauxwhat>
   }

#  define TAGL(_xa) p2XA(_xa, "%s", tagL)
#  define TAGR(_xa) p2XA(_xa, "%s", tagR)
#  define XAGL(_xa) p2XA(_xa, "%s", xagL)
#  define XAGR(_xa) p2XA(_xa, "%s", xagR)
#  define TXTL(_xa) p2XA(_xa, "%s", "<text>")
#  define TXTR(_xa) p2XA(_xa, "%s", "</text>")

   /* ------ local cases ------ */

   if ( frameNo >= 0 && (!have_srcloc) && (!have_descr) ) {
      /* no srcloc, no description:
         Location 0x7fefff6cf is 543 bytes inside local var "a",
         in frame #1 of thread 1
      */
      if (xml) {
         TAGL( dn1 );
         p2XA( dn1,
               "Location 0x%lx is %ld byte%s inside local var \"%pS\",",
               data_addr, var_offset, vo_plural, var->name );
         TAGR( dn1 );
         TAGL( dn2 );
         p2XA( dn2,
               "in frame #%d of thread %u", frameNo, tid );
         TAGR( dn2 );
      } else {
         p2XA( dn1,
               "Location 0x%lx is %ld byte%s inside local var \"%s\",",
               data_addr, var_offset, vo_plural, var->name );
         p2XA( dn2,
               "in frame #%d of thread %u", frameNo, tid );
      }
   } 
   else
   if ( frameNo >= 0 && have_srcloc && (!have_descr) ) {
      /* no description:
         Location 0x7fefff6cf is 543 bytes inside local var "a"
         declared at dsyms7.c:17, in frame #1 of thread 1
      */
      if (xml) {
         TAGL( dn1 );
         p2XA( dn1,
               "Location 0x%lx is %ld byte%s inside local var \"%pS\"",
               data_addr, var_offset, vo_plural, var->name );
         TAGR( dn1 );
         XAGL( dn2 );
         TXTL( dn2 );
         p2XA( dn2,
               "declared at %pS:%d, in frame #%d of thread %u",
               fileName, var->lineNo, frameNo, tid );
         TXTR( dn2 );
         // FIXME: also do <dir>
         p2XA( dn2,
               " <file>%pS</file> <line>%d</line> ", 
               fileName, var->lineNo );
         XAGR( dn2 );
      } else {
         p2XA( dn1,
               "Location 0x%lx is %ld byte%s inside local var \"%s\"",
               data_addr, var_offset, vo_plural, var->name );
         p2XA( dn2,
               "declared at %s:%d, in frame #%d of thread %u",
               fileName, var->lineNo, frameNo, tid );
      }
   }
   else
   if ( frameNo >= 0 && (!have_srcloc) && have_descr ) {
      /* no srcloc:
         Location 0x7fefff6cf is 2 bytes inside a[3].xyzzy[21].c2
         in frame #1 of thread 1
      */
      if (xml) {
         TAGL( dn1 );
         p2XA( dn1,
               "Location 0x%lx is %ld byte%s inside %pS%pS",
               data_addr, residual_offset, ro_plural, var->name,
               (HChar*)(VG_(indexXA)(described,0)) );
         TAGR( dn1 );
         TAGL( dn2 );
         p2XA( dn2,
               "in frame #%d of thread %u", frameNo, tid );
         TAGR( dn2 );
      } else {
         p2XA( dn1,
               "Location 0x%lx is %ld byte%s inside %s%s",
               data_addr, residual_offset, ro_plural, var->name,
               (HChar*)(VG_(indexXA)(described,0)) );
         p2XA( dn2,
               "in frame #%d of thread %u", frameNo, tid );
      }
   } 
   else
   if ( frameNo >= 0 && have_srcloc && have_descr ) {
      /* Location 0x7fefff6cf is 2 bytes inside a[3].xyzzy[21].c2,
         declared at dsyms7.c:17, in frame #1 of thread 1 */
      if (xml) {
         TAGL( dn1 );
         p2XA( dn1,
               "Location 0x%lx is %ld byte%s inside %pS%pS,",
               data_addr, residual_offset, ro_plural, var->name,
               (HChar*)(VG_(indexXA)(described,0)) );
         TAGR( dn1 );
         XAGL( dn2 );
         TXTL( dn2 );
         p2XA( dn2,
               "declared at %pS:%d, in frame #%d of thread %u",
               fileName, var->lineNo, frameNo, tid );
         TXTR( dn2 );
         // FIXME: also do <dir>
         p2XA( dn2,
               " <file>%pS</file> <line>%d</line> ",
               fileName, var->lineNo );
         XAGR( dn2 );
      } else {
         p2XA( dn1,
               "Location 0x%lx is %ld byte%s inside %s%s,",
               data_addr, residual_offset, ro_plural, var->name,
               (HChar*)(VG_(indexXA)(described,0)) );
         p2XA( dn2,
               "declared at %s:%d, in frame #%d of thread %u",
               fileName, var->lineNo, frameNo, tid );
      }
   }
   else
   /* ------ global cases ------ */
   if ( frameNo >= -1 && (!have_srcloc) && (!have_descr) ) {
      /* no srcloc, no description:
         Location 0x7fefff6cf is 543 bytes inside global var "a"
      */
      if (xml) {
         TAGL( dn1 );
         p2XA( dn1,
               "Location 0x%lx is %ld byte%s inside global var \"%pS\"",
               data_addr, var_offset, vo_plural, var->name );
         TAGR( dn1 );
      } else {
         p2XA( dn1,
               "Location 0x%lx is %ld byte%s inside global var \"%s\"",
               data_addr, var_offset, vo_plural, var->name );
      }
   } 
   else
   if ( frameNo >= -1 && have_srcloc && (!have_descr) ) {
      /* no description:
         Location 0x7fefff6cf is 543 bytes inside global var "a"
         declared at dsyms7.c:17
      */
      if (xml) {
         TAGL( dn1 );
         p2XA( dn1,
               "Location 0x%lx is %ld byte%s inside global var \"%pS\"",
               data_addr, var_offset, vo_plural, var->name );
         TAGR( dn1 );
         XAGL( dn2 );
         TXTL( dn2 );
         p2XA( dn2,
               "declared at %pS:%d",
               fileName, var->lineNo);
         TXTR( dn2 );
         // FIXME: also do <dir>
         p2XA( dn2,
               " <file>%pS</file> <line>%d</line> ",
               fileName, var->lineNo );
         XAGR( dn2 );
      } else {
         p2XA( dn1,
               "Location 0x%lx is %ld byte%s inside global var \"%s\"",
               data_addr, var_offset, vo_plural, var->name );
         p2XA( dn2,
               "declared at %s:%d",
               fileName, var->lineNo);
      }
   }
   else
   if ( frameNo >= -1 && (!have_srcloc) && have_descr ) {
      /* no srcloc:
         Location 0x7fefff6cf is 2 bytes inside a[3].xyzzy[21].c2,
         a global variable
      */
      if (xml) {
         TAGL( dn1 );
         p2XA( dn1,
               "Location 0x%lx is %ld byte%s inside %pS%pS,",
               data_addr, residual_offset, ro_plural, var->name,
               (HChar*)(VG_(indexXA)(described,0)) );
         TAGR( dn1 );
         TAGL( dn2 );
         p2XA( dn2,
               "a global variable");
         TAGR( dn2 );
      } else {
         p2XA( dn1,
               "Location 0x%lx is %ld byte%s inside %s%s,",
               data_addr, residual_offset, ro_plural, var->name,
               (HChar*)(VG_(indexXA)(described,0)) );
         p2XA( dn2,
               "a global variable");
      }
   } 
   else
   if ( frameNo >= -1 && have_srcloc && have_descr ) {
      /* Location 0x7fefff6cf is 2 bytes inside a[3].xyzzy[21].c2,
         a global variable declared at dsyms7.c:17 */
      if (xml) {
         TAGL( dn1 );
         p2XA( dn1,
               "Location 0x%lx is %ld byte%s inside %pS%pS,",
               data_addr, residual_offset, ro_plural, var->name,
               (HChar*)(VG_(indexXA)(described,0)) );
         TAGR( dn1 );
         XAGL( dn2 );
         TXTL( dn2 );
         p2XA( dn2,
               "a global variable declared at %pS:%d",
               fileName, var->lineNo);
         TXTR( dn2 );
         // FIXME: also do <dir>
         p2XA( dn2,
               " <file>%pS</file> <line>%d</line> ",
               fileName, var->lineNo );
         XAGR( dn2 );
      } else {
         p2XA( dn1,
               "Location 0x%lx is %ld byte%s inside %s%s,",
               data_addr, residual_offset, ro_plural, var->name,
               (HChar*)(VG_(indexXA)(described,0)) );
         p2XA( dn2,
               "a global variable declared at %s:%d",
               fileName, var->lineNo);
      }
   }
   else 
      vg_assert(0);

   /* Zero terminate both strings */
   zterm_XA( dn1 );
   zterm_XA( dn2 );

#  undef TAGL
#  undef TAGR
#  undef XAGL
#  undef XAGR
#  undef TXTL
#  undef TXTR
}


/* Determine if data_addr is a local variable in the frame
   characterised by (ip,sp,fp), and if so write its description at the
   ends of DNAME{1,2}, which are XArray*s of HChar, that have been
   initialised by the caller, zero terminate both, and return True.
   If it's not a local variable in said frame, return False. */
static 
Bool consider_vars_in_frame ( /*MOD*/XArray* /* of HChar */ dname1,
                              /*MOD*/XArray* /* of HChar */ dname2,
                              Addr data_addr,
                              Addr ip, Addr sp, Addr fp,
                              /* shown to user: */
                              ThreadId tid, Int frameNo )
{
   Word       i;
   DebugInfo* di;
   RegSummary regs;
   Bool debug = False;

   static UInt n_search = 0;
   static UInt n_steps = 0;
   n_search++;
   if (debug)
      VG_(printf)("QQQQ: cvif: ip,sp,fp %#lx,%#lx,%#lx\n", ip,sp,fp);
   /* first, find the DebugInfo that pertains to 'ip'. */
   for (di = debugInfo_list; di; di = di->next) {
      n_steps++;
      /* text segment missing? unlikely, but handle it .. */
      if (!di->text_present || di->text_size == 0)
         continue;
      /* Ok.  So does this text mapping bracket the ip? */
      if (di->text_avma <= ip && ip < di->text_avma + di->text_size)
         break;
   }
 
   /* Didn't find it.  Strange -- means ip is a code address outside
      of any mapped text segment.  Unlikely but not impossible -- app
      could be generating code to run. */
   if (!di)
      return False;

   if (0 && ((n_search & 0x1) == 0))
      VG_(printf)("consider_vars_in_frame: %u searches, "
                  "%u DebugInfos looked at\n", 
                  n_search, n_steps);
   /* Start of performance-enhancing hack: once every ??? (chosen
      hackily after profiling) successful searches, move the found
      DebugInfo one step closer to the start of the list.  This makes
      future searches cheaper. */
   if ((n_search & 0xFFFF) == 0) {
      /* Move si one step closer to the start of the list. */
      move_DebugInfo_one_step_forward( di );
   }
   /* End of performance-enhancing hack. */

   /* any var info at all? */
   if (!di->varinfo)
      return False;

   /* Work through the scopes from most deeply nested outwards,
      looking for code address ranges that bracket 'ip'.  The
      variables on each such address range found are in scope right
      now.  Don't descend to level zero as that is the global
      scope. */
   regs.ip = ip;
   regs.sp = sp;
   regs.fp = fp;

   /* "for each scope, working outwards ..." */
   for (i = VG_(sizeXA)(di->varinfo) - 1; i >= 1; i--) {
      XArray*      vars;
      Word         j;
      DiAddrRange* arange;
      OSet*        this_scope 
         = *(OSet**)VG_(indexXA)( di->varinfo, i );
      if (debug)
         VG_(printf)("QQQQ:   considering scope %ld\n", (Word)i);
      if (!this_scope)
         continue;
      /* Find the set of variables in this scope that
         bracket the program counter. */
      arange = VG_(OSetGen_LookupWithCmp)(
                  this_scope, &ip, 
                  ML_(cmp_for_DiAddrRange_range)
               );
      if (!arange)
         continue;
      /* stay sane */
      vg_assert(arange->aMin <= arange->aMax);
      /* It must bracket the ip we asked for, else
         ML_(cmp_for_DiAddrRange_range) is somehow broken. */
      vg_assert(arange->aMin <= ip && ip <= arange->aMax);
      /* It must have an attached XArray of DiVariables. */
      vars = arange->vars;
      vg_assert(vars);
      /* But it mustn't cover the entire address range.  We only
         expect that to happen for the global scope (level 0), which
         we're not looking at here.  Except, it may cover the entire
         address range, but in that case the vars array must be
         empty. */
      vg_assert(! (arange->aMin == (Addr)0
                   && arange->aMax == ~(Addr)0
                   && VG_(sizeXA)(vars) > 0) );
      for (j = 0; j < VG_(sizeXA)( vars ); j++) {
         DiVariable* var = (DiVariable*)VG_(indexXA)( vars, j );
         PtrdiffT    offset;
         if (debug)
            VG_(printf)("QQQQ:    var:name=%s %#lx-%#lx %#lx\n",
                        var->name,arange->aMin,arange->aMax,ip);
         if (data_address_is_in_var( &offset, di->admin_tyents,
                                     var, &regs,
                                     data_addr, di )) {
            PtrdiffT residual_offset = 0;
            XArray* described = ML_(describe_type)( &residual_offset,
                                                    di->admin_tyents, 
                                                    var->typeR, offset );
            format_message( dname1, dname2,
                            data_addr, di, var, offset, residual_offset,
                            described, frameNo, tid );
            VG_(deleteXA)( described );
            return True;
         }
      }
   }

   return False;
}


// pgbovine - copied and pasted from consider_vars_in_frame above
Bool VG_(pg_traverse_local_var) (const HChar* varname, Addr data_addr,
                                 Addr ip, Addr sp, Addr fp,
                                 Bool is_static, /* True if this is a static var declared within a function */
                                 int is_mem_defined_func(Addr, SizeT, Addr*, UInt*),
                                 OSet* encoded_addrs, Bool prefix_with_comma, VgFile* trace_fp)
{
   Word       i;
   DebugInfo* di;
   RegSummary regs;
   Bool debug = False;

   static UInt n_search = 0;
   static UInt n_steps = 0;
   n_search++;
   if (debug)
      VG_(printf)("QQQQ: cvif: ip,sp,fp %#lx,%#lx,%#lx\n", ip,sp,fp);
   /* first, find the DebugInfo that pertains to 'ip'. */
   for (di = debugInfo_list; di; di = di->next) {
      n_steps++;
      /* text segment missing? unlikely, but handle it .. */
      if (!di->text_present || di->text_size == 0)
         continue;
      /* Ok.  So does this text mapping bracket the ip? */
      if (di->text_avma <= ip && ip < di->text_avma + di->text_size)
         break;
   }
 
   /* Didn't find it.  Strange -- means ip is a code address outside
      of any mapped text segment.  Unlikely but not impossible -- app
      could be generating code to run. */
   if (!di)
      return False;

   if (0 && ((n_search & 0x1) == 0))
      VG_(printf)("consider_vars_in_frame: %u searches, "
                  "%u DebugInfos looked at\n", 
                  n_search, n_steps);
   /* Start of performance-enhancing hack: once every ??? (chosen
      hackily after profiling) successful searches, move the found
      DebugInfo one step closer to the start of the list.  This makes
      future searches cheaper. */
   if ((n_search & 0xFFFF) == 0) {
      /* Move si one step closer to the start of the list. */
      move_DebugInfo_one_step_forward( di );
   }
   /* End of performance-enhancing hack. */

   /* any var info at all? */
   if (!di->varinfo)
      return False;

   /* Work through the scopes from most deeply nested outwards,
      looking for code address ranges that bracket 'ip'.  The
      variables on each such address range found are in scope right
      now.  Don't descend to level zero as that is the global
      scope. */
   regs.ip = ip;
   regs.sp = sp;
   regs.fp = fp;

   /* "for each scope, working outwards ..." */
   for (i = VG_(sizeXA)(di->varinfo) - 1; i >= 1; i--) {
      XArray*      vars;
      Word         j;
      DiAddrRange* arange;
      OSet*        this_scope 
         = *(OSet**)VG_(indexXA)( di->varinfo, i );
      if (debug)
         VG_(printf)("QQQQ:   considering scope %ld\n", (Word)i);
      if (!this_scope)
         continue;
      /* Find the set of variables in this scope that
         bracket the program counter. */
      arange = VG_(OSetGen_LookupWithCmp)(
                  this_scope, &ip, 
                  ML_(cmp_for_DiAddrRange_range)
               );
      if (!arange)
         continue;
      /* stay sane */
      vg_assert(arange->aMin <= arange->aMax);
      /* It must bracket the ip we asked for, else
         ML_(cmp_for_DiAddrRange_range) is somehow broken. */
      vg_assert(arange->aMin <= ip && ip <= arange->aMax);
      /* It must have an attached XArray of DiVariables. */
      vars = arange->vars;
      vg_assert(vars);
      /* But it mustn't cover the entire address range.  We only
         expect that to happen for the global scope (level 0), which
         we're not looking at here.  Except, it may cover the entire
         address range, but in that case the vars array must be
         empty. */
      vg_assert(! (arange->aMin == (Addr)0
                   && arange->aMax == ~(Addr)0
                   && VG_(sizeXA)(vars) > 0) );
      for (j = 0; j < VG_(sizeXA)( vars ); j++) {
         DiVariable* var = (DiVariable*)VG_(indexXA)( vars, j );
         PtrdiffT    offset;
         if (debug)
            VG_(printf)("QQQQ:    var:name=%s %#lx-%#lx %#lx\n",
                        var->name,arange->aMin,arange->aMax,ip);
         if (data_address_is_in_var( &offset, di->admin_tyents,
                                     var,
                                     // super tricky! if is_static, then don't
                                     // pass anything as RegSummary, which will
                                     // force a lookup in GLOBAL scope, which is
                                     // correct since static vars are 'global' (#tricky)
                                     is_static ? NULL : &regs,
                                     data_addr, di )) {
            // pgbovine
            if (prefix_with_comma) { // only do this on a successful print!
              VG_(fprintf)(trace_fp, ",");
            }

            if (is_static) {
              VG_(fprintf)(trace_fp, "  \"%s (static %p)\": ", varname, data_addr);
            } else {
              VG_(fprintf)(trace_fp, "  \"%s\": ", varname);
            }
            ML_(pg_pp_varinfo)(di->admin_tyents, var->typeR, data_addr,
                               is_mem_defined_func, encoded_addrs, trace_fp);
            VG_(fprintf)(trace_fp, "\n");

            return True;
         }
      }
   }

   return False;
}


/* Try to form some description of DATA_ADDR by looking at the DWARF3
   debug info we have.  This considers all global variables, and 8
   frames in the stacks of all threads.  Result is written at the ends
   of DNAME{1,2}V, which are XArray*s of HChar, that have been
   initialised by the caller, and True is returned.  If no description
   is created, False is returned.  Regardless of the return value,
   DNAME{1,2}V are guaranteed to be zero terminated after the call.

   Note that after the call, DNAME{1,2} may have more than one
   trailing zero, so callers should establish the useful text length
   using VG_(strlen) on the contents, rather than VG_(sizeXA) on the
   XArray itself.
*/
Bool VG_(get_data_description)( 
        /*MOD*/ XArray* /* of HChar */ dname1,
        /*MOD*/ XArray* /* of HChar */ dname2,
        Addr data_addr
     )
{
#  define N_FRAMES 8
   Addr ips[N_FRAMES], sps[N_FRAMES], fps[N_FRAMES];
   UInt n_frames;

   Addr       stack_min, stack_max;
   ThreadId   tid;
   Bool       found;
   DebugInfo* di;
   Word       j;

   if (0) VG_(printf)("get_data_description: dataaddr %#lx\n", data_addr);
   /* First, see if data_addr is (or is part of) a global variable.
      Loop over the DebugInfos we have.  Check data_addr against the
      outermost scope of all of them, as that should be a global
      scope. */
   for (di = debugInfo_list; di != NULL; di = di->next) {
      OSet*        global_scope;
      Word         gs_size;
      Addr         zero;
      DiAddrRange* global_arange;
      Word         i;
      XArray*      vars;

      /* text segment missing? unlikely, but handle it .. */
      if (!di->text_present || di->text_size == 0)
         continue;
      /* any var info at all? */
      if (!di->varinfo)
         continue;
      /* perhaps this object didn't contribute any vars at all? */
      if (VG_(sizeXA)( di->varinfo ) == 0)
         continue;
      global_scope = *(OSet**)VG_(indexXA)( di->varinfo, 0 );
      vg_assert(global_scope);
      gs_size = VG_(OSetGen_Size)( global_scope );
      /* The global scope might be completely empty if this
         compilation unit declared locals but nothing global. */
      if (gs_size == 0)
          continue;
      /* But if it isn't empty, then it must contain exactly one
         element, which covers the entire address range. */
      vg_assert(gs_size == 1);
      /* Fish out the global scope and check it is as expected. */
      zero = 0;
      global_arange 
         = VG_(OSetGen_Lookup)( global_scope, &zero );
      /* The global range from (Addr)0 to ~(Addr)0 must exist */
      vg_assert(global_arange);
      vg_assert(global_arange->aMin == (Addr)0
                && global_arange->aMax == ~(Addr)0);
      /* Any vars in this range? */
      if (!global_arange->vars)
         continue;
      /* Ok, there are some vars in the global scope of this
         DebugInfo.  Wade through them and see if the data addresses
         of any of them bracket data_addr. */
      vars = global_arange->vars;
      for (i = 0; i < VG_(sizeXA)( vars ); i++) {
         PtrdiffT offset;
         DiVariable* var = (DiVariable*)VG_(indexXA)( vars, i );
         vg_assert(var->name);
         /* Note we use a NULL RegSummary* here.  It can't make any
            sense for a global variable to have a location expression
            which depends on a SP/FP/IP value.  So don't supply any.
            This means, if the evaluation of the location
            expression/list requires a register, we have to let it
            fail. */
         if (data_address_is_in_var( &offset, di->admin_tyents, var, 
                                     NULL/* RegSummary* */, 
                                     data_addr, di )) {
            PtrdiffT residual_offset = 0;
            XArray* described = ML_(describe_type)( &residual_offset,
                                                    di->admin_tyents,
                                                    var->typeR, offset );
            format_message( dname1, dname2,
                            data_addr, di, var, offset, residual_offset,
                            described, -1/*frameNo*/,
                            VG_INVALID_THREADID );
            VG_(deleteXA)( described );
            zterm_XA( dname1 );
            zterm_XA( dname2 );
            return True;
         }
      }
   }

   /* Ok, well it's not a global variable.  So now let's snoop around
      in the stacks of all the threads.  First try to figure out which
      thread's stack data_addr is in. */

   /* Perhaps it's on a thread's stack? */
   found = False;
   VG_(thread_stack_reset_iter)(&tid);
   while ( VG_(thread_stack_next)(&tid, &stack_min, &stack_max) ) {
      if (stack_min >= stack_max)
         continue; /* ignore obviously stupid cases */
      if (stack_min - VG_STACK_REDZONE_SZB <= data_addr
          && data_addr <= stack_max) {
         found = True;
         break;
      }
   }
   if (!found) {
      zterm_XA( dname1 );
      zterm_XA( dname2 );
      return False;
   }

   /* We conclude data_addr is in thread tid's stack.  Unwind the
      stack to get a bunch of (ip,sp,fp) triples describing the
      frames, and for each frame, consider the local variables. */
   n_frames = VG_(get_StackTrace)( tid, ips, N_FRAMES,
                                   sps, fps, 0/*first_ip_delta*/ );

   vg_assert(n_frames >= 0 && n_frames <= N_FRAMES);
   for (j = 0; j < n_frames; j++) {
      if (consider_vars_in_frame( dname1, dname2,
                                  data_addr,
                                  ips[j], 
                                  sps[j], fps[j], tid, j )) {
         zterm_XA( dname1 );
         zterm_XA( dname2 );
         return True;
      }
      /* Now, it appears that gcc sometimes appears to produce
         location lists whose ranges don't actually cover the call
         instruction, even though the address of the variable in
         question is passed as a parameter in the call.  AFAICS this
         is simply a bug in gcc - how can the variable be claimed not
         exist in memory (on the stack) for the duration of a call in
         which its address is passed?  But anyway, in the particular
         case I investigated (memcheck/tests/varinfo6.c, call to croak
         on line 2999, local var budget declared at line 3115
         appearing not to exist across the call to mainSort on line
         3143, "gcc.orig (GCC) 3.4.4 20050721 (Red Hat 3.4.4-2)" on
         amd64), the variable's location list does claim it exists
         starting at the first byte of the first instruction after the
         call instruction.  So, call consider_vars_in_frame a second
         time, but this time add 1 to the IP.  GDB handles this
         example with no difficulty, which leads me to believe that
         either (1) I misunderstood something, or (2) GDB has an
         equivalent kludge. */
      if (j > 0 /* this is a non-innermost frame */
          && consider_vars_in_frame( dname1, dname2,
                                     data_addr,
                                     ips[j] + 1, 
                                     sps[j], fps[j], tid, j )) {
         zterm_XA( dname1 );
         zterm_XA( dname2 );
         return True;
      }
   }

   /* We didn't find anything useful. */
   zterm_XA( dname1 );
   zterm_XA( dname2 );
   return False;
#  undef N_FRAMES
}


//////////////////////////////////////////////////////////////////
//                                                              //
// Support for other kinds of queries to the Dwarf3 var info    //
//                                                              //
//////////////////////////////////////////////////////////////////

/* Figure out if the variable 'var' has a location that is linearly
   dependent on a stack pointer value, or a frame pointer value, and
   if it is, add a description of it to 'blocks'.  Otherwise ignore
   it.  If 'arrays_only' is True, also ignore it unless it has an
   array type. */

static 
void analyse_deps ( /*MOD*/XArray* /* of FrameBlock */ blocks,
                    const XArray* /* TyEnt */ tyents,
                    Addr ip, const DebugInfo* di, const DiVariable* var,
                    Bool arrays_only )
{
   GXResult   res_sp_6k, res_sp_7k, res_fp_6k, res_fp_7k;
   RegSummary regs;
   MaybeULong mul;
   Bool       isVec;
   TyEnt*     ty;

   Bool debug = False;
   if (0&&debug)
      VG_(printf)("adeps: var %s\n", var->name );

   /* Figure out how big the variable is. */
   mul = ML_(sizeOfType)(tyents, var->typeR);
   /* If this var has a type whose size is unknown, zero, or
      impossibly large, it should never have been added.  ML_(addVar)
      should have rejected it. */
   vg_assert(mul.b == True);
   vg_assert(mul.ul > 0);
   if (sizeof(void*) == 4) vg_assert(mul.ul < (1ULL << 32));
   /* After this point, we assume we can truncate mul.ul to a host word
      safely (without loss of info). */

   /* skip if non-array and we're only interested in arrays */
   ty = ML_(TyEnts__index_by_cuOff)( tyents, NULL, var->typeR );
   vg_assert(ty);
   vg_assert(ty->tag == Te_UNKNOWN || ML_(TyEnt__is_type)(ty));
   if (ty->tag == Te_UNKNOWN)
      return; /* perhaps we should complain in this case? */
   isVec = ty->tag == Te_TyArray;
   if (arrays_only && !isVec)
      return;

   if (0) {ML_(pp_TyEnt_C_ishly)(tyents, var->typeR);
           VG_(printf)("  %s\n", var->name);}

   /* Do some test evaluations of the variable's location expression,
      in order to guess whether it is sp-relative, fp-relative, or
      none.  A crude hack, which can be interpreted roughly as finding
      the first derivative of the location expression w.r.t. the
      supplied frame and stack pointer values. */
   regs.fp   = 0;
   regs.ip   = ip;
   regs.sp   = 6 * 1024;
   res_sp_6k = ML_(evaluate_GX)( var->gexpr, var->fbGX, &regs, di );

   regs.fp   = 0;
   regs.ip   = ip;
   regs.sp   = 7 * 1024;
   res_sp_7k = ML_(evaluate_GX)( var->gexpr, var->fbGX, &regs, di );

   regs.fp   = 6 * 1024;
   regs.ip   = ip;
   regs.sp   = 0;
   res_fp_6k = ML_(evaluate_GX)( var->gexpr, var->fbGX, &regs, di );

   regs.fp   = 7 * 1024;
   regs.ip   = ip;
   regs.sp   = 0;
   res_fp_7k = ML_(evaluate_GX)( var->gexpr, var->fbGX, &regs, di );

   vg_assert(res_sp_6k.kind == res_sp_7k.kind);
   vg_assert(res_sp_6k.kind == res_fp_6k.kind);
   vg_assert(res_sp_6k.kind == res_fp_7k.kind);

   if (res_sp_6k.kind == GXR_Addr) {
      StackBlock block;
      GXResult res;
      UWord sp_delta = res_sp_7k.word - res_sp_6k.word;
      UWord fp_delta = res_fp_7k.word - res_fp_6k.word;
      vg_assert(sp_delta == 0 || sp_delta == 1024);
      vg_assert(fp_delta == 0 || fp_delta == 1024);

      if (sp_delta == 0 && fp_delta == 0) {
         /* depends neither on sp nor fp, so it can't be a stack
            local.  Ignore it. */
      }
      else
      if (sp_delta == 1024 && fp_delta == 0) {
         regs.sp = regs.fp = 0;
         regs.ip = ip;
         res = ML_(evaluate_GX)( var->gexpr, var->fbGX, &regs, di );
         vg_assert(res.kind == GXR_Addr);
         if (debug)
         VG_(printf)("   %5lu .. %5llu (sp) %s\n",
                     res.word, res.word + mul.ul - 1, var->name);
         block.base  = res.word;
         block.szB   = (SizeT)mul.ul;
         block.spRel = True;
         block.isVec = isVec;
         VG_(memset)( &block.name[0], 0, sizeof(block.name) );
         if (var->name)
            VG_(strncpy)( &block.name[0], var->name, sizeof(block.name)-1 );
         block.name[ sizeof(block.name)-1 ] = 0;
         block.fullname = var->name; // pgbovine (since name truncates to N bytes)
         VG_(addToXA)( blocks, &block );
      }
      else
      if (sp_delta == 0 && fp_delta == 1024) {
         regs.sp = regs.fp = 0;
         regs.ip = ip;
         res = ML_(evaluate_GX)( var->gexpr, var->fbGX, &regs, di );
         vg_assert(res.kind == GXR_Addr);
         if (debug)
         VG_(printf)("   %5lu .. %5llu (FP) %s\n",
                     res.word, res.word + mul.ul - 1, var->name);
         block.base  = res.word;
         block.szB   = (SizeT)mul.ul;
         block.spRel = False;
         block.isVec = isVec;
         VG_(memset)( &block.name[0], 0, sizeof(block.name) );
         if (var->name)
            VG_(strncpy)( &block.name[0], var->name, sizeof(block.name)-1 );
         block.name[ sizeof(block.name)-1 ] = 0;
         block.fullname = var->name; // pgbovine (since name truncates to N bytes)
         VG_(addToXA)( blocks, &block );
      }
      else {
         vg_assert(0);
      }
   }
}


/* Get an XArray of StackBlock which describe the stack (auto) blocks
   for this ip.  The caller is expected to free the XArray at some
   point.  If 'arrays_only' is True, only array-typed blocks are
   returned; otherwise blocks of all types are returned. */

XArray* /* of StackBlock */
VG_(di_get_stack_blocks_at_ip)( Addr ip, Bool arrays_only )
{
   /* This is a derivation of consider_vars_in_frame() above. */
   Word       i;
   DebugInfo* di;
   Bool debug = False;

   XArray* res = VG_(newXA)( ML_(dinfo_zalloc), "di.debuginfo.dgsbai.1",
                             ML_(dinfo_free),
                             sizeof(StackBlock) );

   static UInt n_search = 0;
   static UInt n_steps = 0;
   n_search++;
   if (debug)
      VG_(printf)("QQQQ: dgsbai: ip %#lx\n", ip);
   /* first, find the DebugInfo that pertains to 'ip'. */
   for (di = debugInfo_list; di; di = di->next) {
      n_steps++;
      /* text segment missing? unlikely, but handle it .. */
      if (!di->text_present || di->text_size == 0)
         continue;
      /* Ok.  So does this text mapping bracket the ip? */
      if (di->text_avma <= ip && ip < di->text_avma + di->text_size)
         break;
   }
 
   /* Didn't find it.  Strange -- means ip is a code address outside
      of any mapped text segment.  Unlikely but not impossible -- app
      could be generating code to run. */
   if (!di)
      return res; /* currently empty */

   if (0 && ((n_search & 0x1) == 0))
      VG_(printf)("VG_(di_get_stack_blocks_at_ip): %u searches, "
                  "%u DebugInfos looked at\n", 
                  n_search, n_steps);
   /* Start of performance-enhancing hack: once every ??? (chosen
      hackily after profiling) successful searches, move the found
      DebugInfo one step closer to the start of the list.  This makes
      future searches cheaper. */
   if ((n_search & 0xFFFF) == 0) {
      /* Move si one step closer to the start of the list. */
      move_DebugInfo_one_step_forward( di );
   }
   /* End of performance-enhancing hack. */

   /* any var info at all? */
   if (!di->varinfo)
      return res; /* currently empty */

   /* Work through the scopes from most deeply nested outwards,
      looking for code address ranges that bracket 'ip'.  The
      variables on each such address range found are in scope right
      now.  Don't descend to level zero as that is the global
      scope. */

   /* "for each scope, working outwards ..." */
   for (i = VG_(sizeXA)(di->varinfo) - 1; i >= 1; i--) {
      XArray*      vars;
      Word         j;
      DiAddrRange* arange;
      OSet*        this_scope 
         = *(OSet**)VG_(indexXA)( di->varinfo, i );
      if (debug)
         VG_(printf)("QQQQ:   considering scope %ld\n", (Word)i);
      if (!this_scope)
         continue;
      /* Find the set of variables in this scope that
         bracket the program counter. */
      arange = VG_(OSetGen_LookupWithCmp)(
                  this_scope, &ip, 
                  ML_(cmp_for_DiAddrRange_range)
               );
      if (!arange)
         continue;
      /* stay sane */
      vg_assert(arange->aMin <= arange->aMax);
      /* It must bracket the ip we asked for, else
         ML_(cmp_for_DiAddrRange_range) is somehow broken. */
      vg_assert(arange->aMin <= ip && ip <= arange->aMax);
      /* It must have an attached XArray of DiVariables. */
      vars = arange->vars;
      vg_assert(vars);
      /* But it mustn't cover the entire address range.  We only
         expect that to happen for the global scope (level 0), which
         we're not looking at here.  Except, it may cover the entire
         address range, but in that case the vars array must be
         empty. */
      vg_assert(! (arange->aMin == (Addr)0
                   && arange->aMax == ~(Addr)0
                   && VG_(sizeXA)(vars) > 0) );
      for (j = 0; j < VG_(sizeXA)( vars ); j++) {
         DiVariable* var = (DiVariable*)VG_(indexXA)( vars, j );
         if (debug)
            VG_(printf)("QQQQ:    var:name=%s %#lx-%#lx %#lx\n", 
                        var->name,arange->aMin,arange->aMax,ip);
         analyse_deps( res, di->admin_tyents, ip,
                       di, var, arrays_only );
      }
   }

   return res;
}


// pgbovine - adapted from VG_(di_get_stack_blocks_at_ip)
UWord pg_get_di_handle_at_ip(Addr ip)
{
   /* This is a derivation of consider_vars_in_frame() above. */
   DebugInfo* di;
   Bool debug = False;

   static UInt n_search = 0;
   static UInt n_steps = 0;
   n_search++;
   if (debug)
      VG_(printf)("QQQQ: dgsbai: ip %#lx\n", ip);
   /* first, find the DebugInfo that pertains to 'ip'. */
   for (di = debugInfo_list; di; di = di->next) {
      n_steps++;
      /* text segment missing? unlikely, but handle it .. */
      if (!di->text_present || di->text_size == 0)
         continue;
      /* Ok.  So does this text mapping bracket the ip? */
      if (di->text_avma <= ip && ip < di->text_avma + di->text_size)
         break;
   }

   /* Didn't find it.  Strange -- means ip is a code address outside
      of any mapped text segment.  Unlikely but not impossible -- app
      could be generating code to run. */
   if (!di)
      return 0; /* currently empty */

   if (0 && ((n_search & 0x1) == 0))
      VG_(printf)("VG_(di_get_stack_blocks_at_ip): %u searches, "
                  "%u DebugInfos looked at\n",
                  n_search, n_steps);
   /* Start of performance-enhancing hack: once every ??? (chosen
      hackily after profiling) successful searches, move the found
      DebugInfo one step closer to the start of the list.  This makes
      future searches cheaper. */
   if ((n_search & 0xFFFF) == 0) {
      /* Move si one step closer to the start of the list. */
      move_DebugInfo_one_step_forward( di );
   }
   /* End of performance-enhancing hack. */

   /* any var info at all? */
   if (!di->varinfo)
      return 0; /* currently empty */

   return di->handle;
}


Bool VG_(pg_traverse_global_var)(const HChar* varname, Addr data_addr,
                                 int is_mem_defined_func(Addr, SizeT, Addr*, UInt*),
                                 OSet* encoded_addrs, Bool prefix_with_comma, VgFile* trace_fp) {
  // adapted from VG_(get_data_description)

  /* First, see if data_addr is (or is part of) a global variable.
     Loop over the DebugInfos we have.  Check data_addr against the
     outermost scope of all of them, as that should be a global
     scope. */
  for (DebugInfo* di = debugInfo_list; di != NULL; di = di->next) {
    OSet*        global_scope;
    Word         gs_size;
    Addr         zero;
    DiAddrRange* global_arange;
    Word         i;
    XArray*      vars;

    /* text segment missing? unlikely, but handle it .. */
    if (!di->text_present || di->text_size == 0)
      continue;
    /* any var info at all? */
    if (!di->varinfo)
      continue;
    /* perhaps this object didn't contribute any vars at all? */
    if (VG_(sizeXA)( di->varinfo ) == 0)
      continue;
    global_scope = *(OSet**)VG_(indexXA)( di->varinfo, 0 );
    vg_assert(global_scope);
    gs_size = VG_(OSetGen_Size)( global_scope );
    /* The global scope might be completely empty if this
       compilation unit declared locals but nothing global. */
    if (gs_size == 0)
      continue;
    /* But if it isn't empty, then it must contain exactly one
       element, which covers the entire address range. */
    vg_assert(gs_size == 1);
    /* Fish out the global scope and check it is as expected. */
    zero = 0;
    global_arange = VG_(OSetGen_Lookup)( global_scope, &zero );
    /* The global range from (Addr)0 to ~(Addr)0 must exist */
    vg_assert(global_arange);
    vg_assert(global_arange->aMin == (Addr)0
              && global_arange->aMax == ~(Addr)0);
    /* Any vars in this range? */
    if (!global_arange->vars)
      continue;
    /* Ok, there are some vars in the global scope of this
       DebugInfo.  Wade through them and see if the data addresses
       of any of them bracket data_addr. */
    vars = global_arange->vars;
    for (i = 0; i < VG_(sizeXA)( vars ); i++) {
      PtrdiffT offset;
      DiVariable* var = (DiVariable*)VG_(indexXA)( vars, i );
      vg_assert(var->name);
      /* Note we use a NULL RegSummary* here.  It can't make any
         sense for a global variable to have a location expression
         which depends on a SP/FP/IP value.  So don't supply any.
         This means, if the evaluation of the location
         expression/list requires a register, we have to let it
         fail. */
      if (data_address_is_in_var( &offset, di->admin_tyents, var,
                                  NULL/* RegSummary* */,
                                  data_addr, di )) {
        if (prefix_with_comma) { // only do this on a successful print!
          VG_(fprintf)(trace_fp, ",");
        }
        VG_(fprintf)(trace_fp, "  \"%s\": ", varname);
        ML_(pg_pp_varinfo)(di->admin_tyents, var->typeR, data_addr,
                           is_mem_defined_func, encoded_addrs, trace_fp);
        VG_(fprintf)(trace_fp, "\n");

        return True;
      }
    }
  }

  return False;
}


/* Get an array of GlobalBlock which describe the global blocks owned
   by the shared object characterised by the given di_handle.  Asserts
   if the handle is invalid.  The caller is responsible for freeing
   the array at some point.  If 'arrays_only' is True, only
   array-typed blocks are returned; otherwise blocks of all types are
   returned. */

XArray* /* of GlobalBlock */
VG_(di_get_global_blocks_from_dihandle) ( ULong di_handle, Bool  arrays_only )
{
   /* This is a derivation of consider_vars_in_frame() above. */

   DebugInfo* di;
   XArray* gvars; /* XArray* of GlobalBlock */
   Word nScopes, scopeIx;

   /* The first thing to do is find the DebugInfo that
      pertains to 'di_handle'. */
   vg_assert(di_handle > 0);
   for (di = debugInfo_list; di; di = di->next) {
      if (di->handle == di_handle)
         break;
   }

   /* If this fails, we were unable to find any DebugInfo with the
      given handle.  This is considered an error on the part of the
      caller. */
   vg_assert(di != NULL);

   /* we'll put the collected variables in here. */
   gvars = VG_(newXA)( ML_(dinfo_zalloc), "di.debuginfo.dggbfd.1",
                       ML_(dinfo_free), sizeof(GlobalBlock) );

   /* any var info at all? */
   if (!di->varinfo)
      return gvars;

   /* we'll iterate over all the variables we can find, even if
      it seems senseless to visit stack-allocated variables */
   /* Iterate over all scopes */
   nScopes = VG_(sizeXA)( di->varinfo );
   for (scopeIx = 0; scopeIx < nScopes; scopeIx++) {

      /* Iterate over each (code) address range at the current scope */
      DiAddrRange* range;
      OSet* /* of DiAddrInfo */ scope
         = *(OSet**)VG_(indexXA)( di->varinfo, scopeIx );
      vg_assert(scope);
      VG_(OSetGen_ResetIter)(scope);
      while ( (range = VG_(OSetGen_Next)(scope)) ) {

         /* Iterate over each variable in the current address range */
         Word nVars, varIx;
         vg_assert(range->vars);
         nVars = VG_(sizeXA)( range->vars );
         for (varIx = 0; varIx < nVars; varIx++) {

            Bool        isVec;
            GXResult    res;
            MaybeULong  mul;
            GlobalBlock gb;
            TyEnt*      ty;
            DiVariable* var = VG_(indexXA)( range->vars, varIx );
            vg_assert(var->name);
            if (0) VG_(printf)("at depth %ld var %s ", scopeIx, var->name );

            /* Now figure out if this variable has a constant address
               (that is, independent of FP, SP, phase of moon, etc),
               and if so, what the address is.  Any variable with a
               constant address is deemed to be a global so we collect
               it. */
            if (0) { VG_(printf)("EVAL: "); ML_(pp_GX)(var->gexpr);
                     VG_(printf)("\n"); }
            res = ML_(evaluate_trivial_GX)( var->gexpr, di );

            /* Not a constant address => not interesting */
            if (res.kind != GXR_Addr) {
               if (0) VG_(printf)("FAIL\n");
               continue;
            }

            /* Ok, it's a constant address.  See if we want to collect
               it. */
            if (0) VG_(printf)("%#lx\n", res.word);

            /* Figure out how big the variable is. */
            mul = ML_(sizeOfType)(di->admin_tyents, var->typeR);

            /* If this var has a type whose size is unknown, zero, or
               impossibly large, it should never have been added.
               ML_(addVar) should have rejected it. */
            vg_assert(mul.b == True);
            vg_assert(mul.ul > 0);
            if (sizeof(void*) == 4) vg_assert(mul.ul < (1ULL << 32));
            /* After this point, we assume we can truncate mul.ul to a
               host word safely (without loss of info). */

            /* skip if non-array and we're only interested in
               arrays */
            ty = ML_(TyEnts__index_by_cuOff)( di->admin_tyents, NULL,
                                              var->typeR );
            vg_assert(ty);
            vg_assert(ty->tag == Te_UNKNOWN || ML_(TyEnt__is_type)(ty));
            if (ty->tag == Te_UNKNOWN)
               continue; /* perhaps we should complain in this case? */

            isVec = ty->tag == Te_TyArray;
            if (arrays_only && !isVec) continue;

            /* Ok, so collect it! */
            vg_assert(var->name);
            vg_assert(di->soname);
            if (0) VG_(printf)("XXXX %s %s %d\n", var->name,
                               ML_(fndn_ix2filename)(di, var->fndn_ix),
                               var->lineNo);
            VG_(memset)(&gb, 0, sizeof(gb));
            gb.addr  = res.word;
            gb.szB   = (SizeT)mul.ul;
            gb.isVec = isVec;
            VG_(strncpy)(&gb.name[0], var->name, sizeof(gb.name)-1);
            VG_(strncpy)(&gb.soname[0], di->soname, sizeof(gb.soname)-1);
            vg_assert(gb.name[ sizeof(gb.name)-1 ] == 0);
            vg_assert(gb.soname[ sizeof(gb.soname)-1 ] == 0);

            gb.fullname = var->name; // pgbovine (since name truncates to N bytes)

            VG_(addToXA)( gvars, &gb );

         } /* for (varIx = 0; varIx < nVars; varIx++) */

      } /* while ( (range = VG_(OSetGen_Next)(scope)) ) */

   } /* for (scopeIx = 0; scopeIx < nScopes; scopeIx++) */

   return gvars;
}


/*------------------------------------------------------------*/
/*--- DebugInfo accessor functions                         ---*/
/*------------------------------------------------------------*/

const DebugInfo* VG_(next_DebugInfo)(const DebugInfo* di)
{
   if (di == NULL)
      return debugInfo_list;
   return di->next;
}

Addr VG_(DebugInfo_get_text_avma)(const DebugInfo* di)
{
   return di->text_present ? di->text_avma : 0; 
}

SizeT VG_(DebugInfo_get_text_size)(const DebugInfo* di)
{
   return di->text_present ? di->text_size : 0; 
}

Addr VG_(DebugInfo_get_bss_avma)(const DebugInfo* di)
{
   return di->bss_present ? di->bss_avma : 0; 
}

SizeT VG_(DebugInfo_get_bss_size)(const DebugInfo* di)
{
   return di->bss_present ? di->bss_size : 0; 
}

Addr VG_(DebugInfo_get_plt_avma)(const DebugInfo* di)
{
   return di->plt_present ? di->plt_avma : 0; 
}

SizeT VG_(DebugInfo_get_plt_size)(const DebugInfo* di)
{
   return di->plt_present ? di->plt_size : 0; 
}

Addr VG_(DebugInfo_get_gotplt_avma)(const DebugInfo* di)
{
   return di->gotplt_present ? di->gotplt_avma : 0; 
}

SizeT VG_(DebugInfo_get_gotplt_size)(const DebugInfo* di)
{
   return di->gotplt_present ? di->gotplt_size : 0; 
}

Addr VG_(DebugInfo_get_got_avma)(const DebugInfo* di)
{
   return di->got_present ? di->got_avma : 0; 
}

SizeT VG_(DebugInfo_get_got_size)(const DebugInfo* di)
{
   return di->got_present ? di->got_size : 0; 
}

const HChar* VG_(DebugInfo_get_soname)(const DebugInfo* di)
{
   return di->soname;
}

const HChar* VG_(DebugInfo_get_filename)(const DebugInfo* di)
{
   return di->fsm.filename;
}

PtrdiffT VG_(DebugInfo_get_text_bias)(const DebugInfo* di)
{
   return di->text_present ? di->text_bias : 0;
}

Int VG_(DebugInfo_syms_howmany) ( const DebugInfo *si )
{
   return si->symtab_used;
}

void VG_(DebugInfo_syms_getidx) ( const DebugInfo *si, 
                                        Int idx,
                                  /*OUT*/SymAVMAs* avmas,
                                  /*OUT*/UInt*     size,
                                  /*OUT*/const HChar**   pri_name,
                                  /*OUT*/const HChar***  sec_names,
                                  /*OUT*/Bool*     isText,
                                  /*OUT*/Bool*     isIFunc )
{
   vg_assert(idx >= 0 && idx < si->symtab_used);
   if (avmas)     *avmas     = si->symtab[idx].avmas;
   if (size)      *size      = si->symtab[idx].size;
   if (pri_name)  *pri_name  = si->symtab[idx].pri_name;
   if (sec_names) *sec_names = si->symtab[idx].sec_names;
   if (isText)    *isText    = si->symtab[idx].isText;
   if (isIFunc)   *isIFunc   = si->symtab[idx].isIFunc;
}


/*------------------------------------------------------------*/
/*--- SectKind query functions                             ---*/
/*------------------------------------------------------------*/

/* Convert a VgSectKind to a string, which must be copied if you want
   to change it. */
const HChar* VG_(pp_SectKind)( VgSectKind kind )
{
   switch (kind) {
      case Vg_SectUnknown: return "Unknown";
      case Vg_SectText:    return "Text";
      case Vg_SectData:    return "Data";
      case Vg_SectBSS:     return "BSS";
      case Vg_SectGOT:     return "GOT";
      case Vg_SectPLT:     return "PLT";
      case Vg_SectOPD:     return "OPD";
      case Vg_SectGOTPLT:  return "GOTPLT";
      default:             vg_assert(0);
   }
}

/* Given an address 'a', make a guess of which section of which object
   it comes from.  If name is non-NULL, then the object's name is put
   in *name. The returned name, if any, should be saved away, if there is
   a chance that a debug-info will be discarded and the name is being
   used later on. */
VgSectKind VG_(DebugInfo_sect_kind)( /*OUT*/const HChar** name, Addr a)
{
   DebugInfo* di;
   VgSectKind res = Vg_SectUnknown;

   for (di = debugInfo_list; di != NULL; di = di->next) {

      if (0)
         VG_(printf)(
            "addr=%#lx di=%p %s got=%#lx,%lu plt=%#lx,%lu "
            "data=%#lx,%lu bss=%#lx,%lu\n",
            a, di, di->fsm.filename,
            di->got_avma,  di->got_size,
            di->plt_avma,  di->plt_size,
            di->data_avma, di->data_size,
            di->bss_avma,  di->bss_size);

      if (di->text_present
          && di->text_size > 0
          && a >= di->text_avma && a < di->text_avma + di->text_size) {
         res = Vg_SectText;
         break;
      }
      if (di->data_present
          && di->data_size > 0
          && a >= di->data_avma && a < di->data_avma + di->data_size) {
         res = Vg_SectData;
         break;
      }
      if (di->sdata_present
          && di->sdata_size > 0
          && a >= di->sdata_avma && a < di->sdata_avma + di->sdata_size) {
         res = Vg_SectData;
         break;
      }
      if (di->bss_present
          && di->bss_size > 0
          && a >= di->bss_avma && a < di->bss_avma + di->bss_size) {
         res = Vg_SectBSS;
         break;
      }
      if (di->sbss_present
          && di->sbss_size > 0
          && a >= di->sbss_avma && a < di->sbss_avma + di->sbss_size) {
         res = Vg_SectBSS;
         break;
      }
      if (di->plt_present
          && di->plt_size > 0
          && a >= di->plt_avma && a < di->plt_avma + di->plt_size) {
         res = Vg_SectPLT;
         break;
      }
      if (di->got_present
          && di->got_size > 0
          && a >= di->got_avma && a < di->got_avma + di->got_size) {
         res = Vg_SectGOT;
         break;
      }
      if (di->gotplt_present
          && di->gotplt_size > 0
          && a >= di->gotplt_avma && a < di->gotplt_avma + di->gotplt_size) {
         res = Vg_SectGOTPLT;
         break;
      }
      if (di->opd_present
          && di->opd_size > 0
          && a >= di->opd_avma && a < di->opd_avma + di->opd_size) {
         res = Vg_SectOPD;
         break;
      }
      /* we could also check for .eh_frame, if anyone really cares */
   }

   vg_assert( (di == NULL && res == Vg_SectUnknown)
              || (di != NULL && res != Vg_SectUnknown) );

   if (name) {
      if (di && di->fsm.filename) {
         *name = di->fsm.filename;
      } else {
         *name = "???";
      }
   }

   return res;

}

/*--------------------------------------------------------------------*/
/*--- end                                                          ---*/
/*--------------------------------------------------------------------*/
