# Ruby backend for Online "Python" Tutor
# created on 2015-06-29 by Philip Guo
#
# WARNING: this script only works on a *hacked version* of Ruby 2.X since
# we use the TracePoint API and custom fields such as binding::frame_id.
# See custom-ruby-interpreter/ for details.

# simple Ruby idiom for assert:
# raise "error msg" unless <condition to assert>

# TODO
#
# fix these tests:
#
# in frontend, maybe '=' isn't a valid CSS selector. also escape '?' too
#   tests/blocks-iterate.rb
#
# - test syntax errors in the OPT frontend
# - display the 'binding' within a proc/lambda object, which represents
#   https://codequizzes.wordpress.com/2014/04/07/rubys-self-keyword-and-implicit-self/
#   its closure. test on tests/proc-return.rb
# - support gets() for user input using the restart hack mechanism
#   - user input stored in $_
# - support 'include'-ing a module and bringing in variables into namespace
#   - maybe this already works?
# - cosmetic issues in the OPT frontend for Ruby:
#   - relabel "Global frame" as "Globals" or something
#   - display None values as 'nil'
#   - display booleans as 'true' and 'false'
#   - rename 'list' to 'array' - check
#   - rename 'dict' to 'hash' - check
#   - rename 'instance' to 'object' - check
#   - rename 'function' to 'method' - check
# - display private and protected attributes
#
# Limitations/quirks:
# - no support for (lexical) environment pointers, since MRI doesn't seem to
#   expose them. We can see only the current (dynamic) stack backtrace
#   with debug_inspector.
#   - NB: is this true? at least we have 'binding' for procs/lambdas
#
# - keeps executing for a few more lines after an exception -- dunno if
#   that's standard Ruby behavior or not
#
# - method aliases show up as separate Method objects instead of the
#   same one
#
# - if you write, say, "require 'date'", it will pull in classes from
#   the date module into globals, which might make the display HUGE
#   with way too many attributes. this is a general problem that
#   manifests in other languages as well.

# style guide: https://github.com/styleguide/ruby


require 'json'
require 'optparse'
require 'set'
require 'stringio'

require 'debug_inspector' # gem install debug_inspector, use on Ruby 2.X

trace_output_fn = 'stdout' # default
script_name = nil
cod = nil

OptionParser.new do |opts|
  opts.banner = "Usage: ./ruby pg_logger.rb [options]"

  opts.on("-t", "--tracefile", "Create a test-trace.js trace file") do |t|
    trace_output_fn = "../../../v3/test-trace.js" if t
  end

  opts.on("-f", "--file FILE", "Execute a .rb file") do |s|
    script_name = s
  end

  opts.on("-c", "--code CODE", String, "Execute Ruby code from string") do |c|
    cod = c
  end

end.parse!

# -c gets precedence over -f
if !cod
  cod = File.open(script_name).read
end

cur_trace = []
res = {'code' => cod.dup, # make a snapshot of the code NOW before it's modified
       'trace' => cur_trace}

# canonicalize to pretty-print
cur_frame_id = 1
ordered_frame_ids = {}

stdout_buffer = StringIO.new

n_steps = 0
MAX_STEPS = 300

n_lines_added = nil

class MaxStepsException < RuntimeError
end

PRIMITIVES = [Fixnum, Float, String, TrueClass, FalseClass, NilClass]

# ported from ../../../v3/pg_encoder.py
class ObjectEncoder
  def initialize
    # Key: canonicalized small ID
    # Value: encoded (compound) heap object
    @encoded_heap_objects = {}

    @id_to_small_IDs = {}
    @cur_small_ID = 1
  end

  def get_heap
    @encoded_heap_objects
  end

  def reset_heap
    # VERY IMPORTANT to reassign to a NEW empty hash rather than just
    # clearing the existing hash, since get_heap() could have been
    # called earlier to return a reference to a previous heap state
    @encoded_heap_objects = {}
  end

  # return either a primitive object or an object reference;
  # and as a side effect, update encoded_heap_objects
  def encode(dat)
    if PRIMITIVES.include? dat.class
      if dat.class == Float
        if dat == Float::INFINITY
          return ['SPECIAL_FLOAT', 'Infinity']
        elsif dat == (-1 * Float::INFINITY)
          return ['SPECIAL_FLOAT', '-Infinity']
        elsif dat.nan?
          return ['SPECIAL_FLOAT', 'NaN']
        elsif dat == dat.to_i
          # (this way, 3.0 prints as '3.0' and not as 3, which looks like an int)
          return ['SPECIAL_FLOAT', '%.1f' % dat]
        end
      elsif dat.class == String
        # annoying! strings are mutable, so need to make
        # a duplicate to snapshot the current value!
        return dat.dup
      end

      return dat
    else
      my_id = dat.object_id

      my_small_id = @id_to_small_IDs[my_id]
      if !my_small_id
        my_small_id = @cur_small_ID
        @id_to_small_IDs[my_id] = @cur_small_ID
        @cur_small_ID += 1
      end

      ret = ['REF', my_small_id]

      # punt early if you've already encoded this object
      return ret if @encoded_heap_objects.include? my_small_id

      new_obj = []
      @encoded_heap_objects[my_small_id] = new_obj

      # otherwise encode it in the heap and return ret
      if dat.class == Array
        new_obj << 'LIST'
        dat.each { |e| new_obj << encode(e) }
      elsif dat.class == Hash
        new_obj << 'DICT'
        dat.each { |k, v| new_obj << [encode(k), encode(v)] }
      elsif dat.class == Set
        new_obj << 'SET'
        dat.each { |e| new_obj << encode(e) }
      elsif dat.class == Range || dat.class == Symbol || dat.class == Regexp
        # display these simple types as-is without any frills
        new_obj << dat.class.to_s
        new_obj << dat.inspect
      elsif dat.class == Method || dat.class == UnboundMethod
        # just use 'FUNCTION' for simplicity, even though it masks some
        # subtleties of methods, unbound methods, etc.
        new_obj << 'FUNCTION'
        new_obj << dat.name
        new_obj << '' # parent frame ID
      elsif dat.class == Proc
        new_obj << dat.class.to_s
        if dat.lambda?
          new_obj << ("Lambda on line %d" % dat.source_location[1])
        else
          new_obj << ("Proc on line %d" % dat.source_location[1])
        end
      elsif dat.class == Class
        new_obj << 'CLASS'
        new_obj << dat.to_s
        sups = []
        sups << dat.superclass if dat.superclass != Object
        new_obj << sups

        encoded_constants = []
        encoded_class_methods = []
        encoded_instance_methods = []
        encoded_class_variables = []
        encoded_instance_variables = []

        dat.constants.each do |e|
          encoded_constants << [e.to_s, encode(dat.const_get(e))]
        end

        my_class_methods = dat.methods - dat.superclass.methods
        my_class_methods.each do |e|
          encoded_class_methods << ['self.' + e.to_s, encode(dat.method(e))]
        end

        my_instance_methods = dat.instance_methods - dat.superclass.instance_methods
        my_instance_methods.each do |e|
          # use instance_method to get the unbound method
          # http://ruby-doc.org/core-2.2.0/UnboundMethod.html
          encoded_instance_methods << [e.to_s, encode(dat.instance_method(e))]
        end

        dat.class_variables.each do |e|
          encoded_class_variables << [e.to_s, encode(dat.class_variable_get(e))]
        end

        dat.instance_variables.each do |e|
          encoded_instance_variables << [e.to_s, encode(dat.instance_variable_get(e))]
        end

        new_obj.concat(encoded_constants)
        new_obj.concat(encoded_class_methods)
        new_obj.concat(encoded_instance_methods)
        new_obj.concat(encoded_class_variables)
        new_obj.concat(encoded_instance_variables)
      elsif dat.class == Module
        new_obj << 'INSTANCE'
        new_obj << dat.class.to_s

        encoded_constants = []
        encoded_instance_methods = []
        encoded_class_variables = []
        encoded_instance_variables = []

        dat.constants.each do |e|
          encoded_constants << [e.to_s, encode(dat.const_get(e))]
        end

        # TODO: maybe remove duplication from included modules?

        dat.instance_methods.each do |e|
          # use instance_method to get the unbound method
          # http://ruby-doc.org/core-2.2.0/UnboundMethod.html
          encoded_instance_methods << [e.to_s, encode(dat.instance_method(e))]
        end

        dat.class_variables.each do |e|
          encoded_class_variables << [e.to_s, encode(dat.class_variable_get(e))]
        end

        dat.instance_variables.each do |e|
          encoded_instance_variables << [e.to_s, encode(dat.instance_variable_get(e))]
        end

        new_obj.concat(encoded_constants)
        new_obj.concat(encoded_instance_methods)
        new_obj.concat(encoded_class_variables)
        new_obj.concat(encoded_instance_variables)
      else
        # concise case: instance that doesn't use the default Kernel to_s
        # (i.e., either it or its superclass defined a custom to_s):
        if dat.method(:to_s).owner != Kernel
          new_obj << 'INSTANCE_PPRINT'
          new_obj << dat.class.to_s
          new_obj << dat.to_s
        else
          new_obj << 'INSTANCE'
          new_obj << dat.class.to_s

          # catch-all case: in Ruby, everything is an object
          my_inst_vars = dat.instance_variables

          encoded_instance_variables = []

          my_inst_vars.each do |e|
            encoded_instance_variables << [e.to_s, encode(dat.instance_variable_get(e))]
          end

          new_obj.concat(encoded_instance_variables)

          # for brevity, put methods in the class, not in instances
        end
      end

      return ret
    end
  end
end

pg_encoder = ObjectEncoder.new


# end all of my own definitions here so that I can set the following vars ...

# collect the sets of these variables RIGHT BEFORE the user's code runs
# so that we can do a set difference later to see what the user defined
base_globals_set = global_variables
base_constants_set = Module.constants
base_inst_vars_set = self.instance_variables # toplevel instance variables are set on 'self'
base_class_vars_set = Object.class_variables # toplevel class variables are set on 'Object'
base_methods_set  = Object.private_methods # toplevel defined methods are set on 'Object'


pg_tracer = TracePoint.new(:line,:class,:end,:call,:return,:raise,:b_call,:b_return) do |tp|
  next if tp.path != '(eval)' # 'next' is a 'return' from a block

  raise MaxStepsException if n_steps > MAX_STEPS

  # TODO: look into tp.defined_class and tp.method_id attrs

  pg_encoder.reset_heap() # VERY VERY VERY IMPORTANT, or else we won't properly
                          # capture heap object mutations in the trace!

  retval = nil
  if tp.event == :return || tp.event == :b_return
    retval = pg_encoder.encode(tp.return_value)
  end

  evt_type = case tp.event
             when :line then "step_line"
             when :call, :b_call, :class then "call"
             when :return, :b_return, :end then "return"
             when :raise then "exception"
             end

  entry = {}

  entry['func_name'] = '<toplevel>' #tp.method_id
  entry['line'] = tp.lineno
  entry['event'] = evt_type

  # make a copy to take a snapshot at this point in time
  entry['stdout'] = stdout_buffer.string.dup

  stack = []
  entry['stack_to_render'] = stack
  entry['heap'] = pg_encoder.get_heap

  # globals
  globals = {}
  entry['globals'] = globals

  true_globals = (global_variables - base_globals_set) # set difference
  entry['ordered_globals'] = true_globals.map { |e| e.to_s }

  true_globals.each.with_index do |varname, i|
    val = eval(varname.to_s) # TODO: is there a better way? this seems hacky!
    globals[varname.to_s] = pg_encoder.encode(val)
  end

  # toplevel constants (stuff them in globals)
  toplevel_constants = (Module.constants - base_constants_set) # set difference
  entry['ordered_globals'].concat(toplevel_constants.map { |e| e.to_s })
  toplevel_constants.each do |varname|
    #val = eval(varname.to_s) # TODO: is there a better way? this seems hacky! # yes, see below
    val = Module.const_get(varname)
    globals[varname.to_s] = pg_encoder.encode(val)
  end

  # toplevel methods, class vars, and instance vars
  # just stuff them in globals, even though technically they're not
  # really global variables in Ruby; they're part of the weird 'self'
  # instance and also 'Object' itself ... quirky
  toplevel_methods = Object.private_methods - base_methods_set
  toplevel_class_vars = Object.class_variables - base_class_vars_set
  toplevel_inst_vars = self.instance_variables - base_inst_vars_set

  entry['ordered_globals'].concat(toplevel_methods.map { |e| e.to_s })
  entry['ordered_globals'].concat(toplevel_class_vars.map { |e| e.to_s })
  entry['ordered_globals'].concat(toplevel_inst_vars.map { |e| e.to_s })


  toplevel_methods.each do |varname|
    val = Object.method(varname)
    globals[varname.to_s] = pg_encoder.encode(val)
  end

  toplevel_class_vars.each do |varname|
    val = Object.class_variable_get(varname)
    globals[varname.to_s] = pg_encoder.encode(val)
  end

  toplevel_inst_vars.each do |varname|
    val = self.instance_variable_get(varname)
    globals[varname.to_s] = pg_encoder.encode(val)
  end

  if tp.event == :raise
    entry['exception_msg'] = tp.raised_exception
  end

  # adapted from https://github.com/ko1/pretty_backtrace/blob/master/lib/pretty_backtrace.rb
  def self.iseq_local_variables iseq
    _,_,_,_,arg_info,name,path,a_path,_,type,lvs, * = iseq.to_a
    lvs
  end

  # adapted from https://github.com/ko1/pretty_backtrace/blob/master/lib/pretty_backtrace.rb
  RubyVM::DebugInspector.open do |dc|
    locs = dc.backtrace_locations

    locs.each.with_index do |loc, i|
      # ignore first two boilerplate frames
      next if i < 2
      # and totally punt as soon as you hit the 'eval' frame
      break if /in `eval'/ =~ loc.to_s

      stack_entry = {}
      stack_entry['is_highlighted'] = false # set the last entry to true later

      is_main = false

      iseq = dc.frame_iseq(i)
      if !iseq
        # if you're, say, in a built-in operator like :/ (division)
        # totally punt since we can't get any useful info
        next
      else
        b = dc.frame_binding(i)

        # frame_id field exists only in my hacked Ruby interpreter!
        canonical_fid = ordered_frame_ids[b.frame_id]
        if !canonical_fid
          canonical_fid = cur_frame_id
          ordered_frame_ids[b.frame_id] = cur_frame_id
          cur_frame_id += 1
        end

        # special-case handling for the toplevel '<main>' frame
        # (NB: don't do this for now)
        #is_main = true if loc.label == '<main>'

        stack_entry['func_name'] = '%s:%d' % [loc.label, loc.lineno]


        stack_entry['frame_id'] = canonical_fid
        stack_entry['unique_hash'] = stack_entry['func_name'] + '_f' + stack_entry['frame_id'].to_s

        # unsupported features
        stack_entry['is_parent'] = false
        stack_entry['is_zombie'] = false
        stack_entry['parent_frame_id_list'] = []

        lvs = iseq_local_variables(iseq)
        lvs_val = lvs.inject({}){|r, lv|
          begin
            v = b.local_variable_get(lv)
            r[lv] = pg_encoder.encode(v)
          rescue NameError
            # ignore
          end
          r
        }

        stack_entry['ordered_varnames'] = lvs.map { |e| e.to_s }
        stack_entry['encoded_locals'] = lvs_val

        # get the value of 'self' as seen by this frame
        my_self = b.eval('self')
        if my_self != self # ignore default global 'self' for brevity
          stack_entry['ordered_varnames'].insert(0, 'self') # insert at front
          stack_entry['encoded_locals']['self'] = pg_encoder.encode(my_self)
        end

        # just fold everything into globals rather than creating a
        # separate (redundant) frame for '<main>'
        # (NB: don't do this for now ... just relabel "Global frames" as
        # 'Global Object' or something)
        if is_main
          entry['ordered_globals'].concat(stack_entry['ordered_varnames'])
          entry['globals'].update(stack_entry['encoded_locals'])
        end
      end

      # no separate frame for main since its local variables were folded
      # into globals
      if !is_main
        stack << stack_entry
      end

    end
  end

  # massage the topmost stack entry
  if stack.length > 0
    stack[0]['is_highlighted'] = true
    if tp.event == :return || tp.event == :b_return
      stack[0]['ordered_varnames'] << '__return__'
      stack[0]['encoded_locals']['__return__'] = retval
    end
  end

  # now REVERSE the stack so that it grows downward
  stack.reverse!

  n_steps += 1

  cur_trace << entry
end


begin
  # we are redirecting stdout so we need to print all warnings to stderr!
  pg_tracer.enable
  $stdout = stdout_buffer

  # super-hack: add an extra 'nil' line to execute at the end so that the
  # tracer can easily pick up on the final executed line in '(eval)'
  # - this isn't a 'real' line number in the user's code since we've
  #   inserted an extra line
  if cod[-1] == "\n"
    cod << "nil"
    n_lines_added = 1
  else
    cod << "\nnil"
    n_lines_added = 2
  end

  eval(cod) # the filename of the user's code is '(eval)'
  pg_tracer.disable
rescue SyntaxError
  $stdout = STDOUT
  puts "SyntaxError -- blarrrggg!!!"
  exc_object = $!

  raw_exc_message = exc_object.message
  # parse out the line number and message from raw_exc_message. e.g.,:
  # "(eval):11: syntax error, unexpected end-of-input, expecting keyword_end"
  # - we want to extract out the line number of 11 and the message of
  #   "syntax error, unexpected end-of-input, expecting keyword_end"
  /[:](\d+)[:] (.*)$/ =~ raw_exc_message
  lineno = $1.to_i
  exc_message = $2

  puts raw_exc_message
  puts lineno
  puts exc_message

  # From: https://github.com/pgbovine/OnlinePythonTutor/blob/master/v3/docs/opt-trace-format.md
  # "If the trace has exactly 1 entry and it's an uncaught_exception, then
  # the OPT frontend doesn't switch to the visualization at all ...
  # instead it displays a "syntax error"-like thingy in the code editor.
  # It will highlight the faulting line, indicated by the line field and
  # display exception_msg there. So if you want to indicate a syntax error,
  # then create a trace with exactly ONE entry that's an uncaught_exception.
  singleton_entry = {}
  # mutate cur_trace in place rather than reassigning, since res already includes it
  cur_trace.clear
  cur_trace << singleton_entry
  singleton_entry['event'] = 'uncaught_exception'
  singleton_entry['line'] = lineno
  singleton_entry['exception_msg'] = exc_message
rescue MaxStepsException
  $stdout = STDOUT

  # take the final trace entry & make it into a instruction_limit_reached event
  if cur_trace.length > 0
    cur_trace[-1]['event'] = 'instruction_limit_reached'
    cur_trace[-1]['exception_msg'] = "(stopped after %d steps to prevent possible infinite loop)" % MAX_STEPS
  end
rescue
  $stdout = STDOUT
  # ignore since we've already handled a :raise event in the trace by now
  STDERR.puts $! # but still print the error to ease debugging
  STDERR.puts $!.backtrace
ensure
  $stdout = STDOUT

  # super hack -- to account for the fact that we added an extra 'nil'
  # instruction at the very end of the user's code, we will set the
  # final instruction's line number to the last line of the file
  # (only do this if the trace isn't a single element, which likely
  # indicates some sort of uncaught_exception)
  if cur_trace.length > 1 && n_lines_added
    cur_trace[-1]['line'] -= n_lines_added
  end

  # postprocessing into a trace
  trace_json = JSON.pretty_generate(res)
  if trace_output_fn == 'stdout'
    STDOUT.write(trace_json)
  else
    File.open(trace_output_fn, 'w') do |f|
      f.write('var trace = ' + trace_json)
    end
    puts "Trace written to " + trace_output_fn
  end
end
